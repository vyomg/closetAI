import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

// Google sign-in is only wired up when real credentials are present — never
// a fake/disabled-looking button that silently fails on click. See
// GOOGLE_AUTH_ENABLED (exported below) for the UI-side flag that keeps the
// login/signup pages honest about whether this is actually available; see
// .env.example for exact setup steps.
export const GOOGLE_AUTH_ENABLED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    ...(GOOGLE_AUTH_ENABLED
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
    // Google accounts land here on first sign-in with no passwordHash yet —
    // credentials-based accounts always go through /api/auth/signup instead,
    // which sets one. A random, never-used hash keeps the column's NOT NULL
    // constraint satisfied without a schema change or a guessable value.
    // Also overwrites `user.id` (which NextAuth otherwise sets to Google's
    // own account id) with OUR User row's real id, so the `jwt` callback
    // right after this stores the id every API route actually queries by.
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      const email = user.email.toLowerCase();
      let dbUser = await db.user.findUnique({ where: { email } });
      if (!dbUser) {
        const randomHash = await bcrypt.hash(randomUUID(), 10);
        dbUser = await db.user.create({
          data: { email, name: user.name ?? email, passwordHash: randomHash },
        });
      }
      user.id = dbUser.id;
      return true;
    },
  },
});
