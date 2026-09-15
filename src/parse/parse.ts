import { type Positional, Block } from "../block.ts";
import { checkParam, parseParam } from "../parse-param/parse-param.ts";
import { convertDefault, convertParam } from "../convert/convert.ts";
import { globalArg } from "./global-arg.ts";

// Одна запись результата = одна пройденная команда.
// Для `mycli remote add origin` результат: [корень, remote, add].
export type ParsedBlock<TBlock extends Block = Block> = {
  // Что пользователь набрал, чтобы попасть в этот блок ("remote").
  // Для корня — globalArg, для входа через линк — имя блока ("run"),
  // потому что набранного токена там нет.
  arg: string;
  // Объявление команды: её флаги, позиционные, потомки, линк.
  block: TBlock;
  // Значения флагов, уже приведённые к типу: { tag: "beta", verbose: true }.
  params: Record<string, string | boolean | number>;
  // Значения позиционных: { file: "app.ts" }, для variadic — массив.
  positionals: Record<string, string | string[]>;
};

// Откуда начинать разбор. Два способа вызвать parse:
// - parse(args, [globalBlock]) — корень передали сами (так делает Cli и dapes);
// - parse(args, [runBlock, buildBlock]) — передали команды верхнего уровня,
//   и корень надо создать самим, положив эти команды ему в потомки.
// Отличаем по тому, что единственный блок назван globalArg.
function resolveRoot(blocks: Block[]): Block {
  if (blocks.length === 1 && blocks[0]!.arg === globalArg) {
    return blocks[0]!;
  }

  return new Block({
    arg: globalArg,
    params: [],
    description: "",
    children: blocks,
  });
}

// Превращает имя из block.link ("run") в сам блок-потомок.
// Нет линка — undefined. Линк есть, а потомка с таким именем нет — это ошибка
// объявления, падаем. Ищем при разборе, а не при объявлении, потому что
// в Cli команда "run" объявляется уже после new Cli({ commandLink: "run" }).
function findLink(block: Block): Block | undefined {
  if (block.link === undefined) {
    return;
  }

  const link = block.children.find((child) => child.arg === block.link);
  if (link === undefined) {
    throw new Error(`Command link "${block.link}" not found`);
  }

  return link;
}

// Пробует сопоставить начало rest с одной из команд-потомков.
// Каждый потомок решает сам через свой matcher: обычный съедает один токен
// с его именем, кастомный (как в dapes) может съесть сколько угодно.
// Возвращает найденный блок и то, что осталось несъеденным.
function matchChild(
  rest: string[],
  children: Block[],
): { block: Block; rest: string[] } | undefined {
  for (const child of children) {
    const { match, elems } = child.matcher(rest);
    if (match) {
      return { block: child, rest: elems };
    }
  }

  return;
}

// Проверяет, что все обязательные позиционные блока получили значение.
// Вызывается, когда блок закрывается: при переходе в другой блок и в конце
// аргументов. Раньше нельзя — позиционные могут прийти после флагов.
function checkRequiredPositionals(entry: ParsedBlock): void {
  for (const positional of entry.block.positionals) {
    if (!positional.required) {
      continue;
    }

    // Значение кладётся в positionals только когда пришёл токен —
    // и для обычного, и для variadic (массив создаётся на первом токене).
    // Значит, «есть ключ» и есть «заполнен».
    if (positional.name in entry.positionals) {
      continue;
    }

    const label = positional.variadic
      ? `...${positional.name}`
      : positional.name;
    throw new Error(`Required positional <${label}> is missing`);
  }
}

// Мы внутри слинкованной команды: в результате ровно корень и сама она.
// Пока так, глобальные флаги по-прежнему принимаются.
function checkInsideLink(parsedBlocks: ParsedBlock[]): boolean {
  if (parsedBlocks.length !== 2) {
    return false;
  }

  const link = findLink(parsedBlocks[0]!.block);
  if (link === undefined) {
    return false;
  }

  return parsedBlocks[1]!.block === link;
}

// Переход в другую команду. Два шага:
// 1. Закрыть блок, из которого уходим, — последний в parsedBlocks. Вернуться
//    в него уже нельзя, так что проверяем его обязательные позиционные сейчас.
// 2. Завести пустую запись для нового блока в конце parsedBlocks.
// После этого новый блок — последний, и цикл в parse на следующем шаге сам
// увидит его как текущий. Больше ничего переключать не нужно.
function enterBlock(
  parsedBlocks: ParsedBlock[],
  { block, arg }: { block: Block; arg: string },
): void {
  checkRequiredPositionals(parsedBlocks.at(-1)!);
  parsedBlocks.push({ arg, params: {}, positionals: {}, block });
}

