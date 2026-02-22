const TOKEN_KEY = "finintel_token";
const TENANT_KEY = "finintel_tenant";
const ID_TOKEN_KEY = "finintel_id_token";
const REFRESH_TOKEN_KEY = "finintel_refresh_token";

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
