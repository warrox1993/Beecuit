import { describe, it, expect } from "vitest";
import {
  nextFirstOfMonth,
  currentYearMonth,
  nextYearMonth,
  compositionDeadlineFor,
  isComposingPhase,
  isReminderPhase,
  isLockPhase,
} from "@/lib/subscription/dates";

describe("nextFirstOfMonth", () => {
  it("returns next-month 1st at 00:00 UTC from a mid-month date", () => {
    const r = nextFirstOfMonth(new Date("2026-06-15T10:00:00Z"));
    expect(r.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });

  it("handles year boundary December → January", () => {
    const r = nextFirstOfMonth(new Date("2026-12-20T10:00:00Z"));
    expect(r.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});

describe("currentYearMonth / nextYearMonth", () => {
  it("currentYearMonth formats as YYYY-MM", () => {
    expect(currentYearMonth(new Date("2026-06-15"))).toBe("2026-06");
  });
  it("nextYearMonth rolls year over", () => {
    expect(nextYearMonth(new Date("2026-12-15"))).toBe("2027-01");
  });
});

describe("compositionDeadlineFor", () => {
  it("returns 25th of the month BEFORE the given cycleYearMonth", () => {
    expect(compositionDeadlineFor("2026-07").toISOString()).toBe(
      "2026-06-25T00:00:00.000Z",
    );
  });
  it("handles January cycle → December previous year deadline", () => {
    expect(compositionDeadlineFor("2026-01").toISOString()).toBe(
      "2025-12-25T00:00:00.000Z",
    );
  });
});

describe("phase helpers", () => {
  it("isComposingPhase = true on 1st", () => {
    expect(isComposingPhase(new Date("2026-06-01T06:00:00Z"))).toBe(true);
  });
  it("isReminderPhase = true on 22nd", () => {
    expect(isReminderPhase(new Date("2026-06-22T06:00:00Z"))).toBe(true);
  });
  it("isLockPhase = true on 25th", () => {
    expect(isLockPhase(new Date("2026-06-25T06:00:00Z"))).toBe(true);
  });
  it("all false on other days", () => {
    const d = new Date("2026-06-10T06:00:00Z");
    expect(isComposingPhase(d)).toBe(false);
    expect(isReminderPhase(d)).toBe(false);
    expect(isLockPhase(d)).toBe(false);
  });
});
