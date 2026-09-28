import { notFound } from "next/navigation";
import { getPortalRecord } from "@/services/portal";
import { ContentFrame, RecordBody } from "@/components/content/ContentUI";
import { contentMetadata } from "@/lib/metadata";
async function record(params) {
  const { locale, topic, slug } = await params;
  const kind = { closures: "closures", "avalanche-danger": "avalanches" }[
    topic
  ];
  if (!kind) notFound();
  const r = await getPortalRecord(kind, slug, { locale });
  if (!r) notFound();
  return { r, locale, topic, slug };
}
export async function generateMetadata({ params }) {
  const { r, locale, topic, slug } = await record(params);
  return contentMetadata(
    locale,
    "/safety/" + topic + "/" + slug,
    r.title,
    r.description,
    r.image,
  );
}
export default async function Page({ params }) {
  const { r, topic } = await record(params);
  return (
    <ContentFrame
      title={r.title}
      description={r.description}
      back={"/safety/" + topic}
    >
      <RecordBody record={r} />
    </ContentFrame>
  );
}
