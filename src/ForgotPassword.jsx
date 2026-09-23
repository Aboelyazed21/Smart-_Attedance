import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "./services/api";
import "./App.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const value = identifier.trim();

    if (!value) {
      setError("Enter your email or university ID.");
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
          "Could not send the reset link. Try again."
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
            Reset Password
          </h2>

          <p className="app-description">
            Enter your account email or university ID and
            we will send you a password reset link.
          </p>

          {sent ? (
            <div
              className="form-notice"
              role="status"
            >
              <p>
                {typeof sent === "string"
                  ? sent
                  : "If the account exists, a password reset link has been sent."}
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
              <div className="form-group">
                <label htmlFor="forgot-identifier">
                  Email or University ID
                </label>

                <div className="input-container">
                  <input
                    id="forgot-identifier"
                    type="text"
                    placeholder="Enter your email or university ID"
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
                    ? "Sending reset link..."
                    : "Send Reset Link"}
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

export default ForgotPassword;
