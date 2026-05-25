import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

const imgs = await sql`
  SELECT pi.url, p.sku, pt.slug
  FROM product_images pi
  JOIN products p ON p.id = pi.product_id
  JOIN product_translations pt ON pt.product_id = p.id AND pt.locale = 'fr'
  WHERE pi.is_primary = true
  ORDER BY p.sku
`;
console.log("Primary images:");
for (const i of imgs) console.log(" - " + i.slug + " → " + i.url);
