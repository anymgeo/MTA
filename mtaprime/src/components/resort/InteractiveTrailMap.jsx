"use client";
import { useEffect, useLayoutEffect, useRef, useState, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  Plus,
  Minus,
  RotateCcw,
  X,
  Maximize,
  Minimize,
  Route,
  CableCar,
  TriangleAlert,
  MapPin,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSiteSeason } from "@/providers/SeasonProvider";
import { clampView, zoomView } from "@/models/map-records";
const icons = { trail: Route, lift: CableCar, warning: TriangleAlert };
export default function InteractiveTrailMap({ map, resortName }) {
  const t = useTranslations("TrailMap"),
    common = useTranslations("Portal"),
    { season } = useSiteSeason(),
    id = useId();
  const [layers, setLayers] = useState({
      trail: true,
      lift: true,
      warning: true,
      poi: true,
      label: true,
      zone: true,
    }),
    [selected, setSelected] = useState(null),
    [area, setArea] = useState("all"),
    [expanded, setExpanded] = useState(false),
    [view, setView] = useState({ x: 0, y: 0, z: 1 }),
    [size, setSize] = useState({ width: 1, height: 1 });
  const viewport = useRef(null),
    popup = useRef(null),
    close = useRef(null),
    opener = useRef(null),
    viewRef = useRef(view),
    sizeRef = useRef(size),
    pointers = useRef(new Map()),
    moved = useRef(false),
    root = useRef(null),
    fullscreenButton = useRef(null),
    wasExpanded = useRef(false),
    popupAnchor = useRef(null);
  const records = map.records || [],
    visible = records.filter(
      (r) => layers[r.kind] && (area === "all" || r.areaId === area),
    ),
    pins = visible.filter((r) => r.position),
    scale = Math.min(size.width / map.width, size.height / map.height) * view.z;
  const apply = (value) => {
    setSelected(null);
    viewRef.current = value;
    setView(value);
  };
  const dismiss = () => {
    setSelected(null);
    opener.current?.focus();
  };
  const choose = (record, target) => {
    const box = viewport.current.getBoundingClientRect();
    const anchor = record.position
      ? {
          x: box.left + viewRef.current.x + record.position.x * scale,
          y: box.top + viewRef.current.y + record.position.y * scale,
        }
      : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    if (
      anchor.x < Math.max(0, box.left) ||
      anchor.x > Math.min(innerWidth, box.right) ||
      anchor.y < Math.max(0, box.top) ||
      anchor.y > Math.min(innerHeight, box.bottom)
    )
      return;
    popupAnchor.current = anchor;
    opener.current = target;
    setSelected(record);
  };
  useEffect(() => {
    const el = viewport.current,
      activePointers = pointers.current;
    const observer = new ResizeObserver(() => {
      const size = { width: el.clientWidth, height: el.clientHeight };
      sizeRef.current = size;
      setSize(size);
      const next = clampView(viewRef.current, size, map);
      viewRef.current = next;
      setView(next);
    });
    observer.observe(el);
    const wheel = (e) => {
      if (e.target.closest("button")) return;
      e.preventDefault();
      setSelected(null);
      const box = el.getBoundingClientRect(),
        factor = Math.exp(
          -Math.max(
            -100,
            Math.min(100, e.deltaY * (e.deltaMode === 1 ? 16 : 1)),
          ) * 0.003,
        );
      const next = zoomView(
        viewRef.current,
        factor,
        { x: e.clientX - box.left, y: e.clientY - box.top },
        sizeRef.current,
        map,
      );
      viewRef.current = next;
      setView(next);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      observer.disconnect();
      el.removeEventListener("wheel", wheel);
      activePointers.clear();
    };
  }, [expanded, map]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "Tab" && expanded) {
        const scope = selected ? popup.current : root.current;
        const focusable = [
          ...(scope?.querySelectorAll(
            'button:not(:disabled),a[href],summary,[tabindex="0"]',
          ) || []),
        ].filter((el) => el.getClientRects().length);
        const first = focusable[0],
          last = focusable.at(-1);
        if (
          first &&
          ((e.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === scope)) ||
            (!e.shiftKey && document.activeElement === last))
        ) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
      if (e.key === "Escape") {
        if (selected) {
          e.preventDefault();
          setSelected(null);
          opener.current?.focus();
        } else if (expanded) {
          e.preventDefault();
          setExpanded(false);
        }
      }
    };
    const outside = (e) => {
      if (
        selected &&
        !popup.current?.contains(e.target) &&
        !e.target.closest("[data-feature]")
      )
        setSelected(null);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [selected, expanded]);
  useEffect(() => {
    if (selected) close.current?.focus({ preventScroll: true });
  }, [selected]);
  useEffect(() => {
    if (!expanded) {
      if (wasExpanded.current) fullscreenButton.current?.focus();
      wasExpanded.current = false;
      return;
    }
    wasExpanded.current = true;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    return () => {
      document.body.style.overflow = old;
    };
  }, [expanded]);
  // The portal remains outside the clipped map, but its bounds and anchor come from the map.
  useLayoutEffect(() => {
    if (!selected || !popup.current || !popupAnchor.current) return;
    const panel = popup.current;
    const place = () => {
      const mapBox = viewport.current.getBoundingClientRect(),
        anchor = popupAnchor.current;
      const left = Math.max(8, mapBox.left + 8),
        right = Math.min(innerWidth - 8, mapBox.right - 8);
      const top = Math.max(8, mapBox.top + 8),
        bottom = Math.min(innerHeight - 8, mapBox.bottom - 8);
      panel.style.width = Math.max(1, Math.min(360, right - left)) + "px";
      panel.style.maxHeight = Math.max(1, bottom - top) + "px";
      const { width, height } = panel.getBoundingClientRect();
      let x = anchor.x + 30,
        y = anchor.y - height / 2;
      if (x + width > right) x = anchor.x - width - 30;
      if (x < left) {
        x = anchor.x - width / 2;
        y = anchor.y + 30;
        if (y + height > bottom) y = anchor.y - height - 30;
      }
      panel.style.left = Math.max(left, Math.min(right - width, x)) + "px";
      panel.style.top = Math.max(top, Math.min(bottom - height, y)) + "px";
      panel.style.visibility = "visible";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    const invalidate = (event) => {
      if (!panel.contains(event.target)) setSelected(null);
    };
    window.addEventListener("scroll", invalidate, true);
    window.addEventListener("resize", invalidate);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", invalidate, true);
      window.removeEventListener("resize", invalidate);
    };
  }, [selected]);
  const point = (e) => {
    const box = viewport.current.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  };
  const down = (e) => {
    if (e.target.closest("button") || e.button > 0) return;
    setSelected(null);
    const p = point(e);
    pointers.current.set(e.pointerId, p);
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const before = [...pointers.current.values()],
      previous = pointers.current.get(e.pointerId),
      next = point(e);
    pointers.current.set(e.pointerId, next);
    const after = [...pointers.current.values()];
    if (Math.hypot(next.x - previous.x, next.y - previous.y) > 1)
      moved.current = true;
    let value = viewRef.current;
    if (after.length >= 2) {
      const center = (a) => ({
          x: (a[0].x + a[1].x) / 2,
          y: (a[0].y + a[1].y) / 2,
        }),
        distance = (a) => Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y),
        a = center(before),
        b = center(after);
      value = zoomView(
        value,
        distance(after) / Math.max(1, distance(before)),
        a,
        sizeRef.current,
        map,
      );
      value = clampView(
        { ...value, x: value.x + b.x - a.x, y: value.y + b.y - a.y },
        sizeRef.current,
        map,
      );
    } else
      value = clampView(
        {
          ...value,
          x: value.x + next.x - previous.x,
          y: value.y + next.y - previous.y,
        },
        sizeRef.current,
        map,
      );
    apply(value);
  };
  const up = (e) => {
    pointers.current.delete(e.pointerId);
  };
  const zoom = (factor) =>
    apply(
      zoomView(
        viewRef.current,
        factor,
        { x: size.width / 2, y: size.height / 2 },
        size,
        map,
      ),
    );
  const reset = () => {
    apply(clampView({ x: 0, y: 0, z: 1 }, size, map));
    setSelected(null);
  };
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
        onClick={() => {
          setSelected(null);
          setExpanded((v) => !v);
        }}
        ref={fullscreenButton}
        aria-label={t(expanded ? "exitFullscreen" : "fullscreen")}
      >
        {expanded ? <Minimize /> : <Maximize />}
      </button>
    </div>
  );
  const content = (
    <section
      ref={root}
      tabIndex={-1}
      role={expanded ? "dialog" : undefined}
      aria-label={resortName}
      aria-modal={(expanded && !selected) || undefined}
      className={"unified-map " + (expanded ? "unified-map-expanded" : "")}
    >
      {map.demo && (
        <p className="unified-map-demo" role="note">
          {t("demo")}
        </p>
      )}
      <div className="unified-map-heading">
        <div>
          <b>{resortName}</b>
          <p>{t("gesture")}</p>
        </div>
        <output aria-live="off">{Math.round(view.z * 100)}%</output>
      </div>
      {map.areas?.length > 1 && (
        <div className="unified-map-layers" role="group" aria-label={t("area")}>
          {[{ id: "all", name: t("allAreas") }, ...map.areas].map((a) => (
            <button
              key={a.id}
              aria-pressed={area === a.id}
              onClick={() => {
                setArea(a.id);
                setSelected(null);
              }}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}
      <div className="unified-map-layers" role="group" aria-label={t("layers")}>
        {["trail", "lift", "warning"].map((kind) => {
          const Icon = icons[kind];
          return (
            <button
              key={kind}
              aria-pressed={layers[kind]}
              onClick={() => {
                setLayers((v) => ({ ...v, [kind]: !v[kind] }));
                if (selected?.kind === kind) setSelected(null);
              }}
            >
              <Icon size={18} />
              {t(kind)}
            </button>
          );
        })}
      </div>
      <div
        className="unified-map-stage"
        ref={viewport}
        tabIndex={0}
        aria-label={t("viewport")}
        role="region"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClick={(e) => {
          if (!moved.current && !e.target.closest("button")) setSelected(null);
        }}
        onKeyDown={(e) => {
          const delta = {
            ArrowLeft: [50, 0],
            ArrowRight: [-50, 0],
            ArrowUp: [0, 50],
            ArrowDown: [0, -50],
          }[e.key];
          if (e.target !== e.currentTarget) return;
          if (delta) {
            e.preventDefault();
            apply(
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
          if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            zoom(1.35);
          }
          if (e.key === "-") {
            e.preventDefault();
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
          <g
            transform={
              "translate(" + view.x + " " + view.y + ") scale(" + scale + ")"
            }
          >
            <image href={map.image} width={map.width} height={map.height} />
            {pins
              .filter((r) => r.points?.length > 1)
              .map((r) => (
                <polyline
                  data-route={r.id}
                  data-kind={r.kind}
                  key={r.id}
                  points={r.points.map((p) => p.join(",")).join(" ")}
                  className={
                    "trail-line unified-map-route route-" +
                    r.kind +
                    " difficulty-" +
                    (r.difficulty || "black")
                  }
                />
              ))}
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
              className={"unified-map-pin pin-" + record.kind}
              style={{
                left: view.x + record.position.x * scale,
                top: view.y + record.position.y * scale,
              }}
              aria-label={record.name}
              aria-pressed={selected?.id === record.id}
              onClick={(e) => choose(record, e.currentTarget)}
            >
              <Icon size={19} />
              <span className="unified-map-tooltip">{record.name}</span>
            </button>
          );
        })}
        {controls}
      </div>
      <div className="unified-map-notes">
        <p>
          {map.demo
            ? t("baseNote")
            : map.verified
              ? t("hint")
              : t("unverifiedBase")}
        </p>
        {!records.some((r) => r.kind === "warning") && <p>{t("noWarnings")}</p>}
      </div>
      <details className="unified-map-records">
        <summary>
          {t("records")} ({visible.length})
        </summary>
        <p>{t("unmapped")}</p>
        <ul>
          {visible.map((r) => (
            <li key={r.id}>
              <button
                data-feature={r.id}
                onClick={(e) => choose(r, e.currentTarget)}
              >
                <span>{r.name}</span>
                <small>
                  {t(r.kind in icons ? r.kind : "poi")}
                  {!r.position ? " · " + t("unpositioned") : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
  const popupView =
    selected &&
    createPortal(
      <div
        className="season-atmosphere unified-map-portal"
        data-season={season}
      >
        <aside
          ref={popup}
          role="dialog"
          aria-modal={expanded || undefined}
          aria-labelledby={id}
          className="unified-map-popup"
        >
          <button
            ref={close}
            className="unified-map-close"
            aria-label={t("close")}
            onClick={dismiss}
          >
            <X size={20} />
          </button>
          <p className="brand-eyebrow">
            {t(selected.kind in icons ? selected.kind : "poi")}
          </p>
          <h3 id={id}>{selected.name}</h3>
          {selected.demo ? (
            <p className="unified-map-demo">{t("demoRecord")}</p>
          ) : (
            selected.catalog && <p>{t("catalog")}</p>
          )}
          <p>{selected.description}</p>
          <dl>
            {[
              ["status", selected.status],
              ...(selected.kind === "trail"
                ? [["difficulty", selected.difficulty]]
                : []),
              ...(selected.kind === "lift" ? [["hours", selected.hours]] : []),
              ...(selected.type ? [["type", selected.type]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{t(label)}</dt>
                <dd>
                  {value
                    ? t.has(value)
                      ? t(value)
                      : common.has(value)
                        ? common(value)
                        : value
                    : t("unknown")}
                </dd>
              </div>
            ))}
          </dl>
          {!selected.position && <p>{t("unpositioned")}</p>}
          {selected.href && (
            <Link href={selected.href} className="underline">
              {t("details")} ↗
            </Link>
          )}
        </aside>
      </div>,
      document.body,
    );
  return (
    <>
      {expanded
        ? createPortal(
            <div
              className="season-atmosphere unified-map-fullscreen"
              data-season={season}
            >
              {content}
            </div>,
            document.body,
          )
        : content}
      {popupView}
    </>
  );
}
