import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import type { NextAuthConfig } from "next-auth";

const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID?.length && process.env.AUTH_GOOGLE_SECRET?.length,
);

const authApiBase = () => process.env.AUTH_API_URL ?? "http://127.0.0.1:4000";

/**
 * JWT/session encryption secret. Required in production (`AUTH_SECRET`).
 * In development only, a fixed fallback is used so `npm run dev` works without `.env.local`.
 */
const authSecret =
  process.env.AUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "peoplesolve-dev-only-secret-not-for-production-min-32-chars"
    : undefined);

type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
  karma: number;
  image: string | null;
};

/**
 * NextAuth v5: Google OAuth, credentials (Express `/auth/login` + offline demo fallback), guest.
 */
export const authConfig = {
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const emailRaw = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const email = emailRaw?.trim().toLowerCase() ?? "";
        if (!email || !password) return null;

        try {
          const res = await fetch(`${authApiBase()}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(8_000),
          });
          if (res.ok) {
            const data = (await res.json()) as { user: ApiUser };
            const u = data.user;
            return {
              id: u.id,
              name: u.name ?? "User",
              email: u.email,
              image: u.image,
              karma: u.karma,
            };
          }
        } catch {
          /* backend down — try offline demo below */
        }

        if (email === "demo@peoplesolve.dev" && password === "demo") {
          return {
            id: "demo-user-1",
            name: "Demo Student",
            email: "demo@peoplesolve.dev",
            image: null,
            karma: 42,
          };
        }
        return null;
      },
    }),
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        return {
          id: `guest-${crypto.randomUUID()}`,
          name: "Guest",
          email: null,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        const isGuest = user.id?.startsWith("guest-") ?? false;
        token.isGuest = isGuest;
        const withKarma = user as { karma?: number };
        token.karma =
          typeof withKarma.karma === "number" ? withKarma.karma : 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.isGuest = Boolean(token.isGuest);
        session.user.karma = typeof token.karma === "number" ? token.karma : 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
