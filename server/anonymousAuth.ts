import { getDb } from "./db";
import { anonymousUsers } from "../drizzle/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { getAnonymousCookieOptions } from "./_core/cookies";

const ANONYMOUS_COOKIE_NAME = "anonymous_user_id";

/**
 * Get or create anonymous user from cookie
 * Returns the anonymous user ID
 */
export async function getOrCreateAnonymousUser(
  req: Request,
  res: Response
): Promise<number> {
  // Check if cookie exists
  const cookies = (req as any).cookies || {};
  const existingUuid = cookies[ANONYMOUS_COOKIE_NAME];

  if (existingUuid) {
    // Try to find existing user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existingUser = await db
      .select()
      .from(anonymousUsers)
      .where(and(eq(anonymousUsers.uuid, existingUuid), gt(anonymousUsers.expiresAt, new Date())))
      .limit(1);

    if (existingUser.length > 0) {
      // Update last seen timestamp
      await db
        .update(anonymousUsers)
        .set({ lastSeenAt: new Date() })
        .where(eq(anonymousUsers.id, existingUser[0].id));

      return existingUser[0].id;
    }
  }

  // Create new anonymous user
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newUuid = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Expire after 30 days (matches cookie maxAge)
  
  const result = await db.insert(anonymousUsers).values({
    uuid: newUuid,
    expiresAt,
  });

  const newUserId = Number(result[0].insertId);

  // Set cookie with proper options based on request context
  const cookieOptions = getAnonymousCookieOptions(req);
  res.cookie(ANONYMOUS_COOKIE_NAME, newUuid, cookieOptions);

  return newUserId;
}

/**
 * Get anonymous user ID from cookie (without creating new one)
 * Returns null if no anonymous user exists
 */
export async function getAnonymousUserId(req: Request): Promise<number | null> {
  const cookies = (req as any).cookies || {};
  const uuid = cookies[ANONYMOUS_COOKIE_NAME];

  if (!uuid) {
    return null;
  }

  const db = await getDb();
  if (!db) return null;

  const user = await db
    .select()
    .from(anonymousUsers)
    .where(and(eq(anonymousUsers.uuid, uuid), gt(anonymousUsers.expiresAt, new Date())))
    .limit(1);

  return user.length > 0 ? user[0].id : null;
}
