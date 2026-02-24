"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const memory_1 = require("../memory");
const router = (0, express_1.Router)();
// GET /api/receptionist/patients - list all patients (for booking)
router.get("/patients", (0, requireAuth_1.requireAuth)(["receptionist", "admin"]), async (_req, res) => {
    try {
        const result = await db_1.pool.query(`SELECT p.id, u.full_name, u.email, u.phone
       FROM patients p
       JOIN users u ON p.user_id = u.id
       ORDER BY u.full_name`);
        return res.json(result.rows.map((r) => ({
            id: r.id, fullName: r.full_name, email: r.email, phone: r.phone,
        })));
    }
    catch (err) {
        console.error("Error in GET /receptionist/patients:", err);
        return res.status(500).json({ message: "Failed to load patients." });
    }
});
// GET /api/receptionist/appointments - all appointments (with filters)
router.get("/appointments", (0, requireAuth_1.requireAuth)(["receptionist", "admin"]), async (req, res) => {
    try {
        const status = req.query.status;
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
        const params = [];
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
        const result = await db_1.pool.query(query, params);
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
    }
    catch (err) {
        console.error("Error in GET /receptionist/appointments:", err);
        return res.status(500).json({ message: "Failed to load appointments." });
    }
});
// POST /api/receptionist/appointments - create appointment (receptionist/admin booking for patient)
router.post("/appointments", (0, requireAuth_1.requireAuth)(["receptionist", "admin"]), async (req, res) => {
    const { patientId, doctorId, date, time, mode } = req.body;
    if (!patientId || !doctorId || !date || !time) {
        return res.status(400).json({ message: "patientId, doctorId, date, and time are required." });
    }
    const visitMode = mode === "Virtual" ? "Virtual" : "In-person";
    try {
        const client = await db_1.pool.connect();
        try {
            const patientCheck = await client.query("SELECT id FROM patients WHERE id = $1", [patientId]);
            if (!patientCheck.rows[0])
                return res.status(400).json({ message: "Invalid patient." });
            const doctorCheck = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'doctor'", [doctorId]);
            if (!doctorCheck.rows[0])
                return res.status(400).json({ message: "Invalid doctor." });
            const appointmentDate = new Date(`${date}T${time}`);
            if (isNaN(appointmentDate.getTime()))
                return res.status(400).json({ message: "Invalid date or time." });
            const result = await client.query(`INSERT INTO appointments (patient_id, doctor_user_id, appointment_date, mode, status)
         VALUES ($1, $2, $3, $4, 'Pending') RETURNING id`, [patientId, doctorId, appointmentDate, visitMode]);
            const apptId = result.rows[0].id;
            await client.query("INSERT INTO payments (appointment_id, amount, status) VALUES ($1, 0, 'Pending')", [apptId]);
            return res.status(201).json({ id: apptId, status: "Pending" });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error("Error in POST /receptionist/appointments:", err);
        return res.status(500).json({ message: "Failed to create appointment." });
    }
});
// PATCH /api/receptionist/appointments/:id - update status (Confirm, Cancel)
router.patch("/appointments/:id", (0, requireAuth_1.requireAuth)(["receptionist", "admin"]), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["Pending", "Confirmed", "Cancelled", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Valid status required: Pending, Confirmed, Cancelled, or Completed." });
    }
    try {
        const result = await db_1.pool.query("UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id, status", [status, id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Appointment not found." });
        }
        return res.json({ id: result.rows[0].id, status: result.rows[0].status });
    }
    catch (err) {
        console.error("Error in PATCH /receptionist/appointments:", err);
        return res.status(500).json({ message: "Failed to update appointment." });
    }
});
// GET /api/receptionist/stats - dashboard stats
router.get("/stats", (0, requireAuth_1.requireAuth)(["receptionist", "admin"]), async (_req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const [pending, todayCount, confirmed, cancelled] = await Promise.all([
            db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Pending'"),
            db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE appointment_date::date = $1", [today]),
            db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Confirmed'"),
            db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE status = 'Cancelled'"),
        ]);
        return res.json({
            pending: pending.rows[0]?.c ?? 0,
            today: todayCount.rows[0]?.c ?? 0,
            confirmed: confirmed.rows[0]?.c ?? 0,
            cancelled: cancelled.rows[0]?.c ?? 0,
        });
    }
    catch (err) {
        console.error("Error in GET /receptionist/stats:", err);
        return res.status(500).json({ message: "Failed to load stats." });
    }
});
router.get("/availability", (0, requireAuth_1.requireAuth)(["receptionist", "admin", "doctor"]), async (req, res) => {
    const doctorId = req.query.doctor_id;
    const date = req.query.date;
    if (!doctorId || !date)
        return res.status(400).json({ message: "doctor_id and date are required." });
    try {
        try {
            const dayStart = `${date}T00:00:00Z`;
            const dayEnd = `${date}T23:59:59Z`;
            const result = await db_1.pool.query("SELECT appointment_date FROM appointments WHERE doctor_user_id = $1 AND appointment_date BETWEEN $2 AND $3", [doctorId, dayStart, dayEnd]);
            const taken = new Set(result.rows.map((r) => new Date(r.appointment_date).toISOString().slice(11, 16)));
            const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((t) => ({ time: t, available: !taken.has(t) }));
            return res.json({ slots });
        }
        catch {
            const slots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map((t) => ({ time: t, available: true }));
            return res.json({ slots });
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to load availability." });
    }
});
router.post("/queue/checkin", (0, requireAuth_1.requireAuth)(["receptionist", "admin"]), async (req, res) => {
    const { doctorUserId, appointmentId } = req.body;
    if (!doctorUserId || !appointmentId)
        return res.status(400).json({ message: "doctorUserId and appointmentId required." });
    try {
        const item = memory_1.mem.checkIn(doctorUserId, appointmentId);
        return res.status(201).json(item);
    }
    catch {
        return res.status(500).json({ message: "Failed to check in." });
    }
});
exports.default = router;
