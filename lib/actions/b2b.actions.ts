"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { b2bQuoteRequests } from "@/lib/db/schemas/b2b";
import { auth } from "@/lib/auth";
import {
  CreateB2BQuoteSchema,
  AdminSetQuoteSchema,
  AdminRejectQuoteSchema,
  type CreateB2BQuoteInput,
  type AdminSetQuoteInput,
  type AdminRejectQuoteInput,
} from "@/lib/validators/b2b";
import { checkRateLimit, getClientIp } from "@/lib/b2b/anti-spam";
import { createB2BPaymentLink, deactivateB2BPaymentLink } from "@/lib/stripe/payment-link";
import {
  sendB2BAdminNotification,
  sendB2BCustomerQuote,
  sendB2BQuoteRejected,
} from "@/lib/email/send-b2b";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Forbidden");
  return session;
}

export async function createB2BQuoteRequest(
  input: CreateB2BQuoteInput,
): Promise<Result<{ id: string }>> {
  const parsed = CreateB2BQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Données invalides" };
  }
  if (parsed.data._hp) {
    return { ok: true, data: { id: "noop" } };
  }

  const h = await headers();
  const ip = getClientIp(h);
  if (!checkRateLimit(ip)) {
    return { ok: false, error: "Trop de demandes, réessaie dans quelques minutes." };
  }

  const inserted = await db
    .insert(b2bQuoteRequests)
    .values({
      companyName: parsed.data.companyName,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      vatNumber: parsed.data.vatNumber || null,
      requestedProducts: parsed.data.requestedProducts,
      targetQuantity: parsed.data.targetQuantity ?? null,
      targetDeliveryDate: parsed.data.targetDeliveryDate || null,
      budgetRange: parsed.data.budgetRange || null,
      message: parsed.data.message || null,
      locale: parsed.data.locale,
      sourceIp: ip,
    })
    .returning({ id: b2bQuoteRequests.id });

  const row = inserted[0];
  if (!row) return { ok: false, error: "Insertion DB échouée" };

  await sendB2BAdminNotification({
    quoteId: row.id,
    companyName: parsed.data.companyName,
    contactName: parsed.data.contactName,
    email: parsed.data.email,
    requestedProducts: parsed.data.requestedProducts,
  }).catch((e) => console.error("[b2b] admin email failed", e));

  return { ok: true, data: { id: row.id } };
}

export async function adminSetQuote(input: AdminSetQuoteInput): Promise<Result> {
  const session = await requireAdmin();
  const parsed = AdminSetQuoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const quote = (
    await db
      .select()
      .from(b2bQuoteRequests)
      .where(eq(b2bQuoteRequests.id, parsed.data.quoteId))
      .limit(1)
  )[0];
  if (!quote) return { ok: false, error: "Devis introuvable" };
  if (quote.status !== "pending") {
    return { ok: false, error: `Statut actuel ${quote.status} — impossible de relancer` };
  }

  const shortId = parsed.data.quoteId.slice(0, 8).toUpperCase();
  const stripeRes = await createB2BPaymentLink({
    quoteId: parsed.data.quoteId,
    shortId,
    amountCents: parsed.data.quotedAmountCents,
    description: parsed.data.quoteDescription,
    customerEmail: quote.email,
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await db
    .update(b2bQuoteRequests)
    .set({
      status: "quoted",
      quotedAmountCents: parsed.data.quotedAmountCents,
      quoteDescription: parsed.data.quoteDescription,
      shippingAddress: parsed.data.shippingAddress as Record<string, unknown>,
      adminNotes: parsed.data.adminNotes || null,
      stripeProductId: stripeRes.productId,
      stripePriceId: stripeRes.priceId,
      stripePaymentLinkId: stripeRes.paymentLinkId,
      stripePaymentLinkUrl: stripeRes.paymentLinkUrl,
      quotedAt: now,
      quotedBy: session.user?.id ?? null,
      quoteExpiresAt: expiresAt,
      updatedAt: now,
    })
    .where(eq(b2bQuoteRequests.id, parsed.data.quoteId));

  await sendB2BCustomerQuote({
    quoteId: parsed.data.quoteId,
    to: quote.email,
    contactName: quote.contactName,
    amountCents: parsed.data.quotedAmountCents,
    description: parsed.data.quoteDescription,
    paymentLinkUrl: stripeRes.paymentLinkUrl,
    expiresAt,
    locale: quote.locale,
  }).catch((e) => console.error("[b2b] customer quote email failed", e));

  revalidatePath("/admin/devis");
  revalidatePath(`/admin/devis/${parsed.data.quoteId}`);
  return { ok: true };
}

export async function adminRejectQuote(input: AdminRejectQuoteInput): Promise<Result> {
  await requireAdmin();
  const parsed = AdminRejectQuoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides" };

  const quote = (
    await db
      .select()
      .from(b2bQuoteRequests)
      .where(eq(b2bQuoteRequests.id, parsed.data.quoteId))
      .limit(1)
  )[0];
  if (!quote) return { ok: false, error: "Devis introuvable" };
  if (quote.status === "paid") return { ok: false, error: "Devis déjà payé" };

  // Update DB first so a Stripe failure leaves the system in a recoverable state
  // (rejected quote with link briefly active is harmless; the reverse is not).
  await db
    .update(b2bQuoteRequests)
    .set({
      status: "rejected",
      rejectedReason: parsed.data.reason,
      updatedAt: new Date(),
    })
    .where(eq(b2bQuoteRequests.id, parsed.data.quoteId));

  if (quote.stripePaymentLinkId) {
    await deactivateB2BPaymentLink(quote.stripePaymentLinkId);
  }

  await sendB2BQuoteRejected({
    to: quote.email,
    contactName: quote.contactName,
    reason: parsed.data.reason,
    locale: quote.locale,
  }).catch((e) => console.error("[b2b] reject email failed", e));

  revalidatePath("/admin/devis");
  revalidatePath(`/admin/devis/${parsed.data.quoteId}`);
  return { ok: true };
}
