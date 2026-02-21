import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";
import type { UserRole } from "../types/auth.js";

const JWKS = createRemoteJWKSet(new URL(config.KEYCLOAK_JWKS_URI));
const INTERNAL_ISSUER = config.KEYCLOAK_JWKS_URI.replace(/\/protocol\/openid-connect\/certs$/, "");

type JwtPayload = {
  sub: string;
  iss?: string;
  aud?: string | string[];
  azp?: string;
  tenant_id?: string;
  tenant?: string;
  role?: UserRole;
  email?: string;
  realm_access?: {
    roles?: string[];
  };
};

type AuthResult = "authenticated" | "missing" | "invalid";

function extractRole(payload: JwtPayload): UserRole {
  const candidate = payload.role ?? payload.realm_access?.roles?.[0] ?? "VIEWER";
  if (candidate === "OWNER" || candidate === "CFO" || candidate === "ANALYST" || candidate === "VIEWER") {
    return candidate;
  }
  return "VIEWER";
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const result = await hydrateUserFromToken(req);
  if (result !== "authenticated") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function authenticateOptional(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const result = await hydrateUserFromToken(req);
  if (result === "invalid") {
    res.status(401).json({ error: "Invalid bearer token" });
    return;
  }
  next();
}

async function hydrateUserFromToken(req: Request): Promise<AuthResult> {
  try {
    const authHeader = req.header("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return "missing";
    }

    const { payload } = await jwtVerify(token, JWKS);

    const typed = payload as unknown as JwtPayload;
    const issuerAccepted = typed.iss === config.JWT_ISSUER || typed.iss === INTERNAL_ISSUER;
    const audience = typed.aud;
    const audienceList = Array.isArray(audience) ? audience : audience ? [audience] : [];
    const audienceAccepted =
      audienceList.includes(config.JWT_AUDIENCE) || typed.azp === config.JWT_AUDIENCE;

    if (!typed.sub || !issuerAccepted || !audienceAccepted) {
      return "invalid";
    }

    const tenantFromHeader = req.header("x-tenant-id") ?? undefined;
    const tenantId =
      typed.tenant_id ??
      typed.tenant ??
      tenantFromHeader ??
      (config.AUTH_MODE === "optional" ? config.DEFAULT_TENANT_SLUG : undefined);

    if (!tenantId) return "invalid";

    req.user = {
      sub: typed.sub,
      tenantId,
      role: extractRole(typed),
      email: typed.email
    };

    return "authenticated";
  } catch {
    return "invalid";
  }
}
