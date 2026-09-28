import { getTrailMap } from "@/services/trail-maps";
import ResortIcon from "@/components/brand/ResortIcon";
import InteractiveTrailMap from "@/components/resort/InteractiveTrailMap";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getResortBySlug, getResortBuildParams } from "@/services/resorts";
import { contentMetadata } from "@/lib/metadata";
import { getTranslations } from "next-intl/server";

export function generateStaticParams() {
  return getResortBuildParams();
}
export const dynamic = "force-dynamic";

export default async function MapsPage({ params }) {
  const { slug, locale } = await params;
  const resort = await getResortBySlug(slug, { locale });
  if (!resort) notFound();
  const map = await getTrailMap(slug, { locale });
  if (map) {
    const t = await getTranslations({ locale, namespace: "TrailMap" });
    return (
      <main
        className="resort-brand-page bg-canvas px-4 pb-16 pt-32 md:px-8"
        data-resort={resort.slug}
      >
        <div className="mx-auto max-w-[1600px]">
          <Link href={`/resorts/${slug}`} className="font-semibold underline">
            ← {t("back")}
          </Link>
          <p className="brand-eyebrow mt-8">{t("eyebrow")}</p>
          <h1 className="my-6 flex items-center gap-4 text-4xl font-black md:text-6xl">
            <ResortIcon
              slug={resort.slug}
              className="h-12 w-12 md:h-16 md:w-16"
            />
            {resort.name}
          </h1>
          <InteractiveTrailMap
            map={map}
            resortName={resort.name}
            resortSlug={resort.slug}
          />
        </div>
      </main>
    );
  }
  notFound();
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const resort = await getResortBySlug(slug, { locale });
  if (!resort) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return contentMetadata(
    locale,
    "/resorts/" + slug + "/maps",
    resort.name + " · " + t("mapsTitle"),
    resort.description,
    resort.image,
  );
}
