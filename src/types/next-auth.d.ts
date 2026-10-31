import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "USER" | "ADMIN";
    isDemo?: boolean;
  }
  interface Session {
    user: {
      id: string;
      role: "USER" | "ADMIN";
      isDemo: boolean;
    } & DefaultSession["user"];
  }
}
