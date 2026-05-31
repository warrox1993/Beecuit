import "server-only";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { generateRawToken } from "@/lib/auth/tokens";
import { env } from "@/lib/env";
import type { SessionMetadata } from "@/lib/auth/session-metadata";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Opaque, non-reversible handle for a session token, safe to send to the client
 * (e.g. the "active sessions" UI). The raw `sessionToken` IS the bearer cookie
 * value, so it must never reach the browser DOM — exposing it would defeat the
 * cookie's httpOnly protection. Revocation resolves the handle back to a token
 * server-side by recomputing the HMAC over the user's own sessions.
 */
export function sessionHandle(token: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}

function getCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
}

/**
 * Issue a new DB-backed session for `userId` and set the auth cookie.
 *
 * The cookie name + token format match what NextAuth's DrizzleAdapter writes
 * in its own flows, so `auth()` reads them transparently.
 */
export async function createDbSession(
  userId: string,
  metadata?: SessionMetadata,
): Promise<void> {
  const sessionToken = generateRawToken();
  const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.insert(sessions).values({
    sessionToken,
    userId,
    expires,
    lastSeenAt: new Date(),
    userAgent: metadata?.userAgent ?? null,
    ip: metadata?.ip ?? null,
    city: metadata?.city ?? null,
    country: metadata?.country ?? null,
  });

  const cookieStore = await cookies();
  cookieStore.set(getCookieName(), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/**
 * Delete the current session row (if any) and clear the auth cookie.
 * Used by `signOut` paths that bypass NextAuth's signOut handler.
 */
export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const name = getCookieName();
  const value = cookieStore.get(name)?.value;
  if (value) {
    await db.delete(sessions).where(eq(sessions.sessionToken, value));
  }
  cookieStore.delete(name);
}
