import "server-only";
import { sendEmail } from "@/lib/email/client";
import { env } from "@/lib/env";
import { B2BAdminNotification } from "./templates/B2BAdminNotification";
import { B2BCustomerQuote } from "./templates/B2BCustomerQuote";
import { B2BPaymentConfirmation } from "./templates/B2BPaymentConfirmation";
import { B2BQuoteRejected } from "./templates/B2BQuoteRejected";

export async function sendB2BAdminNotification(opts: {
  quoteId: string;
  companyName: string;
  contactName: string;
  email: string;
  requestedProducts: string;
}) {
  const adminUrl = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/admin/devis/${opts.quoteId}`;
  await sendEmail({
    to: env.ADMIN_EMAIL,
    subject: `Nouveau devis B2B — ${opts.companyName}`,
    react: B2BAdminNotification({
      companyName: opts.companyName,
      contactName: opts.contactName,
      email: opts.email,
      requestedProducts: opts.requestedProducts,
      adminUrl,
    }),
  });
}

export async function sendB2BCustomerQuote(opts: {
  quoteId: string;
  to: string;
  contactName: string;
  amountCents: number;
  description: string;
  paymentLinkUrl: string;
  expiresAt: Date;
  locale: string;
}) {
  await sendEmail({
    to: opts.to,
    subject: "Votre devis BeeCuit",
    react: B2BCustomerQuote({
      contactName: opts.contactName,
      amountCents: opts.amountCents,
      description: opts.description,
      paymentLinkUrl: opts.paymentLinkUrl,
      expiresAt: opts.expiresAt,
    }),
  });
}

export async function sendB2BPaymentConfirmation(opts: {
  to: string;
  contactName: string;
  amountCents: number;
}) {
  await sendEmail({
    to: opts.to,
    subject: "Paiement reçu — Merci !",
    react: B2BPaymentConfirmation({
      contactName: opts.contactName,
      amountCents: opts.amountCents,
    }),
  });
}

export async function sendB2BQuoteRejected(opts: {
  to: string;
  contactName: string;
  reason: string;
  locale: string;
}) {
  await sendEmail({
    to: opts.to,
    subject: "Concernant votre demande BeeCuit",
    react: B2BQuoteRejected({ contactName: opts.contactName, reason: opts.reason }),
  });
}
