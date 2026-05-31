import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { AUTH_SECRET: "y".repeat(40) } }));

import { buildPendingValue, parsePendingValue } from "@/lib/auth/pending-2fa";

describe("pending-2fa value", () => {
  it("round-trips a valid (non-expired) value", () => {
    const value = buildPendingValue("user-1", Date.now() + 60_000);
    expect(parsePendingValue(value)).toEqual({ userId: "user-1" });
  });

  it("rejects an expired value", () => {
    const value = buildPendingValue("user-1", Date.now() - 1);
    expect(parsePendingValue(value)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const value = buildPendingValue("user-1", Date.now() + 60_000);
    const tampered = value.replace("user-1", "user-2");
    expect(parsePendingValue(tampered)).toBeNull();
  });
});
