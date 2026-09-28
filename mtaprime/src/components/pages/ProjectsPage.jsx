"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { DateTime } from "@/components/content/ContentUI";
function ProjectCard({ project }) {
  const p = useTranslations("Portal");
  const t = useTranslations("ProjectsPage");
  return (
    <article className="group overflow-hidden rounded-[28px] border border-border bg-canvas shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
      <Link href={`/projects/${project.slug}`}>
        <div className="relative h-[300px] overflow-hidden">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />

          <div className="absolute left-5 top-5 flex gap-2">
            <span className="rounded-full bg-canvas px-3 py-1.5 text-xs font-bold text-ink">
              {project.resort}
            </span>

            <span className="rounded-full bg-brand-red px-3 py-1.5 text-xs font-bold text-ink">
              {project.year}
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-canvas/70">
              {project.category}
            </p>

            <h2 className="text-2xl font-black leading-tight text-canvas">
              {project.title}
            </h2>
          </div>
        </div>
      </Link>

      <div className="p-6">
        <dl className="mb-5 text-sm">
          <dt>{p("status")}</dt>
          <dd>{p.has(project.status) ? p(project.status) : project.status}</dd>
          <dt className="mt-2">{p("start")}</dt>
          <dd>
            <DateTime value={project.startAt} />
          </dd>
          <dt className="mt-2">{p("end")}</dt>
          <dd>
            <DateTime value={project.endAt} />
          </dd>
        </dl>
        <p className="mb-6 text-sm leading-6 text-muted">
          {project.description}
        </p>

        <div className="mb-6 grid grid-cols-3 gap-3 border-y border-surface py-5">
          {project.stats.map((stat) => (
            <div key={stat.label}>
              <div className="text-lg font-black text-ink">{stat.value}</div>

              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <Link
          href={`/projects/${project.slug}`}
          className="text-sm font-bold text-ink"
        >
          {t("viewProject_d90104")}
        </Link>
      </div>
    </article>
  );
}
export default function ProjectsPage({ projects }) {
  const p = useTranslations("Portal");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const t = useTranslations("ProjectsPage");
  const resortOptions = [
    "all",
    ...new Set(projects.map((project) => project.resortId)),
  ];
  const yearOptions = [
    "all",
    ...Array.from(new Set(projects.map((project) => project.year))).sort(
      (a, b) => b - a,
    ),
  ];
  const [search, setSearch] = useState("");
  const [selectedResort, setSelectedResort] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const filteredProjects = useMemo(() => {
    const searchValue = search.toLowerCase().trim();
    return projects.filter((project) => {
      const matchesSearch =
        !searchValue ||
        project.title.toLowerCase().includes(searchValue) ||
        project.resort.toLowerCase().includes(searchValue) ||
        project.category.toLowerCase().includes(searchValue) ||
        project.description.toLowerCase().includes(searchValue);
      const matchesResort =
        selectedResort === "all" || project.resortId === selectedResort;
      const matchesYear =
        selectedYear === "all" || project.year === Number(selectedYear);
      return (
        matchesSearch &&
        matchesResort &&
        matchesYear &&
        (!status || project.status === status) &&
        (!date ||
          (project.startAt &&
            project.startAt.slice(0, 10) <= date &&
            (!project.endAt || project.endAt.slice(0, 10) >= date)))
      );
    });
  }, [projects, search, selectedResort, selectedYear, status, date]);
  function resetFilters() {
    setStatus("");
    setDate("");
    setSearch("");
    setSelectedResort("all");
    setSelectedYear("all");
  }
  return (
    <main className="min-h-screen bg-surface">
      <section className="bg-ink px-6 pb-24 pt-40 text-canvas">
        <div className="mx-auto max-w-7xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.3em] text-ink">
            {t("mountainTrailsAgency_1ebf43")}
          </p>

          <h1 className="text-5xl font-black md:text-8xl">
            {t("ourProjects_fbada6")}
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-canvas/60">
            {t("discoverTheInfrastructureAndDevelopmentProjects_aae842")}
          </p>

          <div className="mt-12 flex gap-12">
            <div>
              <div className="text-4xl font-black">{projects.length}</div>
              <p className="mt-2 text-sm text-canvas/40">
                {t("projects_53e890")}
              </p>
            </div>

            <div>
              <div className="text-4xl font-black">
                {new Set(projects.map((p) => p.resort)).size}
              </div>
              <p className="mt-2 text-sm text-canvas/40">
                {t("resorts_c5a813")}
              </p>
            </div>

            <div>
              <div className="text-4xl font-black">2022–2024</div>
              <p className="mt-2 text-sm text-canvas/40">
                {t("projectPeriod_726a18")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-10 max-w-7xl px-6">
        <div className="rounded-3xl bg-canvas p-5 shadow-xl">
          <div className="mb-4 flex flex-wrap gap-4">
            <label>
              {p("status")}
              <select
                className="ml-3 rounded-lg border border-border p-3"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">{p("all")}</option>
                {["ongoing", "completed", "unknown"].map((value) => (
                  <option key={value} value={value}>
                    {p(value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {p("date")}
              <input
                className="ml-3 rounded-lg border border-border p-3"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
            <input
              aria-label={t("searchProjects_469d78")}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchProjects_469d78")}
              className="h-14 rounded-xl border border-border bg-surface px-4 text-sm outline-none focus:border-brand-green"
            />

            <select
              aria-label={t("allResorts_af7a62")}
              value={selectedResort}
              onChange={(event) => setSelectedResort(event.target.value)}
              className="h-14 rounded-xl border border-border bg-surface px-4 text-sm font-bold outline-none"
            >
              {resortOptions.map((resort) => (
                <option key={resort} value={resort}>
                  {resort === "all"
                    ? t("allResorts_af7a62")
                    : projects.find((project) => project.resortId === resort)
                        ?.resort}
                </option>
              ))}
            </select>

            <select
              aria-label={t("allYears_6d76b8")}
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="h-14 rounded-xl border border-border bg-surface px-4 text-sm font-bold outline-none"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year === "all" ? t("allYears_6d76b8") : year}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="h-14 rounded-xl bg-ink px-7 text-sm font-bold text-canvas hover:bg-neutral-700"
            >
              {t("reset_44c57a")}
            </button>
          </div>

          <p className="mt-4 border-t border-surface pt-4 text-sm text-muted">
            {t("showing_163d81")}{" "}
            <strong className="text-ink">{filteredProjects.length}</strong>{" "}
            {t("projects_b37b56")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        {filteredProjects.length > 0 ? (
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-canvas p-20 text-center">
            <h2 className="text-3xl font-black text-ink">
              {t("noProjectsFound_008ce3")}
            </h2>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-xl bg-ink px-6 py-3 font-bold text-white"
            >
              {t("resetFilters_565531")}
            </button>
          </div>
        )}
      </section>

      <section className="bg-ink px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-ink">
            {t("mountainTrailsAgency_1ebf43")}
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-black text-canvas">
            {t("buildingTheFutureOfGeorgianMountains_42bbc6")}
          </h2>
        </div>
      </section>
    </main>
  );
}
