"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  CableCar,
  CheckCircle2,
  Layers3,
  MapPin,
  Maximize,
  Minimize,
  Minus,
  Plus,
  RotateCcw,
  Route,
  Search,
  TriangleAlert,
} from "lucide-react";
import ResortIcon from "@/components/brand/ResortIcon";
import { managedMapView } from "@/models/managed-map-view";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { clampView, zoomView } from "@/models/map-records";
import { useSiteSeason } from "@/providers/SeasonProvider";
import {visibleTiles,liftTickPath,LIFT_STYLE,liftStyleForMap,cutLabelLayout} from '../../../../shared/map-geometry.mjs';

const icons = { trail: Route, lift: CableCar, warning: TriangleAlert };

export default function InteractiveTrailMap(props) {
  return props.map.managed ? <ManagedInteractiveTrailMap {...props} /> : <LegacyInteractiveTrailMap {...props} />;
}

function ManagedInteractiveTrailMap({ map: initial, ...props }) {
  const locale = useLocale();
  const [map, setMap] = useState(initial);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    async function refresh() {
      if (document.hidden) return;
      try {
        const response = await fetch(`/api/resort-map?slug=${encodeURIComponent(initial.id)}&locale=${locale}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const next = await response.json();
        if (alive && next.managed && Array.isArray(next.features) && next.width > 0 && next.height > 0)
          setMap({ ...next, catalogRecords: initial.catalogRecords });
      } catch { /* Keep the last saved map visible while the connection recovers. */ }
    }
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { alive = false; controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [initial.id, initial.catalogRecords, locale]);
  return <LegacyInteractiveTrailMap {...props} map={managedMapView(map)} />;
}

function LegacyInteractiveTrailMap({ map, resortName, resortSlug }) {
  const cutPrefix=useId().replaceAll(':','');
  const t = useTranslations("TrailMap");
  const common = useTranslations("Portal");
  const { season } = useSiteSeason();
  const brandSlug = resortSlug || map.id;
  const [layers, setLayers] = useState({
    trail: true,
    lift: true,
    warning: true,
    poi: true,
    label: true,
    zone: true,
  });
  const [selectedId, setSelectedId] = useState(null);
  const [area, setArea] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [size, setSize] = useState({ width: 1, height: 1 });
  const viewport = useRef(null);
  const root = useRef(null);
  const fullscreenButton = useRef(null);
  const wasExpanded = useRef(false);
  const viewRef = useRef(view);
  const sizeRef = useRef(size);
  const pointers = useRef(new Map());
  const moved = useRef(false);

  const records = map.records || [];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const inArea = records.filter(
    (record) => area === "all" || record.areaId === area,
  );
  const visible = inArea.filter((record) => {
    if (!layers[record.kind]) return false;
    if (!normalizedQuery) return true;
    return [record.name, record.description, record.type]
      .filter(Boolean)
      .some((value) =>
        String(value).toLocaleLowerCase().includes(normalizedQuery),
      );
  });
  const pins = visible.filter((record) => record.position);
  const selected =
    visible.find((record) => record.id === selectedId) || pins[0] || null;
  const lifts = inArea.filter((record) => record.kind === "lift");
  const trails = inArea.filter((record) => record.kind === "trail");
  const warnings = inArea.filter((record) => record.kind === "warning");
  const openCount = (items) =>
    items.filter((item) => ["open", "limited"].includes(item.status)).length;
  const scale =
    Math.min(size.width / map.width, size.height / map.height) * view.z;

  const translateValue = (value) => {
    if (!value) return t("unknown");
    if (t.has(value)) return t(value);
    if (common.has(value)) return common(value);
    return value;
  };

  const applyView = (value) => {
    viewRef.current = value;
    setView(value);
  };

  useEffect(() => {
    const element = viewport.current;
    const activePointers = pointers.current;
    const observer = new ResizeObserver(() => {
      const nextSize = {
        width: element.clientWidth,
        height: element.clientHeight,
      };
      sizeRef.current = nextSize;
      setSize(nextSize);
      const nextView = clampView(viewRef.current, nextSize, map);
      applyView(nextView);
    });
    observer.observe(element);

    // Let wheel/trackpad scrolling continue through the page. Zoom remains
    // available through explicit controls, keyboard shortcuts and pinch.
    return () => {
      observer.disconnect();
      activePointers.clear();
    };
  }, [expanded, map]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Tab" && expanded) {
        const focusable = [
          ...(root.current?.querySelectorAll(
            'button:not(:disabled),a[href],input,summary,[tabindex="0"]',
          ) || []),
        ].filter((element) => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (
          first &&
          ((event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === root.current)) ||
            (!event.shiftKey && document.activeElement === last))
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
      if (event.key === "Escape" && expanded) {
        event.preventDefault();
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) {
      if (wasExpanded.current) fullscreenButton.current?.focus();
      wasExpanded.current = false;
      return;
    }
    wasExpanded.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const localPoint = (event) => {
    const box = viewport.current.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  const handlePointerDown = (event) => {
    if (event.target.closest("button, input, a, summary") || event.button > 0)
      return;
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return;
    const before = [...pointers.current.values()];
    const previous = pointers.current.get(event.pointerId);
    const next = localPoint(event);
    pointers.current.set(event.pointerId, next);
    const after = [...pointers.current.values()];
    if (Math.hypot(next.x - previous.x, next.y - previous.y) > 1)
      moved.current = true;

    let nextView = viewRef.current;
    if (after.length >= 2) {
      const center = (points) => ({
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      });
      const distance = (points) =>
        Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const previousCenter = center(before);
      const nextCenter = center(after);
      nextView = zoomView(
        nextView,
        distance(after) / Math.max(1, distance(before)),
        previousCenter,
        sizeRef.current,
        map,
      );
      nextView = clampView(
        {
          ...nextView,
          x: nextView.x + nextCenter.x - previousCenter.x,
          y: nextView.y + nextCenter.y - previousCenter.y,
        },
        sizeRef.current,
        map,
      );
    } else {
      nextView = clampView(
        {
          ...nextView,
          x: nextView.x + next.x - previous.x,
          y: nextView.y + next.y - previous.y,
        },
        sizeRef.current,
        map,
      );
    }
    applyView(nextView);
  };

  const handlePointerUp = (event) => {
    pointers.current.delete(event.pointerId);
  };

  const zoom = (factor) =>
    applyView(
      zoomView(
        viewRef.current,
        factor,
        { x: size.width / 2, y: size.height / 2 },
        size,
        map,
      ),
    );

  const reset = () => applyView(clampView({ x: 0, y: 0, z: 1 }, size, map));

  const controls = (
    <div className="unified-map-controls">
      <button
        onClick={() => zoom(1.35)}
        disabled={view.z >= 8}
        aria-label={t("zoomIn")}
      >
        <Plus />
      </button>
      <button
        onClick={() => zoom(1 / 1.35)}
        disabled={view.z <= 1}
        aria-label={t("zoomOut")}
      >
        <Minus />
      </button>
      <button onClick={reset} aria-label={t("reset")}>
        <RotateCcw />
      </button>
      <button
        onClick={() => setExpanded((value) => !value)}
        ref={fullscreenButton}
        aria-label={t(expanded ? "exitFullscreen" : "fullscreen")}
      >
        {expanded ? <Minimize /> : <Maximize />}
      </button>
    </div>
  );

  const details = selected && (
    <aside className="unified-map-feature-card" aria-live="polite">
      <div className="unified-map-feature-meta">
        <span>{t(selected.kind in icons ? selected.kind : "poi")}</span>
        <strong data-status={selected.status || "unknown"}>
          {translateValue(selected.status)}
        </strong>
      </div>
      <h3>{selected.name}</h3>
      {selected.demo && (
        <p className="unified-map-demo-record">{t("demoRecord")}</p>
      )}
      {selected.description && <p>{selected.description}</p>}
      <dl>
        {[
          ...(selected.kind === "trail"
            ? [["difficulty", selected.difficulty]]
            : []),
          ...(selected.kind === "lift" ? [["hours", selected.hours]] : []),
          ...(selected.type ? [["type", selected.type]] : []),
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd style={label==='difficulty'&&selected.routeColor?{color:selected.routeColor,fontWeight:800}:undefined}>{translateValue(value)}</dd>
          </div>
        ))}
      </dl>
      {selected.href && (
        <Link href={selected.href} className="unified-map-details-link">
          {t("details")} ↗
        </Link>
      )}
    </aside>
  );

  const content = (
    <section
      ref={root}
      tabIndex={-1}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded || undefined}
      aria-label={resortName}
      className={`unified-map${expanded ? " unified-map-expanded" : ""}`}
      data-resort={brandSlug}
    >
      {map.demo && (
        <p className="unified-map-demo" role="note">
          {t("demo")}
        </p>
      )}
      <div className="unified-map-dashboard">
        <aside className="unified-map-sidebar">
          <header className="unified-map-brand">
            <ResortIcon slug={brandSlug} className="h-12 w-12" />
            <div>
              <p>{t("liveTitle")}</p>
              <h2>{resortName}</h2>
            </div>
            <span
              className="unified-map-live-dot"
              aria-label={t("operationalStatus")}
            />
          </header>

          <div className="unified-map-stat-grid">
            <div>
              <CableCar />
              <span>{t("liftsOpen")}</span>
              <strong>
                {openCount(lifts)} / {lifts.length}
              </strong>
            </div>
            <div>
              <Route />
              <span>{t("trailsOpen")}</span>
              <strong>
                {openCount(trails)} / {trails.length}
              </strong>
            </div>
          </div>

          <label className="unified-map-search">
            <Search aria-hidden="true" />
            <span className="sr-only">{t("searchPlaceholder")}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              type="search"
            />
          </label>

          {map.areas?.length > 1 && (
            <div
              className="unified-map-areas"
              role="group"
              aria-label={t("area")}
            >
              {[{ id: "all", name: t("allAreas") }, ...map.areas].map(
                (mapArea) => (
                  <button
                    key={mapArea.id}
                    aria-pressed={area === mapArea.id}
                    onClick={() => {
                      setArea(mapArea.id);
                      setSelectedId(null);
                    }}
                  >
                    {mapArea.name}
                  </button>
                ),
              )}
            </div>
          )}

          <section className="unified-map-filter-section">
            <h3>
              <Layers3 /> {t("filters")}
            </h3>
            <div className="unified-map-layer-list">
              {["trail", "lift", "warning"].map((kind) => {
                const Icon = icons[kind];
                const count = inArea.filter(
                  (record) => record.kind === kind,
                ).length;
                return (
                  <button
                    key={kind}
                    aria-pressed={layers[kind]}
                    onClick={() => {
                      setLayers((value) => ({
                        ...value,
                        [kind]: !value[kind],
                      }));
                      if (selected?.kind === kind) setSelectedId(null);
                    }}
                  >
                    <span className={`unified-map-layer-icon layer-${kind}`}>
                      <Icon />
                    </span>
                    <span>
                      {t(kind)}
                      <small>{count}</small>
                    </span>
                    <i aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="unified-map-alerts">
            <h3>
              <TriangleAlert /> {t(warnings.some(warning => warning.reference) ? "referenceAlerts" : "liveAlerts")} <span>{warnings.length}</span>
            </h3>
            {warnings.length ? (
              warnings.slice(0, 2).map((warning) => (
                <button
                  key={warning.id}
                  onClick={() => setSelectedId(warning.id)}
                >
                  <TriangleAlert />
                  <span>
                    <strong>{warning.name}</strong>
                    <small>{warning.description}</small>
                  </span>
                </button>
              ))
            ) : (
              <p>{t("noWarnings")}</p>
            )}
          </section>

          <section className="unified-map-legend">
            <h3>{t("legend")}</h3>
            <div>
              <span className="legend-trail" />
              {t("trail")}
            </div>
            <div>
              <span className="legend-lift" />
              {t("lift")}
            </div>
            <div>
              <span className="legend-warning" />
              {t("warning")}
            </div>
          </section>
        </aside>

        <div className="unified-map-map-shell">
          <div className="unified-map-mapbar">
            <span>
              <CheckCircle2 />
              {map.demo
                ? t("demoShort")
                : map.verified
                  ? t("official")
                  : t("statusPending")}
            </span>
            <span>
              <CableCar /> {openCount(lifts)}/{lifts.length}
            </span>
            <span>
              <Route /> {openCount(trails)}/{trails.length}
            </span>
            <output>{Math.round(view.z * 100)}%</output>
          </div>
          <div
            className="unified-map-stage"
            ref={viewport}
            tabIndex={0}
            aria-label={t("viewport")}
            role="region"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={(event) => {
              const delta = {
                ArrowLeft: [50, 0],
                ArrowRight: [-50, 0],
                ArrowUp: [0, 50],
                ArrowDown: [0, -50],
              }[event.key];
              if (event.target !== event.currentTarget) return;
              if (delta) {
                event.preventDefault();
                applyView(
                  clampView(
                    {
                      ...viewRef.current,
                      x: view.x + delta[0],
                      y: view.y + delta[1],
                    },
                    size,
                    map,
                  ),
                );
              }
              if (event.key === "+" || event.key === "=") {
                event.preventDefault();
                zoom(1.35);
              }
              if (event.key === "-") {
                event.preventDefault();
                zoom(1 / 1.35);
              }
            }}
          >
            <svg
              className="unified-map-terrain"
              width={size.width}
              height={size.height}
              aria-hidden="true"
            >
              <g transform={`translate(${view.x} ${view.y}) scale(${scale})`}>
                <image href={map.tiles?.previewUrl||map.image} width={map.width} height={map.height} preserveAspectRatio="none"/>
                {map.tiles&&visibleTiles(map.tiles,scale,view.x,view.y,size.width,size.height).map(tile=><image key={tile.key} href={tile.url} x={tile.x} y={tile.y} width={tile.width} height={tile.height} preserveAspectRatio="none"/>)}
                {pins
                  .filter((record) => record.points?.length > 1)
                  .map((record) => {const cut=cutLabelLayout(record.points,record.label,map,scale,record.label?.text||''),maskId=`${cutPrefix}-cut-${record.id}`;return (
                    <g key={record.id}>
                    {cut&&<defs><mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={map.width} height={map.height}><rect width={map.width} height={map.height} fill="white"/><rect data-line-cut={record.id} x={cut.x-cut.width/2} y={cut.y-cut.height/2} width={cut.width} height={cut.height} fill="black" transform={`rotate(${cut.angle} ${cut.x} ${cut.y})`}/></mask></defs>}
                    <path
                      mask={cut?`url(#${maskId})`:undefined}
                      data-route={record.id}
                      data-kind={record.kind}
                      key={record.id}
                      d={record.path || `M ${record.points.map(point => point.join(",")).join(" L ")}`}
                      fill={record.closedGeometry ? `${record.color || "#d73b32"}33` : "none"}
                      data-render-style={record.kind==='lift'?'lift-ticked':undefined}
                      style={record.kind==='lift'?{stroke:record.routeColor||'#171717',strokeWidth:LIFT_STYLE.strokeWidth,strokeDasharray:'none'}:record.sourceKind ? { stroke:record.routeColor, strokeWidth:record.reference ? 2 : undefined, strokeDasharray:record.dashed ? "5 4" : record.reference ? "none" : undefined } : undefined}
                      className={`trail-line unified-map-route route-${record.kind} difficulty-${record.difficulty || "black"}`}
                    />
                    {record.kind==='lift'&&<LiftCuts record={record} width={map.width} height={map.height} mask={cut?`url(#${maskId})`:undefined} />}
                    </g>
                  );})}
                {visible.filter(record=>record.label).map(record=>{const cut=cutLabelLayout(record.points,record.label,map,scale,record.label.text||'');return <text key={'label-'+record.id} data-map-label={record.id} data-cut-label={cut?record.id:undefined} x={cut?.x??record.label.x} y={cut?.y??record.label.y} transform={cut?`rotate(${cut.angle} ${cut.x} ${cut.y})`:undefined} textAnchor={cut?'middle':undefined} dominantBaseline={cut?'central':undefined} fontSize={cut?.fontSize??15/scale} fontWeight="700" fill={record.routeColor||record.color} stroke="white" strokeWidth={(cut?2:4)/scale} paintOrder="stroke" strokeLinejoin="round">{record.label.text}</text>;})}
              </g>
            </svg>

            {pins.map((record) => {
              const Icon = icons[record.kind] || MapPin;
              return (
                <button
                  key={record.id}
                  data-feature={record.id}
                  data-kind={record.kind}
                  data-area={record.areaId}
                  data-status={record.status || "unknown"}
                  className={`unified-map-pin pin-${record.kind}${record.reference ? " pin-reference" : ""}`}
                  style={{
                    left: view.x + record.position.x * scale,
                    top: view.y + record.position.y * scale,
                    ...(record.sourceKind && record.kind !== "label" ? { background:record.routeColor || record.color || "#fff", color:["official-hazard","parking","snowpark"].includes(record.sourceKind) ? "#17231f" : "#fff" } : {}),
                  }}
                  aria-label={record.name}
                  aria-pressed={selected?.id === record.id}
                  onClick={() => setSelectedId(record.id)}
                >
                  {record.kind === "label" ? <span className="unified-map-reference-label">{record.name}</span> : <Icon />}
                  <span className="unified-map-tooltip">{record.name}</span>
                </button>
              );
            })}
            {controls}
            {details}
            <p className="unified-map-map-hint">{t("mapHint")}</p>
          </div>
        </div>
      </div>

      <div className="unified-map-notes">
        <p>
          {map.demo
            ? t("baseNote")
            : map.verified
              ? t("hint")
              : t("unverifiedBase")}
        </p>
        {!warnings.length && <p>{t("noWarnings")}</p>}
      </div>
      <details className="unified-map-records">
        <summary>
          {t("records")} ({visible.length})
        </summary>
        <p>{t("unmapped")}</p>
        <ul>
          {visible.map((record) => (
            <li key={record.id}>
              <button onClick={() => setSelectedId(record.id)} style={record.routeColor?{borderLeft:`3px solid ${record.routeColor}`}:undefined}>
                <span>{record.name}</span>
                <small>
                  {t(record.kind in icons ? record.kind : "poi")}
                  {!record.position ? ` · ${t("unpositioned")}` : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );

  return expanded
    ? createPortal(
        <div
          className="season-atmosphere unified-map-fullscreen"
          data-season={season}
        >
          {content}
        </div>,
        document.body,
      )
    : content;
}

function LiftCuts({record,width,height,mask}) {
  const d=useMemo(()=>liftTickPath(record.points,liftStyleForMap({width,height})),[record.points,width,height]);
  return <path data-lift-ticks={record.id} mask={mask} d={d} fill="none" stroke={record.routeColor||'#171717'} strokeWidth={LIFT_STYLE.tickStrokeWidth} vectorEffect="non-scaling-stroke" pointerEvents="none"/>;
}
