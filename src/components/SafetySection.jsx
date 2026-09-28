import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
export default function SafetySection() {
  const t = useTranslations("SafetySection");
  const { SAFETY_LINKS } = getLocalizedContent(t);
  return (
    <section
      id="safety"
      className="grid gap-12 bg-surface px-6 py-20 text-ink md:px-10 lg:grid-cols-[1fr_1fr_auto] lg:items-center lg:px-20"
    >
      {/* TITLE */}
      <div>
        <ShieldCheck
          size={40}
          strokeWidth={1.5}
          className="mb-8 text-brand-green"
          aria-hidden="true"
        />

        <p className="mb-4 text-xs font-bold tracking-[0.25em] text-muted">
          {t("planASafeDay_3d00fd")}
        </p>

        <h2 className="text-5xl font-black leading-[0.9] md:text-6xl">
          {t("mountain_5f147b")}
          <br />
          <span className="font-heading font-normal">{t("safety")}</span>
        </h2>
      </div>

      {/* LINKS */}
      <div className="flex flex-col border-t border-border">
        {SAFETY_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="group flex items-center justify-between rounded-xl border-b border-border px-4 py-5 text-sm transition-colors hover:bg-canvas hover:shadow-sm"
          >
            <span>{link.label}</span>
            <ArrowUpRight
              size={18}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>

      {/* EMERGENCY CTA */}
      <a
        href="tel:112"
        aria-label={t("callEmergencyServicesAt112_221219")}
        className="group flex min-w-[200px] flex-col justify-center rounded-2xl bg-ink text-white p-8 transition-all duration-300 hover:bg-ink/90 hover:shadow-lg"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[0.2em] text-white">
            {t("emergency_c1a29b")}
          </span>
          <ArrowUpRight
            size={16}
            className="opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </div>

        <strong className="mt-2 text-5xl font-black tracking-tight">112</strong>
      </a>
    </section>
  );
}
function getLocalizedContent(t) {
  const SAFETY_LINKS = [
    {
      label: t("emergencyContacts_616894"),
      href: "/safety/emergency-contacts",
    },
    {
      label: t("avalancheWarnings_e7d5b2"),
      href: "/safety/avalanche-danger",
    },
    {
      label: t("trailClassification_0cd57b"),
      href: "/safety/piste-classification",
    },
  ];
  return {
    SAFETY_LINKS,
  };
}
