import { Router } from "express";
import { config } from "../config.js";

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

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok || typeof payload.access_token !== "string") {
      const detail = typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : "Token request failed";
      res.status(401).json({ error: detail });
      return;
    }

    res.json({
      accessToken: payload.access_token,
      expiresIn: payload.expires_in,
      tokenType: payload.token_type
    });
  } catch {
    res.status(502).json({ error: "Unable to reach Keycloak token endpoint" });
  }
});
