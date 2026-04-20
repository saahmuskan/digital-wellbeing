const THEME_KEY = "wellifyTheme";

export const THEME_OPTIONS = [
  { id: "default", name: "OG Wellify", subtitle: "Fresh core vibe" },
  { id: "zen-mode", name: "Zen Vibes", subtitle: "Calm but classy" },
  { id: "focus-flow", name: "Lock-In Mode", subtitle: "Peak focus energy" },
  { id: "aura-theme", name: "Aura Drip ✨", subtitle: "Soft glow flex" },
  { id: "mindspace", name: "Mind Lounge", subtitle: "Chill brain zone" },
  { id: "balance-mode", name: "Balance Flex", subtitle: "Clean neutral mood" },
  { id: "soft-pink", name: "Blush Pop", subtitle: "Cute and cozy" },
  { id: "blue-relax", name: "Blue Chill", subtitle: "Cool and clear" },
  { id: "dark-calm", name: "Midnight Mellow", subtitle: "Dark calm aesthetic" },
  { id: "sunset-amber", name: "Sunset Glow", subtitle: "Golden hour feels" },
];

function normalizeTheme(themeId) {
  if (!themeId) return "default";
  if (themeId === "rose-dawn") return "zen-mode";
  if (themeId === "calm-green") return "zen-mode";
  if (themeId === "mint-light") return "zen-mode";
  if (themeId === "lavender-mist") return "zen-mode";
  if (themeId === "stone-slate") return "zen-mode";
  if (themeId === "forest-veil") return "zen-mode";
  return THEME_OPTIONS.some((theme) => theme.id === themeId) ? themeId : "default";
}

export function getSavedTheme() {
  return normalizeTheme(localStorage.getItem(THEME_KEY));
}

export function applyTheme(themeId) {
  const normalized = normalizeTheme(themeId);
  const root = document.documentElement;

  if (normalized === "default") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", normalized);
  }

  localStorage.setItem(THEME_KEY, normalized);
  return normalized;
}
