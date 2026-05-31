import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE = "pending-2fa";
const TTL_MS = 5 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

/** "userId.exp.sig" — sig over "userId.exp". exp is epoch ms. */
export function buildPendingValue(userId: string, exp: number): string {
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function parsePendingValue(raw: string): { userId: string } | null {
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const userId = parts[0]!;
  const exp = parts[1]!;
  const sig = parts[2]!;
  const expected = sign(`${userId}.${exp}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!Number.isFinite(Number(exp)) || Date.now() > Number(exp)) return null;
  return { userId };
}

export async function setPending2faCookie(userId: string): Promise<void> {
  const value = buildPendingValue(userId, Date.now() + TTL_MS);
  const store = await cookies();
  store.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
}

export async function readPending2faCookie(): Promise<{ userId: string } | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  return raw ? parsePendingValue(raw) : null;
}

export async function clearPending2faCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
