const TOKEN_KEY = "finintel_token";
const TENANT_KEY = "finintel_tenant";
const ID_TOKEN_KEY = "finintel_id_token";
const REFRESH_TOKEN_KEY = "finintel_refresh_token";

export type UserRole = "OWNER" | "CFO" | "ANALYST" | "VIEWER";

type JwtPayload = {
  role?: string;
  realm_access?: {
    roles?: string[];
  };
};

const BUSINESS_ROLES: UserRole[] = ["OWNER", "CFO", "ANALYST", "VIEWER"];

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

function parseJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2 || !parts[1]) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserRoleFromToken(token: string): UserRole {
  const payload = parseJwtPayload(token);

  const directRole = payload?.role?.toUpperCase();
  if (directRole && BUSINESS_ROLES.includes(directRole as UserRole)) {
    return directRole as UserRole;
  }

  const realmRoles = payload?.realm_access?.roles ?? [];
  const matched = BUSINESS_ROLES.find((role) => realmRoles.includes(role));
  return matched ?? "VIEWER";
}

export function canUploadReports(role: UserRole): boolean {
  return role === "OWNER" || role === "CFO" || role === "ANALYST";
}

export function getAuthState() {
  return {
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    tenant: localStorage.getItem(TENANT_KEY) ?? "tenant-1",
    idToken: localStorage.getItem(ID_TOKEN_KEY) ?? "",
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) ?? ""
  };
}

export function setAuthState(token: string, tenant: string, idToken = "", refreshToken = "") {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(TENANT_KEY, tenant.trim() || "tenant-1");
  if (idToken) localStorage.setItem(ID_TOKEN_KEY, idToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthState() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
