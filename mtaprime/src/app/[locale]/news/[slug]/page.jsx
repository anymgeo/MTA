import LocalizedDate from "@/components/LocalizedDate";
import NewsCategoryTag from "@/components/NewsCategoryTag";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getNewsArticleBySlug, getNewsSlugs } from "@/services/news";
import { contentMetadata } from "@/lib/metadata";
import { env } from "@/config/env";
import MediaGallery from "@/components/media/MediaGallery";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const article = await getNewsArticleBySlug(slug, {
    locale,
  });
  if (!article) notFound();
  return contentMetadata(
    locale,
    "/news/" + slug,
    article.title,
    article.excerpt,
    article.image,
  );
}
import PrintButton from "@/components/PrintButton";
export async function generateStaticParams() {
  if (env.newsDataSource === "api") return [];
  return getNewsSlugs();
}
export default async function NewsDetailsPage({ params }) {
  const t = await getTranslations("news_Detail");
  const { slug, locale } = await params;
  const article = await getNewsArticleBySlug(slug, {
    locale,
  });
  if (!article) {
    notFound();
  }
  const shareUrl = `${env.siteUrl}/${locale}/news/${article.slug}`;
  const shareTitle = encodeURIComponent(article.title);
  const encodedUrl = encodeURIComponent(shareUrl);
  const firstParagraph = article.content?.[0];
  const remainingParagraphs = article.content?.slice(1) || [];
  return (
    <main className="min-h-screen bg-canvas">
      <article id="printArticle">
        {/* CONTENT */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-10">
          {/* BACK */}
          <div className="mb-10 print:hidden">
            <Link
              href="/news"
              className="inline-flex items-center text-sm font-bold text-muted transition hover:text-ink"
            >
              {t("backToNews_a790ac")}
            </Link>
          </div>

          {/* ARTICLE HEADER */}
          <header className="mb-12 border-b border-border pb-10">
            <div className="brand-stripe mb-8 h-1 w-24" aria-hidden="true" />
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <NewsCategoryTag category={article.category} />
                <p className="text-sm font-semibold tracking-wide text-muted"><LocalizedDate value={article.date} /></p>
              </div>

              <h1 className="max-w-5xl text-4xl font-black leading-[1.05] tracking-tight text-ink md:text-6xl">
                {article.title}
              </h1>
            </div>
          </header>

          {/* HERO: IMAGE + INTRO */}
          <div className="space-y-10">
            {/* IMAGE */}
            <div className="overflow-hidden rounded-3xl bg-surface">
              <img
                src={article.image}
                alt={article.title}
                className="aspect-[4/3] w-full object-cover md:aspect-[16/9] lg:aspect-[2/1]"
              />
            </div>

            {/* INTRO TEXT */}
            {firstParagraph && (
              <div className="mx-auto max-w-3xl border-l-4 border-brand-yellow pl-6">
                <p className="text-xl font-medium leading-9 text-ink md:text-2xl md:leading-10">
                  {firstParagraph}
                </p>
              </div>
            )}
          </div>

          {/* ARTICLE BODY */}
          {remainingParagraphs.length > 0 && (
            <div className="mx-auto mt-14 max-w-3xl">
              <div className="space-y-7">
                {remainingParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-xl leading-9 text-muted md:text-[1.375rem] md:leading-10"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          )}

          {article.gallery?.length > 0 && (
            <MediaGallery className="news-media-gallery" images={article.gallery} title={article.title} />
          )}

          {/* SHARE + PRINT */}
          <div className="mx-auto mt-16 max-w-3xl border-t border-border pt-8 print:hidden">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              {/* SHARE */}
              <div>
                <p className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-muted">
                  {t("shareThisNews_5084d3")}
                </p>

                <div className="flex flex-wrap gap-3">
                  {/* FACEBOOK */}
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border px-5 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-canvas"
                  >
                    {t("facebook_82da67")}
                  </a>

                  {/* X */}
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border px-5 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-canvas"
                  >
                    {t("x_c032ad")}
                  </a>

                  {/* LINKEDIN */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border px-5 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-canvas"
                  >
                    {t("linkedin_6b6390")}
                  </a>

                  {/* WHATSAPP */}
                  <a
                    href={`https://api.whatsapp.com/send?text=${shareTitle}%20${encodedUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-border px-5 py-3 text-sm font-bold text-ink transition hover:bg-ink hover:text-canvas"
                  >
                    {t("whatsapp_b336fc")}
                  </a>
                </div>
              </div>

              {/* PRINT */}
              <PrintButton />
            </div>
          </div>

          {/* ATTACHED FILES */}
          {article.files && article.files.length > 0 && (
            <div className="mx-auto mt-16 max-w-3xl border-t border-border pt-10 print:hidden">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-ink">
                {t("documents_687c82")}
              </p>

              <h2 className="mt-2 text-2xl font-black text-ink">
                {t("attachedFiles_a5a109")}
              </h2>

              <div className="mt-6 space-y-3">
                {article.files.map((file, index) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-2xl border border-border px-5 py-4 transition hover:border-brand-green hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-ink">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.8"
                          stroke="currentColor"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H6.375A2.625 2.625 0 0 0 3.75 4.875v14.25a2.625 2.625 0 0 0 2.625 2.625h11.25a2.625 2.625 0 0 0 2.625-2.625Z"
                          />
                        </svg>
                      </div>

                      <div>
                        <p className="font-bold text-ink">{file.name}</p>

                        {file.type && (
                          <p className="mt-1 text-xs uppercase tracking-wider text-muted">
                            {file.type}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-lg text-muted transition group-hover:translate-x-1 group-hover:text-ink">
                      →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* BACK TO NEWS */}
          <div className="mx-auto mt-14 max-w-3xl border-t border-border pt-8 print:hidden">
            <Link
              href="/news"
              className="inline-flex items-center text-sm font-black text-ink transition hover:text-ink"
            >
              {t("backToAllNews_76fac7")}
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
