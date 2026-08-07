import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

async function check() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ No MONGODB_URI found in .env");
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

  const premiumSubs = await db.collection("subscriptions").find({ status: "active" }).toArray();
  const premiumShopIds = premiumSubs.map((s) => s.shopId).filter(Boolean);

  const eligible = premiumShopIds.length
    ? await db.collection("products").countDocuments({
        status: "published",
        shopId: { $in: premiumShopIds },
        variants: { $elemMatch: { active: true, stockQuantity: { $gt: 0 } } },
      })
    : 0;

  console.log("=== STYLIST DIAGNOSTIC ===");
  console.log("Published products:", total);
  console.log("With active stock variants:", withStock);
  console.log("Active premium subscriptions:", premiums);
  console.log("Premium Shop IDs:", premiumShopIds);
  console.log("Products passing full stylist filter:", eligible);

  if (eligible === 0) {
    if (premiums === 0) {
      console.log("\n⚠️  Root cause: NO active Premium subscriptions. Stylist only shows premium-shop products.");
    } else if (withStock === 0) {
      console.log("\n⚠️  Root cause: No products have variants with active=true AND stockQuantity>0.");
    } else {
      console.log("\n⚠️  Root cause: Products exist but none belong to premium shops.");
    }
  } else {
    console.log("\n✅ Data looks fine — issue may be with vector embeddings or index name.");
  }

  await client.close();
}

check().catch(console.error);
