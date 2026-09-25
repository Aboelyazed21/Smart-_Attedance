import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./utils/i18n";
import { usePlatformSettings } from "./utils/platformSettings";

import "./App.css";

function Login() {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();

  const platformInitial =
    String(platformName || "A").trim().charAt(0).toUpperCase() ||
    "A";
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Login submitted");
  };

  return (
    <div className="login-page">

      {/* HEADER */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-logo">
            <span aria-hidden="true">{platformInitial}</span>
          </div>

          <div className="brand-text">
            <h1>{platformName}</h1>
            <p>{t("brand.tagline")}</p>
          </div>

        </div>


        <button
          type="button"
          className="language-button"
        >
          <span className="globe">
            ◎
          </span>

          <span>
            {t("login.language")}
          </span>

          <span className="chevron">
            ⌄
          </span>
        </button>

      </header>


      {/* LOGIN */}

      <main className="login-area">

        <div className="login-card">

          {/* LOGO */}

          <div className="login-logo">
            <span aria-hidden="true">{platformInitial}</span>
          </div>


          {/* TITLE */}

          <h2 className="app-name">
            {platformName}
          </h2>

          <p className="app-description">
            {t("auth.system")}
          </p>


          {/* WELCOME */}

          <div className="welcome-section">

            <h3>
              {t("auth.welcome")}
            </h3>

            <p>
              {t("auth.subtitle")}
            </p>

          </div>


          {/* FORM */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}

            <div className="form-group">

              <label>
                {t("auth.identifier")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m4 7 8 6 8-6" />
                  </svg>
                </span>

                <input
                  type="text"
                  placeholder={t("auth.identifierPh")}
                  autoComplete="username"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                {t("auth.password")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={t("auth.password")}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>


            {/* FORGOT */}

            <div className="forgot-container">

              <button
                type="button"
                className="forgot-password"
              >
                {t("auth.forgot")}
              </button>

            </div>


            {/* SIGN IN */}

            <button
              type="submit"
              className="sign-in-button"
            >

              <span>
                {t("auth.signIn")}
              </span>

              <span className="sign-arrow">
                →
              </span>

            </button>


            {/* OR */}

            <div className="or-divider">

              <span></span>

              <p>
                {t("login.or")}
              </p>

              <span></span>

            </div>


            {/* CREATE ACCOUNT */}

            <Link
              to="/register"
              className="create-account-button"
            >

              <span className="create-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>

              <span>
                {t("auth.createAccount")}
              </span>

            </Link>

          </form>

        </div>

      </main>


      {/* FOOTER */}

      <footer className="page-footer">

        <div className="page-footer-copy">
          {t("footer.copy")}
        </div>

        <div className="page-footer-uni">
          {t("footer.uni")}
        </div>

      </footer>

    </div>
  );
}

export default Login;
