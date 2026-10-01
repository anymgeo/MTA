import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { portalDateParts } from "@/lib/portal-date";
import RichText from './RichText';
export function ContentFrame({
  title,
  description,
  children,
  back = "/safety",
}) {
  const t = useTranslations("Portal");
  return (
    <main className="min-h-screen bg-surface text-ink">
      <section className="bg-ink px-6 pb-16 pt-36 text-canvas md:px-10">
        <div className="mx-auto max-w-7xl">
          <Link href={back} className="text-sm font-bold transition-opacity hover:opacity-60">
            {t("back")}
          </Link>
          <h1 className="editorial-page-title mt-8 max-w-5xl text-3xl font-black leading-tight sm:text-4xl md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-canvas/80">
              <RichText text={description}/>
            </p>
          )}
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10">{children}</div>
    </main>
  );
}
export function EmptyState({ alerts = false }) {
  const t = useTranslations("Portal");
  return (
    <p
      role="status"
      className="rounded-2xl border border-border bg-canvas p-7 leading-7"
    >
      {t(alerts ? "alertsUnavailable" : "unavailable")}
    </p>
  );
}
export function DateTime({ value }) {
  const t = useTranslations("Portal"), dates = useTranslations("PortalDate");
  const parts = value ? portalDateParts(value) : null;
  return parts ? (
    <time dateTime={value}>
      {`${parts.day} ${dates("months." + Number(parts.month))} ${parts.year}${parts.hour ? `, ${parts.hour}:${parts.minute}` : ""}`}
    </time>
  ) : (
    <span>{t("notPublished")}</span>
  );
}
export function PdfFiles({ files = [] }) {
  const t = useTranslations("Portal");
  return (
    files.length > 0 && (
      <section className="mt-10">
        <h2 className="text-2xl font-black">{t("files")}</h2>
        <ul className="mt-5 space-y-3">
          {files.map((file) => (
            <li
              key={file.url}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-canvas p-5"
            >
              <span>{file.name}</span>
              <span className="flex gap-5">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold transition-opacity hover:opacity-60"
                >
                  {t("view")}
                </a>
                <a
                  href={`/api/documents/download?url=${encodeURIComponent(file.url)}`}
                  className="font-bold transition-opacity hover:opacity-60"
                >
                  {t("download")}
                </a>
              </span>
            </li>
          ))}
        </ul>
      </section>
    )
  );
}
export function EmergencyBlock({ contacts = [] }) {
  const t = useTranslations("Portal");
  return (
    <aside className="sticky top-28 z-20 mb-8 rounded-2xl border-l-4 border-brand-red bg-canvas p-5 shadow-lg">
      <h2 className="text-xl font-black">{t("emergency")}</h2>
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="mt-3 flex flex-wrap items-center justify-between gap-3"
        >
          <span>
            {contact.title}
            {contact.area && (
              <small className="block text-muted">{contact.area}</small>
            )}
            <small className="mt-1 block text-muted">
              {contact.description}
            </small>
          </span>
          <a
            className="rounded-full bg-ink px-5 py-3 font-bold text-white"
            href={`tel:${contact.phone}`}
          >
            {t("call", { phone: contact.phone })}
          </a>
        </div>
      ))}
    </aside>
  );
}
export function RecordBody({ record }) {
  const t = useTranslations("Portal");
  return (
    <>
      {record.image && (
        <img
          src={record.image}
          alt={record.title}
          className="mb-10 max-h-[640px] w-full rounded-3xl object-cover"
        />
      )}
      <dl className="mb-8 grid gap-4 sm:grid-cols-2">
        {["area", "position", "status", "type"]
          .filter((k) => record[k])
          .map((k) => (
            <div key={k}>
              <dt className="text-sm text-muted">
                {t(k === "position" ? "leadershipLabel" : k)}
              </dt>
              <dd className="font-semibold">
                {["status", "type"].includes(k) && t.has(record[k])
                  ? t(record[k])
                  : record[k]}
              </dd>
            </div>
          ))}
        {["startAt", "endAt", "updatedAt", "publishedAt"]
          .filter((k) => record[k])
          .map((k) => (
            <div key={k}>
              <dt className="text-sm text-muted">
                {t(
                  {
                    startAt: "start",
                    endAt: "end",
                    updatedAt: "updated",
                    publishedAt: "date",
                  }[k],
                )}
              </dt>
              <dd>
                <DateTime value={record[k]} />
              </dd>
            </div>
          ))}
      </dl>
      <div className="max-w-3xl space-y-7">
        {(record.blocks || []).map((block, i) => (
          <section key={i} className="rounded-2xl bg-canvas p-6">
            <h2 className="text-2xl font-black">{block.title}</h2>
            <p className="mt-3 whitespace-pre-line text-lg leading-8 text-muted">
              <RichText text={block.text} />
            </p>
          </section>
        ))}
      </div>
      {["schedule", "participants", "changes", "results", "media"]
        .filter((k) => record[k])
        .map((k) => (
          <section key={k} className="mt-10 max-w-3xl">
            <h2 className="text-2xl font-black">{t(k)}</h2>
            {record[k].length ? (
              record[k].map((b, i) => (
                <div key={i} className="mt-4">
                  <h3 className="text-lg font-bold">{b.title}</h3>
                  <p className="mt-2 leading-7 text-muted"><RichText text={b.text}/></p>
                </div>
              ))
            ) : (
              <p className="mt-3 text-muted">{t("notPublished")}</p>
            )}
          </section>
        ))}
      {record.specs?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-black">{t("specs")}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {record.specs.map((s) => (
              <div key={s.label}>
                <dt className="text-muted">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {record.images?.map((src) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          className="mt-6 max-h-[600px] rounded-2xl object-cover"
        />
      ))}
      {record.mapUrl && (
        <a
          className="mt-8 inline-block font-bold transition-opacity hover:opacity-60"
          href={record.mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          {t("location")}
        </a>
      )}
      {record.videoUrl && (
        <iframe
          src={record.videoUrl}
          title={record.title}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allowFullScreen
          className="mt-8 aspect-video w-full rounded-2xl border-0"
        />
      )}
      <PdfFiles files={record.files} />
      {record.email && <a className="mt-4 block font-semibold" href={`mailto:${record.email}`}>{record.email}</a>}
      {record.linkedinUrl && <a className="mt-4 block font-semibold" href={record.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}
      {record.links?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-black">{t("links")}</h2>
          <ul className="mt-4 space-y-3">
            {record.links.map((link) => (
              <li key={link.url}>
                <a
                  className="font-bold transition-opacity hover:opacity-60"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
