import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const sql = neon(process.env.DATABASE_URL);

const check = await sql`SELECT table_name FROM information_schema.tables WHERE table_name = 'b2b_quote_requests'`;
if (check.length > 0) {
  console.log("✓ b2b_quote_requests already exists — skipping");
  process.exit(0);
}

console.log("Applying drizzle/0007_b2b.sql ...");
const raw = readFileSync("drizzle/0007_b2b.sql", "utf-8");
const statements = raw
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

for (const stmt of statements) {
  console.log(`  → ${stmt.slice(0, 70).replace(/\s+/g, " ")}...`);
  try {
    await sql.query(stmt);
  } catch (e) {
    if (e.code === "42710" || e.code === "42P07" || e.code === "42701") {
      // 42710 = duplicate object, 42P07 = duplicate table, 42701 = duplicate column
      console.log(`    (skip, already exists)`);
      continue;
    }
    throw e;
  }
}

// Record in drizzle's __drizzle_migrations table so subsequent drizzle-kit ops know it's applied
const drizzleSchemaCheck = await sql`SELECT 1 FROM information_schema.schemata WHERE schema_name = 'drizzle'`;
if (drizzleSchemaCheck.length === 0) {
  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
}
await sql`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
)`;

// Insert a record using the snapshot hash (drizzle uses file hash, we'll use the journal timestamp as a placeholder)
await sql`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('0007_b2b_manual', 1780300000000)`;

console.log("✓ Migration 0007_b2b applied successfully");
