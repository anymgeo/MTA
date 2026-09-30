import { getTranslations } from "next-intl/server";
import { getWebcamViews } from "@/services/webcams";
import { contentMetadata } from "@/lib/metadata";
import WebcamCard from "@/components/webcams/WebcamCard";
import { Link } from "@/i18n/navigation";
export async function generateMetadata({ params }) {
  const { locale } = await params,
    t = await getTranslations({ locale, namespace: "MountainViews" });
  return contentMetadata(locale, "/webcams", t("eyebrow"), t("intro"));
}
export default async function Page({ params, searchParams }) {
  const { locale } = await params,
    { area } = await searchParams;
  const [t, cameras, all] = await Promise.all([
    getTranslations({ locale, namespace: "MountainViews" }),
    getWebcamViews({ locale, area }),
    getWebcamViews({ locale }),
  ]);
  return (
    <main className="min-h-screen bg-canvas px-6 pb-24 pt-40 text-ink md:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="brand-eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          {t("intro")}
        </p>
        <nav aria-label={t("location")} className="my-10 flex flex-wrap gap-3">
          {[{ slug: "", name: t("all") }, ...all].map((c) => (
            <Link
              key={c.slug}
              href={c.slug ? "/webcams?area=" + c.slug : "/webcams"}
              aria-current={(area || "") === c.slug ? "page" : undefined}
              className="camera-filter"
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="grid gap-6 md:grid-cols-2">
          {cameras.map((camera) => (
            <WebcamCard key={camera.id} camera={camera} />
          ))}
        </div>
        <div className="mt-12 rounded-3xl border border-border bg-surface p-8">
          <h2 className="text-2xl font-bold">{t("conditions")}</h2>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            {t("conditionsText")}
          </p>
          <a
            href="https://status.mta.ski/en"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block font-bold transition-opacity hover:opacity-60"
          >
            {t("official")} ↗
          </a>
        </div>
      </div>
    </main>
  );
}
