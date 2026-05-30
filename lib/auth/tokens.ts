import "server-only";
import { randomBytes, createHash } from "node:crypto";

/** 32 bytes → 43-char base64url string (no padding). */
export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex digest of an arbitrary string. Used to store tokens at rest. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
