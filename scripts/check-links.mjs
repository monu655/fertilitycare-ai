// Opens every source link in the evidence library and reports which ones still work.
// Run:  npm run check:links      (needs internet, no extra packages)
// Exit code 1 means at least one link looks broken (404, 410, network error, timeout).
// 403 and 429 are only warnings: many sites refuse scripts even though the page works in a browser.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function extractUrls(text) {
  return [...new Set([...text.matchAll(/url:\s*"(https:\/\/[^"]+)"/g)].map((m) => m[1]))];
}

export function classify(status) {
  if (status >= 200 && status < 400) return "ok";
  if (status === 403 || status === 429 || status === 999) return "warning";
  return "broken";
}

async function check(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "FertilityCareAI-link-check/1.0", accept: "text/html" },
    });
    await res.body?.cancel();
    return { url, status: res.status, result: classify(res.status) };
  } catch (error) {
    return { url, status: 0, result: "broken", detail: error?.name === "AbortError" ? "timeout" : "network error" };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const text = readFileSync(new URL("../src/data/evidence-library.ts", import.meta.url), "utf8");
  const urls = extractUrls(text);
  console.log(`Checking ${urls.length} source links...\n`);

  const results = [];
  const queue = [...urls];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length > 0) {
      const url = queue.shift();
      const r = await check(url);
      results.push(r);
      const mark = r.result === "ok" ? "OK     " : r.result === "warning" ? "WARNING" : "BROKEN ";
      console.log(`${mark} ${r.status || "---"} ${r.url}${r.detail ? ` (${r.detail})` : ""}`);
    }
  });
  await Promise.all(workers);

  const count = (name) => results.filter((r) => r.result === name).length;
  console.log(`\n${count("ok")} ok, ${count("warning")} warning, ${count("broken")} broken. Checked on ${new Date().toISOString().slice(0, 10)}.`);
  process.exit(count("broken") > 0 ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
