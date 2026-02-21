import { Redis } from "ioredis";
import { config } from "../config.js";

export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2
});

redis.on("error", (error) => {
  if (config.NODE_ENV !== "test") {
    console.warn(`Redis error: ${error.message}`);
  }
});

export async function connectRedis(): Promise<void> {
  if (redis.status !== "ready") {
    await redis.connect();
  }
}
