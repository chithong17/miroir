import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx";
const snapshotDate = process.argv[2] || new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(new Date());

const decodeXml = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'");

const escapeXml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const soap = async (operation, parameters) => {
  const fields = Object.entries(parameters)
    .map(([key, value]) => `<${key}>${escapeXml(value)}</${key}>`)
    .join("");
  const body = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><${operation} xmlns="http://tempuri.org/">${fields}</${operation}></soap:Body></soap:Envelope>`;
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "text/xml; charset=utf-8",
      soapaction: `http://tempuri.org/${operation}`,
    },
    body,
  });
  if (!response.ok) throw new Error(`${operation} returned HTTP ${response.status}`);
  return response.text();
};

const rows = (xml) => [...xml.matchAll(/<TABLE\b[^>]*>([\s\S]*?)<\/TABLE>/g)].map((match) => {
  const row = {};
  for (const field of match[1].matchAll(/<([A-Za-z0-9_]+)>([\s\S]*?)<\/\1>/g)) {
    row[field[1]] = decodeXml(field[2].trim());
  }
  return row;
});

const provinceRows = rows(await soap("DanhMucTinh", { DenNgay: snapshotDate }));
const provinces = [];
for (const province of provinceRows) {
  const wardRows = rows(await soap("DanhMucPhuongXa", {
    DenNgay: snapshotDate,
    Tinh: province.MaTinh,
    TenTinh: "",
    QuanHuyen: "",
    TenQuanHuyen: "",
  }));
  provinces.push({
    code: province.MaTinh,
    name: province.TenTinh,
    wards: wardRows.map((ward) => ({
      code: ward.MaXa || ward.MaPhuongXa || ward.Ma,
      name: ward.TenXa || ward.TenPhuongXa || ward.Ten,
      provinceCode: province.MaTinh,
    })).filter((ward) => ward.code && ward.name),
  });
  console.log(`${province.MaTinh} ${province.TenTinh}: ${wardRows.length}`);
}

const output = {
  datasetVersion: `NSO-${snapshotDate.split("/").reverse().join("-")}`,
  source: "https://danhmuchanhchinh.nso.gov.vn/DMDVHC.asmx",
  generatedAt: new Date().toISOString(),
  provinces,
};
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data");
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(path.join(directory, "vn-admin-units.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${provinces.length} provinces and ${provinces.reduce((sum, item) => sum + item.wards.length, 0)} wards.`);
