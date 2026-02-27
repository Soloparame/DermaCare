import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "../db";
import {
  hashPassword,
  signToken,
  verifyPassword,
  type UserRole,
} from "../auth";

const router: Router = createRouter();

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const validRoles: UserRole[] = ["patient", "doctor", "nurse", "receptionist", "admin"];
  const {
    role: rawRole = "patient",
    fullName,
    email,
    password,
    confirmPassword,
    dateOfBirth,
    gender,
    phone,
    dermatologyHistory,
  } = req.body as {
    role?: string;
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    dermatologyHistory?: string;
  };

  const role = validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : "patient";

  if (!fullName || !email || !password || !confirmPassword) {
    return res.status(400).json({
      message: "fullName, email, password and confirmPassword are required.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const client = await pool.connect();
    try {
      const emailCheck = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (emailCheck.rowCount && emailCheck.rowCount > 0) {
        return res.status(409).json({ message: "Email already registered." });
      }

      const passwordHash = await hashPassword(password);

      const insertUserResult = await client.query(
        `
        INSERT INTO users (role, full_name, email, password_hash, phone, date_of_birth, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `,
        [role, fullName, email, passwordHash, phone ?? null, dateOfBirth ?? null, gender ?? null]
      );

      const userId = insertUserResult.rows[0].id as string;

      if (role === "patient") {
        await client.query(
          "INSERT INTO patients (user_id, dermatology_history) VALUES ($1, $2)",
          [userId, dermatologyHistory ?? null]
        );
      }
      if (role === "doctor") {
        try {
          await client.query(
            "INSERT INTO doctor_profiles (user_id, specialization) VALUES ($1, 'Dermatology')",
            [userId]
          );
        } catch {
          // doctor_profiles table may not exist yet
        }
      }

      return res.status(201).json({ id: userId });
    } finally {
      client.release();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /auth/register:", err);
    return res.status(500).json({
      message:
        "Failed to create account. Please ensure the database is configured.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, role } = req.body as {
    email?: string;
    password?: string;
    role?: UserRole;
  };

  if (!email || !password || !role) {
    return res.status(400).json({
      message: "email, password and role are required.",
    });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, role, password_hash FROM users WHERE email = $1",
        [email]
      );

      if (result.rowCount === 0) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const user = result.rows[0] as {
        id: string;
        role: UserRole;
        password_hash: string;
      };

      if (user.role !== role) {
        return res.status(403).json({
          message: `This account is registered as ${user.role}, not ${role}.`,
        });
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials." });
      }

      const token = signToken({ userId: user.id, role: user.role });

      return res.json({ token, role: user.role });
    } finally {
      client.release();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /auth/login:", err);
    return res
      .status(500)
      .json({ message: "Failed to sign in. Please try again later." });
  }
});

// GET /api/auth/me - current user info with role-specific profile (requires valid token)
router.get("/me", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const { verifyToken } = await import("../auth");
    const payload = verifyToken(token);
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT id, role, full_name, email, phone, date_of_birth, gender, created_at
         FROM users WHERE id = $1`,
        [payload.userId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      const u = result.rows[0] as {
        id: string;
        role: string;
        full_name: string;
        email: string;
        phone: string | null;
        date_of_birth: string | null;
        gender: string | null;
        created_at: string;
      };
      const profile: Record<string, unknown> = {
        id: u.id,
        role: u.role,
        fullName: u.full_name,
        email: u.email,
        phone: u.phone,
        dateOfBirth: u.date_of_birth,
        gender: u.gender,
        createdAt: u.created_at,
      };
      if (u.role === "patient") {
        try {
          const pp = await client.query(
            `SELECT pp.address, pp.emergency_contact, pp.allergies
             FROM patient_profiles pp JOIN patients p ON pp.patient_id = p.id
             WHERE p.user_id = $1`,
            [u.id]
          );
          if (pp.rows[0]) {
            const r = pp.rows[0] as { address?: string; emergency_contact?: string; allergies?: string };
            profile.address = r.address ?? null;
            profile.emergencyContact = r.emergency_contact ?? null;
            profile.allergies = r.allergies ?? null;
          }
        } catch {
          /* patient_profiles may not exist */
        }
      }
      if (u.role === "doctor") {
        try {
          const dp = await client.query(
            "SELECT specialization, bio, consultation_fee FROM doctor_profiles WHERE user_id = $1",
            [u.id]
          );
          if (dp.rows[0]) {
            const r = dp.rows[0] as { specialization?: string; bio?: string; consultation_fee?: number };
            profile.specialization = r.specialization ?? "Dermatology";
            profile.bio = r.bio ?? null;
            profile.consultationFee = r.consultation_fee ?? null;
          }
        } catch {
          /* doctor_profiles may not exist */
        }
      }
      return res.json(profile);
    } finally {
      client.release();
    }
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
});

export default router;
