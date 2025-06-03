import { Block } from "./block.ts";
import { Param } from "./param.ts";

export class Matrix {
  matrix: string[][];

  constructor(matrix: string[][]) {
    this.matrix = matrix;
  }

  getMaxRowLength() {
    console.log("-----", "before");
    let max = 0;

    console.log("-----", "this.matrix", this.matrix);
    for (const row of this.matrix) {
      max = Math.max(row.length, max);
    }
    console.log("-----", "max", max);
    return max;
  }

  getRowMaxLengths() {
    const maxValues: number[] = new Array(this.getMaxRowLength()).fill(0);

    this.iterateEach((row, value) => {
      maxValues[row] = Math.max(maxValues[row]!, value.length);
    });

    return maxValues;
  }

  iterateEach(cb: (rowNum: number, value: string) => void) {
    for (let i = 0; i < this.matrix.length; i++) {
      const row = this.matrix[i]!;

      for (let j = 0; j < row.length; j++) {
        const value = row[j]!;

        cb(j, value);
      }
    }
  }

  prepareToPrint() {
    const maxValues = this.getRowMaxLengths();
    // console.log("-----", "maxValues", maxValues);
    const prints: string[] = [];
    for (const row of this.matrix) {
      let strToPrint = "";
      for (let i = 0; i < maxValues.length; i++) {
        const maxValue = maxValues[i]!;
        if (maxValue === 0) {
          console.log("-----", "maxValue");
          continue;
        }

        const value = row[i] || "";

        let valueToPrint;

        valueToPrint = value + " ".repeat(maxValue - value.length);

        if (i === 0) {
          strToPrint = valueToPrint;
          continue;
        }

        strToPrint += " ".repeat(4) + valueToPrint;
      }

      console.log("-----", "strToPrint", strToPrint);
      prints.push(strToPrint);
    }

    return prints;
  }
}

// const matrix = new Matrix([
//   // ["row1.1", "row", "row1.2"],
//   // ["row2.1", "row2.1.5", "row2.2"],
// ]);

const printParam = () => {};

const constructParam = (block: Block) => {
  const paramMatrix = new Matrix([]);

  block.params.forEach((params) => {
    const left = params.short
      ? `--${params.name}, -${params.short}`
      : `--${params.name}`;

    paramMatrix.matrix.push([left, `[${params.type}]`]);
  });

  // console.log("-----", paramMatrix.matrix);

  const messages = paramMatrix.prepareToPrint();

  // console.log("-----", "messages", messages);

  console.log("PARAMS");
  block.params.forEach((params, i) => {
    console.log(messages[i]);
    console.log(" ".repeat(2), params.description);
    // const left = params.short
    //   ? `--${params.name}, ${params.short}`
    //   : `--${params.name}`;

    // paramMatrix.matrix.push([left, params.description]);
  });

  // console.log("Params:\n");
  // block.params.forEach((params) => {
  //   if (params.short) {
  //     console.log(`--${params.name},${params.short} - ${params.description}`);
  //   }
  // });

  // block.children.forEach(() => {});
};

// const result = matrix.prepareToPrint();
// result.forEach((value) => console.log(value));
// console.log("-----", "result", result);

constructParam(
  new Block({
    arg: "hello",
    params: [
      new Param({
        type: "string",
        name: "hello",
        short: "h",
        description: "Is a verby important param",
      }),
      new Param({
        type: "string",
        name: "world",
        short: "w",
        description: "Is a verby important param too",
      }),
    ],
    description: "",
  })
);
