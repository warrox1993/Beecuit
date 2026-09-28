import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isCommentOrBlank, splitSqlStatements } from "@/scripts/lib/split-sql.mjs";

describe("splitSqlStatements", () => {
  it("splits on statement breakpoints and trailing semicolons", () => {
    const sql =
      'CREATE TABLE "a" ("id" int);\n--> statement-breakpoint\nCREATE INDEX "i" ON "a" ("id");\n';
    expect(splitSqlStatements(sql)).toEqual([
      'CREATE TABLE "a" ("id" int)',
      'CREATE INDEX "i" ON "a" ("id")',
    ]);
  });

  it("keeps a statement preceded by a comment line", () => {
    // Avec l'ancienne expression (drapeau m), ce bloc était écarté en entier.
    const sql = '-- Add a column\nALTER TABLE "a" ADD COLUMN "b" int;\n';
    expect(splitSqlStatements(sql)).toEqual([
      '-- Add a column\nALTER TABLE "a" ADD COLUMN "b" int',
    ]);
  });

  it("drops blocks made only of comments and blank lines", () => {
    const sql = "SELECT 1;\n-- only a comment\n\n-- another one;\n";
    expect(splitSqlStatements(sql)).toEqual(["SELECT 1"]);
    expect(isCommentOrBlank("-- a\n\n   -- b")).toBe(true);
    expect(isCommentOrBlank("-- a\nSELECT 1")).toBe(false);
  });

  it("keeps every real statement of the repository migrations", () => {
    const dir = path.resolve(__dirname, "../../drizzle");
    const gift = splitSqlStatements(readFileSync(path.join(dir, "0005_gift_cards.sql"), "utf8"));
    expect(gift.some((s) => s.includes('ALTER TYPE "product_type" ADD VALUE'))).toBe(true);
    expect(gift.some((s) => s.includes('CREATE TABLE "gift_cards"'))).toBe(true);
    expect(gift.some((s) => s.includes('CREATE TABLE "gift_card_redemptions"'))).toBe(true);
    const coffrets = splitSqlStatements(readFileSync(path.join(dir, "0004_coffrets.sql"), "utf8"));
    expect(coffrets.some((s) => s.includes('CREATE TABLE "coffret_contents"'))).toBe(true);
  });

  it("stays fast on long runs of comment markers (CodeQL js/redos)", () => {
    // Garde-fou : le filtre ne repose plus sur une expression à retour arrière
    // (l'ancienne /^(--[^\n]*|\s)+$/m était signalée par CodeQL js/redos).
    const hostile = "--".repeat(50_000) + "x;";
    const start = performance.now();
    expect(splitSqlStatements(hostile)).toHaveLength(0);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
