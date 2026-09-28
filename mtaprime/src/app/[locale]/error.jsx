"use client";
import { useTranslations } from "next-intl";
export default function ErrorView({ reset }) {
  const t = useTranslations("Common");
  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-6 pb-20 pt-40">
      <h1 className="text-3xl font-bold">{t("error")}</h1>
      <p className="mt-4">{t("errorDescription")}</p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-brand-green px-6 py-3 text-ink"
      >
        {t("retry")}
      </button>
    </main>
  );
}
