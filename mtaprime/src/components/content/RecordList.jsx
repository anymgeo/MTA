"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { filterRecords } from "@/models/portal";
import { DateTime, EmptyState, PdfFiles } from "./ContentUI";
export default function RecordList({
  items,
  basePath,
  filters = ["area", "category", "date"],
  alerts = false,
}) {
  const t = useTranslations("Portal"),
    [selected, setSelected] = useState({});
  const filtered = filterRecords(items, selected);
  return (
    <>
      {filters.length > 0 && <div className="mb-8 flex flex-wrap items-end gap-4 rounded-2xl bg-canvas p-5">
        {filters.map((key) => (
          <label key={key} className="min-w-40 flex-1 text-sm font-semibold">
            {t(key)}
            {key === "date" ? (
              <input
                type="date"
                value={selected[key] || ""}
                onChange={(e) =>
                  setSelected({ ...selected, [key]: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-border p-3"
              />
            ) : (
              <select
                value={selected[key] || ""}
                onChange={(e) =>
                  setSelected({ ...selected, [key]: e.target.value })
                }
                className="mt-2 block w-full rounded-lg border border-border bg-canvas p-3"
              >
                <option value="">{t("all")}</option>
                {[
                  ...new Set(
                    items
                      .map((item) =>
                        key === "area"
                          ? item.areaId
                          : key === "year"
                            ? (item.publishedAt || item.startAt || "").slice(
                                0,
                                4,
                              )
                            : item[key],
                      )
                      .filter(Boolean),
                  ),
                ]
                  .sort()
                  .map((value) => (
                    <option key={value} value={value}>
                      {key === "area"
                        ? items.find((item) => item.areaId === value)?.area ||
                          value
                        : t.has(value)
                          ? t(value)
                          : value}
                    </option>
                  ))}
              </select>
            )}
          </label>
        ))}
        <button
          type="button"
          className="rounded-full border border-border px-5 py-3 text-sm"
          onClick={() => setSelected({})}
        >
          {t("reset")}
        </button>
      </div>
      }
      {!items.length ? (
        <EmptyState alerts={alerts} />
      ) : !filtered.length ? (
        <p role="status">{t("noResults")}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="news-card overflow-hidden rounded-3xl bg-canvas"
            >
              {item.image && (
                <img
                  src={item.image}
                  loading="lazy"
                  alt={item.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="p-6">
                <p className="text-sm text-muted">
                  {item.area}
                  {item.category &&
                    ` · ${t.has(item.category) ? t(item.category) : item.category}`}
                </p>
                <h2 className="mt-3 text-2xl font-black">{item.title}</h2>
                {item.position && (
                  <p className="mt-2 font-semibold">{item.position}</p>
                )}
                {item.status && (
                  <p className="mt-3 text-sm font-bold">
                    {t.has(item.status) ? t(item.status) : item.status}
                  </p>
                )}
                {item.startAt && (
                  <p className="mt-3 text-sm">
                    <DateTime value={item.startAt} />
                    {item.endAt && (
                      <>
                        {" "}
                        — <DateTime value={item.endAt} />
                      </>
                    )}
                  </p>
                )}
                {item.publishedAt && (
                  <p className="mt-2 text-sm">
                    <DateTime value={item.publishedAt} />
                  </p>
                )}
                {item.type && (
                  <p className="mt-2 text-sm">
                    {t.has(item.type) ? t(item.type) : item.type}
                  </p>
                )}
                {item.updatedAt && (
                  <p className="mt-2 text-xs text-muted">
                    {t("updated")}: <DateTime value={item.updatedAt} />
                  </p>
                )}
                <p className="mt-4 leading-7 text-muted">{item.description}</p>
                {basePath && (
                  <Link
                    href={`${basePath}/${item.slug}`}
                    className="mt-5 inline-block font-bold underline"
                  >
                    {t("read")}
                  </Link>
                )}
                {!basePath && <PdfFiles files={item.files} />}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
