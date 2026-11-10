import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { classify, extractUrls } from "../../scripts/check-links.mjs";

describe("link checker", () => {
  it("finds every https source link in the evidence library", () => {
    const urls: string[] = extractUrls(readFileSync("src/data/evidence-library.ts", "utf8"));
    expect(urls.length).toBeGreaterThan(5);
    for (const u of urls) expect(u.startsWith("https://")).toBe(true);
  });

  it("treats 404 and 410 as broken, 403 and 429 as warnings, 2xx and 3xx as ok", () => {
    expect(classify(200)).toBe("ok");
    expect(classify(301)).toBe("ok");
    expect(classify(404)).toBe("broken");
    expect(classify(410)).toBe("broken");
    expect(classify(500)).toBe("broken");
    expect(classify(403)).toBe("warning");
    expect(classify(429)).toBe("warning");
  });
});
