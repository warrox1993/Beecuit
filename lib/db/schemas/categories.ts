import { pgTable, text, integer, boolean, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { locale } from "./auth";

export const categories = pgTable("categories", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (t) => ({ pk: primaryKey({ columns: [t.categoryId, t.locale] }) }),
);
