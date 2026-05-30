import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

describe("safeCallbackUrl", () => {
  it("falls back to /{locale}/compte when raw is null/undefined/empty", () => {
    expect(safeCallbackUrl(null, "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl(undefined, "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl("", "fr")).toBe("/fr/compte");
  });

  it("blocks protocol-relative and absolute URLs", () => {
    expect(safeCallbackUrl("//evil.com", "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl("https://evil.com", "fr")).toBe("/fr/compte");
    expect(safeCallbackUrl("evil.com", "fr")).toBe("/fr/compte");
  });

  it("blocks /api/* paths", () => {
    expect(safeCallbackUrl("/api/admin", "fr")).toBe("/fr/compte");
  });

  it("preserves /admin and /admin/* (non-localized)", () => {
    expect(safeCallbackUrl("/admin", "fr")).toBe("/admin");
    expect(safeCallbackUrl("/admin/coffrets", "fr")).toBe("/admin/coffrets");
  });

  it("preserves already-locale-prefixed paths", () => {
    expect(safeCallbackUrl("/fr/coffrets", "fr")).toBe("/fr/coffrets");
    expect(safeCallbackUrl("/nl/abonnement", "fr")).toBe("/nl/abonnement");
  });

  it("prepends the current locale to bare paths", () => {
    expect(safeCallbackUrl("/coffrets", "nl")).toBe("/nl/coffrets");
    expect(safeCallbackUrl("/compte/commandes", "de")).toBe("/de/compte/commandes");
  });
});
