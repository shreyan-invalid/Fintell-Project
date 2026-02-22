import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";
import { authRouter } from "../src/routes/auth.js";

type FetchLike = typeof fetch;

describe("auth refresh route", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn() as unknown as FetchLike;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function buildApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
    return app;
  }

  it("returns 400 when refresh token is missing", async () => {
    const app = buildApp();

    const res = await request(app).post("/api/auth/refresh").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Missing refreshToken" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns refreshed tokens", async () => {
    const app = buildApp();

    (global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        id_token: "new-id-token",
        expires_in: 300,
        token_type: "Bearer"
      })
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "old-refresh-token" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      idToken: "new-id-token",
      expiresIn: 300,
      tokenType: "Bearer"
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when provider rejects refresh token", async () => {
    const app = buildApp();

    (global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "invalid_grant" })
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "bad-token" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "invalid_grant" });
  });
});
