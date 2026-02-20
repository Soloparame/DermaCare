"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middleware/requireAuth");
const router = (0, express_1.Router)();
// GET /api/doctors - list all doctors (for booking)
router.get("/", (0, requireAuth_1.requireAuth)(["patient", "receptionist", "admin"]), async (_req, res) => {
    try {
        let result;
        try {
            result = await db_1.pool.query(`SELECT u.id, u.full_name, u.email, u.phone,
                COALESCE(dp.specialization, 'Dermatology') AS specialization
         FROM users u
         LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
         WHERE u.role = 'doctor' ORDER BY u.full_name`);
        }
        catch {
            result = await db_1.pool.query(`SELECT id, full_name, email, phone FROM users WHERE role = 'doctor' ORDER BY full_name`);
        }
        return res.json(result.rows.map((r) => ({
            id: r.id,
            fullName: r.full_name,
            email: r.email,
            phone: r.phone,
            specialization: r.specialization ?? "Dermatology",
        })));
    }
    catch (err) {
        console.error("Error in GET /doctors:", err);
        return res.status(500).json({ message: "Failed to load doctors." });
    }
});
exports.default = router;
