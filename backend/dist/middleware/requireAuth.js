"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const auth_1 = require("../auth");
function requireAuth(allowedRoles) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid token" });
        }
        const token = authHeader.split(" ")[1];
        try {
            const payload = (0, auth_1.verifyToken)(token);
            // Admin can access any role-specific endpoint
            if (allowedRoles && !allowedRoles.includes(payload.role) && payload.role !== "admin") {
                return res.status(403).json({ message: "Insufficient permissions" });
            }
            req.user = payload;
            return next();
        }
        catch {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    };
}
