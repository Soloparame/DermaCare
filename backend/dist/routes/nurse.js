"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const memory_1 = require("../memory");
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
            date: new Date(r.appointment_date).toISOString().split("T")[0],
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
router.post("/appointments/:id/vitals", (0, requireAuth_1.requireAuth)(["nurse", "admin"]), async (req, res) => {
    const id = String(req.params.id);
    const { bp, hr, temp, weight, notes } = req.body;
    const triageScore = Math.max(1, Math.min(10, (hr ? 1 : 0) + (temp && temp > 38 ? 3 : 0) + (notes ? 1 : 0)));
    try {
        try {
            const r = await db_1.pool.query("INSERT INTO vitals (appointment_id, bp, hr, temp, weight, notes, triage_score) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING appointment_id, recorded_at, triage_score", [id, bp ?? null, hr ?? null, temp ?? null, weight ?? null, notes ?? null, triageScore]);
            return res.status(201).json({ appointmentId: r.rows[0].appointment_id, triageScore: r.rows[0].triage_score, recordedAt: r.rows[0].recorded_at });
        }
        catch {
            const v = { appointmentId: id, bp: bp ?? null, hr: hr ?? null, temp: temp ?? null, weight: weight ?? null, notes: notes ?? null, triageScore, recordedAt: new Date().toISOString() };
            memory_1.mem.setVitals(v);
            return res.status(201).json(v);
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to record vitals." });
    }
});
router.patch("/appointments/:id/prep", (0, requireAuth_1.requireAuth)(["nurse", "admin"]), async (req, res) => {
    const id = String(req.params.id);
    const { steps } = req.body;
    if (!steps)
        return res.status(400).json({ message: "steps required." });
    try {
        try {
            const r = await db_1.pool.query("INSERT INTO prep_status (appointment_id, steps_json, ready_at) VALUES ($1, $2, NOW()) RETURNING appointment_id, ready_at", [id, steps]);
            return res.json({ appointmentId: r.rows[0].appointment_id, readyAt: r.rows[0].ready_at });
        }
        catch {
            const p = { appointmentId: id, steps, readyAt: new Date().toISOString() };
            memory_1.mem.setPrep(p);
            return res.json(p);
        }
    }
    catch {
        return res.status(500).json({ message: "Failed to update preparation." });
    }
});
exports.default = router;
