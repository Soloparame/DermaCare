import type { NextFunction, Request, Response } from "express";
import { verifyToken, type JwtPayload, type UserRole } from "../auth";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export function requireAuth(allowedRoles?: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const payload = verifyToken(token);

      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      req.user = payload;
      return next();
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

