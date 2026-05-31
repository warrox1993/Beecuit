"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { validateGiftCardCode } from "@/lib/gift-cards/validation";
import { checkAuthRateLimit, getClientIp } from "@/lib/auth/rate-limit";

// Public server action wrapper — the code itself is the auth token. IP-rate-limited
// to prevent brute-forcing valid codes via this pre-validation endpoint (the
// checkout action is already limited; this closes the same-purpose bypass).
export async function validateGiftCardCodeAction(code: string) {
  const ip = getClientIp(await headers());
  const rl = await checkAuthRateLimit({ action: "gift-card", ip });
  if (!rl.ok) {
    return { valid: false as const, error: "Trop de tentatives, réessaie plus tard" };
  }
  return validateGiftCardCode(code);
}

// Admin: soft-disable a gift card
export async function disableGiftCard(id: string) {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
  await db.update(giftCards).set({ isActive: false }).where(eq(giftCards.id, id));
  revalidatePath("/admin/cartes-cadeaux");
}
