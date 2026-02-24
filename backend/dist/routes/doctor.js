"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const memory_1 = require("../memory");
const router = (0, express_1.Router)();
// GET /api/doctor/appointments
router.get("/appointments", (0, requireAuth_1.requireAuth)(["doctor"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated." });
    }
    try {
        const client = await db_1.pool.connect();
        try {
            const result = await client.query(`
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
        `, [userId]);
            const rows = result.rows.map((row) => ({
                id: row.id,
                date: row.date,
                time: row.time,
                mode: row.mode ?? "In-person",
                status: row.status ?? "Pending",
                patientName: row.patient_name ?? "Patient",
            }));
            return res.json(rows);
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error in GET /doctor/appointments:", err);
        return res.status(500).json({
            message: "Failed to load appointments. Please ensure the database is set up.",
        });
    }
});
// PATCH /api/doctor/appointments/:id - update status (e.g. Completed)
router.patch("/appointments/:id", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["Pending", "Confirmed", "Cancelled", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Valid status required." });
    }
    try {
        const result = await db_1.pool.query("UPDATE appointments SET status = $1 WHERE id = $2 AND doctor_user_id = $3 RETURNING id, status", [status, id, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Appointment not found." });
        }
        return res.json({ id: result.rows[0].id, status: result.rows[0].status });
    }
    catch (err) {
        console.error("Error in PATCH /doctor/appointments:", err);
        return res.status(500).json({ message: "Failed to update appointment." });
    }
});
// POST /api/doctor/medical-records - add medical record for a patient
router.post("/medical-records", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    const { patientId, notes, diagnosis, prescriptions } = req.body;
    if (!patientId) {
        return res.status(400).json({ message: "patientId is required." });
    }
    try {
        const result = await db_1.pool.query(`INSERT INTO medical_records (patient_id, doctor_user_id, notes, diagnosis, prescriptions)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, patient_id, notes, diagnosis, prescriptions, created_at`, [patientId, userId, notes ?? null, diagnosis ?? null, prescriptions ?? null]);
        const row = result.rows[0];
        return res.status(201).json({
            id: row.id,
            patientId: row.patient_id,
            notes: row.notes,
            diagnosis: row.diagnosis,
            prescriptions: row.prescriptions,
            createdAt: row.created_at,
        });
    }
    catch (err) {
        console.error("Error in POST /doctor/medical-records:", err);
        return res.status(500).json({ message: "Failed to create medical record." });
    }
});
// GET /api/doctor/patients - list patients (for medical records dropdown)
router.get("/patients", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    try {
        const result = await db_1.pool.query(`
      SELECT DISTINCT p.id, u.full_name, u.email
      FROM patients p
      JOIN users u ON p.user_id = u.id
      JOIN appointments a ON a.patient_id = p.id
      WHERE a.doctor_user_id = $1
      ORDER BY u.full_name
      `, [userId]);
        return res.json(result.rows.map((r) => ({ id: r.id, fullName: r.full_name, email: r.email })));
    }
    catch (err) {
        console.error("Error in GET /doctor/patients:", err);
        return res.status(500).json({ message: "Failed to load patients." });
    }
});
router.get("/dashboard", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    try {
        try {
            const today = new Date().toISOString().split("T")[0];
            const [todayRes, pendingRes, confirmedRes] = await Promise.all([
                db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE doctor_user_id = $1 AND appointment_date::date = $2", [userId, today]),
                db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE doctor_user_id = $1 AND status = 'Pending'", [userId]),
                db_1.pool.query("SELECT COUNT(*)::int AS c FROM appointments WHERE doctor_user_id = $1 AND status = 'Confirmed'", [userId]),
            ]);
            return res.json({ today: todayRes.rows[0]?.c ?? 0, pending: pendingRes.rows[0]?.c ?? 0, confirmed: confirmedRes.rows[0]?.c ?? 0 });
        }
        catch {
            return res.json({ today: 0, pending: 0, confirmed: 0 });
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to load dashboard." });
    }
});
router.get("/patients/:id/summary", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const { id } = req.params;
    try {
        try {
            const basic = await db_1.pool.query("SELECT id, full_name, email, phone, date_of_birth, gender FROM users WHERE id = $1", [id]);
            const mr = await db_1.pool.query("SELECT id, notes, diagnosis, prescriptions, created_at FROM medical_records WHERE patient_id IN (SELECT p.id FROM patients p WHERE p.user_id = $1) ORDER BY created_at DESC LIMIT 5", [id]);
            const images = await db_1.pool.query("SELECT file_url, created_at FROM case_images WHERE case_id IN (SELECT id FROM cases WHERE patient_id IN (SELECT p.id FROM patients p WHERE p.user_id = $1)) ORDER BY created_at DESC LIMIT 4", [id]);
            return res.json({ basic: basic.rows[0] ?? null, recentRecords: mr.rows ?? [], recentImages: images.rows ?? [] });
        }
        catch {
            return res.json({ basic: null, recentRecords: [], recentImages: [] });
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to load summary." });
    }
});
router.post("/prescriptions", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const doctorId = req.user?.userId;
    if (!doctorId)
        return res.status(401).json({ message: "Not authenticated." });
    const { appointmentId, patientId, items, instructions, startDate, endDate } = req.body;
    if (!appointmentId || !patientId || !items)
        return res.status(400).json({ message: "appointmentId, patientId, items required." });
    try {
        try {
            const r = await db_1.pool.query("INSERT INTO rx_prescriptions (appointment_id, patient_id, doctor_id, items_json, instructions, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at", [appointmentId, patientId, doctorId, items, instructions ?? null, startDate ?? null, endDate ?? null]);
            return res.status(201).json({ id: r.rows[0].id, createdAt: r.rows[0].created_at });
        }
        catch {
            const rec = memory_1.mem.addPrescription(appointmentId, patientId, doctorId, items, instructions ?? null, startDate ?? null, endDate ?? null);
            return res.status(201).json({ id: rec.id, createdAt: rec.createdAt });
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to create prescription." });
    }
});
router.post("/appointments/:id/followup", (0, requireAuth_1.requireAuth)(["doctor", "admin"]), async (req, res) => {
    const doctorId = req.user?.userId;
    if (!doctorId)
        return res.status(401).json({ message: "Not authenticated." });
    const { id } = req.params;
    const { date, time, mode } = req.body;
    if (!date || !time)
        return res.status(400).json({ message: "date and time required." });
    try {
        try {
            const apptDate = new Date(`${date}T${time}:00Z`);
            const base = await db_1.pool.query("SELECT patient_id FROM appointments WHERE id = $1", [id]);
            if (base.rowCount === 0)
                return res.status(404).json({ message: "Base appointment not found." });
            const patientId = base.rows[0].patient_id;
            const r = await db_1.pool.query("INSERT INTO appointments (patient_id, doctor_user_id, appointment_date, mode, status) VALUES ($1, $2, $3, $4, 'Pending') RETURNING id, status", [patientId, doctorId, apptDate.toISOString(), mode ?? "In-person"]);
            return res.status(201).json({ id: r.rows[0].id, status: r.rows[0].status });
        }
        catch {
            return res.status(501).json({ message: "Follow‑up scheduling requires DB support." });
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to create follow‑up." });
    }
});
exports.default = router;
