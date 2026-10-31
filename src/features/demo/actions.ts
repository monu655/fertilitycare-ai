"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { createDemoUser } from "./service";
import { demoEnabled } from "./synthetic-data";

export type DemoState = { message?: string };

// One click: make a fresh synthetic demo user and sign in as them.
export async function startDemoAction(_prev: DemoState): Promise<DemoState> {
  if (!demoEnabled()) return { message: "The demo is not switched on for this site." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`demo:${ip}`, Number(process.env.DEMO_LIMIT_PER_HOUR ?? 20), 60 * 60 * 1000).ok) {
    return { message: "Too many demo sessions from this network. Please try again later." };
  }

  try {
    const { email, password, userId } = await createDemoUser();
    await recordAudit(userId, "demo.started");
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return { message: "Could not start the demo. Please try again." };
    throw error; // a redirect is thrown by Next.js and must continue
  }
  return {};
}
