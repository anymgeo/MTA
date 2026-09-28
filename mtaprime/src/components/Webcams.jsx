import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import WebcamCard from "./webcams/WebcamCard";
export default function Webcams({ cameras = [], current }) {
  const t = useTranslations("MountainViews");
  const ordered = [...cameras]
    .sort(
      (a, b) =>
        Number(b.resortSlug === current?.slug) -
        Number(a.resortSlug === current?.slug),
    )
    .slice(0, 3);
  return (
    <section className="bg-canvas px-6 py-24 md:px-10 lg:py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="brand-eyebrow">{t("eyebrow")}</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              {t("title")}
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-muted">{t("intro")}</p>
          </div>
          <Link
            href="/webcams"
            className="inline-flex shrink-0 items-center gap-3 rounded-full border border-border px-6 py-4 font-semibold transition hover:bg-surface"
          >
            {t("all")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          {ordered[0] && <WebcamCard camera={ordered[0]} featured />}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {ordered.slice(1).map((camera) => (
              <WebcamCard key={camera.id} camera={camera} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
