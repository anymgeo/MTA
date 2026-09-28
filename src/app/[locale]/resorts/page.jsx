import ExploreResorts from "@/components/ExploreResorts";
import { getResorts } from "@/services/resorts";
import { pageMetadata } from "@/lib/metadata";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return pageMetadata((await params).locale, "resorts", "/resorts");
}

export default async function ResortsPage({ params }) {
  const resorts = await getResorts({ locale: (await params).locale });
  return (
    <main>
      <ExploreResorts resorts={resorts} directory />
    </main>
  );
}
