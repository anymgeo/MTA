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
    "/events/competitions",
    t("titles.competitions"),
    t("titles.competitions"),
  );
}
export default async function Page({ params }) {
  const { locale } = await params,
    t = await getTranslations({ locale, namespace: "Portal" });
  let items = await getEvents({ locale });
  items = items.filter((item) => ["fis", "fwt", "other"].includes(item.type));
  return (
    <ContentFrame title={t("titles.competitions")} back="/events">
      <Link href="/events/competitions" className="mb-8 inline-block font-bold transition-opacity hover:opacity-60">
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
