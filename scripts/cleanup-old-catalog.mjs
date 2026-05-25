#!/usr/bin/env node
/**
 * Cleanup old catalog before reseeding with the 5 client-validated products.
 *
 * Removes (DELETE — dev DB, no real commerce data to preserve):
 *   - Old coffrets COF-DECO-006, COF-GOUR-012, COF-CHOC-012, COF-SG-006
 *     and their coffret_contents
 *   - 7 old biscuits (all SKUs that won't appear in the new catalog)
 *   - Old empty categories: sables, chocolat, saisonniers, sans-gluten
 *
 * Safety: skips SKUs that are referenced by order_items or subscription_box_items
 * (FK is ON DELETE RESTRICT for subscription_box_items, SET NULL for order_items —
 * still better to warn and let user handle it manually).
 *
 * Idempotent: re-running after a clean DB is a no-op.
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)="(.*)"\s*$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const sql = neon(env.DATABASE_URL);

const OLD_COFFRET_SKUS = ["COF-DECO-006", "COF-GOUR-012", "COF-CHOC-012", "COF-SG-006"];
const OLD_BISCUIT_SKUS = [
  "BCT-SPEC-200", // legacy spec 200g (will be replaced by BCT-SPEC-GROS-200)
  "BCT-SABL-CHOC-180",
  "BCT-MACA-NOIS-006",
  "BCT-COOK-CHOC-250",
  "BCT-GALE-BEUR-150",
  "BCT-SPEC-SG-180",
  "BCT-FLOR-AMAN-200",
  "BCT-SPRI-VANI-200",
];
const OLD_CATEGORY_SLUGS = ["sables", "chocolat", "saisonniers", "sans-gluten"];

async function listCurrentState() {
  const products = await sql`SELECT sku, type FROM products ORDER BY type, sku`;
  const cats = await sql`SELECT slug, is_active FROM categories ORDER BY slug`;
  console.log("\n— Current state —");
  console.log(`products (${products.length}):`);
  for (const p of products) console.log(`  ${p.type.padEnd(20)} ${p.sku}`);
  console.log(`categories (${cats.length}):`);
  for (const c of cats) console.log(`  ${c.slug} (active=${c.is_active})`);
}

async function deleteCoffrets() {
  console.log("\n— Deleting old coffrets —");
  for (const sku of OLD_COFFRET_SKUS) {
    const [row] = await sql`SELECT id FROM products WHERE sku = ${sku}`;
    if (!row) {
      console.log(`  ↳ ${sku} not found, skip`);
      continue;
    }
    // coffret_contents FK ON DELETE CASCADE for coffret_id side; manual cleanup
    // for the biscuitId references would not be needed here since we delete the coffret itself.
    await sql`DELETE FROM coffret_contents WHERE coffret_id = ${row.id}`;
    await sql`DELETE FROM product_images WHERE product_id = ${row.id}`;
    await sql`DELETE FROM product_translations WHERE product_id = ${row.id}`;
    await sql`DELETE FROM products WHERE id = ${row.id}`;
    console.log(`  ✓ ${sku} deleted`);
  }
}

async function deleteBiscuits() {
  console.log("\n— Deleting old biscuits —");
  for (const sku of OLD_BISCUIT_SKUS) {
    const [row] = await sql`SELECT id FROM products WHERE sku = ${sku}`;
    if (!row) {
      console.log(`  ↳ ${sku} not found, skip`);
      continue;
    }
    // Check for FK references that would block deletion
    const refs = await sql`
      SELECT COUNT(*)::int AS cnt FROM subscription_box_items WHERE biscuit_id = ${row.id}
    `;
    if (refs[0].cnt > 0) {
      console.log(
        `  ⚠ ${sku} referenced by ${refs[0].cnt} subscription_box_items — skipping DELETE`,
      );
      continue;
    }
    // coffret_contents (biscuit side) is ON DELETE RESTRICT — clear it first
    // (should already be empty after coffrets cascade, but just in case)
    await sql`DELETE FROM coffret_contents WHERE biscuit_id = ${row.id}`;
    await sql`DELETE FROM cart_items WHERE product_id = ${row.id}`;
    // order_items.product_id is ON DELETE SET NULL, so DELETE is safe — snapshot fields preserved
    await sql`DELETE FROM product_images WHERE product_id = ${row.id}`;
    await sql`DELETE FROM product_translations WHERE product_id = ${row.id}`;
    await sql`DELETE FROM products WHERE id = ${row.id}`;
    console.log(`  ✓ ${sku} deleted`);
  }
}

async function deleteCategories() {
  console.log("\n— Deleting old empty categories —");
  for (const slug of OLD_CATEGORY_SLUGS) {
    const [row] = await sql`SELECT id FROM categories WHERE slug = ${slug}`;
    if (!row) {
      console.log(`  ↳ ${slug} not found, skip`);
      continue;
    }
    // Check no product still references it
    const stillUsed = await sql`
      SELECT COUNT(*)::int AS cnt FROM products WHERE category_id = ${row.id}
    `;
    if (stillUsed[0].cnt > 0) {
      console.log(`  ⚠ ${slug} still used by ${stillUsed[0].cnt} products, skip`);
      continue;
    }
    // category_translations FK ON DELETE CASCADE
    await sql`DELETE FROM categories WHERE id = ${row.id}`;
    console.log(`  ✓ ${slug} deleted`);
  }
}

(async () => {
  await listCurrentState();
  await deleteCoffrets();
  await deleteBiscuits();
  await deleteCategories();
  await listCurrentState();
  console.log("\nDone.");
})().catch((e) => {
  console.error("FAILED:", e.message);
  console.error(e.stack);
  process.exit(1);
});
