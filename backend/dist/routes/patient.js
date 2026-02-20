"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
// GET /api/patient/appointments
router.get("/appointments", (0, requireAuth_1.requireAuth)(["patient", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated." });
    }
    try {
        const client = await db_1.pool.connect();
        try {
            const result = await client.query(`
          SELECT a.id, a.appointment_date::date AS date, to_char(a.appointment_date, 'HH24:MI') AS time,
                 a.mode, a.status, d.full_name AS doctor_name,
                 COALESCE(pay.status, 'Pending') AS payment_status
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN users u ON p.user_id = u.id
          JOIN users d ON a.doctor_user_id = d.id
          LEFT JOIN payments pay ON pay.appointment_id = a.id
          WHERE u.id = $1
          ORDER BY a.appointment_date ASC
          LIMIT 50;
        `, [userId]);
            const rows = result.rows.map((row) => ({
                id: row.id,
                date: row.date,
                time: row.time,
                mode: row.mode ?? "In-person",
                status: row.status ?? "Pending",
                doctorName: row.doctor_name ?? "Dermatologist",
                paymentStatus: row.payment_status ?? "Pending",
            }));
            return res.json(rows);
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error in GET /patient/appointments:", err);
        return res.status(500).json({
            message: "Failed to load appointments. Please ensure the database is set up.",
        });
    }
});
// GET /api/patient/stats
router.get("/stats", (0, requireAuth_1.requireAuth)(["patient", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    try {
        const client = await db_1.pool.connect();
        try {
            const patientRow = await client.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (!patientRow.rows[0])
                return res.json({ totalAppointments: 0, completed: 0, pending: 0, medicalRecordsCount: 0 });
            const patientId = patientRow.rows[0].id;
            const [apptRes, mrRes] = await Promise.all([
                client.query("SELECT status FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE p.user_id = $1", [userId]),
                client.query("SELECT COUNT(*)::int AS c FROM medical_records WHERE patient_id = $1", [patientId]),
            ]);
            const appointments = apptRes.rows;
            const completed = appointments.filter((a) => a.status === "Completed").length;
            const pending = appointments.filter((a) => ["Pending", "Confirmed"].includes(a.status)).length;
            return res.json({
                totalAppointments: appointments.length,
                completed,
                pending,
                medicalRecordsCount: mrRes.rows[0]?.c ?? 0,
            });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error("Error in GET /patient/stats:", err);
        return res.status(500).json({ message: "Failed to load stats." });
    }
});
// GET /api/patient/medical-records
router.get("/medical-records", (0, requireAuth_1.requireAuth)(["patient", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    try {
        const result = await db_1.pool.query(`SELECT mr.id, mr.notes, mr.diagnosis, mr.prescriptions, mr.created_at, u.full_name AS doctor_name
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       JOIN users u ON mr.doctor_user_id = u.id
       WHERE p.user_id = $1 ORDER BY mr.created_at DESC`, [userId]);
        return res.json(result.rows.map((r) => ({
            id: r.id, notes: r.notes, diagnosis: r.diagnosis, prescriptions: r.prescriptions,
            createdAt: r.created_at, doctorName: r.doctor_name,
        })));
    }
    catch (err) {
        console.error("Error in GET /patient/medical-records:", err);
        return res.status(500).json({ message: "Failed to load medical records." });
    }
});
// DELETE /api/patient/appointments/:id - cancel (only if Pending)
router.delete("/appointments/:id", (0, requireAuth_1.requireAuth)(["patient", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    const { id } = req.params;
    try {
        const client = await db_1.pool.connect();
        try {
            const check = await client.query(`SELECT a.status FROM appointments a
         JOIN patients p ON a.patient_id = p.id WHERE p.user_id = $1 AND a.id = $2`, [userId, id]);
            if (!check.rows[0])
                return res.status(404).json({ message: "Appointment not found." });
            if (check.rows[0].status !== "Pending") {
                return res.status(400).json({ message: "Only Pending appointments can be cancelled." });
            }
            await client.query("UPDATE appointments SET status = 'Cancelled' WHERE id = $1", [id]);
            return res.json({ id, status: "Cancelled" });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error("Error in DELETE /patient/appointments:", err);
        return res.status(500).json({ message: "Failed to cancel appointment." });
    }
});
// POST /api/patient/appointments - create new appointment
router.post("/appointments", (0, requireAuth_1.requireAuth)(["patient", "admin"]), async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        return res.status(401).json({ message: "Not authenticated." });
    const { doctorId, date, time, mode } = req.body;
    if (!doctorId || !date || !time) {
        return res.status(400).json({ message: "doctorId, date, and time are required." });
    }
    const visitMode = mode === "Virtual" ? "Virtual" : "In-person";
    try {
        const client = await db_1.pool.connect();
        try {
            const patientRow = await client.query("SELECT id FROM patients WHERE user_id = $1", [userId]);
            if (!patientRow.rows[0]) {
                return res.status(400).json({ message: "Patient profile not found." });
            }
            const patientId = patientRow.rows[0].id;
            const doctorCheck = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'doctor'", [doctorId]);
            if (!doctorCheck.rows[0]) {
                return res.status(400).json({ message: "Invalid doctor." });
            }
            const appointmentDate = new Date(`${date}T${time}`);
            if (isNaN(appointmentDate.getTime())) {
                return res.status(400).json({ message: "Invalid date or time." });
            }
            const overlap = await client.query(`SELECT id FROM appointments
           WHERE patient_id = $1 AND doctor_user_id = $2
           AND appointment_date::date = $3
           AND status NOT IN ('Cancelled')
           LIMIT 1`, [patientId, doctorId, date]);
            if (overlap.rowCount && overlap.rowCount > 0) {
                return res.status(409).json({ message: "You already have an appointment with this doctor on this date." });
            }
            const result = await client.query(`INSERT INTO appointments (patient_id, doctor_user_id, appointment_date, mode, status)
           VALUES ($1, $2, $3, $4, 'Pending') RETURNING id`, [patientId, doctorId, appointmentDate, visitMode]);
            const apptId = result.rows[0].id;
            await client.query(`INSERT INTO payments (appointment_id, amount, status) VALUES ($1, 0, 'Pending')`, [apptId]);
            return res.status(201).json({
                id: apptId,
                date,
                mode: visitMode,
                status: "Pending",
                paymentStatus: "Pending",
            });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error("Error in POST /patient/appointments:", err);
        return res.status(500).json({ message: "Failed to create appointment." });
    }
});
exports.default = router;
