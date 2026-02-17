import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";

const router: Router = createRouter();

// GET /api/doctor/appointments
router.get(
  "/appointments",
  requireAuth(["doctor"]),
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(
          `
          SELECT
            a.id,
            a.appointment_date::date AS date,
            to_char(a.appointment_date, 'HH24:MI') AS time,
            a.mode,
            a.status,
            pu.full_name AS patient_name
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users pu ON p.user_id = pu.id
          WHERE a.doctor_user_id = $1
          ORDER BY a.appointment_date ASC
          LIMIT 20;
        `,
          [userId]
        );

        const rows = result.rows.map((row) => ({
          id: row.id as string,
          date: row.date as string,
          time: row.time as string,
          mode: (row.mode as string) ?? "In-person",
          status: (row.status as string) ?? "Pending",
          patientName: (row.patient_name as string) ?? "Patient",
        }));

        return res.json(rows);
      } finally {
        client.release();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error in GET /doctor/appointments:", err);
      return res.status(500).json({
        message:
          "Failed to load appointments. Please ensure the database is set up.",
      });
    }
  }
);

export default router;

