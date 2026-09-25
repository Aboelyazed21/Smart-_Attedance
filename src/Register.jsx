import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "./services/api";
import { useLanguage } from "./utils/i18n";
import { toast } from "./components/Toast";
import { usePlatformSettings } from "./utils/platformSettings";
import ThemeToggle from "./components/ThemeToggle";
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

/* =========================================================
   CLIENT VALIDATION — mirrors the backend authority in
   src/utils/validation.js. Never the only line of defense.
   ========================================================= */

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidName(value) {
  const text = String(value || "");

  if (text.length < 2 || text.length > 50) {
    return false;
  }

  if (!/^(?:\p{L}.*){2,}$/u.test(text)) {
    return false;
  }

  if (/[0-9@]/.test(text)) {
    return false;
  }

  if (/https?:\/\//i.test(text)) {
    return false;
  }

  return /^[\p{L}\p{M} .'\-]+$/u.test(text);
}

function normalizePhone(value) {
  return String(value || "")
    .trim()
    .replace(/[\s\-().]/g, "")
    .replace(/\+(?=.*\+)/g, "");
}

function isValidEgyptianPhone(normalized) {
  return /^01[012][0-9]{8}$/.test(
    normalized || ""
  );
}

function passwordChecks(value) {
  const text = String(value || "");

  return {
    length: text.length >= 8 && text.length <= 12,
    upper: /[A-Z]/.test(text),
    lower: /[a-z]/.test(text),
    number: /[0-9]/.test(text),
    special: /[!@#$%^&*_\-.?]/.test(text),
  };
}

function isValidPassword(value) {
  const checks = passwordChecks(value);

  return (
    checks.length &&
    checks.upper &&
    checks.lower &&
    checks.number &&
    checks.special
  );
}

function passwordStrength(value) {
  const text = String(value || "");

  if (!text) {
    return "empty";
  }

  let score = 0;

  if (text.length >= 8) score += 1;
  if (/[A-Z]/.test(text)) score += 1;
  if (/[a-z]/.test(text)) score += 1;
  if (/[0-9]/.test(text)) score += 1;
  if (/[!@#$%^&*_\-.?]/.test(text)) score += 1;

  if (text.length > 12) {
    return "weak";
  }

  if (score <= 2) return "weak";
  if (score <= 4) return "fair";

  return "strong";
}

function Register() {
  const { t, lang } = useLanguage();
  const { platformName } = usePlatformSettings();
  const navigate = useNavigate();

  const platformInitial =
    String(platformName || "A").trim().charAt(0).toUpperCase() ||
    "A";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const values = useMemo(
    () => ({
      firstName: normalizeName(firstName),
      lastName: normalizeName(lastName),
      email: email.trim(),
      phone: normalizePhone(phone),
      studentCode: studentCode.trim(),
      password,
      confirmPassword,
    }),
    [
      firstName,
      lastName,
      email,
      phone,
      studentCode,
      password,
      confirmPassword,
    ]
  );

  const errors = useMemo(() => {
    const result = {};

    if (!values.firstName) {
      result.firstName = t("reg.firstNameRequired");
    } else if (!isValidName(values.firstName)) {
      result.firstName =
        t("reg.firstNameInvalid");
    }

    if (!values.lastName) {
      result.lastName = t("reg.lastNameRequired");
    } else if (!isValidName(values.lastName)) {
      result.lastName =
        t("reg.lastNameInvalid");
    }

    if (!values.email) {
      result.email = t("reg.emailRequired");
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        values.email
      ) ||
      values.email.length > 255
    ) {
      result.email =
        t("reg.emailInvalid");
    }

    if (!values.phone) {
      result.phone = t("reg.phoneRequired");
    } else if (
      !isValidEgyptianPhone(values.phone)
    ) {
      result.phone = t("reg.phoneError");
    }

    if (!values.studentCode) {
      result.studentCode = t("reg.studentCodeRequired");
    } else if (values.studentCode.length > 50) {
      result.studentCode =
        t("reg.studentCodeInvalid");
    }

    if (!values.password) {
      result.password = t("reg.passwordRequired");
    } else if (!isValidPassword(values.password)) {
      result.password = t("reg.passwordError");
    }

    if (!values.confirmPassword) {
      result.confirmPassword =
        t("reg.confirmRequired");
    } else if (
      values.confirmPassword !== values.password
    ) {
      result.confirmPassword =
        t("reg.passwordMismatch");
    }

    return result;
  }, [values, t]);

  const isValid =
    Object.keys(errors).length === 0;

  const strength = passwordStrength(password);

  function markTouched(name) {
    setTouched((current) =>
      current[name]
        ? current
        : { ...current, [name]: true }
    );
  }

  function handleBlur(name) {
    return () => markTouched(name);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    // Reveal every inline error at submit time.
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      studentCode: true,
      password: true,
      confirmPassword: true,
    });

    const firstError = Object.values(errors)[0];

    if (firstError) {
      setSubmitError(firstError);
      return;
    }

    registerAccount();
  }

  async function registerAccount() {
    try {
      setLoading(true);

      const data = await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        studentCode: values.studentCode,
      });

      console.log("Registration successful:", data);

      toast.success(t("reg.success"));

      // Go back to Login
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      setSubmitError(
        error.message ||
          t("reg.registerFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  function errorFor(name) {
    return touched[name] ? errors[name] : "";
  }

  return (
    <div className="login-page">

      {/* ================= HEADER ================= */}

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

        <ThemeToggle />

      </header>


      {/* ================= REGISTER ================= */}

      <main className="login-area">

        <div className="login-card register-card">

          <div className="login-logo">
            <span aria-hidden="true">{platformInitial}</span>
          </div>

          <h2 className="app-name">
            {t("reg.title")}
          </h2>

          <p className="app-description">
            {lang === "ar"
              ? `انضم إلى ${platformName}`
              : `Join the ${platformName} Smart Campus`}
          </p>


          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {submitError && (
              <div
                className="form-error"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {/* FIRST + LAST NAME */}

            <div className="register-row">

              <div className="form-group">

                <label htmlFor="reg-first-name">
                  {t("reg.firstName")}
                </label>

                <div className="input-container">

                  <span className="input-icon">
                    <AuthIcon name="user" />
                  </span>

                  <input
                    id="reg-first-name"
                    type="text"
                    placeholder={t("reg.firstNamePh")}
                    autoComplete="given-name"
                    aria-invalid={
                      errorFor("firstName")
                        ? "true"
                        : "false"
                    }
                    value={firstName}
                    onChange={(e) =>
                      setFirstName(e.target.value)
                    }
                    onBlur={handleBlur("firstName")}
                  />

                </div>

                {errorFor("firstName") && (
                  <p
                    className="field-error"
                    role="alert"
                  >
                    {errorFor("firstName")}
                  </p>
                )}

              </div>


              <div className="form-group">

                <label htmlFor="reg-last-name">
                  {t("reg.lastName")}
                </label>

                <div className="input-container">

                  <span className="input-icon">
                    <AuthIcon name="user" />
                  </span>

                  <input
                    id="reg-last-name"
                    type="text"
                    placeholder={t("reg.lastNamePh")}
                    autoComplete="family-name"
                    aria-invalid={
                      errorFor("lastName")
                        ? "true"
                        : "false"
                    }
                    value={lastName}
                    onChange={(e) =>
                      setLastName(e.target.value)
                    }
                    onBlur={handleBlur("lastName")}
                  />

                </div>

                {errorFor("lastName") && (
                  <p
                    className="field-error"
                    role="alert"
                  >
                    {errorFor("lastName")}
                  </p>
                )}

              </div>

            </div>


            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="reg-email">
                {t("reg.email")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <AuthIcon name="mail" />
                </span>

                <input
                  id="reg-email"
                  type="email"
                  placeholder={t("reg.emailPh")}
                  autoComplete="email"
                  aria-invalid={
                    errorFor("email")
                      ? "true"
                      : "false"
                  }
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  onBlur={handleBlur("email")}
                />

              </div>

              {errorFor("email") && (
                <p
                  className="field-error"
                  role="alert"
                >
                  {errorFor("email")}
                </p>
              )}

            </div>


            {/* PHONE NUMBER */}

            <div className="form-group">

              <label htmlFor="reg-phone">
                {t("reg.phone")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <AuthIcon name="phone" />
                </span>

                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="01012345678"
                  autoComplete="tel"
                  inputMode="numeric"
                  aria-invalid={
                    errorFor("phone")
                      ? "true"
                      : "false"
                  }
                  aria-describedby="reg-phone-hint"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  onBlur={handleBlur("phone")}
                />

              </div>

              <p
                id="reg-phone-hint"
                className="field-hint"
              >
                {t("reg.phoneHint")}
              </p>

              {errorFor("phone") && (
                <p
                  className="field-error"
                  role="alert"
                >
                  {errorFor("phone")}
                </p>
              )}

            </div>


            {/* UNIVERSITY ID */}

            <div className="form-group">

              <label htmlFor="reg-student-code">
                {t("reg.studentCode")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <AuthIcon name="hash" />
                </span>

                <input
                  id="reg-student-code"
                  type="text"
                  placeholder={t("reg.studentCodePh")}
                  autoComplete="off"
                  aria-invalid={
                    errorFor("studentCode")
                      ? "true"
                      : "false"
                  }
                  value={studentCode}
                  onChange={(e) =>
                    setStudentCode(e.target.value)
                  }
                  onBlur={handleBlur("studentCode")}
                />

              </div>

              {errorFor("studentCode") && (
                <p
                  className="field-error"
                  role="alert"
                >
                  {errorFor("studentCode")}
                </p>
              )}

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="reg-password">
                {t("reg.password")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <AuthIcon name="lock" />
                </span>

                <input
                  id="reg-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={t("reg.passwordPh")}
                  autoComplete="new-password"
                  aria-invalid={
                    errorFor("password")
                      ? "true"
                      : "false"
                  }
                  aria-describedby="reg-password-rules"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  onBlur={handleBlur("password")}
                />

                <button
                  type="button"
                  className="show-password"
                  aria-label={
                    showPassword
                      ? t("reg.hidePassword")
                      : t("reg.showPassword")
                  }
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword
                    ? <AuthIcon name="eyeOff" />
                    : <AuthIcon name="eye" />}
                </button>

              </div>

              <div
                id="reg-password-rules"
                className="password-requirements"
              >

                <p>
                  {t("reg.passwordMustContain")}
                </p>

                <ul>
                  <li
                    data-met={
                      passwordChecks(password).length
                    }
                  >
                    {t("reg.ruleLength")}
                  </li>
                  <li
                    data-met={
                      passwordChecks(password).upper
                    }
                  >
                    {t("reg.ruleUpper")}
                  </li>
                  <li
                    data-met={
                      passwordChecks(password).lower
                    }
                  >
                    {t("reg.ruleLower")}
                  </li>
                  <li
                    data-met={
                      passwordChecks(password).number
                    }
                  >
                    {t("reg.ruleNumber")}
                  </li>
                  <li
                    data-met={
                      passwordChecks(password).special
                    }
                  >
                    {t("reg.ruleSpecial")}
                  </li>
                </ul>

                {password && (
                  <div className="password-strength">
                    <div
                      className="password-strength-bar"
                      data-strength={strength}
                    >
                      <span />
                    </div>
                    <small>
                      {t("reg.strength").replace("{strength}", strength)}
                    </small>
                  </div>
                )}

              </div>

              {errorFor("password") && (
                <p
                  className="field-error"
                  role="alert"
                >
                  {errorFor("password")}
                </p>
              )}

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="reg-confirm-password">
                {t("reg.confirmPassword")}
              </label>

              <div className="input-container">

                <span className="input-icon">
                  <AuthIcon name="lock" />
                </span>

                <input
                  id="reg-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={t("reg.confirmPasswordPh")}
                  autoComplete="new-password"
                  aria-invalid={
                    errorFor("confirmPassword")
                      ? "true"
                      : "false"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  onBlur={handleBlur(
                    "confirmPassword"
                  )}
                />

                <button
                  type="button"
                  className="show-password"
                  aria-label={
                    showConfirmPassword
                      ? t("reg.hidePassword")
                      : t("reg.showPassword")
                  }
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

              {errorFor("confirmPassword") && (
                <p
                  className="field-error"
                  role="alert"
                >
                  {errorFor("confirmPassword")}
                </p>
              )}

            </div>


            {/* CREATE ACCOUNT */}

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading || !isValid}
            >

              <span>
                {loading
                  ? t("reg.creatingAccount")
                  : t("reg.createAccount")}
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
                {t("reg.haveAccount")}
              </span>

              <Link
                to="/"
                className="forgot-password"
              >
                {t("reg.signIn")}
              </Link>

            </div>

          </form>

        </div>

      </main>


      {/* ================= FOOTER ================= */}

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

export default Register;
