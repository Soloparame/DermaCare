import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";

export type UserRole = "patient" | "doctor" | "nurse" | "receptionist" | "admin";

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

const JWT_SECRET: Secret = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
  (process.env.JWT_EXPIRES_IN as unknown as SignOptions["expiresIn"]) ?? "8h";

export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

