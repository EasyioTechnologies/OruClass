import type { MiddlewareHandler } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { trainingFacilitators } from "../db/schema";
import { hasPermission, type Permission } from "@oruclass/utils";
import type { TrainingRole } from "@oruclass/types";

// In-process TTL cache keyed by `userId:trainingId` — avoids a DB round-trip on every request
const CACHE_TTL = 60_000; // 60 seconds
const roleCache = new Map<string, { role: TrainingRole; expiresAt: number }>();

async function getFacilitatorRole(userId: string, trainingId: string): Promise<TrainingRole | null> {
  const cacheKey = `${userId}:${trainingId}`;
  const cached = roleCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.role;

  const facilitator = await db.query.trainingFacilitators.findFirst({
    where: and(
      eq(trainingFacilitators.trainingId, trainingId),
      eq(trainingFacilitators.userId, userId),
    ),
  });

  if (!facilitator) {
    roleCache.delete(cacheKey);
    return null;
  }

  roleCache.set(cacheKey, { role: facilitator.role as TrainingRole, expiresAt: Date.now() + CACHE_TTL });
  return facilitator.role as TrainingRole;
}

/** Call this when a facilitator's role changes to invalidate the cache immediately. */
export function invalidateRoleCache(userId: string, trainingId: string): void {
  roleCache.delete(`${userId}:${trainingId}`);
}

export function requireTrainingPermission(permission: Permission): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get("userId") as string;
    const trainingId = c.req.param("trainingId") ?? c.req.param("id");

    if (!trainingId) {
      return c.json({ error: "Training ID required", code: "NO_TRAINING_ID" }, 400);
    }

    const role = await getFacilitatorRole(userId, trainingId);

    if (!role) {
      return c.json({ error: "Forbidden", code: "NOT_FACILITATOR" }, 403);
    }

    if (!hasPermission(role, permission)) {
      return c.json({ error: "Insufficient permissions", code: "PERMISSION_DENIED" }, 403);
    }

    c.set("trainingRole", role);
    await next();
  };
}
