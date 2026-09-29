"use client";

import { useTranslations } from "next-intl";
import MediaGallery from "@/components/media/MediaGallery";

export default function ResortGallery({ resort }) {
  const t=useTranslations("ResortGallery");
  const images=resort.gallery?.length?resort.gallery:[resort.image];
  return <MediaGallery images={images} eyebrow={t("mountainMoments_c2571e")} title={t("gallery_9c30a3")}/>;
}
