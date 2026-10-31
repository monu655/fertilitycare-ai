import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit, then blocks", () => {
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 60_000).ok).toBe(true);
    const blocked = rateLimit("k", 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("tracks different keys separately", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60_000);
    expect(rateLimit("a", 3, 60_000).ok).toBe(false);
    expect(rateLimit("b", 3, 60_000).ok).toBe(true);
  });
});
