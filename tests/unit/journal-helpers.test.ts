import { describe, it, expect, vi } from "vitest";

// Ensure env is populated before any module under test imports lib/env.
// vi.hoisted runs before all import statements at module evaluation.
vi.hoisted(() => {
  process.env.SKIP_ENV_VALIDATION = "true";
  process.env.JOURNAL_PREVIEW_SECRET ??=
    "test-journal-preview-secret-not-used-in-prod-32chars";
});

import { calculateReadingMinutes } from "@/lib/journal/reading-time";
import { generateExcerpt } from "@/lib/journal/excerpt";
import { toIsoDuration } from "@/lib/journal/duration";
import { signPreviewToken, verifyPreviewToken } from "@/lib/journal/preview-token";

describe("calculateReadingMinutes", () => {
  it("computes 1 min minimum for empty doc", () => {
    expect(calculateReadingMinutes({ type: "doc", content: [] })).toBe(1);
  });
  it("computes ~3 minutes for ~600 words", () => {
    const text = "mot ".repeat(600).trim();
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    };
    expect(calculateReadingMinutes(doc)).toBe(3);
  });
});

describe("generateExcerpt", () => {
  it("returns first paragraph stripped, capped at 200", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Première phrase. Deuxième." }] },
        { type: "paragraph", content: [{ type: "text", text: "Ignored." }] },
      ],
    };
    expect(generateExcerpt(doc, 200)).toBe("Première phrase. Deuxième.");
  });
  it("caps at maxChars with ellipsis", () => {
    const longText = "a".repeat(250);
    const doc = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: longText }] }],
    };
    const result = generateExcerpt(doc, 200);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("toIsoDuration", () => {
  it("formats minutes as ISO 8601 PT", () => {
    expect(toIsoDuration(15)).toBe("PT15M");
    expect(toIsoDuration(75)).toBe("PT1H15M");
    expect(toIsoDuration(60)).toBe("PT1H");
  });
  it("returns empty string for null", () => {
    expect(toIsoDuration(null)).toBe("");
  });
});

describe("preview token", () => {
  it("round-trips a valid token", () => {
    const token = signPreviewToken("article-123", 900);
    const result = verifyPreviewToken(token);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.articleId).toBe("article-123");
    }
  });
  it("rejects an expired token", () => {
    const token = signPreviewToken("article-123", -1); // already expired
    expect(verifyPreviewToken(token).valid).toBe(false);
  });
  it("rejects a tampered token", () => {
    const token = signPreviewToken("article-123", 900);
    const tampered = token.slice(0, -2) + "XX";
    expect(verifyPreviewToken(tampered).valid).toBe(false);
  });
});
