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

function getTokenError(payload: TokenResponse): string {
  return payload.error_description ?? payload.error ?? "Token request failed";
}

export const authRouter = Router();

authRouter.post("/token", async (req, res) => {
  const username = typeof req.body?.username === "string" && req.body.username.trim()
    ? req.body.username.trim()
    : config.DEMO_USERNAME;
  const password = typeof req.body?.password === "string" && req.body.password.trim()
    ? req.body.password
    : config.DEMO_PASSWORD;

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: config.KEYCLOAK_CLIENT_ID,
    client_secret: config.KEYCLOAK_CLIENT_SECRET,
    username,
    password
  });

  try {
    const response = await fetch(config.KEYCLOAK_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });

    const payload = (await response.json().catch(() => ({}))) as TokenResponse;

    if (!response.ok || typeof payload.access_token !== "string") {
      res.status(401).json({ error: getTokenError(payload) });
      return;
    }

    res.json({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? "",
      idToken: payload.id_token ?? "",
      expiresIn: payload.expires_in,
      tokenType: payload.token_type
    });
  } catch {
    res.status(502).json({ error: "Unable to reach Keycloak token endpoint" });
  }
});

authRouter.post("/refresh", async (req, res) => {
  const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken.trim() : "";

  if (!refreshToken) {
    res.status(400).json({ error: "Missing refreshToken" });
    return;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.KEYCLOAK_CLIENT_ID,
    client_secret: config.KEYCLOAK_CLIENT_SECRET,
    refresh_token: refreshToken
  });

  try {
    const response = await fetch(config.KEYCLOAK_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    });

    const payload = (await response.json().catch(() => ({}))) as TokenResponse;

    if (!response.ok || typeof payload.access_token !== "string") {
      res.status(401).json({ error: getTokenError(payload) });
      return;
    }

    res.json({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? refreshToken,
      idToken: payload.id_token ?? "",
      expiresIn: payload.expires_in,
      tokenType: payload.token_type
    });
  } catch {
    res.status(502).json({ error: "Unable to reach Keycloak token endpoint" });
  }
});
