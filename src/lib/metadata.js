import "server-only";
import { getTranslations } from "next-intl/server";
import { env } from "@/config/env";
export function contentMetadata(
  locale,
  path,
  title,
  description,
  image = "/Gudauri.jpg",
) {
  const url = env.siteUrl + "/" + locale + path;
  return {
    metadataBase: new URL(env.siteUrl),
    title: title + " | mta.ski",
    description,
    alternates: {
      canonical: url,
      languages: {
        ka: env.siteUrl + "/ka" + path,
        en: env.siteUrl + "/en" + path,
        "x-default": env.siteUrl + "/ka" + path,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "mta.ski",
      locale: locale === "ka" ? "ka_GE" : "en_US",
      alternateLocale: locale === "ka" ? "en_US" : "ka_GE",
      type: "website",
      images: [{ url: image, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
export async function pageMetadata(locale, section, path = "") {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return contentMetadata(
    locale,
    path,
    t(section + "Title"),
    t(section + "Description"),
  );
}
