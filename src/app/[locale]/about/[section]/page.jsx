import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPortalRecords } from "@/services/portal";
import {
  ContentFrame,
  RecordBody,
  EmptyState,
} from "@/components/content/ContentUI";
import RecordList from "@/components/content/RecordList";
import { contentMetadata } from "@/lib/metadata";
const allowed = ["history", "leadership", "infrastructure", "documents"];
export async function generateMetadata({ params }) {
  const { locale, section } = await params;
  if (!allowed.includes(section)) notFound();
  const t = await getTranslations({ locale, namespace: "Portal" });
  return contentMetadata(
    locale,
    "/about/" + section,
    t("titles." + section),
    t("titles." + section),
  );
}
export default async function Page({ params }) {
  const { locale, section } = await params;
  if (!allowed.includes(section)) notFound();
  const t = await getTranslations({ locale, namespace: "Portal" }),
    items = await getPortalRecords(section, { locale });
  return (
    <ContentFrame title={t("titles." + section)} back="/about">
      {section === "history" ? (
        items[0] ? (
          <RecordBody record={items[0]} />
        ) : (
          <EmptyState />
        )
      ) : (
        <RecordList
          items={items}
          basePath={section === "documents" ? null : "/about/" + section}
          filters={
            section === "documents"
              ? ["category", "year"]
              : section === "infrastructure"
                ? ["area", "type"]
                : []
          }
        />
      )}
    </ContentFrame>
  );
}
