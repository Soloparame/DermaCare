import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // eslint-disable-next-line no-console
  console.warn(
    "[dermacare-backend] DATABASE_URL is not set. The API will start, but any DB call will fail until you configure PostgreSQL."
  );
}

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
      }
    : undefined
);

export async function testConnection() {
  if (!connectionString) return;
  try {
    await pool.query("SELECT 1");
    // eslint-disable-next-line no-console
    console.log("[dermacare-backend] Connected to PostgreSQL successfully.");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      "[dermacare-backend] Failed to connect to PostgreSQL. Please check DATABASE_URL.",
      err
    );
  }
}

