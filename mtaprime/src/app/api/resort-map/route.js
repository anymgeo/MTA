import { request } from "@/services/client";

export async function GET(requestObject) {
  const url = new URL(requestObject.url);
  const slug = url.searchParams.get("slug");
  const locale = url.searchParams.get("locale") === "ka" ? "ka" : "en";
  if (!slug || !/^[a-z0-9-]{2,150}$/.test(slug))
    return Response.json({ message: "Invalid resort" }, { status: 400 });
  try {
    const map = await request(`maps/${slug}`, { locale, revalidate: 0 });
    return map
      ? Response.json(map, { headers: { "Cache-Control": "no-store" } })
      : Response.json({ message: "Map not found" }, { status: 404 });
  } catch {
    return Response.json({ message: "Map unavailable" }, { status: 503 });
  }
}
