import "dotenv/config";
import { closeMongoConnection, getMongoDb } from "../services/mongo.service.js";
import { ensureLegacyCycle } from "../services/billing.service.js";
import { PLAN_CODES, isSubscriptionActive } from "../services/subscription.service.js";

const apply = process.argv.includes("--apply");
try {
  const db = await getMongoDb();
  const owners = await db.collection("shop_owners").find({ "subscription.planCode": PLAN_CODES.SHOP_OWNER_MONTHLY }).toArray();
  const active = owners.filter((owner) => isSubscriptionActive(owner.subscription));
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", legacyOwners: owners.length, activeToMigrate: active.length }, null, 2));
  if (apply) for (const owner of active) await ensureLegacyCycle(owner);
} finally {
  await closeMongoConnection();
}
