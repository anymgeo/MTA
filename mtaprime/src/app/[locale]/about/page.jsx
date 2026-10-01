import View from "@/components/pages/AboutPage";
import { pageMetadata } from "@/lib/metadata";
import { getResorts } from "@/services/resorts";
import { getCmsSettings } from '@/services/cms';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "about", "/about");
}
export default async function Page({ params }) {
  const { locale } = await params;
  const resorts = (await getResorts({ locale })).map((resort, index) => ({
    ...resort,
    number: String(index + 1).padStart(2, "0"),
    href: `/resorts/${resort.slug}`,
  }));
  return <View resorts={resorts} content={await getCmsSettings('about',locale)} />;
}
