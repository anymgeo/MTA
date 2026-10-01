import { getPortalRecords } from "@/services/portal";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from '@/config/env';
import { getProjects } from '@/services/projects';
export const runtime = "nodejs";
export async function GET(request) {
  const url = new URL(request.url).searchParams.get("url");
  const collections = await Promise.all(
    [
      "safety",
      "documents",
      "events",
      "leadership",
      "infrastructure",
      "history",
      "closures",
      "avalanches",
      "resortOperations",
    ].map((kind) => getPortalRecords(kind, { locale: "en" })),
  );
  collections.push(await getProjects({locale:'en'}));
  const file = collections
    .flat()
    .flatMap((item) => item.files || [])
    .find((item) => item.url === url);
  if (!file) return Response.json({ code: "NOT_FOUND" }, { status: 404 });
  let bytes;
  try {
    if (url.startsWith("/documents/")) {
      const root = path.resolve(process.cwd(), "public/documents"),
        target = path.resolve(process.cwd(), "public", url.slice(1));
      if (!target.startsWith(root + path.sep))
        return Response.json({ code: "NOT_FOUND" }, { status: 404 });
      bytes = await readFile(target);
    } else {
      // The URL must be an exact match in the validated, trusted content registry.
      const source = /^\/media\/[a-f0-9]+\.pdf$/.test(url) ? new URL(url, env.apiBaseUrl).href : url;
      const response = await fetch(source, {
        signal: AbortSignal.timeout(10000),
        redirect: "error",
      });
      if (
        !response.ok ||
        Number(response.headers.get("content-length")) > 10 * 1024 * 1024
      )
        throw new Error("Unavailable PDF");
      const reader = response.body.getReader(),
        chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 10 * 1024 * 1024) {
          await reader.cancel();
          throw new Error("PDF too large");
        }
        chunks.push(value);
      }
      bytes = Buffer.concat(chunks);
    }
    if (bytes.subarray(0, 5).toString() !== "%PDF-")
      throw new Error("Invalid PDF");
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="document.pdf"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ code: "DOCUMENT_UNAVAILABLE" }, { status: 502 });
  }
}
