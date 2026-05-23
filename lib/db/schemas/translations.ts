import { pgTable, text, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";
import { locale } from "./auth";

export const productTranslations = pgTable(
  "product_translations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description").notNull(),
    longDescription: text("long_description").notNull(),
    ingredients: text("ingredients").notNull(),
    allergens: text("allergens")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    nutritionalFactsPer100g: jsonb("nutritional_facts_per_100g")
      .$type<{
        energy_kcal: number;
        fat_g: number;
        carbs_g: number;
        protein_g: number;
        salt_g: number;
      }>()
      .notNull(),
    seoTitle: text("seo_title").notNull(),
    seoDescription: text("seo_description").notNull(),
  },
  (t) => ({
    uniqueProductLocale: uniqueIndex("uniq_product_locale").on(t.productId, t.locale),
    uniqueLocaleSlug: uniqueIndex("uniq_locale_slug").on(t.locale, t.slug),
  }),
);
