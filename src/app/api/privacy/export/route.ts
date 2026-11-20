import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { buildExport } from "@/features/privacy/queries";
import { exportAsText } from "@/features/privacy/export-text";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Please sign in.", { status: 401 });

  // Extra protection against other websites posting to this URL.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response("Not allowed.", { status: 403 });

  const data = await buildExport(userId);
  if (!data.account) return new Response("Account not found.", { status: 404 });

  // The Privacy Center buttons send "format" as a form field. ?format=json in the URL also works.
  let format = new URL(request.url).searchParams.get("format");
  if (!format) {
    try {
      const value = (await request.formData()).get("format");
      format = typeof value === "string" ? value : null;
    } catch {
      format = null; // no form body: use the default (readable text)
    }
  }
  const asJson = format === "json";

  await db.insert(schema.exportRequests).values({ userId, kind: asJson ? "FULL_JSON" : "READABLE_TEXT", status: "READY" });
  await recordAudit(userId, "data.exported");

  const day = new Date().toISOString().slice(0, 10);
  return new Response(asJson ? JSON.stringify(data, null, 2) : exportAsText(data), {
    headers: {
      "content-type": asJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="fertilitycare-data-${day}.${asJson ? "json" : "txt"}"`,
      "cache-control": "no-store",
    },
  });
}
