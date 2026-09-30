import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
export default function View() {
  const t = useTranslations("Common");
  return (
    <main
      className="mx-auto min-h-[60vh] max-w-4xl px-6 pb-20 pt-40"
      role="status"
    >
      <h1 className="text-3xl font-bold">{t("loading")}</h1>
      <p className="mt-4">{t("loadingDescription")}</p>
      <Link href="/" className="mt-6 inline-block font-bold transition-opacity hover:opacity-60">
        {t("home")}
      </Link>
    </main>
  );
}
