import { request } from "@/services/client";
export async function GET() {
  try {
    const data = await request("resorts/conditions", { revalidate: 0 });
    return Response.json(Array.isArray(data) ? data : [], { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json([], { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
