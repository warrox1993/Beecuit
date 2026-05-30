import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const testEmail = `purge-test-${Date.now()}@example.invalid`;
const [inserted] = await sql`
  INSERT INTO users (email, name, email_verified, deleted_at)
  VALUES (${testEmail}, 'Purge Test', NOW(), NOW() - INTERVAL '31 days')
  RETURNING id
`;
console.log(`Inserted test user ${inserted.id} (deleted 31 days ago).`);

// Trigger purge by hitting the cron route locally — assumes `pnpm dev` is running.
const port = process.env.PORT ?? 3000;
const res = await fetch(`http://localhost:${port}/api/cron/account-purge`, {
  headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
});
const json = await res.json();
console.log("Purge route response:", json);

const [after] = await sql`
  SELECT email, name, purged_at FROM users WHERE id = ${inserted.id}
`;
console.log("After purge:", after);

if (!after.purged_at) {
  console.error("✗ User was NOT purged.");
  process.exit(1);
}
if (after.email === testEmail) {
  console.error("✗ Email was NOT anonymized.");
  process.exit(1);
}
console.log("✓ Purge worked. Tombstone email:", after.email);