// Читает один флаг с начала rest в запись entry и возвращает остаток.
// Сколько токенов съесть, решает parseParam: `--tag beta` — два,
// `--tag=beta` и `--verbose` — один. `-abc` даёт сразу три значения.
// Если флаг не объявлен в entry.block, parseParam бросит "Unknown param ...".
function readParam(entry: ParsedBlock, rest: string[]): string[] {
  const token = rest[0]!;
  const { values, elems } = parseParam(rest, entry.block);

  for (const { param, value } of values) {
    // Один флаг дважды в одном блоке — ошибка. Дефолты сюда ещё не попали,
    // они проставляются только после всего разбора, поэтому не мешают.
    if (param.name in entry.params) {
      throw new Error("Param duplicated: " + token);
    }

    // "4" → 4, "1" → true, строка остаётся строкой.
    entry.params[param.name] = convertParam(value, param, token);
  }

  return elems;
}

// Какой позиционный следующим примет токен.
// Позиционные идут по порядку объявления; берём первый, у которого ещё нет
// значения. Variadic принимает всегда, сколько бы токенов уже ни было, —
// и он гарантированно последний (это проверяет validatePositionals),
// так что после него искать нечего.
// Вместо хранения индекса вычисляем его из того, что уже заполнено.
function findFreePositional(entry: ParsedBlock): Positional | undefined {
  for (const positional of entry.block.positionals) {
    if (positional.variadic || !(positional.name in entry.positionals)) {
      return positional;
    }
  }

  return;
}

// Кладёт токен в следующий свободный позиционный блока.
// false — свободного нет, токен этому блоку не нужен; что делать дальше,
// решает вызывающий (уйти в линк или упасть).
function readPositional(entry: ParsedBlock, token: string): boolean {
  const positional = findFreePositional(entry);
  if (positional === undefined) {
    return false;
  }

  // Обычный позиционный — одно значение.
  if (!positional.variadic) {
    entry.positionals[positional.name] = token;
    return true;
  }

  // Variadic — дописываем в массив, создавая его на первом токене.
  const list =
    (entry.positionals[positional.name] as string[] | undefined) ?? [];
  list.push(token);
  entry.positionals[positional.name] = list;
  return true;
}

// Разбирает всё, что стоит после `--`: каждый токен — только позиционный,
// даже если похож на флаг (`--weird`) или совпадает с именем команды
// (`build`). Если у текущего блока свободного слота нет, входим в линк и
// пробуем там; линка нет — токен некуда деть, ошибка.
function readSeparated(parsedBlocks: ParsedBlock[], tokens: string[]): void {
  for (const token of tokens) {
    while (!readPositional(parsedBlocks.at(-1)!, token)) {
      const link = findLink(parsedBlocks.at(-1)!.block);
      if (link === undefined) {
        throw new Error(`Unknown arg: ${token}`);
      }

      enterBlock(parsedBlocks, { block: link, arg: link.arg });
    }
  }
}

// Дописывает дефолты флагов, которые пользователь не передал.
// Вызывается один раз в самом конце, когда всё явно переданное уже лежит
// в params, — поэтому явное значение всегда побеждает дефолт.
function applyDefaults(entry: ParsedBlock): void {
  for (const param of entry.block.params) {
    if (param.defaultValue === undefined) {
      continue;
    }

    if (param.name in entry.params) {
      continue;
    }

    // String() + convertDefault: дефолт мог прийти и строкой ("0" из README),
    // и уже типизированным (false). На выходе всегда тип параметра.
    entry.params[param.name] = convertDefault(
      String(param.defaultValue),
      param,
    );
  }
}

