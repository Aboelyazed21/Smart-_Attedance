import { useState } from "react";
import { Link } from "react-router-dom";

import "./App.css";

function Login() {
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
          <span className="globe">
            ◎
          </span>

          <span>
            English
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
            <span>🎓</span>
          </div>


          {/* TITLE */}

          <h2 className="app-name">
            Attendify
          </h2>

          <p className="app-description">
            Smart Attendance System
          </p>


          {/* WELCOME */}

          <div className="welcome-section">

            <h3>
              Welcome Back
            </h3>

            <p>
              Sign in to your account
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
                University Email or University ID
              </label>

              <div className="input-container">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="text"
                  placeholder="Enter your university email or university ID"
                  autoComplete="username"
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
                  placeholder="Password"
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
                Forgot password?
              </button>

            </div>


            {/* SIGN IN */}

            <button
              type="submit"
              className="sign-in-button"
            >

              <span>
                Sign In
              </span>

              <span className="sign-arrow">
                →
              </span>

            </button>


            {/* OR */}

            <div className="or-divider">

              <span></span>

              <p>
                OR
              </p>

              <span></span>

            </div>


            {/* CREATE ACCOUNT */}

            <Link
              to="/register"
              className="create-account-button"
            >

              <span className="create-icon">
                ♙+
              </span>

              <span>
                Create an Account
              </span>

            </Link>

          </form>

        </div>

      </main>


      {/* FOOTER */}

      <footer className="page-footer">

        <div className="page-footer-copy">
          © Aboelyazed Hatem Aboelyazed
        </div>

        <div className="page-footer-uni">
          Badr University in Assiut
        </div>

      </footer>

    </div>
  );
}

export default Login;