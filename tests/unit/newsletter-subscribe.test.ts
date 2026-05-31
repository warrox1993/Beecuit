import { describe, it, expect, vi } from "vitest";

// Mock @/lib/db so the real db module (with neon + env) isn't evaluated in unit tests.
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Stub env so transitive imports don't trigger full env validation.
vi.mock("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://test",
    NEXT_PUBLIC_APP_URL: "https://test.local",
    AUTH_RESEND_KEY: "re_test",
    AUTH_EMAIL_FROM: "test@example.com",
  },
}));

// Stub the email client to avoid loading Resend (which imports server-only).
vi.mock("@/lib/email/client", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

const { subscribeInputSchema } = await import("@/lib/actions/newsletter.schema");

describe("subscribeInputSchema", () => {
  it("accepts a valid input", () => {
    const r = subscribeInputSchema.safeParse({
      email: "a@b.com",
      locale: "fr",
      journalOptIn: true,
      source: "home",
    });
    expect(r.success).toBe(true);
  });

  it("rejects bad locale", () => {
    const r = subscribeInputSchema.safeParse({ email: "a@b.com", locale: "xx" });
    expect(r.success).toBe(false);
  });

  it("defaults journalOptIn to false", () => {
    const r = subscribeInputSchema.parse({ email: "a@b.com", locale: "fr" });
    expect(r.journalOptIn).toBe(false);
  });
});
