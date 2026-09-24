import { useState } from "react";
import { Link } from "react-router-dom";

import Footer from "./components/Footer";
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
          <span>
            English
          </span>

          <span className="chevron" aria-hidden="true">
            ⌄
          </span>
        </button>

      </header>


      {/* LOGIN */}

      <main className="login-area" id="main">

        <div className="login-card">

          {/* LOGO */}

          <div className="login-logo" aria-hidden="true">
            <span>A</span>
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
            noValidate
          >

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="login-email">
                Email or University ID
              </label>

              <div className="input-container">

                <input
                  id="login-email"
                  type="text"
                  placeholder="Email or University ID"
                  autoComplete="username"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="login-password">
                Password
              </label>

              <div className="input-container">

                <input
                  id="login-password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
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

            </button>


            {/* OR */}

            <div className="or-divider">

              <span aria-hidden="true"></span>

              <p>
                OR
              </p>

              <span aria-hidden="true"></span>

            </div>


            {/* CREATE ACCOUNT */}

            <Link
              to="/register"
              className="create-account-button"
            >

              <span>
                Create an Account
              </span>

            </Link>

          </form>

        </div>

      </main>


      <Footer />

    </div>
  );
}

export default Login;
