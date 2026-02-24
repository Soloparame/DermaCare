import type { Request, Response } from "express";
import { Router as createRouter } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";
import { mem } from "../memory";

const router = createRouter();

// GET /api/admin/users - list all users (admin only)
router.get("/users", requireAuth(["admin"]), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, role, full_name, email, phone, date_of_birth, gender, created_at
       FROM users ORDER BY created_at DESC`
    );
    const rows = result.rows.map((r) => ({
      id: r.id,
      role: r.role,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      dateOfBirth: r.date_of_birth,
      gender: r.gender,
      createdAt: r.created_at,
    }));
    return res.json(rows);
  } catch (err) {
    console.error("Error in GET /admin/users:", err);
    return res.status(500).json({ message: "Failed to load users." });
  }
});

// PATCH /api/admin/users/:id/role - change user role
router.patch("/users/:id/role", requireAuth(["admin"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role?: string };

  const validRoles = ["patient", "doctor", "nurse", "receptionist", "admin"];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ message: "Valid role required." });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role",
        [role, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "User not found." });
      }
      if (role === "patient") {
        const existing = await client.query("SELECT id FROM patients WHERE user_id = $1", [id]);
        if (!existing.rows[0]) {
          await client.query("INSERT INTO patients (user_id) VALUES ($1)", [id]);
        }
      }
      if (role === "doctor") {
        try {
          const existing = await client.query("SELECT user_id FROM doctor_profiles WHERE user_id = $1", [id]);
          if (!existing.rows[0]) {
            await client.query("INSERT INTO doctor_profiles (user_id, specialization) VALUES ($1, 'Dermatology')", [id]);
          }
        } catch { /* doctor_profiles may not exist */ }
      }
      return res.json({ id: result.rows[0].id, role: result.rows[0].role });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in PATCH /admin/users/:id/role:", err);
    return res.status(500).json({ message: "Failed to update role." });
  }
});

// GET /api/admin/stats - dashboard stats
router.get("/stats", requireAuth(["admin"]), async (_req: Request, res: Response) => {
  try {
    const usersByRole = await pool.query(
      "SELECT role, COUNT(*)::int AS count FROM users GROUP BY role"
    );
    const roleCounts: Record<string, number> = {};
    usersByRole.rows.forEach((r) => {
      roleCounts[r.role as string] = r.count;
    });

    const [appointments, pending, patients] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS c FROM appointments"),
      pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Pending'"),
      pool.query("SELECT COUNT(*)::int AS c FROM patients"),
    ]);

    return res.json({
      usersByRole: roleCounts,
      totalUsers: Object.values(roleCounts).reduce((a, b) => a + b, 0),
      totalAppointments: appointments.rows[0]?.c ?? 0,
      pendingAppointments: pending.rows[0]?.c ?? 0,
      totalPatients: patients.rows[0]?.c ?? 0,
    });
  } catch (err) {
    console.error("Error in GET /admin/stats:", err);
    return res.status(500).json({ message: "Failed to load stats." });
  }
});

router.post("/notifications/test", requireAuth(["admin"]), async (req: Request, res: Response) => {
  const { userId, type, payload } = req.body as { userId?: string; type?: string; payload?: unknown };
  if (!userId || !type) return res.status(400).json({ message: "userId and type required." });
  try {
    const url = process.env.NOTIFY_WEBHOOK_URL;
    if (url) {
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, type, payload, at: new Date().toISOString() }),
        });
        return res.status(201).json({ status: "sent" });
      } catch {
        return res.status(201).json({ status: "queued" });
      }
    }
    return res.status(201).json({ status: "queued" });
  } catch {
    return res.status(500).json({ message: "Failed to queue notification." });
  }
});

export default router;
