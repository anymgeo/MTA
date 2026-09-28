export const liveStatuses = {
  open: { tone: "open", icon: "check" },
  closed: { tone: "closed", icon: "x" },
  limited: { tone: "warning", icon: "clock" },
  delayed: { tone: "warning", icon: "clock" },
  hold: { tone: "warning", icon: "pause" },
  maintenance: { tone: "warning", icon: "wrench" },
  unavailable: { tone: "unknown", icon: "circle" },
};
export function observationState(conditions, now) {
  const age = now - Date.parse(conditions?.lastUpdatedAt || "");
  const rawStatus = typeof conditions?.status === "string" ? conditions.status.toLowerCase() : "unavailable";
  const unavailable = !Number.isFinite(age) || age < -60000 || age >= 6 * 3600000 || rawStatus === "unavailable" || !Object.hasOwn(liveStatuses, rawStatus);
  const status = unavailable ? "unavailable" : rawStatus;
  return { status: Object.hasOwn(liveStatuses, status) ? status : "unavailable",
    unavailable, stale: !unavailable && age >= 45 * 60000,
    minutes: Math.max(0, Math.floor(age / 60000)) };
}
export const metricNumber = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
