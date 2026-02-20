import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";

const router: Router = createRouter();

// GET /api/doctors - list all doctors (for booking)
router.get("/", requireAuth(["patient", "receptionist", "admin"]), async (_req: Request, res: Response) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT u.id, u.full_name, u.email, u.phone,
                COALESCE(dp.specialization, 'Dermatology') AS specialization
         FROM users u
         LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
         WHERE u.role = 'doctor' ORDER BY u.full_name`
      );
    } catch {
      result = await pool.query(
        `SELECT id, full_name, email, phone FROM users WHERE role = 'doctor' ORDER BY full_name`
      );
    }
    return res.json(
      result.rows.map((r: { id: string; full_name: string; email: string; phone: string | null; specialization?: string }) => ({
        id: r.id,
        fullName: r.full_name,
        email: r.email,
        phone: r.phone,
        specialization: r.specialization ?? "Dermatology",
      }))
    );
  } catch (err) {
    console.error("Error in GET /doctors:", err);
    return res.status(500).json({ message: "Failed to load doctors." });
  }
});

export default router;
