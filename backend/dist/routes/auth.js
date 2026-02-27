"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post("/register", async (req, res) => {
    const validRoles = ["patient", "doctor", "nurse", "receptionist", "admin"];
    const { role: rawRole = "patient", fullName, email, password, confirmPassword, dateOfBirth, gender, phone, dermatologyHistory, } = req.body;
    const role = validRoles.includes(rawRole) ? rawRole : "patient";
    if (!fullName || !email || !password || !confirmPassword) {
        return res.status(400).json({
            message: "fullName, email, password and confirmPassword are required.",
        });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }
    try {
        const client = await db_1.pool.connect();
        try {
            const emailCheck = await client.query("SELECT id FROM users WHERE email = $1", [email]);
            if (emailCheck.rowCount && emailCheck.rowCount > 0) {
                return res.status(409).json({ message: "Email already registered." });
            }
            const passwordHash = await (0, auth_1.hashPassword)(password);
            const insertUserResult = await client.query(`
        INSERT INTO users (role, full_name, email, password_hash, phone, date_of_birth, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
      `, [role, fullName, email, passwordHash, phone ?? null, dateOfBirth ?? null, gender ?? null]);
            const userId = insertUserResult.rows[0].id;
            if (role === "patient") {
                await client.query("INSERT INTO patients (user_id, dermatology_history) VALUES ($1, $2)", [userId, dermatologyHistory ?? null]);
            }
            if (role === "doctor") {
                try {
                    await client.query("INSERT INTO doctor_profiles (user_id, specialization) VALUES ($1, 'Dermatology')", [userId]);
                }
                catch {
                    // doctor_profiles table may not exist yet
                }
            }
            return res.status(201).json({ id: userId });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error in /auth/register:", err);
        return res.status(500).json({
            message: "Failed to create account. Please ensure the database is configured.",
        });
    }
});
// POST /api/auth/login
router.post("/login", async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({
            message: "email, password and role are required.",
        });
    }
    try {
        const client = await db_1.pool.connect();
        try {
            const result = await client.query("SELECT id, role, password_hash FROM users WHERE email = $1", [email]);
            if (result.rowCount === 0) {
                return res.status(401).json({ message: "Invalid credentials." });
            }
            const user = result.rows[0];
            if (user.role !== role) {
                return res.status(403).json({
                    message: `This account is registered as ${user.role}, not ${role}.`,
                });
            }
            const isValid = await (0, auth_1.verifyPassword)(password, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ message: "Invalid credentials." });
            }
            const token = (0, auth_1.signToken)({ userId: user.id, role: user.role });
            return res.json({ token, role: user.role });
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error in /auth/login:", err);
        return res
            .status(500)
            .json({ message: "Failed to sign in. Please try again later." });
    }
});
// GET /api/auth/me - current user info with role-specific profile (requires valid token)
router.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authenticated." });
    }
    const token = authHeader.split(" ")[1];
    try {
        const { verifyToken } = await Promise.resolve().then(() => __importStar(require("../auth")));
        const payload = verifyToken(token);
        const client = await db_1.pool.connect();
        try {
            const result = await client.query(`SELECT id, role, full_name, email, phone, date_of_birth, gender, created_at
         FROM users WHERE id = $1`, [payload.userId]);
            if (result.rowCount === 0) {
                return res.status(404).json({ message: "User not found." });
            }
            const u = result.rows[0];
            const profile = {
                id: u.id,
                role: u.role,
                fullName: u.full_name,
                email: u.email,
                phone: u.phone,
                dateOfBirth: u.date_of_birth,
                gender: u.gender,
                createdAt: u.created_at,
            };
            if (u.role === "patient") {
                try {
                    const pp = await client.query(`SELECT pp.address, pp.emergency_contact, pp.allergies
             FROM patient_profiles pp JOIN patients p ON pp.patient_id = p.id
             WHERE p.user_id = $1`, [u.id]);
                    if (pp.rows[0]) {
                        const r = pp.rows[0];
                        profile.address = r.address ?? null;
                        profile.emergencyContact = r.emergency_contact ?? null;
                        profile.allergies = r.allergies ?? null;
                    }
                }
                catch {
                    /* patient_profiles may not exist */
                }
            }
            if (u.role === "doctor") {
                try {
                    const dp = await client.query("SELECT specialization, bio, consultation_fee FROM doctor_profiles WHERE user_id = $1", [u.id]);
                    if (dp.rows[0]) {
                        const r = dp.rows[0];
                        profile.specialization = r.specialization ?? "Dermatology";
                        profile.bio = r.bio ?? null;
                        profile.consultationFee = r.consultation_fee ?? null;
                    }
                }
                catch {
                    /* doctor_profiles may not exist */
                }
            }
            return res.json(profile);
        }
        finally {
            client.release();
        }
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
});
exports.default = router;
