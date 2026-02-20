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

// PATCH /api/doctor/appointments/:id - update status (e.g. Completed)
router.patch("/appointments/:id", requireAuth(["doctor", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });

  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !["Pending", "Confirmed", "Cancelled", "Completed"].includes(status)) {
    return res.status(400).json({ message: "Valid status required." });
  }

  try {
    const result = await pool.query(
      "UPDATE appointments SET status = $1 WHERE id = $2 AND doctor_user_id = $3 RETURNING id, status",
      [status, id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    return res.json({ id: result.rows[0].id, status: result.rows[0].status });
  } catch (err) {
    console.error("Error in PATCH /doctor/appointments:", err);
    return res.status(500).json({ message: "Failed to update appointment." });
  }
});

// POST /api/doctor/medical-records - add medical record for a patient
router.post("/medical-records", requireAuth(["doctor", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });

  const { patientId, notes, diagnosis, prescriptions } = req.body as {
    patientId?: string;
    notes?: string;
    diagnosis?: string;
    prescriptions?: string;
  };

  if (!patientId) {
    return res.status(400).json({ message: "patientId is required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO medical_records (patient_id, doctor_user_id, notes, diagnosis, prescriptions)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, patient_id, notes, diagnosis, prescriptions, created_at`,
      [patientId, userId, notes ?? null, diagnosis ?? null, prescriptions ?? null]
    );
    const row = result.rows[0];
    return res.status(201).json({
      id: row.id,
      patientId: row.patient_id,
      notes: row.notes,
      diagnosis: row.diagnosis,
      prescriptions: row.prescriptions,
      createdAt: row.created_at,
    });
  } catch (err) {
    console.error("Error in POST /doctor/medical-records:", err);
    return res.status(500).json({ message: "Failed to create medical record." });
  }
});

// GET /api/doctor/patients - list patients (for medical records dropdown)
router.get("/patients", requireAuth(["doctor", "admin"]), async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Not authenticated." });

  try {
    const result = await pool.query(
      `
      SELECT DISTINCT p.id, u.full_name, u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      JOIN appointments a ON a.patient_id = p.id
      WHERE a.doctor_user_id = $1
      ORDER BY u.full_name
      `,
      [userId]
    );
    return res.json(
      result.rows.map((r) => ({ id: r.id, fullName: r.full_name, email: r.email }))
    );
  } catch (err) {
    console.error("Error in GET /doctor/patients:", err);
    return res.status(500).json({ message: "Failed to load patients." });
  }
});

export default router;

