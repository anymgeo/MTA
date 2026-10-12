import View from "@/components/pages/ContactPage";
import { pageMetadata } from "@/lib/metadata";
import { getCmsSettings } from '@/services/cms';
import { env } from '@/config/env';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "contact", "/contact");
}
export default async function Page({ params }) {
  const { locale } = await params;
  return <View settings={await getCmsSettings('contact', locale)} snapshotMode={env.snapshot} locale={locale} />;
}
