import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "../db/redis.js";

const redisLimiters = new Map<string, RateLimiterRedis>();
const fallbackLimiters = new Map<string, RateLimiterMemory>();

function limiterKey(points: number, duration: number): string {
  return `${points}:${duration}`;
}

function getRedisLimiter(points: number, duration: number): RateLimiterRedis {
  const key = limiterKey(points, duration);
  if (!redisLimiters.has(key)) {
    redisLimiters.set(
      key,
      new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: `rl:${points}:${duration}`,
        points,
        duration
      })
    );
  }
  return redisLimiters.get(key)!;
}

function getFallbackLimiter(points: number, duration: number): RateLimiterMemory {
  const key = limiterKey(points, duration);
  if (!fallbackLimiters.has(key)) {
    fallbackLimiters.set(
      key,
      new RateLimiterMemory({
        points,
        duration
      })
    );
  }
  return fallbackLimiters.get(key)!;
}

function endpointBudget(path: string): { points: number; duration: number } {
  if (path.includes("/upload")) return { points: 15, duration: 60 };
  if (path.includes("/metrics/anomalies")) return { points: 40, duration: 60 };
  if (path.includes("/metrics/sources")) return { points: 80, duration: 60 };
  if (path.includes("/metrics")) return { points: 120, duration: 60 };
  return { points: 100, duration: 60 };
}

export async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tenantId = req.header("x-tenant-id") || req.user?.tenantId || "anonymous";
  const endpoint = `${req.method}:${req.path}`;
  const key = `${tenantId}:${req.ip}:${endpoint}`;
  const { points, duration } = endpointBudget(req.path);
  const redisLimiter = getRedisLimiter(points, duration);
  const fallbackLimiter = getFallbackLimiter(points, duration);

  try {
    await redisLimiter.consume(key, 1);
    next();
  } catch (error) {
    try {
      await fallbackLimiter.consume(key, 1);
      next();
    } catch {
      const retrySecs = typeof error === "object" && error && "msBeforeNext" in error
        ? Math.ceil((error.msBeforeNext as number) / 1000)
        : 60;
      res.setHeader("Retry-After", retrySecs);
      res.status(429).json({ error: "Too many requests" });
    }
  }
}
