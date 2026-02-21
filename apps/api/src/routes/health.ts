import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { redis } from "../db/redis.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const health = {
    api: "ok",
    postgres: "down",
    redis: "down",
    timestamp: new Date().toISOString()
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.postgres = "ok";
  } catch {
    // intentionally non-throwing for health visibility
  }

  try {
    await redis.ping();
    health.redis = "ok";
  } catch {
    // intentionally non-throwing for health visibility
  }

  res.json(health);
});
