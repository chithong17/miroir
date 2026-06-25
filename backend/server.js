import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import tryOnRoutes from "./routes/tryon.routes.js";
import { configureCloudinary } from "./services/cloudinary.service.js";

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

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Image size must be 10MB or smaller.",
    });
  }

  if (err.message?.startsWith("Only image files")) {
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
