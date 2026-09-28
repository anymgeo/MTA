import "server-only";
import { request } from "./client";

export async function getFaqs({ locale, scope = "" }) {
  const items = await request("faqs?scope=" + encodeURIComponent(scope), { locale, revalidate: 0 });
  if (!Array.isArray(items) || items.some(item =>
    typeof item.id !== "string" || typeof item.question !== "string" ||
    typeof item.answer !== "string" || typeof item.category !== "string" ||
    !Number.isInteger(item.sortOrder))) throw new Error("Invalid FAQ API response");
  return items;
}
