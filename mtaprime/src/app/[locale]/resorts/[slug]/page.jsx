import { getTrailMap } from "@/services/trail-maps";
import { getResortContext } from "@/services/resort-context";
import { notFound } from "next/navigation";
import { getResortBySlug, getResortBuildParams } from "@/services/resorts";
import { contentMetadata } from "@/lib/metadata";
import { getTranslations } from "next-intl/server";
import ResortDetails from "@/components/resort/ResortDetails";

export function generateStaticParams() {
  return getResortBuildParams();
}
export const dynamic = "force-dynamic";

export default async function ResortPage({ params }) {
  const { slug, locale } = await params;
  const resort = await getResortBySlug(slug, { locale });
  if (!resort) notFound();
  const [context, trailMap] = await Promise.all([
    getResortContext({ locale, area: slug }),
    getTrailMap(slug, { locale }),
  ]);
  return (
    <ResortDetails resort={resort} context={context} trailMap={trailMap} />
  );
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const resort = await getResortBySlug(slug, { locale });
  if (!resort) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return contentMetadata(
    locale,
    "/resorts/" + slug + "",
    resort.name,
    resort.description,
    resort.image,
  );
}
