import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "./services/api";
import { useLanguage } from "./utils/i18n";
import { usePlatformSettings } from "./utils/platformSettings";
import "./App.css";

function ForgotPassword() {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();
  const navigate = useNavigate();

  const platformInitial =
    String(platformName || "A").trim().charAt(0).toUpperCase() ||
    "A";

  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const value = identifier.trim();

    if (!value) {
      setError(t("pwd.identifierRequired"));
      return;
    }

    setSending(true);
    setError("");

    try {
      const data = await forgotPassword(value);

      setSent(true);
      setError("");

      if (data && data.message) {
        setSent(data.message);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          t("pwd.sendFailed")
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="login-page">
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
      </header>

      <main className="login-area">
        <div className="login-card">
          <div className="login-logo">
            <span aria-hidden="true">{platformInitial}</span>
          </div>

          <h2 className="app-name">
            {t("pwd.title")}
          </h2>

          <p className="app-description">
            {t("pwd.subtitle")}
          </p>

          {sent ? (
            <div
              className="form-notice"
              role="status"
            >
              <p>
                {typeof sent === "string"
                  ? sent
                  : t("pwd.sentFallback")}
              </p>

              <button
                type="button"
                className="sign-in-button"
                onClick={() => navigate("/")}
              >
                {t("pwd.backToSignIn")}
              </button>
            </div>
          ) : (
            <form
              className="login-form"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="forgot-identifier">
                  {t("pwd.identifier")}
                </label>

                <div className="input-container">
                  <input
                    id="forgot-identifier"
                    type="text"
                    placeholder={t("pwd.identifierPh")}
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) =>
                      setIdentifier(event.target.value)
                    }
                    disabled={sending}
                  />
                </div>
              </div>

              {error && (
                <div
                  className="form-error"
                  role="alert"
                >
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="sign-in-button"
                disabled={sending}
              >
                <span>
                  {sending
                    ? t("pwd.sending")
                    : t("pwd.sendLink")}
                </span>
              </button>

              <div className="register-login">
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => navigate("/")}
                >
                  {t("pwd.backToSignIn")}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

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

export default ForgotPassword;
