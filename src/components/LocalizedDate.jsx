import { useTranslations } from "next-intl";
export default function LocalizedDate({ value }) {
  const t = useTranslations("Common");
  const date = new Date(value + "T12:00:00Z");
  return (
    <time dateTime={value}>
      {t("date", {
        day: String(date.getUTCDate()),
        month: t("months.m" + (date.getUTCMonth() + 1)),
        year: String(date.getUTCFullYear()),
      })}
    </time>
  );
}
