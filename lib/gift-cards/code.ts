import { randomBytes } from "node:crypto";

// Generates a gift card code in the form BC-XXXX-XXXX-XXXX-XXXX (16 hex chars).
// Uses crypto.randomBytes(8) = 64 bits of entropy (~1.8e19 combinations), which
// — combined with IP rate-limiting on validation — makes online guessing of a
// financially-valuable code infeasible.
export function generateGiftCardCode(): string {
  const hex = randomBytes(8).toString("hex").toUpperCase();
  return `BC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}
