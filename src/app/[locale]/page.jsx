import { getWebcamViews } from "@/services/webcams";
import View from "@/components/pages/HomePage";
import { pageMetadata } from "@/lib/metadata";
import { getResorts } from "@/services/resorts";
import { getPortalRecords } from "@/services/portal";
import { getNews } from "@/services/news";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata(locale, "home", "");
}
export default async function Page({ params }) {
  const { locale } = await params;
  const [resorts, activities, news, cameras] = await Promise.all([
    getResorts({ locale }),
    getPortalRecords("navigation", { locale }),
    getNews({ locale }),
    getWebcamViews({ locale }),
  ]);
  return (
    <View
      resorts={resorts}
      activities={activities}
      news={news}
      cameras={cameras}
    />
  );
}
