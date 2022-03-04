import * as fs from "fs";
import * as path from "path";

type PaymentArgs = {
  file: string;
  terminalID: string;
};

type Payment = {
  RoomID: string;
  StaffID: string;
  TerminalID: string;
  Quantity: string;
  Amount: string;
  Tip: string;
  Total: string;
};

const getArgs = (): PaymentArgs | undefined => {
  try {
    if (process.argv && process.argv.length >= 4) {
      return {
        file: process.argv[2],
        terminalID: process.argv[3],
      };
    }
    throw new Error();
  } catch (_) {
    console.error("\n\nUsage: npm start -- <filename> <terminalId>\n\n");
  }
};

const parseCSV = (filePath: string) =>
  fs
    .readFileSync(path.resolve(__dirname, filePath), { encoding: "utf-8" })
    .trim()
    .replace(/\"JsonData\"\n/, "")
    .split("\n")
    .reduce<Array<string>>(
      (prev, curr) => [
        ...prev,
        ...curr
          .split("[")[1]
          .split("]")[0]
          .replace(/},{/g, "}\n{")
          .replace(/\\"/g, '"')
          .split("\n"),
      ],
      []
    )
    .map((f) => JSON.parse(f) as Payment);

const total = (payments: Array<Payment>, terminalID: string) =>
  payments
    .filter((p) => p.TerminalID === terminalID)
    .reduce<Pick<Payment, "TerminalID" | "Total" | "Quantity">>(
      (prev, current) => {
        return {
          TerminalID: terminalID,
          Total: String(Number(prev.Total) + Number(current.Total)),
          Quantity: String(Number(prev.Quantity) + Number(current.Quantity)),
        };
      },
      {
        TerminalID: terminalID,
        Total: "0",
        Quantity: "0",
      }
    );

(() => {
  console.log("...Validating Args");
  const args = getArgs();
  console.log("Args valid...");
  if (args && args.file && args.terminalID) {
    console.log(`...parsing CSV: ${args.file}`);
    const data = parseCSV(args.file);
    console.log("CSV successfully parsed");
    console.log(`...Aggregating total for terminal: ${args.terminalID}`);
    const result = total(data, args.terminalID);
    console.log("Successfully aggregated");
    console.log("\n");
    console.log("Result");
    console.log("-----------------");
    console.log(result);
  }
})();
