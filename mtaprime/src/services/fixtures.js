import "server-only";
import { getTranslations } from "next-intl/server";
/** Resolve fixture message references at the data boundary, never inside UI components. */
export async function localizeFixture(value, locale) {
  const t = await getTranslations({ locale });
  function resolve(item) {
    if (Array.isArray(item)) return item.map(resolve);
    if (item && typeof item === "object") {
      if (item.$message) return t(item.$message);
      return Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, resolve(value)]),
      );
    }
    return item;
  }
  return resolve(value);
}
