#!/usr/bin/env node
/**
 * Patches the DB for the 3 products that received client-supplied photos
 * (coco choco, coco nature, avoine). Replaces only the primary image
 * (sort_order = 0); secondary Unsplash placeholder is kept.
 *
 * Re-runnable: the existing primary row is updated in place (or recreated
 * if missing).
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

const MAPPING = [
  {
    sku: "BCT-COCO-CHOC-180",
    url: "/images/products/coco-choc.webp",
    alt: "Rochers coco enrobés de chocolat noir, six pièces alignées sur planche bois (photo cliente)",
  },
  {
    sku: "BCT-COCO-NATU-180",
    url: "/images/products/coco-nature.webp",
    alt: "Rochers coco nature dorés, présentation pâtissière sur plat turquoise (photo cliente)",
  },
  {
    sku: "BCT-AVOI-200",
    url: "/images/products/avoine.webp",
    alt: "Biscuits à l'avoine et raisins empilés sur assiette blanche (photo cliente)",
  },
];

for (const m of MAPPING) {
  const [product] = await sql`SELECT id FROM products WHERE sku = ${m.sku}`;
  if (!product) {
    console.log(`✗ ${m.sku} not found in DB, skip`);
    continue;
  }
  // Update existing primary row in place if present, else insert one
  const existing = await sql`
    SELECT id FROM product_images
    WHERE product_id = ${product.id} AND sort_order = 0
  `;
  if (existing.length > 0) {
    await sql`
      UPDATE product_images
      SET url = ${m.url}, alt_text = ${m.alt}, is_primary = true
      WHERE id = ${existing[0].id}
    `;
    console.log(`✓ ${m.sku} primary image updated → ${m.url}`);
  } else {
    await sql`
      INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
      VALUES (${product.id}, ${m.url}, ${m.alt}, 0, true)
    `;
    console.log(`✓ ${m.sku} primary image inserted → ${m.url}`);
  }
}

console.log("\nDone.");
