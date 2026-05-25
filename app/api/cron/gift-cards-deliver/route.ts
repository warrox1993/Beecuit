import { NextResponse, type NextRequest } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { giftCards } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/client";
import { GiftCardDelivery } from "@/lib/email/templates/GiftCardDelivery";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const due = await db
    .select()
    .from(giftCards)
    .where(
      and(
        sql`${giftCards.deliveryAt} <= NOW()`,
        sql`${giftCards.deliveredAt} IS NULL`,
        eq(giftCards.isActive, true),
      ),
    );

  let sent = 0;
  const errors: Array<{ id: string; error: string }> = [];
  for (const card of due) {
    // Mark delivered BEFORE sending the email. If the email fails, we accept a single missed
    // send (admin can manually re-trigger via dashboard) over the alternative of re-delivering
    // the same gift card indefinitely on every cron tick when the DB update fails.
    const claimed = await db
      .update(giftCards)
      .set({ deliveredAt: new Date() })
      .where(and(eq(giftCards.id, card.id), sql`${giftCards.deliveredAt} IS NULL`))
      .returning({ id: giftCards.id });
    if (claimed.length === 0) continue; // another cron instance already claimed this card

    try {
      await sendEmail({
        to: card.recipientEmail,
        subject: `${card.purchaserEmail} t'a offert une carte cadeau Au Fil des Saveurs`,
        react: GiftCardDelivery({
          recipientName: card.recipientName,
          purchaserEmail: card.purchaserEmail,
          amountCents: card.initialAmountCents,
          code: card.code,
          message: card.message,
          expiresAt: card.expiresAt,
          appBaseUrl: env.NEXT_PUBLIC_APP_URL,
        }),
      });
      sent++;
    } catch (e) {
      errors.push({ id: card.id, error: (e as Error).message });
    }
  }
  return NextResponse.json({ due: due.length, sent, errors });
}
