import View from "@/components/pages/StructurePage";
import { pageMetadata } from "@/lib/metadata";
import { getCmsSettings } from '@/services/cms';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "structure", "/structure");
}
export default async function Page({ params }) {
  const { locale } = await params;
  return <View structureData={(await getCmsSettings('structure', locale))?.structureData} />;
}
