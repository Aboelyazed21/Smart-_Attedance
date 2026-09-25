import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import "./styles/design-tokens.css";
import "./components/Footer.css";
import "./styles/responsive-system.css";
import "./styles/dark-mode.css";
import "./styles/language-toggle.css";
import "./styles/rtl.css";
import { initTheme } from "./utils/theme";
import { LanguageProvider } from "./utils/i18n";
import { PlatformSettingsProvider } from "./utils/platformSettings";
import { ToastHost } from "./components/Toast";

initTheme();

/* Register the PWA service worker (production only). */
try {
  if (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    import.meta.env.PROD
  ) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => {
          /* offline shell is optional */
        });
    });
  }
} catch {
  /* service workers unavailable */
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <PlatformSettingsProvider>
          <App />
          <ToastHost />
        </PlatformSettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);