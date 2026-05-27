import { createClient } from "redis";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis = createClient({ url: REDIS_URL });

redis.on("error", (err) => logger.error(err, "Redis client error"));

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
}
