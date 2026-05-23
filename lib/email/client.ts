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
