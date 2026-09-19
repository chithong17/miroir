import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/ACER/Downloads/miroir-product-import-template (1).xlsx";
const outputPath = "D:/FPTDocuments/Semester_7/EXE101/miroir/.tmp_excel_template/miroir-product-import-template-populated.xlsx";

const sampleProducts = [
  ["", "Áo sơ mi linen cổ đứng", "Áo sơ mi linen dáng suông, thấm hút tốt và thoáng mát. Phù hợp đi làm, đi chơi hoặc phối layer nhẹ.", 420000, "in_stock", "trắng, be, xanh olive", "S, M, L, XL", "Linen", ""],
  ["", "Đầm midi hoa nhí", "Đầm midi cổ vuông, eo bo nhẹ và chân váy xòe. Chất vải mềm, phù hợp hẹn hò, dạo phố và dự tiệc nhẹ.", 590000, "in_stock", "kem, xanh pastel, hồng phấn", "S, M, L", "Chiffon", ""],
  ["", "Blazer dáng lửng", "Blazer form lửng có lót mỏng, vai đứng nhẹ. Dễ phối cùng chân váy, quần tây hoặc jeans cho phong cách thanh lịch.", 890000, "in_stock", "đen, be, xám", "S, M, L", "Tuytsi", ""],
  ["", "Quần jean ống suông", "Quần jean cạp cao, ống suông vừa, tôn dáng và dễ phối. Thiết kế co giãn nhẹ để mặc thoải mái cả ngày.", 450000, "in_stock", "xanh denim, xanh đậm", "S, M, L, XL", "Denim cotton", ""],
  ["", "Chân váy tennis", "Chân váy xếp ly ngắn, cạp cao và có quần bảo hộ bên trong. Phù hợp phong cách trẻ trung, năng động.", 280000, "in_stock", "trắng, đen, xanh navy", "S, M, L", "Kaki", ""],
  ["", "Áo thun basic cổ tròn", "Áo thun cotton form vừa, cổ tròn và bề mặt mềm mịn. Món cơ bản dễ kết hợp trong tủ đồ hằng ngày.", 220000, "in_stock", "trắng, đen, nâu, xanh rêu", "S, M, L, XL", "Cotton", ""],
  ["", "Áo khoác denim", "Áo khoác denim dáng ngắn, tay dài và có túi trước. Phù hợp phối layer cho những ngày thời tiết mát.", 799000, "in_stock", "xanh nhạt, xanh denim", "S, M, L", "Denim", ""],
  ["", "Quần tây ống rộng", "Quần tây cạp cao, ống rộng rủ nhẹ tạo cảm giác thanh thoát. Phù hợp đi làm, gặp gỡ hoặc sự kiện trang trọng.", 520000, "in_stock", "đen, be, nâu", "S, M, L, XL", "Tuytsi", ""],
  ["", "Áo hoodie zip", "Áo hoodie có khóa kéo, mũ trùm và lớp nỉ mỏng. Dễ phối cùng quần jean hoặc chân váy cho phong cách casual.", 500000, "in_stock", "kem, xám, đen", "S, M, L", "Nỉ cotton", ""],
  ["", "Áo hai dây ren", "Áo hai dây form ôm nhẹ, viền ren tinh tế. Dùng mặc riêng hoặc phối cùng blazer, cardigan.", 180000, "in_stock", "trắng, hồng phấn, đen", "S, M, L", "Thun gân", ""],
];

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const products = workbook.worksheets.getItem("Products");
products.getRange("A2:I11").values = sampleProducts;
products.getRange("A2:A11").format.numberFormat = "@";
products.getRange("D2:D11").format.numberFormat = "#,##0";
products.getRange("C2:C11").format.wrapText = true;
products.getRange("A2:I11").format.rowHeight = 42;

const check = await workbook.inspect({
  kind: "table",
  range: "Products!A1:I11",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 9,
});
console.log(check.ndjson);

const preview = await workbook.render({
  sheetName: "Products",
  range: "A1:I11",
  scale: 1.5,
  format: "png",
});
await fs.writeFile("D:/FPTDocuments/Semester_7/EXE101/miroir/.tmp_excel_template/after.png", new Uint8Array(await preview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved ${outputPath}`);
