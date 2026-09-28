import View from "@/components/pages/ContactPage";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "contact", "/contact");
}
export default async function Page({ params }) {
  const { locale } = await params;
  return <View />;
}
