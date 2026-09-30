"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useId, useMemo, useState } from "react";
function AccordionItem({ question, answer }) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-6 px-6 py-6 text-left transition hover:bg-surface md:px-8"
      >
        <span
          className={`text-base font-bold md:text-lg ${open ? "text-ink" : "text-ink"}`}
        >
          {question}
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${open ? "rotate-45 border-ink bg-ink text-white" : "border-border text-muted"}`}
        >
          <span className="text-xl leading-none">+</span>
        </span>
      </button>

      <div
        id={panelId}
        aria-hidden={!open}
        inert={!open}
        className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-7 md:px-8">
            <p className="whitespace-pre-line max-w-3xl border-l-2 border-brand-green pl-5 text-base leading-8 text-muted">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function FaqPage({ items }) {
  const t = useTranslations("FaqPage");
  const { suggestedLinks } = useMemo(
    () => getLocalizedContent(t),
    [t],
  );
  const faqCategories = useMemo(() => {
    const groups = [];
    for (const item of items) {
      const last = groups.at(-1);
      if (last && last.title === item.category) last.items.push(item);
      else groups.push({ title: item.category, items: [item] });
    }
    return groups;
  }, [items]);
  const [search, setSearch] = useState("");
  const allQuestions = useMemo(() => {
    return faqCategories.flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        category: category.title,
      })),
    );
  }, [faqCategories]);
  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return allQuestions.filter((item) => {
      return (
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [search, allQuestions]);
  const isSearching = search.trim() !== "";
  return (
    <main className="min-h-screen bg-canvas">
      {/* HERO */}
      <section className="relative min-h-[560px] overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <img
            src="/Gudauri.jpg"
            alt=""
            className="h-full w-full object-cover object-center opacity-[0.35]"
          />

          <div className="absolute inset-0 bg-ink/30" />

          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/10" />

          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-ink to-transparent" />
        </div>

        {/* Decorative mountain glow */}
        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-brand-green/10 blur-3xl" />

        {/* CONTENT */}
        <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-6 py-32 md:px-10">
          <div className="max-w-3xl text-left">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-ink">
              {t("helpCenter_110158")}
            </p>

            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-canvas md:text-7xl lg:text-8xl">
              {t("frequently_b6f9db")}
              <br />
              {t("askedQuestions_39e8fa")}
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-border md:text-xl">
              {t("findAnswersQuicklyAndEasilySearch_18b63c")}
            </p>

            {/* SEARCH */}
            <div className="relative mt-10 max-w-2xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.5-4.5m2-5.25a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchForAQuestion_eb8baa")}
                className="h-16 w-full rounded-2xl border border-canvas/20 bg-canvas/95 pl-14 pr-14 text-base text-ink shadow-2xl outline-none placeholder:text-muted focus:border-brand-green focus:ring-4 focus:ring-brand-green/20"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-xl text-muted transition hover:bg-surface hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        {isSearching ? (
          <>
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-ink">
                {t("search_bce064")}
              </p>

              <h2 className="mt-2 text-3xl font-black text-ink">
                {results.length}{" "}
                {results.length === 1
                  ? t("result_37a530")
                  : t("results_cdf7e9")}
              </h2>
            </div>

            {results.length > 0 ? (
              <div className="overflow-hidden rounded-3xl border border-border">
                {results.map((item) => (
                  <div
                    key={`${item.category}-${item.question}`}
                    className="border-b border-border last:border-b-0"
                  >
                    <AccordionItem
                      question={item.question}
                      answer={item.answer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-surface px-6 py-16 text-center">
                <h3 className="text-xl font-black text-ink">
                  {t("noResultsFound_658e79")}
                </h3>

                <p className="mt-2 text-muted">
                  {t("tryAnotherKeyword_60c49e")}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-14">
            {!items.length && <p role="status">{t("empty")}</p>}
            {faqCategories.map((category, index) => (
              <section key={`${category.title}-${index}`}>
                <div className="mb-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-ink">
                    {t("faq_03688b")}
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-ink">
                    {category.title}
                  </h2>
                </div>

                <div className="overflow-hidden rounded-3xl border border-border">
                  {category.items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      question={item.question}
                      answer={item.answer}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* SUGGESTED LINKS */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <div className="mb-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-ink">
              {t("suggestedLinks_042806")}
            </p>

            <h2 className="mt-2 text-3xl font-black text-ink">
              {t("youMayAlsoFindTheseUseful_65ab27")}
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-canvas">
            {suggestedLinks.map((link) => (
              <div
                key={link.href}
                className="border-b border-border last:border-b-0"
              >
                <AccordionItem
                  question={link.title}
                  answer={
                    <span>
                      {link.description}{" "}
                      <Link
                        href={link.href}
                        className="ml-1 font-bold text-ink transition-opacity hover:opacity-60"
                      >
                        {t("openPage_c3c790")}
                      </Link>
                    </span>
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="bg-ink">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
          <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-yellow">
                {t("stillNeedHelp_25e6e3")}
              </p>

              <h2 className="mt-3 text-3xl font-black text-canvas md:text-4xl">
                {t("weAreHereToHelp_1b7785")}
              </h2>

              <p className="mt-3 text-muted">
                {t("canTFindTheInformationYou_d2694a")}
              </p>
            </div>

            <Link
              href="/contact"
              className="rounded-full bg-ink px-7 py-4 text-sm font-black text-white transition hover:bg-ink"
            >
              {t("contactUs_4832e4")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
function getLocalizedContent(t) {
  const suggestedLinks = [
    {
      title: t("exploreResorts_654764"),
      description: t("discoverResortsSlopesAndMountainExperiences_d26a67"),
      href: "/resorts",
    },
    {
      title: t("liveStatus_f300c9"),
      description: t("checkCurrentLiftAndSlopeOperating_b82aad"),
      href: "/#live",
    },
    {
      title: t("maps_80071c"),
      description: t("exploreResortMapsAndMountainInfrastructure_292af2"),
      href: "/#map",
    },
    {
      title: t("latestNews_4e115e"),
      description: t("readTheLatestAnnouncementsAndResort_f4ef01"),
      href: "/news",
    },
  ];
  return {
    suggestedLinks,
  };
}
