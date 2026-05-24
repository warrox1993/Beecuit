import "server-only";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type GiftCardValidation =
  | { valid: true; cardId: string; amountAvailableCents: number }
  | { valid: false; error: string };

export async function validateGiftCardCode(
  code: string,
  now: Date = new Date(),
): Promise<GiftCardValidation> {
  const [card] = await db
    .select({
      id: giftCards.id,
      isActive: giftCards.isActive,
      deliveredAt: giftCards.deliveredAt,
      expiresAt: giftCards.expiresAt,
      remainingAmountCents: giftCards.remainingAmountCents,
    })
    .from(giftCards)
    .where(eq(giftCards.code, code))
    .limit(1);

  if (!card) return { valid: false, error: "Code carte cadeau inconnu" };
  if (!card.isActive) return { valid: false, error: "Carte cadeau désactivée" };
  if (!card.deliveredAt) return { valid: false, error: "Carte cadeau pas encore activée" };
  if (card.expiresAt.getTime() < now.getTime()) {
    return { valid: false, error: "Carte cadeau expirée" };
  }
  if (card.remainingAmountCents <= 0) {
    return { valid: false, error: "Carte cadeau déjà utilisée intégralement" };
  }

  return { valid: true, cardId: card.id, amountAvailableCents: card.remainingAmountCents };
}
