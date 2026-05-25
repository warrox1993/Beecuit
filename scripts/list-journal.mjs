import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });
const sql = neon(process.env.DATABASE_URL);

const articles = await sql`
  SELECT a.slug, a.category, a.status, a.is_featured, a.reading_minutes,
    t.title, t.excerpt, t.recipe_ingredients IS NOT NULL as has_recipe
  FROM journal_articles a
  JOIN journal_article_translations t ON t.article_id = a.id AND t.locale = 'fr'
  ORDER BY a.is_featured DESC, a.category
`;
console.log("Journal articles in DB:\n");
for (const a of articles) {
  console.log(" • " + a.title);
  console.log("   slug: " + a.slug + " | " + a.category + " | " + a.reading_minutes + " min" + (a.is_featured ? " | ★ FEATURED" : "") + (a.has_recipe ? " | 📖 recipe" : ""));
  console.log("   " + a.excerpt.slice(0, 120) + "...");
  console.log();
}
