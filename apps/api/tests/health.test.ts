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

describe("health route", () => {
  it("returns basic health payload", async () => {
    const app = await createApp();
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.api).toBe("ok");
    expect(typeof res.body.timestamp).toBe("string");
  });
});
