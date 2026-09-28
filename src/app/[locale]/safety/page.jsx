import View from "@/components/pages/SafetyPage";
import { getEmergencyContacts } from "@/services/portal";
export const dynamic = "force-dynamic";
import { pageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "safety", "/safety");
}
export default async function Page({ params }) {
  const { locale } = await params;
  return <View contacts={await getEmergencyContacts({ locale })} />;
}
