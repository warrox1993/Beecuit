import "server-only";
import { createHash } from "node:crypto";

/**
 * Checks a password against the HIBP range API using k-anonymity (only the
 * first 5 hash chars leave the server). Fail-open: any error → not breached.
 */
export async function checkPasswordBreached(
  password: string,
): Promise<{ breached: boolean; count: number }> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
    });
    if (!res.ok) return { breached: false, count: 0 };
    const body = await res.text();
    for (const line of body.split("\n")) {
      const parts = line.trim().split(":");
      const hashSuffix = parts[0];
      const countStr = parts[1];
      if (hashSuffix === suffix) {
        const count = Number(countStr) || 0;
        return { breached: count > 0, count };
      }
    }
    return { breached: false, count: 0 };
  } catch {
    return { breached: false, count: 0 };
  }
}
