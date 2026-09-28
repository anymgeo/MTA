import { notFound } from "next/navigation";
import { getPortalRecord } from "@/services/portal";
import { ContentFrame, RecordBody } from "@/components/content/ContentUI";
import { contentMetadata } from "@/lib/metadata";
async function get(params) {
  const { locale, section, slug } = await params;
  if (!["leadership", "infrastructure"].includes(section)) notFound();
  const r = await getPortalRecord(section, slug, { locale });
  if (!r) notFound();
  return { r, locale, section, slug };
}
export async function generateMetadata({ params }) {
  const { r, locale, section, slug } = await get(params);
  return contentMetadata(
    locale,
    "/about/" + section + "/" + slug,
    r.title,
    r.description,
    r.image,
  );
}
export default async function Page({ params }) {
  const { r, section } = await get(params);
  return (
    <ContentFrame
      title={r.title}
      description={r.description}
      back={"/about/" + section}
    >
      <RecordBody record={r} />
    </ContentFrame>
  );
}
