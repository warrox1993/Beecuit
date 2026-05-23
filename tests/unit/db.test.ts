import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { users, products } from "@/lib/db/schema";

describe("db connection", () => {
  it("can query users table (should be empty)", async () => {
    const rows = await db.select().from(users).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe("products table", () => {
  it("is queryable", async () => {
    const rows = await db.select().from(products).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});
