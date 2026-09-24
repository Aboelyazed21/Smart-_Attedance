import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "./services/api";
import { useLanguage } from "./utils/i18n";
import "./App.css";

function getQueryToken() {
  try {
    return (
      new URLSearchParams(window.location.search).get(
        "token"
      ) || ""
    );
  } catch {
    return "";
  }
}

function checkStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) {
    score += 1;
  }
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: "Weak", tone: "weak" };
  }

  if (score === 2) {
    return { label: "Fair", tone: "fair" };
  }

  if (score === 3) {
    return { label: "Good", tone: "good" };
  }

  return { label: "Strong", tone: "strong" };
}

function ResetPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const token = useMemo(() => getQueryToken(), []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const strength = checkStrength(newPassword);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError(
        t("pwd.invalidLink")
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        t("pwd.passwordMin")
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("pwd.passwordMismatch"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          t("pwd.resetFailed")
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-page">
      <header className="top-header">
        <div className="brand">
          <div className="brand-logo">
            <span aria-hidden="true">A</span>
          </div>

          <div className="brand-text">
            <h1>Attendify</h1>
            <p>{t("brand.tagline")}</p>
          </div>
        </div>
      </header>

      <main className="login-area">
        <div className="login-card">
          <div className="login-logo">
            <span aria-hidden="true">A</span>
          </div>

          <h2 className="app-name">
            {t("pwd.newPasswordTitle")}
          </h2>

          <p className="app-description">
            {t("pwd.newPasswordSubtitle")}
          </p>

          {done ? (
            <div
              className="form-notice"
              role="status"
            >
              <p>
                {t("pwd.success")}
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
              {!token && (
                <div
                  className="form-error"
                  role="alert"
                >
                  <p>
                    {t("pwd.invalidOrExpired")}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reset-new">
                  {t("pwd.newPassword")}
                </label>

                <div className="input-container">
                  <input
                    id="reset-new"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder={t("pwd.newPasswordPh")}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    disabled={saving}
                  />

                  <button
                    type="button"
                    className="show-password"
                    aria-label={
                      showPassword
                        ? t("pwd.hidePassword")
                        : t("pwd.showPassword")
                    }
                    onClick={() =>
                      setShowPassword((open) => !open)
                    }
                  >
                    {showPassword ? t("pwd.hide") : t("pwd.show")}
                  </button>
                </div>

                {newPassword && (
                  <div
                    className={`password-strength ${strength.tone}`}
                    aria-live="polite"
                  >
                    <span />
                    <span />
                    <span />
                    <span />
                    <small>
                      {t("pwd.strength").replace("{strength}", strength.label)}
                    </small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reset-confirm">
                  {t("pwd.confirmPassword")}
                </label>

                <div className="input-container">
                  <input
                    id="reset-confirm"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder={t("pwd.confirmPasswordPh")}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    disabled={saving}
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
                disabled={saving || !token}
              >
                <span>
                  {saving
                    ? t("pwd.resetting")
                    : t("pwd.resetPassword")}
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

export default ResetPassword;
