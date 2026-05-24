import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
try {
  await sql.query(`ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_order_id_unique" UNIQUE ("order_id")`);
  console.log("✓ UNIQUE added");
} catch (e) {
  if (e.code === "42710") console.log("(already exists)");
  else throw e;
}
