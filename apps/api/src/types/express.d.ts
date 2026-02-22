import type { UserRole } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        tenantId?: string;
        role: UserRole;
        email?: string;
      };
    }
  }
}

export {};
