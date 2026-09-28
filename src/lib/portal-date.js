// Numeric en-GB parts are supported even by browsers without Georgian ICU data.
// Month names come from our bilingual catalogue, not the browser's fallback locale.
export function portalDateParts(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tbilisi",
    ...(value.includes("T") ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}),
  }).formatToParts(date).filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  parts.day = String(Number(parts.day)); parts.month = String(Number(parts.month));
  return parts;
}
