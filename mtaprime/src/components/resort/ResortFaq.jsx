"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
export default function ResortFaq({ items = [] }) {
  const t = useTranslations("ResortFaq");
  const [open, setOpen] = useState(0);
  if (!items.length) return null;
  return (
    <section id="faq" className="px-6 py-24 md:px-10 lg:px-16 lg:py-32">
      <div className="mx-auto max-w-[1000px]">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
          {t("08NeedToKnow_0d4188")}
        </p>
        <h2 className="mt-5 text-6xl font-black leading-[.8] tracking-[-.07em] md:text-8xl">
          {t("questions_d43927")}
          <br />
          <span className="font-heading font-normal">{t("answered_39fbba")}</span>
        </h2>
        <div className="mt-14 border-t border-ink/15">
          {items.map(({ id, question, answer }, index) => (
            <div key={id} className="border-b border-ink/15">
              <button
                aria-expanded={open === index}
                onClick={() => setOpen(open === index ? -1 : index)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="text-lg font-bold md:text-xl">{question}</span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 transition ${open === index ? "rotate-180" : ""}`}
                />
              </button>
              {open === index && (
                <p className="whitespace-pre-line max-w-2xl pb-6 text-sm leading-7 text-muted">
                  {answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
