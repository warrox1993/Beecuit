import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { generateRawToken } from "@/lib/auth/tokens";
import type { SessionMetadata } from "@/lib/auth/session-metadata";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
