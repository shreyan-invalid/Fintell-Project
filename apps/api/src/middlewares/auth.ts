import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, errors as JoseErrors, jwtVerify } from "jose";
import { config } from "../config.js";
import type { UserRole } from "../types/auth.js";

const JWKS = createRemoteJWKSet(new URL(config.KEYCLOAK_JWKS_URI));
const INTERNAL_ISSUER = config.KEYCLOAK_JWKS_URI.replace(/\/protocol\/openid-connect\/certs$/, "");
const KNOWN_ROLES: UserRole[] = ["OWNER", "CFO", "ANALYST", "VIEWER"];

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

function debugAuth(req: Request, reason: string): void {
  if (!config.AUTH_DEBUG) return;
  console.warn(
    `[auth] ${reason} method=${req.method} path=${req.originalUrl} ip=${req.ip} tenantHeader=${req.header("x-tenant-id") ?? ""}`
  );
}

function extractRole(payload: JwtPayload): UserRole {
  if (payload.role && KNOWN_ROLES.includes(payload.role)) {
    return payload.role;
  }

  const realmRoles = payload.realm_access?.roles ?? [];
  const matched = KNOWN_ROLES.find((role) => realmRoles.includes(role));
  return matched ?? "VIEWER";
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
      debugAuth(req, "missing bearer token");
      return "missing";
    }

    const { payload } = await jwtVerify(token, JWKS);

    const typed = payload as unknown as JwtPayload;
    const issuerAccepted = typed.iss === config.JWT_ISSUER || typed.iss === INTERNAL_ISSUER;
    const audience = typed.aud;
    const audienceList = Array.isArray(audience) ? audience : audience ? [audience] : [];
    const audienceAccepted =
      audienceList.includes(config.JWT_AUDIENCE) || typed.azp === config.JWT_AUDIENCE;

    if (!typed.sub) {
      debugAuth(req, "token missing sub claim");
      return "invalid";
    }

    if (!issuerAccepted) {
      debugAuth(req, `issuer mismatch tokenIss=${typed.iss ?? ""} expected=${config.JWT_ISSUER} internal=${INTERNAL_ISSUER}`);
      return "invalid";
    }

    if (!audienceAccepted) {
      debugAuth(req, `audience mismatch tokenAud=${audienceList.join(",")} tokenAzp=${typed.azp ?? ""} expected=${config.JWT_AUDIENCE}`);
      return "invalid";
    }

    const tenantFromHeader = req.header("x-tenant-id") ?? undefined;
    const tenantId =
      typed.tenant_id ??
      typed.tenant ??
      tenantFromHeader ??
      (config.AUTH_MODE === "optional" ? config.DEFAULT_TENANT_SLUG : undefined);

    if (!tenantId) {
      debugAuth(req, "missing tenant context in token/header; continuing for non-tenant route");
    }

    req.user = {
      sub: typed.sub,
      ...(tenantId ? { tenantId } : {}),
      role: extractRole(typed),
      email: typed.email
    };

    return "authenticated";
  } catch (error) {
    if (error instanceof JoseErrors.JWTExpired) {
      debugAuth(req, "token expired");
      return "invalid";
    }

    if (error instanceof JoseErrors.JWSSignatureVerificationFailed) {
      debugAuth(req, "signature verification failed");
      return "invalid";
    }

    if (error instanceof Error) {
      debugAuth(req, `jwt verification failed: ${error.message}`);
    } else {
      debugAuth(req, "jwt verification failed: unknown error");
    }

    return "invalid";
  }
}
