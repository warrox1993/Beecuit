import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);

console.log("Applying drizzle/0009_subscription_boxes_updated_at.sql ...");
const raw = readFileSync("drizzle/0009_subscription_boxes_updated_at.sql", "utf-8");
const statements = raw
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

for (const stmt of statements) {
  console.log(`  → ${stmt.slice(0, 100).replace(/\s+/g, " ")}...`);
  try {
    await sql.query(stmt);
  } catch (e) {
    if (e.code === "42701") {
      console.log(`    (column already exists, skip)`);
      continue;
    }
    throw e;
  }
}
console.log("✓ Migration 0009 applied");
