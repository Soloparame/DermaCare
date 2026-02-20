import type { Request, Response } from "express";
import { Router as createRouter } from "express";
import { pool } from "../db";
import { requireAuth } from "../middleware/requireAuth";

const router = createRouter();

// GET /api/receptionist/patients - list all patients (for booking)
router.get("/patients", requireAuth(["receptionist", "admin"]), async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, u.full_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ORDER BY u.full_name`
    );
    return res.json(result.rows.map((r) => ({
      id: r.id, fullName: r.full_name, email: r.email, phone: r.phone,
    })));
  } catch (err) {
    console.error("Error in GET /receptionist/patients:", err);
    return res.status(500).json({ message: "Failed to load patients." });
  }
});

// GET /api/receptionist/appointments - all appointments (with filters)
router.get("/appointments", requireAuth(["receptionist", "admin"]), async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    let query = `
      SELECT a.id, a.appointment_date, a.mode, a.status, a.created_at,
             pu.full_name AS patient_name, pu.email AS patient_email, pu.phone AS patient_phone,
             du.full_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN users du ON a.doctor_user_id = du.id
      ORDER BY a.appointment_date ASC
    `;
    const params: string[] = [];
    if (status) {
      query = `
        SELECT a.id, a.appointment_date, a.mode, a.status, a.created_at,
               pu.full_name AS patient_name, pu.email AS patient_email, pu.phone AS patient_phone,
               du.full_name AS doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users pu ON p.user_id = pu.id
        JOIN users du ON a.doctor_user_id = du.id
        WHERE a.status = $1
        ORDER BY a.appointment_date ASC
      `;
      params.push(status);
    }

    const result = await pool.query(query, params);
    const rows = result.rows.map((r) => ({
      id: r.id,
      appointmentDate: r.appointment_date,
      date: new Date(r.appointment_date).toISOString().split("T")[0],
      time: new Date(r.appointment_date).toTimeString().slice(0, 5),
      mode: r.mode,
      status: r.status,
      patientName: r.patient_name,
      patientEmail: r.patient_email,
      patientPhone: r.patient_phone,
      doctorName: r.doctor_name,
    }));
    return res.json(rows);
  } catch (err) {
    console.error("Error in GET /receptionist/appointments:", err);
    return res.status(500).json({ message: "Failed to load appointments." });
  }
});

// POST /api/receptionist/appointments - create appointment (receptionist/admin booking for patient)
router.post("/appointments", requireAuth(["receptionist", "admin"]), async (req: Request, res: Response) => {
  const { patientId, doctorId, date, time, mode } = req.body as {
    patientId?: string;
    doctorId?: string;
    date?: string;
    time?: string;
    mode?: string;
  };

  if (!patientId || !doctorId || !date || !time) {
    return res.status(400).json({ message: "patientId, doctorId, date, and time are required." });
  }

  const visitMode = mode === "Virtual" ? "Virtual" : "In-person";

  try {
    const client = await pool.connect();
    try {
      const patientCheck = await client.query("SELECT id FROM patients WHERE id = $1", [patientId]);
      if (!patientCheck.rows[0]) return res.status(400).json({ message: "Invalid patient." });
      const doctorCheck = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'doctor'", [doctorId]);
      if (!doctorCheck.rows[0]) return res.status(400).json({ message: "Invalid doctor." });

      const appointmentDate = new Date(`${date}T${time}`);
      if (isNaN(appointmentDate.getTime())) return res.status(400).json({ message: "Invalid date or time." });

      const result = await client.query(
        `INSERT INTO appointments (patient_id, doctor_user_id, appointment_date, mode, status)
         VALUES ($1, $2, $3, $4, 'Pending') RETURNING id`,
        [patientId, doctorId, appointmentDate, visitMode]
      );
      const apptId = result.rows[0].id as string;
      await client.query("INSERT INTO payments (appointment_id, amount, status) VALUES ($1, 0, 'Pending')", [apptId]);
      return res.status(201).json({ id: apptId, status: "Pending" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error in POST /receptionist/appointments:", err);
    return res.status(500).json({ message: "Failed to create appointment." });
  }
});

// PATCH /api/receptionist/appointments/:id - update status (Confirm, Cancel)
router.patch("/appointments/:id", requireAuth(["receptionist", "admin"]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status?: string };

  if (!status || !["Pending", "Confirmed", "Cancelled", "Completed"].includes(status)) {
    return res.status(400).json({ message: "Valid status required: Pending, Confirmed, Cancelled, or Completed." });
  }

  try {
    const result = await pool.query(
      "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Appointment not found." });
    }
    return res.json({ id: result.rows[0].id, status: result.rows[0].status });
  } catch (err) {
    console.error("Error in PATCH /receptionist/appointments:", err);
    return res.status(500).json({ message: "Failed to update appointment." });
  }
});

// GET /api/receptionist/stats - dashboard stats
router.get("/stats", requireAuth(["receptionist", "admin"]), async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [pending, todayCount, confirmed, cancelled] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Pending'"),
      pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE appointment_date::date = $1", [today]),
      pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Confirmed'"),
      pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Cancelled'"),
    ]);
    return res.json({
      pending: pending.rows[0]?.c ?? 0,
      today: todayCount.rows[0]?.c ?? 0,
      confirmed: confirmed.rows[0]?.c ?? 0,
      cancelled: cancelled.rows[0]?.c ?? 0,
    });
  } catch (err) {
    console.error("Error in GET /receptionist/stats:", err);
    return res.status(500).json({ message: "Failed to load stats." });
  }
});

export default router;
