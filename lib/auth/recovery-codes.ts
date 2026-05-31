import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { twoFactorRecoveryCodes } from "@/lib/db/schema";

const CODE_COUNT = 10;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomBlock(): string {
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code.trim().toLowerCase()).digest("hex");
}

/** Returns 10 plaintext codes (shown once) + their sha256 hashes (stored). */
export function generateRecoveryCodes(): { plain: string[]; hashes: string[] } {
  const plain: string[] = [];
  const seen = new Set<string>();
  while (plain.length < CODE_COUNT) {
    const code = `${randomBlock()}-${randomBlock()}`;
    if (seen.has(code)) continue;
    seen.add(code);
    plain.push(code);
  }
  return { plain, hashes: plain.map(hashRecoveryCode) };
}

/** Marks a matching unused code as used. Returns true if a code was consumed. */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const hash = hashRecoveryCode(code);
  const rows = await db
    .select()
    .from(twoFactorRecoveryCodes)
    .where(
      and(
        eq(twoFactorRecoveryCodes.userId, userId),
        eq(twoFactorRecoveryCodes.codeHash, hash),
        isNull(twoFactorRecoveryCodes.usedAt),
      ),
    );
  if (rows.length === 0) return false;
  await db
    .update(twoFactorRecoveryCodes)
    .set({ usedAt: new Date() })
    .where(eq(twoFactorRecoveryCodes.id, rows[0]!.id));
  return true;
}
