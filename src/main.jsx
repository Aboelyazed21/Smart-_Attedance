import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import "./components/Footer.css";
import "./styles/responsive-system.css";
import "./styles/dark-mode.css";
import "./styles/language-toggle.css";
import "./styles/rtl.css";
import { initTheme } from "./utils/theme";
import { LanguageProvider } from "./utils/i18n";

initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);