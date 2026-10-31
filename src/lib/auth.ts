import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { signInSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/security/rate-limit";

// A real bcrypt hash, made lazily on first use (NOT at import time, because Next.js
// rejects random values created while prerendering). We compare against it when the
// email is unknown, so "unknown email" and "wrong password" take about the same time.
let dummyHash: string | undefined;
function getDummyHash() {
  dummyHash ??= bcrypt.hashSync("not-a-real-password", 12);
  return dummyHash;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Max 8 attempts per email every 10 minutes.
        if (!rateLimit(`signin:${email}`, 8, 10 * 60 * 1000).ok) return null;

        const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
        const ok = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
        if (!user || !ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role, isDemo: user.isDemo };
      },
    }),
  ],
  callbacks: {
    // Put id, role and isDemo into the token, then into the session.
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
        token.isDemo = user.isDemo;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      session.user.isDemo = Boolean(token.isDemo);
      return session;
    },
  },
});
