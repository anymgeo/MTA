import { notFound } from "next/navigation";
import { getPortalRecord } from "@/services/portal";
import { ContentFrame, RecordBody } from "@/components/content/ContentUI";
import PdfUpload from "@/components/content/PdfUpload";
import { contentMetadata } from "@/lib/metadata";
async function get(params) {
  const { locale, slug } = await params;
  const r = await getPortalRecord("events", slug, { locale });
  if (!r) notFound();
  return { r, locale, slug };
}
export async function generateMetadata({ params }) {
  const { r, locale, slug } = await get(params);
  return contentMetadata(
    locale,
    "/events/" + slug,
    r.title,
    r.description,
    r.image,
  );
}
export default async function Page({ params }) {
  const { r } = await get(params);
  return (
    <ContentFrame title={r.title} description={r.description} back="/events">
      <RecordBody record={r} />
      <PdfUpload />
    </ContentFrame>
  );
}
