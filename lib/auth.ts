import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/client";
import { MagicLinkEmail } from "@/components/email/MagicLinkEmail";

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
      async sendVerificationRequest(params: { identifier: string; url: string }) {
        const { identifier, url } = params;

        if (process.env.NODE_ENV !== "production") {
          console.log("\n[auth] Magic link for", identifier);
          console.log("[auth]", url, "\n");
        }

        await sendEmail({
          to: identifier,
          subject: "Ton lien de connexion Au Fil des Saveurs",
          react: MagicLinkEmail({ signInUrl: url }),
        });
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
        const dbUser = user as {
          id: string;
          role?: "customer" | "b2b" | "admin";
          preferredLocale?: "fr" | "nl" | "de" | "en";
        };
        session.user.id = dbUser.id;
        session.user.role = dbUser.role ?? "customer";
        session.user.preferredLocale = dbUser.preferredLocale ?? "fr";
      }
      return session;
    },
  },
});
