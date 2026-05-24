import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
try {
  await sql.query(`ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_box_id_unique" UNIQUE ("subscription_box_id")`);
  console.log("✓ UNIQUE added");
} catch (e) {
  if (e.code === "42710") console.log("(already exists)");
  else throw e;
}
