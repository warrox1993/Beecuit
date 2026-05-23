import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    Resend({
      apiKey: env.AUTH_RESEND_KEY,
      from: env.AUTH_EMAIL_FROM,
      async sendVerificationRequest(params: {
        identifier: string;
        url: string;
        provider: { from?: unknown; apiKey?: unknown };
      }) {
        const { identifier, url, provider } = params;

        if (process.env.NODE_ENV !== "production") {
          console.log("\n[auth] Magic link for", identifier);
          console.log("[auth]", url, "\n");
        }

        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(provider.apiKey as string);
        const result = await resend.emails.send({
          from: provider.from as string,
          to: identifier,
          subject: "Ton lien de connexion BeeCuit",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #4a332a;">
              <h1 style="color: #e4a11b; font-size: 28px; margin-bottom: 16px;">BeeCuit</h1>
              <p>Clique sur le lien ci-dessous pour te connecter. Il est valable 24 heures.</p>
              <p style="margin: 24px 0;">
                <a href="${url}" style="display: inline-block; background: #e4a11b; color: #fbf6ee; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Se connecter à BeeCuit
                </a>
              </p>
              <p style="font-size: 12px; color: #888;">Si tu n'as pas demandé ce lien, tu peux ignorer cet email.</p>
            </div>
          `,
          text: `Lien de connexion BeeCuit : ${url}`,
        });

        if (result.error) {
          throw new Error(`Resend error: ${result.error.message}`);
        }
      },
    }),
  ],
  pages: {
    signIn: "/fr/sign-in",
    verifyRequest: "/fr/sign-in?check=email",
  },
  trustHost: true,
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // With DB sessions, `user` is the AdapterUser row — role is already on it.
        // See next-auth.d.ts which augments AdapterUser to include `role`.
        session.user.role = (user as { role?: "customer" | "b2b" | "admin" }).role ?? "customer";
      }
      return session;
    },
  },
});
