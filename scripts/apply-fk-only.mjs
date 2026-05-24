import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
try {
  await sql.query(
    `ALTER TABLE "orders" ADD CONSTRAINT "orders_b2b_quote_id_fk" FOREIGN KEY ("b2b_quote_id") REFERENCES "b2b_quote_requests"("id") ON DELETE SET NULL`,
  );
  console.log("✓ FK added");
} catch (e) {
  if (e.code === "42710") console.log("(already exists)");
  else throw e;
}
