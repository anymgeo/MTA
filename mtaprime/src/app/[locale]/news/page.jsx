import { getTranslations } from "next-intl/server";
import NewsList from "@/components/NewsList";
import { getNews } from "@/services/news";
import { pageMetadata } from "@/lib/metadata";
import { paginateNews } from "@/models/news-pagination";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  return pageMetadata((await params).locale, "news", "/news");
}
export default async function NewsPage({ params, searchParams }) {
  const t = await getTranslations("news");
  const { locale } = await params;
  const news = await getNews({
    locale,
  });
  const pagination = paginateNews(news, (await searchParams).page);
  return (
    <main className="min-h-screen bg-canvas px-6 pt-32 pb-24 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 pb-8">
          <div className="brand-stripe mb-8 h-1 w-24" aria-hidden="true" />
          <h1 className="text-5xl font-black md:text-6xl">{t("news_34c808")}</h1>
        </div>
        <NewsList {...pagination} />
      </div>
    </main>
  );
}
