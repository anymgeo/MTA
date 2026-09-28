"use client";
import Image from "next/image";
import ResortIcon from "@/components/brand/ResortIcon";
import { ArrowUpRight, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSiteSeason } from "@/providers/SeasonProvider";
export function CameraBadge({ status }) {
  const t = useTranslations("MountainViews");
  return (
    <span className="camera-badge">
      <span
        className={
          status === "live" ? "camera-dot camera-dot-live" : "camera-dot"
        }
      />
      {t(status)}
    </span>
  );
}
export default function WebcamCard({ camera, featured = false }) {
  const t = useTranslations("MountainViews"),
    { season } = useSiteSeason();
  return (
    <Link
      href={"/webcams/" + camera.slug}
      className={
        "camera-card group " + (featured ? "camera-card-featured" : "")
      }
    >
      <div className="camera-card-image">
        <Image
          src={camera.seasonImages?.[season]?.image || camera.image}
          alt={camera.name}
          fill
          sizes={
            featured
              ? "(max-width: 1024px) 100vw, 66vw"
              : "(max-width: 640px) 100vw, 40vw"
          }
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="camera-shade" />
        <div className="absolute left-5 top-5">
          <CameraBadge status={camera.status} />
        </div>
        <span className="camera-play" aria-hidden="true">
          <Video size={24} />
        </span>
        <div className="absolute bottom-6 left-6 right-6 text-canvas">
          <p className="mb-2 text-xs font-semibold">{camera.location}</p>
          <div className="flex items-end justify-between gap-4">
            <h3 className="flex items-center gap-3 text-2xl font-black md:text-3xl"><ResortIcon slug={camera.resortSlug} />{camera.name}</h3>
            <ArrowUpRight className="shrink-0" />
          </div>
          <p className="mt-3 text-sm text-canvas/90">{t("open")}</p>
        </div>
      </div>
    </Link>
  );
}
