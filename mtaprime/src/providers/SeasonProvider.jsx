"use client";
import { createContext, useContext, useSyncExternalStore } from "react";
const SeasonContext = createContext(null);
const key = "mta-season";
const changeEvent = "mta-season-change";
let memorySeason = "winter";
let storageFailed = false;
function readSeason() {
  if (storageFailed) return memorySeason;
  try {
    const value = window.localStorage.getItem(key);
    return value === "summer" || value === "winter" ? value : memorySeason;
  } catch {
    return memorySeason;
  }
}
function subscribe(notify) {
  const onStorage = (event) => {
    if (event.key === key || event.key === null) notify();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, notify);
  };
}
function setSeason(value) {
  if (value !== "winter" && value !== "summer") return;
  memorySeason = value;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    storageFailed = true;
    /* Storage may be unavailable in private browsing. */
  }
  window.dispatchEvent(new Event(changeEvent));
}
export function SeasonProvider({ children }) {
  const season = useSyncExternalStore(subscribe, readSeason, () => "winter");
  return (
    <SeasonContext.Provider value={{ season, setSeason }}>
      <div className="season-atmosphere" data-season={season}>{children}</div>
    </SeasonContext.Provider>
  );
}
export function useSiteSeason() {
  const context = useContext(SeasonContext);
  if (!context) throw new Error("useSiteSeason requires SeasonProvider");
  return context;
}
