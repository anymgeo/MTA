import "server-only";
import { env } from "@/config/env";
/** Fetch a JSON resource. Errors propagate to the localized route error boundary. */
export async function request(path, { locale, revalidate = 300 } = {}) {
  if (!env.apiBaseUrl) throw new Error("API_BASE_URL is not configured");
  const url = new URL(
    env.apiBaseUrl.replace(/\/$/, "") + "/" + path.replace(/^\//, ""),
  );
  if (locale) url.searchParams.set("locale", locale);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(env.apiToken ? { Authorization: "Bearer " + env.apiToken } : {}),
    },
    signal: AbortSignal.timeout(10000),
    ...(revalidate === 0 ? { cache: "no-store" } : { next: { revalidate } }),
  });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error("Upstream request failed (" + response.status + ")");
  return response.json();
}
