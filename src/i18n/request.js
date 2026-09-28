import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { routing } from "./routing";
export default getRequestConfig(async ({ locale: requestedLocale }) => {
  const locale = requestedLocale || (await rootParams.locale());
  if (!hasLocale(routing.locales, locale)) notFound();
  return {
    locale,
    timeZone: "Asia/Tbilisi",
    messages: (await import("../../messages/" + locale + ".json")).default,
  };
});
