import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { redis } from "../src/db/redis.js";

afterAll(async () => {
  if ("$disconnect" in prisma && typeof prisma.$disconnect === "function") {
    await prisma.$disconnect();
  }

  if (redis.status !== "end") {
    await redis.quit();
  }
});

describe("auth-protected routes", () => {
  it("returns 401 for tenants route without bearer token", async () => {
    const app = await createApp();
    const res = await request(app).get("/api/tenants");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 for upload route without bearer token", async () => {
    const app = await createApp();
    const res = await request(app)
      .post("/api/v1/reports/upload")
      .set("x-tenant-id", "tenant-1");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });
});
