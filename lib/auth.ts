import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { captureMetadata } from "@/lib/auth/session-metadata";

const googleConfigured = !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...baseAdapter,
    async createSession(data) {
      const session = await baseAdapter.createSession!(data);
      try {
        const meta = captureMetadata(await headers());
        await db
          .update(sessions)
          .set({ lastSeenAt: new Date(), ...meta })
          .where(eq(sessions.sessionToken, session.sessionToken));
      } catch {
        // header access can fail in non-request contexts — metadata is best-effort
      }
      return session;
    },
  },
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
