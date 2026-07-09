import dotenv from "dotenv";
import { seedAdminUser } from "../services/adminAuth.service.js";
import { closeMongoConnection } from "../services/mongo.service.js";

dotenv.config();

try {
  const admin = await seedAdminUser({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME,
  });

  console.log(`Seeded admin account: ${admin.email}`);
} catch (error) {
  console.error(error.message || "Could not seed admin account.");
  process.exitCode = 1;
} finally {
  await closeMongoConnection();
}
