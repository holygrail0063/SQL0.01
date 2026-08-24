export const DEFAULT_ACCENT_ID = "lime";

export const ACCENT_PRESETS = [
  { id: "lime", name: "Lime", primary: "#BEF264", strong: "#A3E635", primaryRgb: "190 242 100", strongRgb: "163 230 53", foregroundRgb: "9 11 10" },
  { id: "emerald", name: "Emerald", primary: "#34D399", strong: "#10B981", primaryRgb: "52 211 153", strongRgb: "16 185 129", foregroundRgb: "9 11 10" },
  { id: "teal", name: "Teal", primary: "#2DD4BF", strong: "#14B8A6", primaryRgb: "45 212 191", strongRgb: "20 184 166", foregroundRgb: "9 11 10" },
  { id: "cyan", name: "Cyan", primary: "#22D3EE", strong: "#06B6D4", primaryRgb: "34 211 238", strongRgb: "6 182 212", foregroundRgb: "9 11 10" },
  { id: "sky", name: "Sky", primary: "#38BDF8", strong: "#0EA5E9", primaryRgb: "56 189 248", strongRgb: "14 165 233", foregroundRgb: "9 11 10" },
  { id: "blue", name: "Blue", primary: "#60A5FA", strong: "#3B82F6", primaryRgb: "96 165 250", strongRgb: "59 130 246", foregroundRgb: "9 11 10" },
  { id: "indigo", name: "Indigo", primary: "#818CF8", strong: "#6366F1", primaryRgb: "129 140 248", strongRgb: "99 102 241", foregroundRgb: "9 11 10" },
  { id: "violet", name: "Violet", primary: "#A78BFA", strong: "#8B5CF6", primaryRgb: "167 139 250", strongRgb: "139 92 246", foregroundRgb: "9 11 10" },
  { id: "fuchsia", name: "Fuchsia", primary: "#E879F9", strong: "#D946EF", primaryRgb: "232 121 249", strongRgb: "217 70 239", foregroundRgb: "9 11 10" },
  { id: "rose", name: "Rose", primary: "#FB7185", strong: "#F43F5E", primaryRgb: "251 113 133", strongRgb: "244 63 94", foregroundRgb: "9 11 10" },
  { id: "orange", name: "Orange", primary: "#FB923C", strong: "#F97316", primaryRgb: "251 146 60", strongRgb: "249 115 22", foregroundRgb: "9 11 10" },
  { id: "gold", name: "Gold", primary: "#FACC15", strong: "#EAB308", primaryRgb: "250 204 21", strongRgb: "234 179 8", foregroundRgb: "9 11 10" },
] as const;

export type AccentPreset = (typeof ACCENT_PRESETS)[number];
export type AccentId = AccentPreset["id"];

const presetIds = new Set<string>(ACCENT_PRESETS.map((preset) => preset.id));
const presetMap = new Map<string, AccentPreset>(ACCENT_PRESETS.map((preset) => [preset.id, preset]));

export function isAccentId(value: unknown): value is AccentId {
  return typeof value === "string" && presetIds.has(value);
}

export function normalizeAccentId(value: unknown): AccentId {
  return isAccentId(value) ? value : DEFAULT_ACCENT_ID;
}

export function getAccentPreset(value: unknown): AccentPreset {
  return presetMap.get(normalizeAccentId(value)) ?? ACCENT_PRESETS[0];
}

export function applyAccent(value: unknown) {
  if (typeof document === "undefined") return;
  const preset = getAccentPreset(value);
  const style = document.documentElement.style;
  style.setProperty("--color-brand", preset.primaryRgb);
  style.setProperty("--color-brand-strong", preset.strongRgb);
  style.setProperty("--color-brand-foreground", preset.foregroundRgb);
  document.documentElement.dataset.accent = preset.id;
}

export function applyDefaultAccent() {
  applyAccent(DEFAULT_ACCENT_ID);
}

export function readCachedAccent(userId: string): AccentId | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(accentStorageKey(userId));
  return isAccentId(value) ? value : null;
}

export function cacheAccent(userId: string, accentId: AccentId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(accentStorageKey(userId), accentId);
}

function accentStorageKey(userId: string) {
  return `queryright:accent:${userId}`;
}
