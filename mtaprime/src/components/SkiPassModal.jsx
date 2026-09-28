"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, X } from "lucide-react";
export default function SkiPassModal({ onClose }) {
  const t = useTranslations("SkiPassModal");
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-6 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-canvas p-8 shadow-2xl md:p-12"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-muted transition-colors hover:text-white"
          aria-label={t("closeModal_70d3a5")}
        >
          <X size={20} />
        </button>

        <p className="text-xs font-bold tracking-[0.2em] text-ink">
          {t("mtaSkiPass_eb0554")}
        </p>

        <h2 className="mt-4 text-4xl font-black leading-none md:text-6xl">
          {t("yourPass_5e2f44")}
          <br />
          <span className="font-heading font-normal">
            {t("toTheMountain_87a5c9")}
          </span>
        </h2>

        <p className="mt-6 max-w-lg text-sm leading-7 text-muted">
          {t("chooseADayPassOrReload_105a0b")}
        </p>

        <button
          onClick={onClose}
          className="mt-8 flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-xs font-bold tracking-wider text-white transition-all hover:brightness-110 active:scale-95"
        >
          {t("viewPassOptions_85f56f")}
          <ArrowUpRight size={18} />
        </button>
      </div>
    </div>
  );
}
