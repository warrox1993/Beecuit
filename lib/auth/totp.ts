import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { env } from "@/lib/env";

const ISSUER = "Au Fil des Saveurs";

// ±1 step (±30s) clock tolerance.
authenticator.options = { window: 1 };

// Derive a stable 32-byte key from AUTH_SECRET — no new env var.
const KEY = scryptSync(env.AUTH_SECRET, "2fa-secret-enc", 32);

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpauthUrl(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token: token.trim(), secret });
  } catch {
    return false;
  }
}

export async function buildQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
}

/** AES-256-GCM. Returns "iv:tag:ciphertext", all base64url. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(":");
}

export function decryptSecret(stored: string): string {
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format");
  const [ivB, tagB, ctB] = parts as [string, string, string];
  const decipher = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivB, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ctB, "base64url")), decipher.final()]).toString(
    "utf8",
  );
}
