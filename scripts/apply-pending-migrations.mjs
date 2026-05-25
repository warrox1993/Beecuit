import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

function splitSqlStatements(content) {
  const noBreakpoints = content.replace(/-->\s*statement-breakpoint/g, "");
  return noBreakpoints
    .split(/;\s*(?=\n|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.match(/^(--[^\n]*|\s)+$/m));
}

const IDEMPOTENT_ERRORS = [
  "already exists",
  "duplicate key value",
  "constraint",  // 'constraint "x" of relation "y" already exists'
];

function isIdempotentError(e) {
  const msg = (e.message ?? "").toLowerCase();
  return IDEMPOTENT_ERRORS.some(s => msg.includes(s));
}

const applied = await sql`SELECT COUNT(*)::int as n FROM "drizzle"."__drizzle_migrations"`;
const appliedCount = applied[0].n;
console.log("Drizzle metadata says: " + appliedCount + " migrations applied");

const dir = "drizzle";
const files = readdirSync(dir).filter(f => /^\d{4}_.*\.sql$/.test(f)).sort();
const pending = files.slice(appliedCount);
console.log("Pending: " + pending.join(", ") + "\n");

for (const file of pending) {
  const content = readFileSync(join(dir, file), "utf-8");
  const hash = createHash("sha256").update(content).digest("hex");
  const statements = splitSqlStatements(content);

  console.log(" ▶ " + file + " (" + statements.length + " statements)");
  let okCount = 0, skipCount = 0;
  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      okCount++;
    } catch (e) {
      if (isIdempotentError(e)) {
        skipCount++;
      } else {
        console.error(" ✗ FAILED on statement:");
        console.error(stmt.slice(0, 300));
        console.error(" Error: " + e.message);
        process.exit(1);
      }
    }
  }
  await sql`INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES (${hash}, ${Date.now()})`;
  console.log(" ✓ " + file + " applied (" + okCount + " new, " + skipCount + " skipped-as-existing)\n");
}

console.log("All pending migrations recorded.");
