import "server-only";
import { db } from "@/lib/db";
import {
  subscriptions,
  subscriptionBoxes,
  subscriptionBoxItems,
  products,
  productTranslations,
} from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function getActiveSubscriptionForUser(userId: string) {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), sql`${subscriptions.status} != 'expired'`))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return sub ?? null;
}

export async function getBoxForCycle(subscriptionId: string, cycleYearMonth: string) {
  const [box] = await db
    .select()
    .from(subscriptionBoxes)
    .where(
      and(
        eq(subscriptionBoxes.subscriptionId, subscriptionId),
        eq(subscriptionBoxes.cycleYearMonth, cycleYearMonth),
      ),
    )
    .limit(1);
  return box ?? null;
}

export async function getBoxItems(boxId: string, locale: "fr" | "nl" | "de" | "en" = "fr") {
  return db
    .select({
      id: subscriptionBoxItems.id,
      biscuitId: subscriptionBoxItems.biscuitId,
      quantity: subscriptionBoxItems.quantity,
      name: productTranslations.name,
      slug: productTranslations.slug,
      primaryImageUrl: sql<
        string | null
      >`(SELECT url FROM product_images WHERE product_id = ${subscriptionBoxItems.biscuitId} AND is_primary = true LIMIT 1)`,
    })
    .from(subscriptionBoxItems)
    .innerJoin(products, eq(products.id, subscriptionBoxItems.biscuitId))
    .innerJoin(
      productTranslations,
      and(eq(productTranslations.productId, products.id), eq(productTranslations.locale, locale)),
    )
    .where(eq(subscriptionBoxItems.boxId, boxId));
}

export async function listSubscriptionHistory(subscriptionId: string) {
  return db
    .select()
    .from(subscriptionBoxes)
    .where(eq(subscriptionBoxes.subscriptionId, subscriptionId))
    .orderBy(desc(subscriptionBoxes.cycleYearMonth));
}

export async function listAllSubscriptions() {
  return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
}

export async function getSubscriptionById(id: string) {
  const [s] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return s ?? null;
}
