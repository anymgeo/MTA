"use client";

import { useTranslations } from "next-intl";
export default function PrintButton() {
  const t = useTranslations("PrintButton");
  const handlePrint = () => {
    window.print();
  };
  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-3 rounded-full border border-border px-5 py-3 text-sm font-bold text-ink transition hover:border-ink hover:bg-ink hover:text-canvas"
    >
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
          d="M6.75 9V4.5h10.5V9M6 18H4.875A1.875 1.875 0 0 1 3 16.125v-5.25A1.875 1.875 0 0 1 4.875 9h14.25A1.875 1.875 0 0 1 21 10.875v5.25A1.875 1.875 0 0 1 19.125 18H18m-11.25 0v1.875c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125V18m-10.5 0h10.5"
        />
      </svg>
      {t("print_5b221e")}
    </button>
  );
}
