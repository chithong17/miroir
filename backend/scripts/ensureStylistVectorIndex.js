import "dotenv/config";
import { getMongoDb, closeMongoConnection } from "../services/mongo.service.js";

try {
  const db = await getMongoDb();
  const collection = db.collection("products");
  const name = process.env.MONGODB_PRODUCT_VECTOR_INDEX || "products_embedding_index";
  const indexes = await collection.listSearchIndexes(name).toArray();
  const index = indexes[0];
  if (!index) throw new Error(`Vector index ${name} does not exist; create the product embedding index first.`);
  const definition = index.latestDefinition || index.definition;
  if (!Array.isArray(definition?.fields)) throw new Error("Unsupported product vector index definition.");
  const exists = definition.fields.some(field => field.path === "shopId" && field.type === "filter");
  console.log(JSON.stringify({ name, status: index.status, shopFilterConfigured: exists, apply: process.argv.includes("--apply") }));
  if (!exists && process.argv.includes("--apply")) {
    await collection.updateSearchIndex(name, { ...definition, fields: [...definition.fields, { type: "filter", path: "shopId" }] });
    console.log("Added shopId filter; Atlas rebuilds the search index asynchronously. Existing vector dimensions and filters are preserved.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { await closeMongoConnection(); }
