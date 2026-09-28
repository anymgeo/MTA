import { getTranslations } from "next-intl/server";
import { getEvents } from "@/services/portal";
import { ContentFrame } from "@/components/content/ContentUI";
import RecordList from "@/components/content/RecordList";
import { contentMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";
export async function generateMetadata({ params }) {
  const { locale } = await params,
    t = await getTranslations({ locale, namespace: "Portal" });
  return contentMetadata(
    locale,
    "/events",
    t("titles.events"),
    t("titles.events"),
  );
}
export default async function Page({ params }) {
  const { locale } = await params,
    t = await getTranslations({ locale, namespace: "Portal" });
  let items = await getEvents({ locale });
  return (
    <ContentFrame title={t("titles.events")} back="/events">
      <Link href="/events/competitions" className="mb-8 inline-block underline">
        {t("titles.competitions")}
      </Link>
      <RecordList
        items={items}
        basePath="/events"
        filters={["area", "category", "date"]}
      />
    </ContentFrame>
  );
}
