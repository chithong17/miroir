import "dotenv/config";
import { getMongoDb, closeMongoConnection } from "../services/mongo.service.js";
import { migrateAddressView } from "../services/locationV2.service.js";

// Dry run by default. Reports contain IDs/status only; originals stay in MongoDB.
const apply = process.argv.includes("--apply");
const rollback = process.argv.includes("--rollback");
const db = await getMongoDb();
const counts = { convertible: 0, needsConfirmation: 0, updated: 0, skipped: 0 };
try {
  if (rollback) {
    for await (const backup of db.collection("address_v2_migration_backups").find({ restoredAt: null })) {
      if (!apply) { console.log(JSON.stringify({ id: backup.addressId, action: "would_restore" })); continue; }
      const original = { ...backup.original }; delete original._id;
      const result = await db.collection("user_addresses").replaceOne(
        { id: backup.addressId, updatedAt: backup.migratedAt }, original,
      );
      if (result.modifiedCount) {
        await db.collection("address_v2_migration_backups").updateOne({ _id: backup._id }, { $set: { restoredAt: new Date() } });
        counts.updated += 1;
      } else counts.skipped += 1; // Never overwrite later user edits.
    }
  } else {
    for await (const address of db.collection("user_addresses").find({ addressVersion: { $ne: "v2" } })) {
      const converted = migrateAddressView(address);
      if (converted.requiresAddressConfirmation) {
        counts.needsConfirmation += 1;
        console.log(JSON.stringify({ id: address.id, action: "needs_confirmation" }));
        continue;
      }
      counts.convertible += 1;
      if (!apply) { console.log(JSON.stringify({ id: address.id, action: "would_convert" })); continue; }
      const migratedAt = new Date();
      await db.collection("address_v2_migration_backups").insertOne({ addressId: address.id, original: address, migratedAt, restoredAt: null });
      const { _id, ...patch } = converted;
      const result = await db.collection("user_addresses").updateOne(
        { id: address.id, addressVersion: { $ne: "v2" }, updatedAt: address.updatedAt ?? null },
        { $set: { ...patch, updatedAt: migratedAt } },
      );
      if (result.modifiedCount) counts.updated += 1;
      else counts.skipped += 1;
    }
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", rollback, ...counts }));
} finally { await closeMongoConnection(); }
