"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { validateGiftCardCode } from "@/lib/gift-cards/validation";

// Public server action wrapper — the code itself is the auth token
export async function validateGiftCardCodeAction(code: string) {
  return validateGiftCardCode(code);
}

// Admin: soft-disable a gift card
export async function disableGiftCard(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
  await db.update(giftCards).set({ isActive: false }).where(eq(giftCards.id, id));
  revalidatePath("/admin/cartes-cadeaux");
}
