import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINT = "https://provinces.open-api.vn/api/?depth=3";

console.log("Fetching location data from open-api.vn...");
const response = await fetch(ENDPOINT);
const rawData = await response.json();

const provinces = rawData.map((province) => ({
  code: String(province.code),
  name: province.name,
  districts: (province.districts || []).map((district) => ({
    code: String(district.code),
    name: district.name,
    wards: (district.wards || []).map((ward) => ({
      code: String(ward.code),
      name: ward.name,
    })),
  })),
}));

const output = {
  datasetVersion: `OPENAPI-${new Date().toISOString().split("T")[0]}`,
  source: ENDPOINT,
  generatedAt: new Date().toISOString(),
  provinces,
};

const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data");
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(path.join(directory, "vn-admin-units.json"), `${JSON.stringify(output, null, 2)}\n`);

const districtCount = provinces.reduce((sum, p) => sum + p.districts.length, 0);
const wardCount = provinces.reduce((sum, p) => sum + p.districts.reduce((s, d) => s + d.wards.length, 0), 0);
console.log(`Wrote ${provinces.length} provinces, ${districtCount} districts, and ${wardCount} wards.`);
