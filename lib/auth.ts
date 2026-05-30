import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";

const googleConfigured = !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: googleConfigured
    ? [
        Google({
          clientId: env.AUTH_GOOGLE_ID!,
          clientSecret: env.AUTH_GOOGLE_SECRET!,
          // Google verifies the email — safe to link an existing local account
          // when the addresses match.
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : [],
  pages: {
    signIn: "/fr/sign-in",
  },
  trustHost: true,
  callbacks: {
    async signIn({ user }) {
      // Block OAuth sign-in for users in cool-off or already tombstoned.
      const u = user as {
        id?: string;
        deletedAt?: Date | null;
        purgedAt?: Date | null;
      };
      if (u?.purgedAt) return false;
      if (u?.deletedAt) return "/fr/sign-in?error=account-deleted";
      return true;
    },
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
