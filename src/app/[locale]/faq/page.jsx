import View from "@/components/pages/FaqPage";
import { getFaqs } from "@/services/faqs";
export const dynamic = "force-dynamic";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "faq", "/faq");
}
export default async function Page({ params }) {
  const { locale } = await params;
  return <View items={await getFaqs({ locale })} />;
}
