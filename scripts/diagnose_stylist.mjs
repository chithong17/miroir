import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

async function check() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ No MONGODB_URI found in backend/.env");
    process.exit(1);
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const total = await db.collection("products").countDocuments({ status: "published" });
  const withStock = await db.collection("products").countDocuments({
    status: "published",
    variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
  });
  const premiums = await db.collection("subscriptions").countDocuments({ status: "active" });

  // Check premium shop IDs
  const premiumSubs = await db.collection("subscriptions").find({ status: "active" }).toArray();
  const premiumShopIds = premiumSubs.map((s) => s.shopId).filter(Boolean);

  // Check products that pass the full filter
  const eligible = await db.collection("products").countDocuments({
    status: "published",
    shopId: { $in: premiumShopIds.length ? premiumShopIds : ["__none__"] },
    variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
  });

  console.log("=== STYLIST DIAGNOSTIC ===");
  console.log("Published products:", total);
  console.log("Published products WITH active stock variants:", withStock);
  console.log("Active premium subscriptions:", premiums);
  console.log("Premium Shop IDs:", premiumShopIds);
  console.log("Products that PASS full stylist filter (eligible):", eligible);

  if (eligible === 0) {
    if (premiums === 0) {
      console.log("\n⚠️  Root cause: NO shops have active Premium subscriptions.");
      console.log("   The retrieval.service.js filters out non-premium shops.");
    } else if (withStock === 0) {
      console.log("\n⚠️  Root cause: No published products have active variants with stock > 0.");
    } else {
      console.log("\n⚠️  Root cause: Products exist but none belong to premium shops.");
    }
  } else {
    console.log("\n✅ Data looks fine. Issue may be with vector embeddings or index.");
  }

  await client.close();
}

check().catch(console.error);
