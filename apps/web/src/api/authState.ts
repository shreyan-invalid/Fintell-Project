const TOKEN_KEY = "finintel_token";
const TENANT_KEY = "finintel_tenant";

export function getAuthState() {
  return {
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    tenant: localStorage.getItem(TENANT_KEY) ?? "tenant-1"
  };
}

export function setAuthState(token: string, tenant: string) {
  localStorage.setItem(TOKEN_KEY, token.trim());
  localStorage.setItem(TENANT_KEY, tenant.trim() || "tenant-1");
}

export function clearAuthState() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TENANT_KEY);
}