export function parse<TBlock extends Block = any>(
  args: string[],
  blocks: TBlock[],
  { onHelp }: { onHelp?: (block: Block) => void } = {},
): ParsedBlock<TBlock>[] {
  if (blocks.length === 0) {
    throw new Error("Empty blocks");
  }

  // Состояния у разбора ровно два:
  // - parsedBlocks — пройденные команды; последняя = текущая, в неё пишем;
  // - rest — токены, которые ещё не прочитаны.
  const root = resolveRoot(blocks);
  const parsedBlocks: ParsedBlock[] = [
    { arg: root.arg, params: {}, positionals: {}, block: root },
  ];
  let rest = args;

  // Каждый шаг либо съедает токены из rest, либо входит в блок и через
  // continue читает тот же токен заново — уже от лица нового блока.
  while (rest.length > 0) {
    const current = parsedBlocks.at(-1)!;
    const token = rest[0]!;

    // Справка по текущей команде, разбор прекращаем.
    if (token === "--help") {
      onHelp?.(current.block);
      return [];
    }

    // Разделитель: дальше флагов и команд нет, только позиционные.
    // Сам `--` в результат не кладём, остаток разбираем целиком.
    if (token === "--") {
      readSeparated(parsedBlocks, rest.slice(1));
      rest = [];
      continue;
    }

    // Куда уходить, если токен текущему блоку не подходит. У корня с
    // commandLink это "run"; у обычной команды без линка — undefined.
    const link = findLink(current.block);

    // --- Флаг ---
    if (token.startsWith("-")) {
      // Внутри слинкованной команды глобальный блок проверяется первым, как и
      // до входа в линк: `--debug --tag beta --debug2` валидно, даже если
      // --debug2 глобальный, а --tag уже увёл нас в run.
      const root = parsedBlocks[0]!;
      if (checkInsideLink(parsedBlocks) && checkParam(token, root.block)) {
        rest = readParam(root, rest);
        continue;
      }

      // В линк уходим, только если флаг не знает текущий блок, но знает
      // слинкованный. Текущий проверяется первым: `--verbose build` при
      // --verbose у обоих оставит флаг в корне и не угонит команду build.
      if (
        link !== undefined &&
        !checkParam(token, current.block) &&
        checkParam(token, link)
      ) {
        // rest не трогаем: следующий шаг прочитает этот же флаг уже в линке.
        enterBlock(parsedBlocks, { block: link, arg: link.arg });
        continue;
      }

      // Иначе разбираем в текущем блоке. Незнакомый флаг упадёт внутри
      // parseParam со своим сообщением.
      rest = readParam(current, rest);
      continue;
    }

    // --- Команда ---
    // Проверяется раньше позиционных: `mycli build` — всегда команда build,
    // даже если у текущего блока есть свободный позиционный.
    const matched = matchChild(rest, current.block.children);
    if (matched !== undefined) {
      // Сколько токенов съел матчер = было минус осталось.
      // Обычно один ("remote"); у dapes — все оставшиеся, и dapes читает их
      // потом из arg как строку аргументов задачи.
      const consumed = rest.slice(0, rest.length - matched.rest.length);
      enterBlock(parsedBlocks, {
        block: matched.block,
        arg: consumed.join(" "),
      });
      rest = matched.rest;
      continue;
    }

    // --- Позиционный ---
    if (readPositional(current, token)) {
      rest = rest.slice(1);
      continue;
    }

    // --- Никто токен не взял ---
    // Некуда уходить — это ошибка пользователя.
    if (link === undefined) {
      throw new Error(`Unknown arg: ${token}`);
    }

    // Есть линк — входим и читаем токен заново уже там, по тем же правилам:
    // сначала команды слинкованного блока, потом его позиционные.
    // rest не трогаем.
    enterBlock(parsedBlocks, { block: link, arg: link.arg });
  }

  // Аргументы кончились, а мы всё ещё в блоке с линком — значит, команду
  // так и не набрали. `mycli` и `mycli --debug` работают как `mycli run`.
  const link = findLink(parsedBlocks.at(-1)!.block);
  if (link !== undefined) {
    enterBlock(parsedBlocks, { block: link, arg: link.arg });
  }

  // Закрываем последний блок: enterBlock проверяет только те, из которых
  // ушли, а из последнего никто не уходил.
  checkRequiredPositionals(parsedBlocks.at(-1)!);

  // Дефолты — строго после разбора, чтобы не сработала проверка дубликатов
  // в readParam и чтобы явные значения их перекрывали.
  for (const entry of parsedBlocks) {
    applyDefaults(entry);
  }

  // Внутри разбора все блоки типизированы как Block: корень мог быть создан
  // здесь же, потомки и линки найдены обходом дерева. То, что всё дерево
  // состоит из TBlock, — обещание вызывающего (dapes передаёт Block<Data>
  // везде), компилятор это не проверит. Поэтому приведение ровно здесь.
  return parsedBlocks as ParsedBlock<TBlock>[];
}
