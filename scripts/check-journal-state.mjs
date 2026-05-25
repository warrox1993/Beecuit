import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name IN (
    'journal_articles', 'journal_article_translations',
    'journal_email_log', 'newsletter_subscribers'
  )
  ORDER BY table_name
`;
console.log("Journal tables present:", tables.map(r => r.table_name));

try {
  const constraints = await sql`
    SELECT conname FROM pg_constraint
    WHERE conname LIKE 'journal_%' OR conname LIKE 'newsletter_subscribers_%'
    ORDER BY conname
  `;
  console.log("Journal constraints:", constraints.map(r => r.conname));
} catch (e) { console.log("Constraints query err:", e.message); }

try {
  const migrations = await sql`
    SELECT hash, created_at FROM "drizzle"."__drizzle_migrations"
    ORDER BY created_at DESC LIMIT 5
  `;
  console.log("Recent applied migrations:");
  for (const m of migrations) console.log(" -", m.created_at, m.hash.slice(0,12));
} catch (e) { console.log("Migrations table err:", e.message); }
