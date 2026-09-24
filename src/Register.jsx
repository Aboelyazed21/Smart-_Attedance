import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "./services/api";
import "./App.css";

function AuthIcon({ name, size = 17 }) {
  const paths = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    hash: (
      <>
        <path d="M9 3 7 21" />
        <path d="M17 3l-2 18" />
        <path d="M4 8h17" />
        <path d="M3 16h17" />
      </>
    ),

    phone: (
      <>
        <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
      </>
    ),

    eye: (
      <>
        <path d="M3 12a9 9 0 0 1 18 0" />
        <path d="M3 12a9 9 0 0 0 18 0" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    eyeOff: (
      <>
        <path d="M4 4l16 16" />
        <path d="M10.6 5.1A9 9 0 0 1 21 12a13 13 0 0 1-3.2 4.4" />
        <path d="M6.6 6.6A13 13 0 0 0 3 12a9 9 0 0 0 14.9 3.4" />
      </>
    ),

    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // Same rule as the backend: digits with an optional
  // leading "+", 7-15 digits after separators are removed.
  const normalizePhone = (value) =>
    String(value || "")
      .trim()
      .replace(/[\s\-().]/g, "")
      .replace(/\+(?=.*\+)/g, "");

  const isValidPhone = (normalized) =>
    /^\+?[0-9]{7,15}$/.test(normalized || "");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check required fields
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !studentCode.trim() ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill in all fields");
      return;
    }

    const normalizedPhone =
      normalizePhone(phone);

    if (!isValidPhone(normalizedPhone)) {
      alert("Please enter a valid phone number");
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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: normalizedPhone,
        password,
        studentCode: studentCode.trim(),
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
            <span aria-hidden="true">A</span>
          </div>

          <div className="brand-text">
            <h1>Attendify</h1>
            <p>SMART ATTENDANCE SYSTEM</p>
          </div>

        </div>

      </header>


      {/* ================= REGISTER ================= */}

      <main className="login-area">

        <div className="login-card register-card">

          <div className="login-logo">
            <span aria-hidden="true">A</span>
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
                    <AuthIcon name="user" />
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
                    <AuthIcon name="user" />
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
                  <AuthIcon name="mail" />
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


            {/* PHONE NUMBER */}

            <div className="form-group">

              <label>
                Phone Number
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <AuthIcon name="phone" />
                </span>

                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
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
                  <AuthIcon name="hash" />
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
                  <AuthIcon name="lock" />
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
                  {showPassword
                    ? <AuthIcon name="eyeOff" />
                    : <AuthIcon name="eye" />}
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
                  <AuthIcon name="lock" />
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
                  {showConfirmPassword
                    ? <AuthIcon name="eyeOff" />
                    : <AuthIcon name="eye" />}
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
                  <AuthIcon name="arrow" size={19} />
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
