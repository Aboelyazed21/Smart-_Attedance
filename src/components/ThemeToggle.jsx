import { useState } from "react";

import { getTheme, setTheme } from "../utils/theme";

function ThemeToggle({ className = "" }) {
  const [theme, setCurrentTheme] = useState(() =>
    typeof document === "undefined"
      ? "light"
      : getTheme()
  );

  function toggle() {
    setCurrentTheme(
      setTheme(
        theme === "dark" ? "light" : "dark"
      )
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={
        className
          ? `theme-toggle ${className}`
          : "theme-toggle"
      }
      onClick={toggle}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      aria-pressed={isDark}
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      {isDark ? (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.6 17.6l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.6 6.4l1.4-1.4" />
        </svg>
      ) : (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
