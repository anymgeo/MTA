import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getWebcamView, getWebcamViews } from "@/services/webcams";
import { contentMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";
import CameraPlayer from "@/components/webcams/CameraPlayer";
import WebcamCard from "@/components/webcams/WebcamCard";
import { DateTime } from "@/components/content/ContentUI";
export async function generateMetadata({ params }) {
  const { locale, slug } = await params,
    camera = await getWebcamView(slug, { locale });
  if (!camera) notFound();
  const t = await getTranslations({ locale, namespace: "MountainViews" });
  return contentMetadata(
    locale,
    "/webcams/" + slug,
    camera.name + " · " + t("camera"),
    t("intro"),
    camera.image,
  );
}
export default async function Page({ params }) {
  const { locale, slug } = await params;
  const [camera, cameras, t] = await Promise.all([
    getWebcamView(slug, { locale }),
    getWebcamViews({ locale }),
    getTranslations({ locale, namespace: "MountainViews" }),
  ]);
  if (!camera) notFound();
  return (
    <main className="bg-canvas px-6 pb-24 pt-36 text-ink md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/webcams"
          className="text-sm font-semibold underline underline-offset-4"
        >
          ← {t("back")}
        </Link>
        <div className="mb-8 mt-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="brand-eyebrow">{camera.location}</p>
            <h1 className="mt-4 text-4xl font-black md:text-6xl">
              {camera.name}
            </h1>
          </div>
          <Link
            href={"/resorts/" + camera.resortSlug}
            className="camera-filter"
          >
            {t("resort")} ↗
          </Link>
        </div>
        <CameraPlayer camera={camera} />
        <dl className="my-8 grid gap-6 rounded-3xl border border-border bg-surface p-8 sm:grid-cols-3">
          {[
            ["location", camera.location],
            ["status", t(camera.status)],
          ].map(([key, value]) => (
            <div key={key}>
              <dt className="text-sm text-muted">{t(key)}</dt>
              <dd className="mt-2 font-semibold">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm text-muted">{t("updated")}</dt>
            <dd className="mt-2 font-semibold">
              {camera.updatedAt ? (
                <DateTime value={camera.updatedAt} />
              ) : (
                t("unknown")
              )}
            </dd>
          </div>
        </dl>
        <section className="mb-16">
          <h2 className="text-2xl font-bold">{t("conditions")}</h2>
          <p className="my-4 max-w-3xl leading-7 text-muted">
            {t("conditionsText")}
          </p>
          <a
            href="https://status.mta.ski/en"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            {t("official")} ↗
          </a>
        </section>
        <h2 className="mb-8 text-3xl font-black">{t("related")}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {cameras
            .filter((c) => c.slug !== slug)
            .map((c) => (
              <WebcamCard key={c.id} camera={c} />
            ))}
        </div>
      </div>
    </main>
  );
}
