import dotenv from "dotenv";
import path from "path";

// Load .env from backend folder explicitly (fixes cwd/path issues)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import cors, { type CorsOptions } from "cors";
import express, { Request, Response, NextFunction } from "express";

import authRoutes from "./routes/auth";
import patientRoutes from "./routes/patient";
import doctorRoutes from "./routes/doctor";
import receptionistRoutes from "./routes/receptionist";
import nurseRoutes from "./routes/nurse";
import adminRoutes from "./routes/admin";
import doctorsRoutes from "./routes/shared";
import { testConnection } from "./db";
import { subscribe } from "./events";
import { verifyToken } from "./auth";

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

const corsOptions: CorsOptions = {
  origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", (corsOptions.origin as string) ?? "*");
  res.header("Access-Control-Allow-Credentials", String(corsOptions.credentials ?? false));
  res.header("Access-Control-Allow-Methods", (corsOptions.methods as string[]).join(","));
  res.header("Access-Control-Allow-Headers", (corsOptions.allowedHeaders as string[]).join(","));
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

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
app.use("/api/receptionist", receptionistRoutes);
app.use("/api/nurse", nurseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctors", doctorsRoutes);

app.get("/api/events", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const qToken = typeof req.query.token === "string" ? (req.query.token as string) : null;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const token = qToken ?? headerToken;
  if (!token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }
  try {
    const payload = verifyToken(token);
    subscribe(res, String(payload.userId));
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

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
