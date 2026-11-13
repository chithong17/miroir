import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { getMongoDb, closeMongoConnection } from "../services/mongo.service.js";

dotenv.config({ path: "backend/.env" });

async function applyProductionPlan() {
  const db = await getMongoDb();
  console.log("=== Bắt đầu áp dụng kế hoạch chuẩn hóa dữ liệu Production ===");

  const jsonPath = path.resolve("backend/scripts/plannedCustomers.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Không tìm thấy file: ${jsonPath}`);
  }

  const plannedCustomers = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Đã nạp ${plannedCustomers.length} tài khoản khách hàng từ plannedCustomers.json`);

  let updatedUsersCount = 0;
  const standardPasswordHash = "$2b$12$yIqs9r6PS.4BtMLdLr09V.3Aw3suNXtAa9cZIJcG/HzQu23JfHSLe";

  for (const c of plannedCustomers) {
    const shoulder = Math.round(c.height * 0.23);
    const profile = {
      gender: c.gender,
      measurements: {
        height: c.height,
        weight: c.weight,
        bust: c.bust,
        waist: c.waist,
        hips: c.hips,
        shoulder,
      },
      fitPreference: c.fitPreference,
      fitConsentAt: c.createdAt,
    };

    const result = await db.collection("users").updateOne(
      { id: c.id },
      {
        $set: {
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: "active",
          passwordHash: standardPasswordHash,
          profile: c.profileCompleted ? profile : {},
          profileCompleted: Boolean(c.profileCompleted),
          profileSkipped: !c.profileCompleted,
          updatedAt: new Date(c.createdAt),
        },
        $unset: {
          simulation: "",
        },
      }
    );

    if (result.matchedCount > 0) {
      updatedUsersCount++;
    }
  }

  console.log(`Đã cập nhật thành công ${updatedUsersCount}/${plannedCustomers.length} tài khoản khách hàng trong DB users.`);

  // Clean shop_events metadata
  const eventUpdateResult = await db.collection("shop_events").updateMany(
    {
      $or: [
        { "metadata.isSimulation": { $exists: true } },
        { "metadata.simulationBatch": { $exists: true } },
        { "metadata.source": "customer_presentation_simulation" },
      ],
    },
    {
      $unset: {
        "metadata.isSimulation": "",
        "metadata.simulationBatch": "",
      },
      $set: {
        "metadata.source": "customer_activity",
      },
    }
  );

  console.log(`Đã làm sạch metadata mô phỏng trên ${eventUpdateResult.modifiedCount} sự kiện trong collection shop_events.`);

  // Also clean orders if any
  const orderUpdateResult = await db.collection("orders").updateMany(
    {
      $or: [
        { "metadata.isSimulation": { $exists: true } },
        { "metadata.simulationBatch": { $exists: true } },
      ],
    },
    {
      $unset: {
        "metadata.isSimulation": "",
        "metadata.simulationBatch": "",
      },
      $set: {
        "metadata.source": "checkout",
      },
    }
  );

  if (orderUpdateResult.matchedCount > 0) {
    console.log(`Đã làm sạch metadata trên ${orderUpdateResult.modifiedCount} đơn hàng.`);
  }

  console.log("=== Hoàn tất áp dụng kế hoạch chuẩn hóa dữ liệu Production ===");
  await closeMongoConnection();
}

applyProductionPlan().catch((err) => {
  console.error("Lỗi khi áp dụng:", err);
  process.exitCode = 1;
});
