import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/ACER/Downloads/miroir-product-import-template (1).xlsx";
const outputDir = "D:/FPTDocuments/Semester_7/EXE101/miroir/.tmp_excel_template";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const overview = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 4000,
  tableMaxRows: 10,
  tableMaxCols: 14,
  tableMaxCellChars: 100,
});
console.log(overview.ndjson);
const preview = await workbook.render({
  sheetName: "Products",
  autoCrop: "all",
  scale: 1.5,
  format: "png",
});
await fs.writeFile(`${outputDir}/before.png`, new Uint8Array(await preview.arrayBuffer()));
