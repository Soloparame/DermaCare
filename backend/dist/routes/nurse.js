"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
// GET /api/nurse/appointments - today's appointments
router.get("/appointments", (0, requireAuth_1.requireAuth)(["nurse", "admin"]), async (_req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const result = await db_1.pool.query(`
      SELECT a.id, a.appointment_date, a.mode, a.status,
             pu.full_name AS patient_name, pu.phone AS patient_phone, p.dermatology_history,
             du.full_name AS doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN users du ON a.doctor_user_id = du.id
      WHERE a.appointment_date::date = $1 AND a.status IN ('Confirmed', 'Pending')
      ORDER BY a.appointment_date ASC
      `, [today]);
        const rows = result.rows.map((r) => ({
            id: r.id,
            appointmentDate: r.appointment_date,
            time: new Date(r.appointment_date).toTimeString().slice(0, 5),
            mode: r.mode,
            status: r.status,
            patientName: r.patient_name,
            patientPhone: r.patient_phone,
            dermatologyHistory: r.dermatology_history,
            doctorName: r.doctor_name,
        }));
        return res.json(rows);
    }
    catch (err) {
        console.error("Error in GET /nurse/appointments:", err);
        return res.status(500).json({ message: "Failed to load appointments." });
    }
});
exports.default = router;
