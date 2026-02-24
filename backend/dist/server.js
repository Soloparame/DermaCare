"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from backend folder explicitly (fixes cwd/path issues)
dotenv_1.default.config({ path: path_1.default.join(__dirname, "..", ".env") });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const patient_1 = __importDefault(require("./routes/patient"));
const doctor_1 = __importDefault(require("./routes/doctor"));
const receptionist_1 = __importDefault(require("./routes/receptionist"));
const nurse_1 = __importDefault(require("./routes/nurse"));
const admin_1 = __importDefault(require("./routes/admin"));
const shared_1 = __importDefault(require("./routes/shared"));
const db_1 = require("./db");
const events_1 = require("./events");
const auth_2 = require("./auth");
const app = (0, express_1.default)();
/* ===========================
   🔎 ENVIRONMENT VALIDATION
=========================== */
function validateEnv() {
    const requiredVars = ["DATABASE_URL", "JWT_SECRET"];
    const missing = requiredVars.filter((key) => !process.env[key] || process.env[key]?.trim() === "");
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
const corsOptions = {
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use((0, cors_1.default)(corsOptions));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", corsOptions.origin ?? "*");
    res.header("Access-Control-Allow-Credentials", String(corsOptions.credentials ?? false));
    res.header("Access-Control-Allow-Methods", corsOptions.methods.join(","));
    res.header("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    return next();
});
app.use(express_1.default.json());
/* ===========================
   🏥 HEALTH CHECK
=========================== */
app.get("/api/health", (_req, res) => {
    return res.json({
        status: "ok",
        service: "dermacare-backend",
    });
});
/* ===========================
   📌 ROUTES
=========================== */
app.use("/api/auth", auth_1.default);
app.use("/api/patient", patient_1.default);
app.use("/api/doctor", doctor_1.default);
app.use("/api/receptionist", receptionist_1.default);
app.use("/api/nurse", nurse_1.default);
app.use("/api/admin", admin_1.default);
app.use("/api/doctors", shared_1.default);
app.get("/api/events", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = (0, auth_2.verifyToken)(token);
        (0, events_1.subscribe)(res, String(payload.userId));
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
});
/* ===========================
   🚨 GLOBAL ERROR HANDLER
=========================== */
app.use((err, _req, res, _next) => {
    console.error("🔥 Unhandled Error:", err);
    return res.status(500).json({
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
/* ===========================
   🚀 START SERVER
=========================== */
const PORT = Number(process.env.PORT) || 4000;
async function startServer() {
    try {
        await (0, db_1.testConnection)(); // Force DB test before starting
        app.listen(PORT, () => {
            console.log(`🚀 [dermacare-backend] API server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("❌ Database connection failed.");
        console.error(error);
        process.exit(1);
    }
}
startServer();
