import { clearAuthState, getAuthState, setAuthState } from "./authState";

const AUTH_URL =
  import.meta.env.VITE_OIDC_AUTH_URL ??
  "http://localhost:8080/realms/finintel/protocol/openid-connect/auth";
const LOGOUT_URL =
  import.meta.env.VITE_OIDC_LOGOUT_URL ??
  "http://localhost:8080/realms/finintel/protocol/openid-connect/logout";
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID ?? "finintel-api";
const SCOPE = import.meta.env.VITE_OIDC_SCOPE ?? "openid profile email";
const REDIRECT_PATH = "/oidc/callback";
const VERIFIER_KEY = "finintel_pkce_verifier";
const STATE_KEY = "finintel_pkce_state";

function randomString(length = 64): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
}

function base64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let raw = "";
  bytes.forEach((value) => {
    raw += String.fromCharCode(value);
  });
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkceChallenge(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(hash);
}

function getRedirectUri(): string {
  return `${window.location.origin}${REDIRECT_PATH}`;
}

export async function beginOidcLogin(): Promise<void> {
  const verifier = randomString(96);
  const state = randomString(32);

  localStorage.setItem(VERIFIER_KEY, verifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: await pkceChallenge(verifier),
    state
  });

  window.location.assign(`${AUTH_URL}?${params.toString()}`);
}

export async function completeOidcCallback(): Promise<void> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const verifier = localStorage.getItem(VERIFIER_KEY) ?? "";
  const expectedState = localStorage.getItem(STATE_KEY) ?? "";

  if (!code || !state || !verifier || state !== expectedState) {
    throw new Error("Invalid OIDC callback state");
  }

  const response = await fetch("/api/oidc/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code,
      codeVerifier: verifier,
      redirectUri: getRedirectUri()
    })
  });

  const payload = (await response.json().catch(() => ({}))) as {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
    error?: string;
  };

  if (!response.ok || !payload.accessToken) {
    throw new Error(payload.error ?? "OIDC exchange failed");
  }

  const current = getAuthState();
  setAuthState(
    payload.accessToken,
    current.tenant || "tenant-1",
    payload.idToken ?? "",
    payload.refreshToken ?? ""
  );

  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
  window.history.replaceState({}, document.title, "/");
}

export function logoutOidc(): void {
  const { idToken } = getAuthState();
  clearAuthState();

  const params = new URLSearchParams({
    post_logout_redirect_uri: window.location.origin
  });
  if (idToken) {
    params.set("id_token_hint", idToken);
  }

  window.location.assign(`${LOGOUT_URL}?${params.toString()}`);
}
