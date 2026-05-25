import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const ALG = "sha256";

function sign(payload: string): string {
  return createHmac(ALG, env.JOURNAL_PREVIEW_SECRET).update(payload).digest("base64url");
}

export function signPreviewToken(articleId: string, ttlSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${articleId}.${exp}`;
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyPreviewToken(
  token: string,
): { valid: true; articleId: string } | { valid: false } {
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };
  const [articleId, expStr, sig] = parts as [string, string, string];
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return { valid: false };
  const expected = sign(`${articleId}.${expStr}`);
  const a = Buffer.from(sig, "base64url");
  const b = Buffer.from(expected, "base64url");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false };
  return { valid: true, articleId };
}
