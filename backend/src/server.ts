import dotenv from "dotenv";
import path from "path";

// Load .env from backend folder explicitly (fixes cwd/path issues)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import cors from "cors";
import express, { Request, Response, NextFunction } from "express";

import authRoutes from "./routes/auth";
import patientRoutes from "./routes/patient";
import doctorRoutes from "./routes/doctor";
import { testConnection } from "./db";

const app = express();

/* ===========================
   🔎 ENVIRONMENT VALIDATION
=========================== */

function validateEnv() {
  const requiredVars = ["DATABASE_URL", "JWT_SECRET"];

  const missing = requiredVars.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === ""
  );

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("👉 Check your .env file inside the backend folder.");
    process.exit(1); // Stop the server immediately
  }

  console.log("✅ Environment variables loaded successfully.");
}

validateEnv();

/* ===========================
   🔧 MIDDLEWARE
=========================== */

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    credentials: false,
  })
);

app.use(express.json());

/* ===========================
   🏥 HEALTH CHECK
=========================== */

app.get("/api/health", (_req: Request, res: Response) => {
  return res.json({
    status: "ok",
    service: "dermacare-backend",
  });
});

/* ===========================
   📌 ROUTES
=========================== */

app.use("/api/auth", authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);

/* ===========================
   🚨 GLOBAL ERROR HANDLER
=========================== */

app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("🔥 Unhandled Error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

/* ===========================
   🚀 START SERVER
=========================== */

const PORT = Number(process.env.PORT) || 4000;

async function startServer() {
  try {
    await testConnection(); // Force DB test before starting

    app.listen(PORT, () => {
      console.log(
        `🚀 [dermacare-backend] API server running on port ${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Database connection failed.");
    console.error(error);
    process.exit(1);
  }
}

startServer();
