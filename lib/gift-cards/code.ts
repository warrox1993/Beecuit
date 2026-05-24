import { randomBytes } from "node:crypto";

// Generates a gift card code in the form BC-XXXX-XXXX-XXXX (12 hex chars grouped).
// Uses crypto.randomBytes(6) = 48 bits of entropy ~ 2.8e14 combinations.
export function generateGiftCardCode(): string {
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `BC-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}
