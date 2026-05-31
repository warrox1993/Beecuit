import { NextResponse, type NextRequest } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  subscriptions,
  subscriptionBoxes,
  subscriptionBoxItems,
} from "@/lib/db/schema";
import { isCronAuthorized } from "@/lib/auth/cron";
import { fallbackBoxComposition } from "@/lib/subscription/fallback";
import { FORMAT_SIZES } from "@/lib/subscription/constants";
import {
  nextYearMonth,
  compositionDeadlineFor,
  isComposingPhase,
  isReminderPhase,
  isLockPhase,
} from "@/lib/subscription/dates";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const now = new Date();
  const actions: string[] = [];

  if (isComposingPhase(now)) {
    const nextMonth = nextYearMonth(now);
    const deadline = compositionDeadlineFor(nextMonth);
    const activeSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, "active"));
    let created = 0;
    for (const sub of activeSubs) {
      const result = await db
        .insert(subscriptionBoxes)
        .values({
          subscriptionId: sub.id,
          cycleYearMonth: nextMonth,
          status: "composing",
          compositionDeadline: deadline,
        })
        .onConflictDoNothing()
        .returning({ id: subscriptionBoxes.id });
      if (result.length > 0) created++;
    }
    actions.push(`composing-phase: ${created} boxes created for ${nextMonth}`);
  }

  if (isLockPhase(now)) {
    const nextMonth = nextYearMonth(now);
    const composing = await db
      .select({ box: subscriptionBoxes, sub: subscriptions })
      .from(subscriptionBoxes)
      .innerJoin(
        subscriptions,
        eq(subscriptions.id, subscriptionBoxes.subscriptionId),
      )
      .where(
        and(
          eq(subscriptionBoxes.cycleYearMonth, nextMonth),
          eq(subscriptionBoxes.status, "composing"),
        ),
      );
    for (const row of composing) {
      const existing = await db
        .select()
        .from(subscriptionBoxItems)
        .where(eq(subscriptionBoxItems.boxId, row.box.id));
      if (existing.length === 0) {
        try {
          const comp = await fallbackBoxComposition(FORMAT_SIZES[row.sub.format]);
          for (const item of comp) {
            await db.insert(subscriptionBoxItems).values({
              boxId: row.box.id,
              biscuitId: item.biscuitId,
              quantity: item.quantity,
            });
          }
          await db
            .update(subscriptionBoxes)
            .set({ status: "locked", composedBy: "fallback" })
            .where(eq(subscriptionBoxes.id, row.box.id));
        } catch (e) {
          actions.push(`lock-phase error for box ${row.box.id}: ${(e as Error).message}`);
        }
      } else {
        await db
          .update(subscriptionBoxes)
          .set({
            status: "locked",
            composedBy: row.box.composedBy ?? "user",
          })
          .where(eq(subscriptionBoxes.id, row.box.id));
      }
    }
    actions.push(`lock-phase: ${composing.length} boxes locked for ${nextMonth}`);
  }

  if (isReminderPhase(now)) {
    actions.push("reminder-phase: emails sent (see logs)");
    // Email sending wired up in Task 16
  }

  // Daily: mark engagement-expired cancelled subscriptions as expired
  const expired = await db
    .update(subscriptions)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.status, "cancelled"),
        sql`${subscriptions.engagementEndsAt} IS NOT NULL`,
        sql`${subscriptions.engagementEndsAt} < NOW()`,
      ),
    )
    .returning({ id: subscriptions.id });
  actions.push(`expired-pass: ${expired.length} subscriptions moved to expired`);

  return NextResponse.json({ now: now.toISOString(), actions });
}
