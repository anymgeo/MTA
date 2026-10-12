"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowUpRight,
  CableCar,
  ChevronDown,
  Clock3,
  MapPin,
  MountainSnow,
  Route,
  Search,
  Snowflake,
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "difficult", "expert", "mixed", "unknown"];
const DESTINATION_FIELDS = ["destinationLabel", "destinationLat", "destinationLng", "destinationUrl"];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function difficultyLabel(level, t, pageT) {
  return ["easy", "medium", "difficult"].includes(level) ? pageT(level) : t(level || "unknown");
}

function googleMapsUrl(row) {
  const direct = clean(row.destinationUrl);
  if (direct) {
    try {
      const url = new URL(direct);
      const host = url.hostname.toLocaleLowerCase();
      const shortLink = host === "maps.app.goo.gl" || host === "goo.gl";
      const googleMaps = (host === "google.com" || host.endsWith(".google.com") || host.startsWith("www.google.") || host.startsWith("maps.google.")) && url.pathname.startsWith("/maps");
      if (url.protocol === "https:" && (shortLink || googleMaps)) return url.toString();
    } catch {
      return "";
    }
  }
  const latitudeText = clean(row.destinationLat);
  const longitudeText = clean(row.destinationLng);
  if (!latitudeText || !longitudeText) return "";
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "";
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

function DetailGrid({ row, fields, t }) {
  const visible = fields.filter((key) => clean(row[key]));
  if (!visible.length) return null;
  return <dl className="rp-accordion-facts">
    {visible.map((key) => <div key={key}>
      <dt>{t(key)}</dt>
      <dd>{row[key]}</dd>
    </div>)}
  </dl>;
}

function DifficultyPill({ level, label, as = "span", active = false, count, onClick }) {
  const className = `rp-difficulty ${level || "unknown"}${active ? " is-active" : ""}`;
  if (as === "button") return <button type="button" className={className} aria-pressed={active} onClick={onClick}>
    <span className="rp-difficulty-dot" aria-hidden="true" />
    {label}
    {typeof count === "number" ? <small>{count}</small> : null}
  </button>;
  return <span className={className}><span className="rp-difficulty-dot" aria-hidden="true" />{label}</span>;
}

function LiftAccordion({ rows, t, pageT }) {
  return <div className="rp-accordion-list">
    {rows.map((row, index) => {
      const rideTime = clean(row.durationMax) || clean(row.duration) || pageT("pending");
      return <details className="rp-infra-accordion" key={`${row.name}:${row.area}:${index}`}>
        <summary>
          <span className="rp-accordion-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="rp-accordion-title"><strong>{row.name}</strong><small>{clean(row.area) || clean(row.sourceType) || row.type}</small></span>
          <span className="rp-accordion-quick"><span><Clock3 aria-hidden="true" />{rideTime}</span><span><CableCar aria-hidden="true" />{clean(row.sourceType) || row.type}</span></span>
          <ChevronDown className="rp-accordion-chevron" aria-hidden="true" />
        </summary>
        <div className="rp-accordion-panel">
          <DetailGrid row={row} fields={["area", "length", "capacity", "stationElevations", "durationMin", "durationMax", "hours", "weekendHours", "notes"]} t={t} />
        </div>
      </details>;
    })}
  </div>;
}

function TrailAccordion({ rows, t, pageT }) {
  return <div className="rp-accordion-list">
    {rows.map((row, index) => {
      const level = DIFFICULTIES.includes(row.difficulty) ? row.difficulty : "unknown";
      const mapUrl = googleMapsUrl(row);
      return <details className="rp-infra-accordion" key={`${row.name}:${row.area}:${index}`}>
        <summary>
          <span className="rp-accordion-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="rp-accordion-title"><strong>{row.name}</strong><small>{clean(row.area) || clean(row.accessLifts) || t("trail")}</small></span>
          <span className="rp-accordion-quick"><span>{clean(row.length) || pageT("pending")}</span><DifficultyPill level={level} label={difficultyLabel(level, t, pageT)} /></span>
          {mapUrl ? <MapPin className="rp-accordion-map-pin" aria-label={t("mappedDestination")} /> : null}
          <ChevronDown className="rp-accordion-chevron" aria-hidden="true" />
        </summary>
        <div className="rp-accordion-panel">
          <DetailGrid row={row} fields={["area", "length", "difficultySource", "accessLifts", "snowmaking", "notes"]} t={t} />
          <div className={`rp-trail-destination${mapUrl ? " is-mapped" : ""}`}>
            <div><MapPin aria-hidden="true" /><span><strong>{clean(row.destinationLabel) || t("destination")}</strong><small>{mapUrl ? t("destinationReady") : t("destinationPending")}</small></span></div>
            {mapUrl ? <a href={mapUrl} target="_blank" rel="noreferrer">{t("openGoogleMaps")}<ArrowUpRight aria-hidden="true" /></a> : null}
          </div>
        </div>
      </details>;
    })}
  </div>;
}

/** CMS catalog only: published winter hours are not a live operating status. */
export default function InfrastructureTables({ lifts = [], trails = [] }) {
  const t = useTranslations("Infrastructure");
  const pageT = useTranslations("ResortPage");
  const [catalog, setCatalog] = useState("lifts");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const difficultyCounts = useMemo(() => Object.fromEntries(DIFFICULTIES.map((level) => [level, trails.filter((row) => row.difficulty === level).length])), [trails]);
  const visibleRows = useMemo(() => {
    const rows = catalog === "lifts" ? lifts : trails;
    return rows.filter((row) => {
      if (catalog === "trails" && difficulty !== "all" && row.difficulty !== difficulty) return false;
      if (!normalizedQuery) return true;
      return Object.entries(row).some(([key, value]) => !DESTINATION_FIELDS.includes(key) && clean(value).toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [catalog, difficulty, lifts, normalizedQuery, trails]);

  return <div className="rp-infrastructure-tables">
    <div className="rp-infra-catalog-head">
      <div><span className="rp-kicker">{t("catalogEyebrow")}</span><h3>{t("catalogTitle")}</h3><p className="rp-infra-note">{t("referenceNote")}</p></div>
      <div className="rp-infra-tabs" role="tablist" aria-label={t("catalogTitle")}>
        <button type="button" role="tab" aria-selected={catalog === "lifts"} className={catalog === "lifts" ? "is-active" : ""} onClick={() => setCatalog("lifts")}><CableCar aria-hidden="true" /><span>{pageT("lifts")}</span><strong>{lifts.length}</strong></button>
        <button type="button" role="tab" aria-selected={catalog === "trails"} className={catalog === "trails" ? "is-active" : ""} onClick={() => setCatalog("trails")}><Route aria-hidden="true" /><span>{pageT("trails")}</span><strong>{trails.length}</strong></button>
      </div>
    </div>

    <div className="rp-infra-toolbar">
      <label className="rp-infra-search"><Search aria-hidden="true" /><span className="sr-only">{t("searchLabel")}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={catalog === "lifts" ? t("searchLifts") : t("searchTrails")} /></label>
      <output aria-live="polite">{t("results", { count: visibleRows.length })}</output>
    </div>

    {catalog === "trails" ? <div className="rp-difficulty-filters" aria-label={t("filterDifficulty")}>
      <button type="button" className={`rp-filter-all${difficulty === "all" ? " is-active" : ""}`} aria-pressed={difficulty === "all"} onClick={() => setDifficulty("all")}><MountainSnow aria-hidden="true" />{t("allDifficulties")}<small>{trails.length}</small></button>
      {DIFFICULTIES.filter((level) => difficultyCounts[level] > 0).map((level) => <DifficultyPill key={level} as="button" level={level} label={difficultyLabel(level, t, pageT)} count={difficultyCounts[level]} active={difficulty === level} onClick={() => setDifficulty(level)} />)}
    </div> : null}

    {visibleRows.length ? (catalog === "lifts" ? <LiftAccordion rows={visibleRows} t={t} pageT={pageT} /> : <TrailAccordion rows={visibleRows} t={t} pageT={pageT} />) : <div className="rp-infra-empty"><Snowflake aria-hidden="true" /><h4>{t("noResults")}</h4><p>{t("tryAnotherSearch")}</p></div>}
  </div>;
}
