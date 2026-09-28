"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
export default function PrintButton() {
  const t = useTranslations("PrintButton");
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 border border-ink px-5 py-3 text-xs font-bold tracking-wider transition hover:bg-ink hover:text-canvas"
    >
      <Printer size={16} />
      {t("print_7081e9")}
    </button>
  );
}
