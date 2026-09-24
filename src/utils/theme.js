// ============================================================
// THEME — single Attendify theme system.
// Persisted in localStorage, applied as data-theme on
// <html>. Default is light. No backend, no context needed;
// components re-render through the toggle's local state.
// ============================================================

const STORAGE_KEY = "attendify-theme";

export function getTheme() {
  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (
      stored === "dark" ||
      stored === "light"
    ) {
      return stored;
    }
  } catch {
    // Private mode: fall through to light.
  }

  return "light";
}

export function setTheme(theme) {
  const value =
    theme === "dark" ? "dark" : "light";

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage unavailable: theme still applies to the page.
  }

  document.documentElement.dataset.theme = value;

  return value;
}

export function initTheme() {
  document.documentElement.dataset.theme =
    getTheme();
}
