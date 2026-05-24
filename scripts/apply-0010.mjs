import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);

console.log("Applying drizzle/0010_b2b_rate_limit.sql ...");
const raw = readFileSync("drizzle/0010_b2b_rate_limit.sql", "utf-8");

// Strip comment-only lines first, then split on ";\n".
const stripped = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

const statements = stripped
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  console.log(`  → ${stmt.slice(0, 80).replace(/\s+/g, " ")}...`);
  try {
    await sql.query(stmt);
  } catch (e) {
    if (e.code === "42P07" || e.code === "42710") {
      console.log(`    (already exists, skip)`);
      continue;
    }
    throw e;
  }
}
console.log("✓ Migration 0010 applied");
