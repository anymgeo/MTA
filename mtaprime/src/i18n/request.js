import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { routing } from "./routing";
import { getCmsSettings } from '@/services/cms';
export default getRequestConfig(async ({ locale: requestedLocale }) => {
  const locale = requestedLocale || (await rootParams.locale());
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = { ...(await import('../../messages/' + locale + '.json')).default };
  const settings = await Promise.all(['about','contact','navigation','footer','structure','page-text'].map(module => getCmsSettings(module, locale)));
  for (const record of settings) for (const [namespace, values] of Object.entries(record?.texts ?? {})) messages[namespace] = values;
  return {
    locale,
    timeZone: "Asia/Tbilisi",
    messages,
  };
});
