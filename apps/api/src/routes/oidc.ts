import { Router } from "express";
import { config } from "../config.js";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export const oidcRouter = Router();

oidcRouter.post("/token", async (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const codeVerifier = typeof req.body?.codeVerifier === "string" ? req.body.codeVerifier : "";
  const redirectUri = typeof req.body?.redirectUri === "string" ? req.body.redirectUri : "";

  if (!code || !codeVerifier || !redirectUri) {
    res.status(400).json({ error: "Missing code, codeVerifier, or redirectUri" });
    return;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.OIDC_CLIENT_ID,
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri
  });

  if (config.KEYCLOAK_CLIENT_SECRET) {
    body.set("client_secret", config.KEYCLOAK_CLIENT_SECRET);
  }

  try {
    const response = await fetch(config.KEYCLOAK_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });

    const payload = (await response.json().catch(() => ({}))) as TokenResponse;

    if (!response.ok || !payload.access_token) {
      res.status(401).json({
        error: payload.error_description ?? payload.error ?? "OIDC token exchange failed"
      });
      return;
    }

    res.json({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? "",
      idToken: payload.id_token ?? "",
      tokenType: payload.token_type ?? "Bearer",
      expiresIn: payload.expires_in ?? 0
    });
  } catch {
    res.status(502).json({ error: "Unable to reach Keycloak token endpoint" });
  }
});
