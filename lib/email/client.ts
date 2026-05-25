import "server-only";
import { Resend } from "resend";
import type * as React from "react";
import { env } from "@/lib/env";

const resend = new Resend(env.AUTH_RESEND_KEY);

export async function sendEmail(args: { to: string; subject: string; react: React.ReactElement }) {
  const { error } = await resend.emails.send({
    from: env.AUTH_EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    react: args.react,
  });
  if (error) {
    console.error("[email] send failed", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}

const RESEND_BATCH_LIMIT = 100;

export type EmailPayload = { to: string; subject: string; react: React.ReactElement };
export type BatchResult = {
  to: string;
  status: "sent" | "failed";
  resendId?: string;
  errorMessage?: string;
};

export async function sendBatchEmails(payloads: EmailPayload[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  for (let i = 0; i < payloads.length; i += RESEND_BATCH_LIMIT) {
    const chunk = payloads.slice(i, i + RESEND_BATCH_LIMIT);
    try {
      const response = await resend.batch.send(
        chunk.map((p) => ({
          from: env.AUTH_EMAIL_FROM,
          to: p.to,
          subject: p.subject,
          react: p.react,
        })),
      );
      const data = response.data?.data ?? [];
      chunk.forEach((p, idx) => {
        const r = data[idx];
        results.push(
          r?.id
            ? { to: p.to, status: "sent", resendId: r.id }
            : { to: p.to, status: "failed", errorMessage: "no resend id" },
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      chunk.forEach((p) => results.push({ to: p.to, status: "failed", errorMessage: msg }));
    }
  }
  return results;
}
