"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { InputText } from "primereact/inputtext";
export default function SearchModal({ onClose }) {
  const t = useTranslations("SearchModal");
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-6 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-canvas p-8 shadow-2xl md:p-12"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-muted transition-colors hover:text-ink"
          aria-label={t("closeModal_70d3a5")}
        >
          <X size={20} />
        </button>

        <p className="text-xs font-bold tracking-[0.2em] text-ink">
          {t("searchMta_ffa952")}
        </p>

        <h2 className="mt-4 text-4xl font-black leading-none md:text-6xl">
          {t("findYour_246976")}
          <br />
          <span className="font-heading font-normal">{t("adventure_6d3991")}</span>
        </h2>

        <div className="mt-8 flex gap-3">
          <InputText
            autoFocus
            placeholder={t("searchResortsLiftsTrails_2cafb9")}
            className="flex-1 rounded-none border border-border px-4 py-3 text-sm focus:border-ink focus:outline-none focus:ring-0"
          />

          <button className="flex items-center gap-2 bg-ink px-6 text-xs font-bold text-canvas transition-opacity hover:opacity-90">
            {t("search_a62a7a")}
            <Search size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
