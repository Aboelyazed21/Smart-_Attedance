import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "./services/api";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !studentCode ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill in all fields");
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      alert("Passwords do not match");
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

      alert(
        "Account created successfully! You can now sign in."
      );

      // Go back to Login
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ================= HEADER ================= */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-logo">
            <span>🎓</span>
          </div>

          <div className="brand-text">
            <h1>Attendify</h1>
            <p>SMART ATTENDANCE SYSTEM</p>
          </div>

        </div>

        <button
          type="button"
          className="language-button"
        >
          <span>English</span>
          <span className="chevron">⌄</span>
        </button>

      </header>


      {/* ================= REGISTER ================= */}

      <main className="login-area">

        <div className="login-card register-card">

          <div className="login-logo">
            <span>🎓</span>
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
          >

            {/* FIRST + LAST NAME */}

            <div className="register-row">

              <div className="form-group">

                <label>
                  First Name
                </label>

                <div className="input-container">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
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

                <label>
                  Last Name
                </label>

                <div className="input-container">

                  <span className="input-icon">
                    👤
                  </span>

                  <input
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

              <label>
                University Email
              </label>

              <div className="input-container">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="email"
                  placeholder="Enter your university email"
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

              <label>
                University ID
              </label>

              <div className="input-container">

                <span className="input-icon">
                  #
                </span>

                <input
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

              <label>
                Password
              </label>

              <div className="input-container">

                <span className="input-icon">
                  🔒
                </span>

                <input
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
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label>
                Confirm Password
              </label>

              <div className="input-container">

                <span className="input-icon">
                  🔒
                </span>

                <input
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
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>


            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading}
            >

              <span>
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </span>

              {!loading && (
                <span className="sign-arrow">
                  →
                </span>
              )}

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

      <footer className="page-footer">

        <div className="tagline">

          <span>
            A Smarter Campus
          </span>

          <span>
            For A Brighter Tomorrow
          </span>

        </div>

        <div className="tagline-line"></div>

        <div className="university-name">
          PORT SAID UNIVERSITY
        </div>

      </footer>

    </div>
  );
}

export default Register;