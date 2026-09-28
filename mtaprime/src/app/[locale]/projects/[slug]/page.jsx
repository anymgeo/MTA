import { RecordBody } from "@/components/content/ContentUI";
import PdfUpload from "@/components/content/PdfUpload";
import { getTranslations } from "next-intl/server";
import { contentMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  getProjects,
  getProjectBySlug,
  getProjectsSlugs,
} from "@/services/projects";
export async function generateStaticParams() {
  return getProjectsSlugs();
}
function formatDate(date, locale) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function createGoogleCalendarUrl(project, agency) {
  const start = project.date.replaceAll("-", "");
  const endDate = new Date(`${project.date}T12:00:00`);
  endDate.setDate(endDate.getDate() + 1);
  const end = [
    endDate.getFullYear(),
    String(endDate.getMonth() + 1).padStart(2, "0"),
    String(endDate.getDate()).padStart(2, "0"),
  ].join("");
  const title = encodeURIComponent(`${project.title} | ${agency}`);
  const details = encodeURIComponent(
    `${project.description}\n\n${agency}\n${project.resort}`,
  );
  const location = encodeURIComponent(project.resort);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
}
export default async function ProjectPage({ params }) {
  const t = await getTranslations("projects_Detail");
  const { slug, locale } = await params;
  const projects = await getProjects({
    locale,
  });
  const project = await getProjectBySlug(slug, {
    locale,
  });
  if (!project) {
    notFound();
  }
  const relatedProjects = projects
    .filter(
      (item) => item.slug !== project.slug && item.resort === project.resort,
    )
    .slice(0, 3);
  const calendarUrl = createGoogleCalendarUrl(
    project,
    t("mountainTrailsAgency_1ebf43"),
  );
  return (
    <main className="min-h-screen bg-surface">
      {/* HERO */}
      <section className="relative min-h-[720px] overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full scale-105 object-cover opacity-55"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/50 to-ink" />

          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/45 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[720px] max-w-7xl items-end px-6 pb-24 pt-40">
          <div className="max-w-5xl">
            <Link
              href="/projects"
              className="inline-flex items-center text-sm font-bold text-canvas/60 transition hover:text-canvas"
            >
              {t("backToProjects_ef1a2b")}
            </Link>

            <div className="mt-12 flex flex-wrap gap-3">
              <span className="rounded-full bg-canvas px-4 py-2 text-xs font-black uppercase tracking-wide text-ink">
                {project.resort}
              </span>

              <span className="rounded-full bg-brand-red px-4 py-2 text-xs font-black uppercase tracking-wide text-ink">
                {project.category}
              </span>

              <span className="rounded-full bg-canvas/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-canvas backdrop-blur-md">
                {project.year}
              </span>
            </div>

            <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-canvas md:text-7xl lg:text-8xl">
              {project.title}
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-canvas/70 md:text-xl">
              {project.description}
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface to-transparent" />
      </section>

      {/* PROJECT META */}
      <section className="relative z-10 mx-auto -mt-2 max-w-7xl px-6">
        <div className="grid overflow-hidden rounded-[28px] bg-canvas shadow-2xl lg:grid-cols-[1fr_1fr_1.3fr]">
          {/* DATE */}
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group border-b border-surface p-7 transition hover:bg-ink lg:border-b-0 lg:border-r"
          >
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-green/10 text-ink transition group-hover:bg-brand-green group-hover:text-ink">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted group-hover:text-canvas/40">
                  {t("projectDate_571194")}
                </p>

                <p className="mt-2 text-lg font-black text-ink group-hover:text-canvas">
                  {formatDate(project.date, locale)}
                </p>

                <p className="mt-1 text-xs font-bold text-ink">
                  {t("addToCalendar_166301")}
                </p>
              </div>
            </div>
          </a>

          {/* LOCATION */}
          <div className="border-b border-surface p-7 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-red/10 text-ink">
                <svg
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted">
                  {t("location_d219c6")}
                </p>

                <p className="mt-2 text-lg font-black text-ink">
                  {project.resort}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {t("mountainResortGeorgia_59fc27")}
                </p>
              </div>
            </div>
          </div>

          {/* ACTIVITIES */}
          <div className="p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted">
              {t("activities_e58f7f")}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {project.activities.map((activity) => (
                <span
                  key={activity}
                  className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-ink"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid overflow-hidden rounded-[28px] bg-ink md:grid-cols-3">
          {project.stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`p-10 md:p-12 ${index !== project.stats.length - 1 ? "border-b border-canvas/10 md:border-b-0 md:border-r" : ""}`}
            >
              <div className="text-5xl font-black tracking-tight text-canvas md:text-6xl">
                {stat.value}
              </div>

              <div className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-canvas/35">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-20">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-ink">
              {t("projectOverview_d4ae1b")}
            </p>

            <h2 className="mt-5 text-4xl font-black leading-tight text-ink md:text-6xl">
              {t("developingGeorgiaSMountainFuture_98b6a6")}
            </h2>
          </div>

          <div>
            <p className="text-lg leading-9 text-muted md:text-xl">
              {project.overview}
            </p>

            <div className="mt-10 h-1 w-20 rounded-full bg-brand-red" />
          </div>
        </div>
      </section>

      {/* LARGE IMAGE */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="group relative h-[450px] overflow-hidden rounded-[32px] md:h-[650px]">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

          <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-canvas/60">
              {t("mountainTrailsAgency_1ebf43")}
            </p>

            <p className="mt-3 max-w-2xl text-2xl font-black text-canvas md:text-4xl">
              {t("infrastructureDesignedForTheNextGeneration_a9de9b")}
            </p>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-ink">
            {t("keyHighlights_850b69")}
          </p>

          <h2 className="mt-5 text-4xl font-black text-ink md:text-6xl">
            {t("whatMakesThisProjectImportant_b45bd5")}
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {project.highlights.map((highlight, index) => (
            <div
              key={highlight}
              className="group rounded-[28px] border border-border bg-canvas p-8 transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:bg-ink hover:shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-sm font-black text-ink transition group-hover:bg-brand-green group-hover:text-ink">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <span className="text-2xl text-border transition group-hover:text-canvas/20">
                  ↗
                </span>
              </div>

              <p className="mt-8 text-lg font-bold leading-8 text-ink transition group-hover:text-canvas">
                {highlight}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECT DETAILS */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-16 lg:grid-cols-[1fr_360px]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-ink">
                {t("projectInformation_0acc39")}
              </p>

              <h2 className="mt-5 text-4xl font-black text-ink md:text-5xl">
                {t("projectDetails_c876b8")}
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
                {t("informationAboutTheDevelopmentProjectAnd_d8b1dd")}
              </p>
            </div>

            <div className="rounded-[28px] bg-surface p-8">
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted">
                    {t("project_f6f4da")}
                  </p>

                  <p className="mt-2 font-bold text-ink">{project.title}</p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted">
                    {t("resort_1968f2")}
                  </p>

                  <p className="mt-2 font-bold text-ink">{project.resort}</p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted">
                    {t("category_a3c686")}
                  </p>

                  <p className="mt-2 font-bold text-ink">{project.category}</p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted">
                    {t("year_879e32")}
                  </p>

                  <p className="mt-2 font-bold text-ink">{project.year}</p>
                </div>
              </div>

              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 flex w-full items-center justify-center rounded-xl bg-ink px-5 py-4 text-sm font-black text-canvas transition hover:bg-brand-red"
              >
                {t("addProjectToCalendar_3282ea")}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED PROJECTS */}
      {relatedProjects.length > 0 && (
        <section className="bg-surface px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-ink">
              {t("moreProjects_78dfec")}
            </p>

            <h2 className="mt-4 text-4xl font-black text-ink md:text-5xl">
              {t("relatedProjects_9d4c97")}
            </h2>

            <div className="mt-12 grid gap-7 md:grid-cols-3">
              {relatedProjects.map((relatedProject) => (
                <Link
                  key={relatedProject.id}
                  href={`/projects/${relatedProject.slug}`}
                  className="group overflow-hidden rounded-[28px] border border-border bg-canvas transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={relatedProject.image}
                      alt={relatedProject.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

                    <span className="absolute left-5 top-5 rounded-full bg-canvas px-3 py-1.5 text-xs font-black text-ink">
                      {relatedProject.year}
                    </span>

                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-canvas/60">
                        {relatedProject.category}
                      </p>

                      <h3 className="mt-2 text-xl font-black leading-tight text-canvas">
                        {relatedProject.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-sm leading-6 text-muted">
                      {relatedProject.description}
                    </p>

                    <div className="mt-5 text-sm font-black text-ink">
                      {t("viewProject_d90104")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-ink px-6 py-28">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-green/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-ink">
            {t("mountainTrailsAgency_1ebf43")}
          </p>

          <h2 className="mt-5 max-w-4xl text-4xl font-black leading-tight text-canvas md:text-6xl">
            {t("discoverMoreOfGeorgiaSMountain_220ac8")}
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-canvas/50">
            {t("exploreTheInfrastructureAndDevelopmentProjects_101325")}
          </p>

          <Link
            href="/projects"
            className="mt-9 inline-flex rounded-full bg-canvas px-8 py-4 text-sm font-black text-ink transition hover:bg-brand-red hover:text-ink"
          >
            {t("exploreAllProjects_842f1c")}
          </Link>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <RecordBody
          record={{
            status: project.status,
            startAt: project.startAt,
            endAt: project.endAt,
            files: project.files,
            links: project.links,
          }}
        />
        <PdfUpload />
      </section>
    </main>
  );
}
export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const project = await getProjectBySlug(slug, {
    locale,
  });
  if (!project) notFound();
  return contentMetadata(
    locale,
    "/projects/" + slug,
    project.title,
    project.description,
    project.image,
  );
}
