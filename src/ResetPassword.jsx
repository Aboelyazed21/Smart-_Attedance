import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "./services/api";
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
        "This password reset link is invalid."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
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
          "Could not reset the password."
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
            <p>SMART ATTENDANCE SYSTEM</p>
          </div>
        </div>
      </header>

      <main className="login-area">
        <div className="login-card">
          <div className="login-logo">
            <span aria-hidden="true">A</span>
          </div>

          <h2 className="app-name">
            New Password
          </h2>

          <p className="app-description">
            Choose a strong password for your account.
          </p>

          {done ? (
            <div
              className="form-notice"
              role="status"
            >
              <p>
                Your password has been updated
                successfully.
              </p>

              <button
                type="button"
                className="sign-in-button"
                onClick={() => navigate("/")}
              >
                Back to Sign In
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
                    This password reset link is
                    invalid or has expired.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="reset-new">
                  New Password
                </label>

                <div className="input-container">
                  <input
                    id="reset-new"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder="At least 8 characters"
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
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword((open) => !open)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
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
                      Password strength: {strength.label}
                    </small>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reset-confirm">
                  Confirm Password
                </label>

                <div className="input-container">
                  <input
                    id="reset-confirm"
                    type={
                      showPassword ? "text" : "password"
                    }
                    placeholder="Repeat the new password"
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
                    ? "Resetting password..."
                    : "Reset Password"}
                </span>
              </button>

              <div className="register-login">
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => navigate("/")}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <footer className="page-footer">
        <div className="tagline">
          <span>A Smarter Campus</span>
          <span>For A Brighter Tomorrow</span>
        </div>

        <div className="tagline-line"></div>

        <div className="university-name">
          PORT SAID UNIVERSITY
        </div>
      </footer>
    </div>
  );
}

export default ResetPassword;
