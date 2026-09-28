"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { X } from "lucide-react";
export default function ResortGallery({ resort }) {
  const t = useTranslations("ResortGallery");
  const [open, setOpen] = useState(false);
  const images = resort.gallery?.length ? resort.gallery : [resort.image];
  return (
    <section id="gallery" className="px-6 py-24 md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-muted">
              {t("mountainMoments_c2571e")}
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-.05em]">
              {t("gallery_9c30a3")}
            </h2>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="text-xs font-bold uppercase tracking-[.16em] underline underline-offset-4"
          >
            {t("viewAll_931e1a")}
          </button>
        </div>
        <div className="mt-8 grid h-[280px] grid-cols-3 gap-3 overflow-hidden rounded-2xl">
          {[0, 1, 2].map((index) => (
            <img
              key={index}
              src={images[index % images.length]}
              loading="lazy"
              alt={t("value0Landscape_b27fda", {
                value0: resort.name,
              })}
              className={`h-full w-full object-cover ${index === 1 ? "mt-8 h-[calc(100%-2rem)]" : ""}`}
            />
          ))}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/90 p-6">
          <button
            onClick={() => setOpen(false)}
            aria-label={t("closeGallery_3da207")}
            className="absolute right-6 top-6 text-canvas"
          >
            <X size={28} />
          </button>
          <img
            src={images[0]}
            alt={t("value0Gallery_9f1c80", {
              value0: resort.name,
            })}
            className="max-h-[82svh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}
