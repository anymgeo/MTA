"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { sendContactMessage } from "@/services/contact-client";
import { useState } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
export default function ContactPage() {
  const t = useTranslations("ContactPage");
  const p = useTranslations("Portal");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    website: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const subjects = [
    {
      label: t("generalInquiry_f92e3b"),
      value: "general",
    },
    {
      label: t("resortsSkiAreas_c355bb"),
      value: "resorts",
    },
    {
      label: t("skiPass_0236c4"),
      value: "ski-pass",
    },
    {
      label: t("safetyMountainConditions_3c309f"),
      value: "safety",
    },
    {
      label: t("partnership_de4763"),
      value: "partnership",
    },
    {
      label: t("mediaInquiry_967be4"),
      value: "media",
    },
    {
      label: t("other_6e6a6f"),
      value: "other",
    },
  ];
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendStatus(null);
    try {
      await sendContactMessage(formData);
      setSendStatus("sendSuccess");
    } catch {
      setSendStatus("sendError");
    } finally {
      setSending(false);
    }
  };
  return (
    <main className="bg-canvas text-ink">
      {/* HERO */}
      <section className="relative min-h-[55vh] overflow-hidden bg-ink text-canvas">
        <div className="absolute inset-0">
          <img
            src="/MESTIA.webp"
            alt={t("georgiaMountainLandscape_ebc873")}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-ink/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-ink/20" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[55vh] max-w-7xl items-end px-6 pb-16 lg:px-10 lg:pb-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-ink">
              {t("mountainTrailsAgency_1ebf43")}
            </p>

            <h1 className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-8xl">
              {t("contactUs_3ae58c")}
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-canvas/75">
              {t("haveAQuestionAboutOurResorts_7732e4")}
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT INFO + FORM */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          {/* LEFT SIDE */}
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-ink">
              {t("getInTouch_c49bb4")}
            </p>

            <h2 className="max-w-xl text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
              {t("weWouldLoveToHearFrom_6002fd")}
            </h2>

            <p className="mt-6 max-w-lg text-lg leading-8 text-ink/60">
              {t("whetherYouArePlanningYourNext_51199e")}
            </p>

            {/* CONTACT DETAILS */}
            <div className="mt-12 space-y-8">
              {/* PHONE */}
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-green/10">
                  <i className="pi pi-phone text-lg text-ink" />
                </div>

                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-ink/40">
                    {t("phone_77064d")}
                  </p>

                  <a
                    href="tel:+995322053050"
                    className="mt-1 block text-lg font-medium transition-colors hover:text-ink"
                  >
                    +995 32 205 30 50
                  </a>
                </div>
              </div>

              {/* EMAIL */}
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-green/10">
                  <i className="pi pi-envelope text-lg text-ink" />
                </div>

                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-ink/40">
                    {t("email_84add5")}
                  </p>

                  <a
                    href="mailto:info@mta.ski"
                    className="mt-1 block text-lg font-medium transition-colors hover:text-ink"
                  >
                    {t("infoMtaSki_399cf5")}
                  </a>
                </div>
              </div>

              {/* ADDRESS */}
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-green/10">
                  <i className="pi pi-map-marker text-lg text-ink" />
                </div>

                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-ink/40">
                    {t("address_d70f93")}
                  </p>

                  <p className="mt-1 max-w-sm text-lg font-medium leading-7">
                    {t("2SanapiroStreet_00a581")}
                    <br />
                    {t("tbilisiGeorgia_55690c")}
                  </p>
                </div>
              </div>

              {/* WORKING HOURS */}
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-green/10">
                  <i className="pi pi-clock text-lg text-ink" />
                </div>

                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-ink/40">
                    {t("workingHours_85fd41")}
                  </p>

                  <p className="mt-1 text-lg font-medium">
                    {t("mondayFriday_e83e6c")}
                  </p>

                  <p className="text-ink/50">09:00 – 18:00</p>
                </div>
              </div>
            </div>

            {/* SOCIAL */}
            <div className="mt-12 border-t border-ink/10 pt-8">
              <p className="mb-4 text-sm font-medium uppercase tracking-wider text-ink/40">
                {t("followUs_d24443")}
              </p>

              <div className="flex gap-3">
                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 transition-all hover:border-neutral-700 hover:bg-neutral-700 hover:text-white"
                >
                  <i className="pi pi-facebook" />
                </a>

                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 transition-all hover:border-neutral-700 hover:bg-neutral-700 hover:text-white"
                >
                  <i className="pi pi-instagram" />
                </a>

                <a
                  href="#"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 transition-all hover:border-neutral-700 hover:bg-neutral-700 hover:text-white"
                >
                  <i className="pi pi-youtube" />
                </a>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="rounded-3xl bg-surface p-7 sm:p-10 lg:p-12">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink">
                {t("sendAMessage_dc2661")}
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                {t("howCanWeHelp_d99615")}
              </h2>

              <p className="mt-4 text-ink/50">
                {t("fillOutTheFormAndOur_7c97b2")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {sendStatus && (
                <p role="status" className="rounded-xl bg-surface p-4 text-sm">
                  {t(sendStatus)}
                </p>
              )}

              <div className="hidden" aria-hidden="true">
                <label>
                  {p("honeypot")}
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                {p("lastName")}
                <InputText
                  required
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="mt-2 w-full"
                />
              </label>
              {/* NAME + EMAIL */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block text-sm font-medium"
                  >
                    {p("firstName")}
                  </label>

                  <InputText
                    id="firstName"
                    required
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder={t("yourName_ab4229")}
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium"
                  >
                    {t("emailAddress_c94d31")}
                  </label>

                  <InputText
                    id="email"
                    required
                    autoComplete="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder={t("youExampleCom_50e2b4")}
                    className="w-full"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium"
                >
                  {t("phoneNumber_8961d3")}
                  <span className="ml-2 text-ink/30">
                    {t("optional_b16c7a")}
                  </span>
                </label>

                <InputText
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+995 ..."
                  className="w-full"
                />
              </div>

              {/* SUBJECT */}
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium"
                >
                  {t("subject_8d183d")}
                </label>

                <Dropdown
                  inputId="subject"
                  required
                  value={formData.subject}
                  options={subjects}
                  onChange={(e) => handleChange("subject", e.value)}
                  placeholder={t("selectASubject_d5f51e")}
                  className="w-full"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium"
                >
                  {t("message_68f414")}
                </label>

                <InputTextarea
                  id="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder={t("writeYourMessage_071225")}
                  rows={7}
                  autoResize
                  className="w-full"
                />
              </div>

              {/* SUBMIT */}
              <Button
                disabled={sending}
                loading={sending}
                type="submit"
                label={t("sendMessage_c70a89")}
                icon="pi pi-arrow-right"
                iconPos="right"
                className="w-full border-0 !bg-ink !px-6 !py-4 font-semibold !text-white hover:!bg-ink sm:w-auto"
              />
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-12">
        <iframe
          title={p("contactMap")}
          src="https://maps.google.com/maps?q=70%20Merab%20Kostava%20Street%20Tbilisi&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-96 w-full rounded-3xl border-0"
        />
      </section>
      {/* MAP / LOCATION */}
      <section className="border-t border-ink/10 bg-ink text-canvas">
        <div className="grid min-h-[500px] lg:grid-cols-2">
          <div className="relative min-h-[400px] overflow-hidden">
            <img
              src="/Gudauri.jpg"
              alt={t("mountainTrailsAgency_1ebf43")}
              className="h-full w-full object-cover opacity-70"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-ink/20 to-ink" />
          </div>

          <div className="flex items-center px-6 py-20 lg:px-16">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink">
                {t("mountainTrailsAgency_1ebf43")}
              </p>

              <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
                {t("fromTheCity_fbb209")}
                <br />
                {t("toTheMountains_b7a378")}
              </h2>

              <p className="mt-6 text-lg leading-8 text-canvas/60">
                {t("ourHeadquartersAreLocatedInTbilisi_bc9f22")}
              </p>

              <div className="mt-8 flex items-start gap-4">
                <i className="pi pi-map-marker mt-1 text-ink" />

                <div>
                  <p className="font-medium">{t("2SanapiroStreet_9c5081")}</p>

                  <p className="mt-1 text-canvas/50">
                    {t("tbilisiGeorgia_55690c")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="px-6 py-20 text-center lg:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink">
          {t("needMoreInformation_2efb23")}
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
          {t("yourNextMountainAdventureStartsHere_af6655")}
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-ink/50">
          {t("exploreOurResortsMountainAreasAnd_c7f024")}
        </p>

        <Link
          href="/resorts"
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 font-semibold text-canvas transition-transform hover:-translate-y-1"
        >
          {t("exploreResorts_609a31")}
          <i className="pi pi-arrow-right" />
        </Link>
      </section>
    </main>
  );
}
