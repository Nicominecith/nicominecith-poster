import { useSyncExternalStore } from "react";

/* Nicominecith Poster: small local settings store (stays in this browser only). */

export type ThemeChoice = "system" | "light" | "dark";
export type AppSettings = { autoCover: boolean; theme: ThemeChoice };

const KEY = "nicominecith-poster:settings";
const DEFAULTS: AppSettings = { autoCover: true, theme: "system" };

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

let current = load();
const listeners = new Set<() => void>();

export function applyTheme(theme: ThemeChoice): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function updateSettings(patch: Partial<AppSettings>): void {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage blocked: keep in memory */
  }
  applyTheme(current.theme);
  listeners.forEach((listener) => listener());
}

applyTheme(current.theme);
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => applyTheme(current.theme));

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}
