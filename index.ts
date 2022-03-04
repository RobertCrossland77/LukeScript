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
    // first two args are default args, so there will be 4
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

const parseCSV = (filePath: string) => {
  const csvFilePath = path.resolve(__dirname, filePath);
  const fileContent = fs.readFileSync(csvFilePath, { encoding: "utf-8" });
  const removedWhitespace = fileContent.trim();
  const removedHeader = removedWhitespace.replace(/\"JsonData\"\n/, "");
  const rows = removedHeader.split("\n");
  const flattened = rows.reduce<Array<string>>((prev, curr, index) => {
    const removeOpenBrace = curr.split("[");
    if (removeOpenBrace.length !== 2) {
      throw new Error(`Error occurrect on index ${index} which equals ${curr}`);
    }

    const removeCloseBrace = removeOpenBrace[1]?.split("]");
    if (removeCloseBrace.length !== 2) {
      throw new Error(`Error occurrect on index ${index} which equals ${curr}`);
    }

    const newLineBetweenObjects = removeCloseBrace[0].replace(/},{/g, "}\n{");
    const removeEscapedQuotes = newLineBetweenObjects.replace(/\\"/g, '"');
    const splitIntoIndividualObjects = removeEscapedQuotes.split("\n");

    return [...prev, ...splitIntoIndividualObjects];
  }, []);

  const parsed = flattened.map((f) => JSON.parse(f) as Payment);
  return parsed;
};

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
