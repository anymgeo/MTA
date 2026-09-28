import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  DateTime,
  EmergencyBlock,
  EmptyState,
  PdfFiles,
} from "@/components/content/ContentUI";
export default function ResortOperationalPanel({ resort, context }) {
  const t = useTranslations("Portal");
  if (!context) return null;
  const op = context.operations;
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <h2 className="text-3xl font-black">{t("officialStatus")}</h2>
      <p className="mt-4 rounded-xl border border-border bg-canvas p-5">
        {op?.description || t("sample")}
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt>{t("status")}</dt>
          <dd>
            {op?.status
              ? t.has(op.status)
                ? t(op.status)
                : op.status
              : t("unknown")}
          </dd>
        </div>
        <div>
          <dt>{t("hours")}</dt>
          <dd>{op?.hours || resort.hours}</dd>
        </div>
        <div>
          <dt>{t("updated")}</dt>
          <dd>
            <DateTime value={op?.updatedAt} />
          </dd>
        </div>
      </dl>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {["lifts", "trails"].map((kind) => (
          <section key={kind} className="rounded-2xl bg-canvas p-6">
            <h3 className="text-2xl font-black">{t(kind)}</h3>
            {op?.[kind]?.length ? (
              <ul className="mt-5 divide-y divide-border">
                {op[kind].map((item) => (
                  <li key={item.id} className="py-4">
                    <b>{item.name}</b>
                    <p>{t.has(item.status) ? t(item.status) : item.status}</p>
                    <p>{item.hours || item.difficulty}</p>
                    <dl>
                      {item.specs?.map((spec) => (
                        <div key={spec.label}>
                          <dt>{spec.label}</dt>
                          <dd>{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">{t("unavailable")}</p>
            )}
          </section>
        ))}
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl bg-canvas p-6">
          <h3 className="text-xl font-black">{t("weather")}</h3>
          {op?.weather?.length ? (
            <dl className="mt-4">
              {op.weather.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4">{t("unavailable")}</p>
          )}
        </section>
        <section className="rounded-2xl bg-canvas p-6">
          <h3 className="text-xl font-black">{t("pricing")}</h3>
          {op?.prices?.length ? (
            <ul>
              {op.prices.map((item) => (
                <li key={item.label}>
                  {item.label}: {item.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4">{t("notPublished")}</p>
          )}
          <a
            href={op?.purchaseUrl || "https://status.mta.ski/en"}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block underline"
          >
            {t(op?.purchaseUrl ? "buy" : "officialStatus")}
          </a>
        </section>
      </div>
      <div className="my-8 flex flex-wrap gap-5">
        <Link href={`/resorts/${resort.slug}/maps`} className="underline">
          {t("map")}
        </Link>
        <Link href={`/webcams?area=${resort.slug}`} className="underline">
          {t("titles.webcams")}
        </Link>
        <Link href="/safety/code-of-conduct" className="underline">
          {t("titles.code-of-conduct")}
        </Link>
      </div>
      <PdfFiles files={op?.files} />
      <h3 className="mb-5 text-2xl font-black">{t("titles.closures")}</h3>
      {context.closures.length ? (
        <ul className="mb-8 space-y-3">
          {context.closures.map((item) => (
            <li key={item.id}>
              <Link
                href={`/safety/closures/${item.slug}`}
                className="underline"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState alerts />
      )}
      <h3 className="mb-5 mt-10 text-2xl font-black">{t("titles.events")}</h3>
      {context.events.length ? (
        <ul>
          {context.events.map((item) => (
            <li key={item.id}>
              <Link href={`/events/${item.slug}`} className="underline">
                {item.title}
              </Link>
              {item.changes?.map((change) => (
                <p key={change.title}>
                  {change.title}: {change.text}
                </p>
              ))}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
      <div className="mt-10">
        <EmergencyBlock contacts={context.contacts} />
      </div>
    </section>
  );
}
