import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Camera, Send, Ticket } from "lucide-react";
export default function Footer({ setModal }) {
  const t = useTranslations("Footer");
  return (
    <footer className="bg-ink px-6 py-14 text-canvas md:px-10 lg:px-16 lg:py-18">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-12 border-b border-canvas/15 pb-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-block rounded-md p-1"
            >
              <Image src="/brand/mta-wordmark-light.svg" alt="M.T.A. Mountain Trails Agency" width={387} height={199} className="h-auto w-[140px]" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-canvas/55">
              {t("georgiaMountainTrailsYourStartingPoint_43bd70")}
            </p>
            <button
              onClick={() => setModal("pass")}
              className="mt-7 inline-flex items-center gap-3 rounded-full bg-border px-5 py-3 text-xs font-bold uppercase tracking-[.15em] text-ink transition hover:bg-canvas"
            >
              <Ticket size={16} />
              {t("buySkiPass_8f7678")}
            </button>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-canvas/40">
              {t("explore_b965ae")}
            </p>
            <nav className="mt-5 flex flex-col gap-3 text-sm text-canvas/75">
              <Link href="/#resorts">{t("resorts_c5a813")}</Link>
              <Link href="/#live">{t("mountainStatus_b7d976")}</Link>
              <Link href="/#map">{t("maps_80071c")}</Link>
              <Link href="/news">{t("news_34c808")}</Link>
            </nav>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-canvas/40">
              {t("stayConnected_925338")}
            </p>
            <a
              href="https://status.mta.ski/en"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-canvas/75 transition hover:text-canvas"
            >
              {t("officialLiveStatus_04c8e6")}
              <ArrowUpRight size={15} />
            </a>
            <div className="mt-6 flex gap-3">
              <a
                href="https://www.instagram.com/"
                aria-label={t("instagram_5721bb")}
                className="grid h-9 w-9 place-items-center rounded-full border border-canvas/20 transition hover:bg-canvas hover:text-ink"
              >
                <Camera size={16} />
              </a>
              <a
                href="https://t.me/"
                aria-label={t("telegram_edbea9")}
                className="grid h-9 w-9 place-items-center rounded-full border border-canvas/20 transition hover:bg-canvas hover:text-ink"
              >
                <Send size={16} />
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6 text-[10px] font-bold uppercase tracking-[.15em] text-canvas/35 sm:flex-row sm:justify-between">
          <span>
            © {new Date().getFullYear()}
            {t("mountainTrailsAgency_c73602")}
          </span>
          <span>{t("georgia_9113c6")}</span>
        </div>
      </div>
    </footer>
  );
}
