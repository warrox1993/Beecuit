import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { locale } from "./auth";

export const journalStatus = pgEnum("journal_status", ["draft", "published", "archived"]);
export const journalCategory = pgEnum("journal_category", [
  "recettes",
  "savoir-faire",
  "saisons",
  "atelier",
]);
export const recipeDifficulty = pgEnum("recipe_difficulty", ["facile", "moyen", "avance"]);
export const journalEmailStatus = pgEnum("journal_email_status", ["sent", "failed", "bounced"]);

export const journalArticles = pgTable("journal_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  status: journalStatus("status").notNull().default("draft"),
  category: journalCategory("category").notNull(),
  coverImage: text("cover_image").notNull(),
  coverAltFr: text("cover_alt_fr").notNull(),
  pinterestImage: text("pinterest_image"),
  author: text("author").notNull().default("Au Fil des Saveurs"),
  readingMinutes: integer("reading_minutes").notNull().default(1),
  isFeatured: boolean("is_featured").notNull().default(false),
  recipePrepMin: integer("recipe_prep_min"),
  recipeCookMin: integer("recipe_cook_min"),
  recipeDifficulty: recipeDifficulty("recipe_difficulty"),
  journalEmailSentAt: timestamp("journal_email_sent_at", { mode: "date", withTimezone: true }),
  publishedAt: timestamp("published_at", { mode: "date", withTimezone: true }),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  featuredProductSlugs: jsonb("featured_product_slugs")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
});

export const journalArticleTranslations = pgTable(
  "journal_article_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => journalArticles.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    bodyJson: jsonb("body_json").$type<unknown>().notNull(),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    recipeYieldLabel: text("recipe_yield_label"),
    recipeIngredients: jsonb("recipe_ingredients").$type<
      Array<{ name: string; qty: string; unit: string }>
    >(),
    recipeSteps: jsonb("recipe_steps").$type<Array<{ n: number; text: string }>>(),
  },
  (t) => ({
    uniqueArticleLocale: uniqueIndex("journal_translation_article_locale_unique").on(
      t.articleId,
      t.locale,
    ),
  }),
);

export const journalEmailLog = pgTable("journal_email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .notNull()
    .references(() => journalArticles.id, { onDelete: "cascade" }),
  locale: locale("locale").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  status: journalEmailStatus("status").notNull(),
  resendId: text("resend_id"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
});
