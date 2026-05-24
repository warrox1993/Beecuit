import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);

console.log("Applying drizzle/0008_b2b_constraints.sql ...");
const raw = readFileSync("drizzle/0008_b2b_constraints.sql", "utf-8");
const statements = raw
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

for (const stmt of statements) {
  console.log(`  → ${stmt.slice(0, 80).replace(/\s+/g, " ")}...`);
  try {
    await sql.query(stmt);
  } catch (e) {
    if (e.code === "42710") {
      console.log(`    (constraint already exists, skip)`);
      continue;
    }
    throw e;
  }
}
console.log("✓ Migration 0008 applied");
