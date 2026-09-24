import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "./services/api";
import Footer from "./components/Footer";
import "./App.css";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Check required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !studentCode ||
      !password ||
      !confirmPassword
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const data = await registerUser({
        firstName,
        lastName,
        email,
        password,
        studentCode,
      });

      console.log("Registration successful:", data);

      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      setFormError(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= HEADER ================= */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-logo" aria-hidden="true">
            <span>A</span>
          </div>

          <div className="brand-text">
            <h1>Attendify</h1>
            <p>SMART ATTENDANCE SYSTEM</p>
          </div>

        </div>

        <button
          type="button"
          className="language-button"
          aria-label="Change language. Current language: English"
        >
          <span>English</span>
          <span className="chevron" aria-hidden="true">⌄</span>
        </button>

      </header>


      {/* ================= REGISTER ================= */}

      <main className="login-area" id="main">

        <div className="login-card register-card">

          <div className="login-logo" aria-hidden="true">
            <span>A</span>
          </div>

          <h2 className="app-name">
            Create Account
          </h2>

          <p className="app-description">
            Join the Attendify Smart Campus
          </p>


          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}

            {/* FIRST + LAST NAME */}

            <div className="register-row">

              <div className="form-group">

                <label htmlFor="reg-first-name">
                  First Name
                </label>

                <div className="input-container">

                  <input
                    id="reg-first-name"
                    type="text"
                    placeholder="First name"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                  />

                </div>

              </div>


              <div className="form-group">

                <label htmlFor="reg-last-name">
                  Last Name
                </label>

                <div className="input-container">

                  <input
                    id="reg-last-name"
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                  />

                </div>

              </div>

            </div>


            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="reg-email">
                University Email
              </label>

              <div className="input-container">

                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

            </div>


            {/* UNIVERSITY ID */}

            <div className="form-group">

              <label htmlFor="reg-student-code">
                University ID
              </label>

              <div className="input-container">

                <input
                  id="reg-student-code"
                  type="text"
                  placeholder="Enter your university ID"
                  autoComplete="off"
                  value={studentCode}
                  onChange={(e) =>
                    setStudentCode(e.target.value)
                  }
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="reg-password">
                Password
              </label>

              <div className="input-container">

                <input
                  id="reg-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="show-password"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="reg-confirm-password">
                Confirm Password
              </label>

              <div className="input-container">

                <input
                  id="reg-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="show-password"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  aria-pressed={showConfirmPassword}
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>


            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading}
              aria-busy={loading}
            >

              <span>
                {loading
                  ? "Creating account…"
                  : "Create Account"}
              </span>

            </button>


            {/* LOGIN */}

            <div className="register-login">

              <span>
                Already have an account?
              </span>

              <Link
                to="/"
                className="forgot-password"
              >
                Sign In
              </Link>

            </div>

          </form>

        </div>

      </main>


      {/* ================= FOOTER ================= */}

      <Footer />

    </div>
  );
}

export default Register;