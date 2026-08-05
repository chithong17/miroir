import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import adminAuthRoutes from "./routes/adminAuth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import shopAuthRoutes from "./routes/shopAuth.routes.js";
import shopProductRoutes from "./routes/shopProduct.routes.js";
import shopRoutes from "./routes/shop.routes.js";
import stylistRoutes from "./routes/stylist.routes.js";
import tryOnRoutes from "./routes/tryon.routes.js";
import userAuthRoutes from "./routes/userAuth.routes.js";
import userRoutes from "./routes/user.routes.js";
import locationRoutes from "./routes/location.routes.js";
import orderRoutes from "./routes/order.routes.js";
import shopOrderRoutes from "./routes/shopOrder.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import shopNotificationRoutes from "./routes/shopNotification.routes.js";
import { configureCloudinary } from "./services/cloudinary.service.js";
import { ensureCommerceIndexes } from "./services/commerceIndexes.service.js";
import { expireCommerceOrders } from "./services/commerce.service.js";

dotenv.config();

const describeEnvValue = (value) => {
  if (!value) {
    return {
      present: false,
      prefix: "",
      suffix: "",
      length: 0,
    };
  }

  const normalizedValue = value.trim();

  return {
    present: true,
    prefix: normalizedValue.slice(0, 4),
    suffix: normalizedValue.slice(-4),
    length: normalizedValue.length,
    hasLeadingOrTrailingWhitespace: normalizedValue !== value,
  };
};

const isAllowedDevOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
};

const isAllowedVercelPreviewOrigin = (origin, configuredOrigin) => {
  if (!origin || !configuredOrigin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const configuredUrl = new URL(configuredOrigin);

    if (
      originUrl.protocol !== "https:" ||
      configuredUrl.protocol !== "https:" ||
      originUrl.hostname === configuredUrl.hostname
    ) {
      return false;
    }

    if (
      !originUrl.hostname.endsWith(".vercel.app") ||
      !configuredUrl.hostname.endsWith(".vercel.app")
    ) {
      return false;
    }

    const configuredProjectSlug = configuredUrl.hostname.replace(".vercel.app", "");
    return originUrl.hostname.startsWith(`${configuredProjectSlug}-`);
  } catch {
    return false;
  }
};

const requiredEnvVars = [
  "PIAPI_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

configureCloudinary();

const app = express();
const port = process.env.PORT || 5000;
const configuredFrontendOrigin = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === configuredFrontendOrigin ||
        isAllowedDevOrigin(origin) ||
        isAllowedVercelPreviewOrigin(origin, configuredFrontendOrigin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "MIROIR backend is running" });
});

app.get("/api/debug/piapi-key", (_req, res) => {
  const key = process.env.PIAPI_KEY || "";

  res.json({
    present: Boolean(key),
    prefix: key.slice(0, 4),
    suffix: key.slice(-4),
    length: key.length,
    hasLeadingOrTrailingWhitespace: key !== key.trim(),
  });
});

app.use("/api/tryon", tryOnRoutes);
app.use("/api/stylist", stylistRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/user-auth", userAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/shop-orders", shopOrderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shop-notifications", shopNotificationRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shop-auth", shopAuthRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/shop-products", shopProductRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Uploaded file is too large.",
    });
  }

  if (err.message?.startsWith("Only image files")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message?.startsWith("Only .xlsx files")) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`MIROIR backend listening on port ${port}`);
  console.log("Loaded PIAPI_KEY env info:", describeEnvValue(process.env.PIAPI_KEY));
});

ensureCommerceIndexes().catch((error) => console.error("Commerce index initialization failed:", error));
const commerceDeadlineWorker = setInterval(() => {
  expireCommerceOrders().catch((error) => console.error("Commerce deadline worker failed:", error));
}, Number(process.env.COMMERCE_WORKER_INTERVAL_MS || 300000));
commerceDeadlineWorker.unref();
