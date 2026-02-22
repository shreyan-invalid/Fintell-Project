import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../types/auth.js";

export function authorize(...roles: UserRole[]) {
  const allowed = new Set<UserRole>(roles);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!allowed.has(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    next();
  };
}
