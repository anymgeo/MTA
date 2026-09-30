"use client";
import { useState } from "react";
import Image from "next/image";
import { Play, VideoOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { CameraBadge } from "./WebcamCard";
export default function CameraPlayer({ camera }) {
  const t = useTranslations("MountainViews"),
    [playing, setPlaying] = useState(false);
  return (
    <div>
      <div className="camera-player">
        {playing && camera.videoUrl ? (
          <iframe
            src={camera.videoUrl}
            title={camera.name}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <>
            <Image
              src={camera.image}
              alt={camera.name}
              fill
              sizes="(max-width: 1024px) 100vw, 80vw"
              className="object-cover"
              priority
            />
            <div className="camera-shade" />
            <div className="absolute inset-0 flex items-center justify-center">
              {camera.videoUrl ? (
                <button
                  className="camera-player-action"
                  onClick={() => setPlaying(true)}
                >
                  <Play size={28} />
                  <span>
                    {t(camera.status === "live" ? "watchLive" : "watch")}
                  </span>
                </button>
              ) : (
                <div className="camera-player-action">
                  <VideoOff size={28} />
                  <span>{t("preview")}</span>
                </div>
              )}
            </div>
          </>
        )}
        <div className="pointer-events-none absolute left-5 top-5">
          <CameraBadge status={camera.status} />
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 py-5">
        <p className="max-w-2xl text-sm leading-7 text-muted">
          {t(
            camera.status === "recorded"
              ? "recordedText"
              : camera.status === "live"
                ? "conditionsText"
                : "unavailableText",
          )}
        </p>
        {camera.sourceUrl && (
          <a
            className="font-semibold transition-opacity hover:opacity-60"
            href={camera.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("external")} ↗
          </a>
        )}
      </div>
    </div>
  );
}
