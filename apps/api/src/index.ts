import { createServer } from "node:http";
import { config } from "./config.js";
import { connectRedis } from "./db/redis.js";
import { createApp } from "./app.js";

async function start(): Promise<void> {
  const app = await createApp();

  try {
    await connectRedis();
    console.log("Redis connected");
  } catch {
    console.warn("Redis unavailable, fallback rate limiting enabled");
  }

  const server = createServer(app);
  server.listen(config.PORT, () => {
    console.log(`API listening on :${config.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
