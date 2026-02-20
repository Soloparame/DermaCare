"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    // eslint-disable-next-line no-console
    console.warn("[dermacare-backend] DATABASE_URL is not set. The API will start, but any DB call will fail until you configure PostgreSQL.");
}
exports.pool = new pg_1.Pool(connectionString
    ? {
        connectionString,
    }
    : undefined);
async function testConnection() {
    if (!connectionString)
        return;
    try {
        await exports.pool.query("SELECT 1");
        // eslint-disable-next-line no-console
        console.log("[dermacare-backend] Connected to PostgreSQL successfully.");
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("[dermacare-backend] Failed to connect to PostgreSQL. Please check DATABASE_URL.", err);
    }
}
