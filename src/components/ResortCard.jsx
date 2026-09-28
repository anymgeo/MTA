"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import ResortIcon from "./brand/ResortIcon";
import { ArrowRight, CableCar, Mountain, Snowflake, CloudSun, Wind, Eye, Clock, Star, Check, X, Pause, Wrench, Circle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { liveStatuses, observationState, metricNumber } from "@/models/live-conditions";
const statusIcons = { check: Check, x: X, clock: Clock, pause: Pause, wrench: Wrench, circle: Circle };
const weatherKeys = new Set(["clear", "partlyCloudy", "cloudy", "snow", "lightSnow", "rain", "fog"]);
const visibilityKeys = new Set(["excellent", "good", "moderate", "poor"]);
const directions = new Set(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]);
function Metric({ icon: Icon, value, label, detail, primary = false }) {
  return <div className={`live-card-metric ${primary ? "is-primary" : ""}`}><Icon size={primary ? 27 : 19} aria-hidden="true" /><div><strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div></div>;
}
export default function ResortCard({ resort, conditions, season, now, detailsHref, detailsLabel }) {
  const t = useTranslations("LiveCards");
  const config = resort.liveCard || {};
  const state = observationState(conditions, now);
  const live = state.unavailable ? {} : (conditions || {});
  const status = liveStatuses[state.status];
  const StatusIcon = statusIcons[status.icon];
  const featured = config.featured === true;
  const image = (season === "summer" ? config.summerImage : config.winterImage) || resort.seasons?.[season]?.image || resort.image;
  const [failedImage, setFailedImage] = useState(null);
  const number = (value, unit = "") => metricNumber(value) === null ? "—" : `${value}${unit}`;
  const fraction = (open, total) => metricNumber(open) === null || metricNumber(total) === null || open < 0 || total < open ? "—" : `${open} / ${total}`;
  const weather = weatherKeys.has(live.weatherCondition) ? t("weather." + live.weatherCondition) : t("weatherUnknown");
  const visibility = visibilityKeys.has(live.visibility) ? t("visibility." + live.visibility) : "—";
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const hours = timePattern.test(live.operatingFrom) && timePattern.test(live.operatingTo) ? `${live.operatingFrom} – ${live.operatingTo}` : "—";
  const updated = state.unavailable ? t("unavailable") : state.minutes < 1 ? t("justNow") : state.minutes < 60 ? t("minutesAgo", { count: state.minutes }) : t("hoursAgo", { count: Math.floor(state.minutes / 60) });
  return (
    <article data-resort={resort.slug} className={`live-resort-card ${featured ? "is-featured" : ""}`}>
      <div className="live-card-cover">
        {image && image !== failedImage ? <Image src={image} alt={config.imageAlt || resort.name} fill sizes="(min-width:1280px) 25vw, (min-width:768px) 50vw, 100vw" className="object-cover" onError={() => setFailedImage(image)} /> : <Mountain className="live-card-placeholder" aria-hidden="true" />}
        <div className="live-card-shade" />
        <div className="live-card-badges">
          {featured ? <span className="live-featured"><Star size={12} aria-hidden="true" />{t("featured")}</span> : <span />}
          <span className={`live-status tone-${status.tone}`}><StatusIcon size={12} aria-hidden="true" />{t("status." + state.status)}</span>
        </div>
        <div className="live-card-identity"><ResortIcon slug={resort.slug} className="h-12 w-12" /><div><h3>{resort.name}</h3><p>{resort.region}</p></div></div>
      </div>
      <div className="live-card-body">
        <div className="live-metric-row">
          <Metric icon={CloudSun} value={number(live.temperature, "°C")} label={weather} primary />
          <Metric icon={Snowflake} value={number(live.snowDepthCm, " " + t("units.cm"))} label={t("snowDepth")} primary />
        </div>
        <div className="live-metric-row">
          <Metric icon={CableCar} value={fraction(live.liftsOpen, live.liftsTotal)} label={t("lifts")} />
          <Metric icon={Mountain} value={fraction(live.trailsOpen, live.trailsTotal)} label={t("trails")} />
        </div>
        <div className="live-metric-row live-secondary">
          <Metric icon={Wind} value={number(live.windSpeedKmh, " " + t("units.kmh"))} label={t("wind")} detail={directions.has(live.windDirection) ? t("directions." + live.windDirection) : null} />
          <Metric icon={Eye} value={visibility} label={t("visibilityLabel")} />
          <Metric icon={Clock} value={hours} label={t("hours")} />
        </div>
        <div className="live-metric-row">
          <Metric icon={Mountain} value={number(live.topElevationM, " " + t("units.m"))} label={t("elevation")} />
          <Metric icon={Snowflake} value={number(live.newSnow24hCm, " " + t("units.cm"))} label={t("newSnow")} />
        </div>
        {config.note && <p className="live-card-note">{config.note}</p>}
        <div className="live-card-footer">
          <span className={`live-freshness ${state.stale ? "is-stale" : ""}`} title={state.unavailable ? undefined : conditions.lastUpdatedAt}><i />{state.stale ? t("stale") + " · " : ""}{updated}</span>
          <Link href={detailsHref || `/resorts/${resort.slug}`} className="live-card-details">{detailsLabel || t("details")}<ArrowRight size={15} aria-hidden="true" /><span className="sr-only"> — {resort.name}</span></Link>
        </div>
      </div>
    </article>
  );
}
