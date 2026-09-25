import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage, LanguageToggle } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";
import NotificationBell from "../../components/NotificationBell";
import "../../components/NotificationBell.css";
import "./StudentProfile.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function Icon({ name, size = 18 }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    scan: (
      <>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 12h16" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),

    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),

    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),

    phone: (
      <>
        <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </>
    ),

    chart: (
      <>
        <path d="M21 12a9 9 0 1 1-9-9" />
        <path d="M12 3v9h9" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 6.3" />
        <path d="M20 5v6h-6" />
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
      {icons[name]}
    </svg>
  );
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return "";

  const raw = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00`
    : raw.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(value) {
  const status = String(value || "recorded").trim().toLowerCase();

  if (!status) return "Recorded";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(value) {
  const status = String(value || "recorded").trim().toLowerCase();

  const known = ["present", "late", "absent", "excused"];

  return known.includes(status) ? status : "recorded";
}

async function requestJson(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Request failed."
    );
  }

  return data;
}

export default function StudentProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { platformName } = usePlatformSettings();
  const savedUser = useMemo(() => getSavedUser(), []);

  // Client mirrors of the backend authority in
  // src/utils/validation.js (backend repo).
  const PASSWORD_ERROR =
    t("stuProfile.passwordRule");

  const normalizeName = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, " ");

  const isValidName = (value) => {
    const text = String(value || "");
    if (text.length < 2 || text.length > 50)
      return false;
    if (!/^(?:\p{L}.*){2,}$/u.test(text))
      return false;
    if (/[0-9@]/.test(text)) return false;
    if (/https?:\/\//i.test(text)) return false;
    return /^[\p{L}\p{M} .'\-]+$/u.test(text);
  };

  const normalizePhone = (value) =>
    String(value || "")
      .trim()
      .replace(/[\s\-().]/g, "")
      .replace(/\+(?=.*\+)/g, "");

  const isValidEgyptianPhone = (normalized) =>
    /^01[012][0-9]{8}$/.test(normalized || "");

  const isValidPassword = (value) => {
    const text = String(value || "");
    return (
      text.length >= 8 &&
      text.length <= 12 &&
      /[A-Z]/.test(text) &&
      /[a-z]/.test(text) &&
      /[0-9]/.test(text) &&
      /[!@#$%^&*_\-.?]/.test(text)
    );
  };
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  useEffect(() => {
    document.body.classList.toggle(
      "student-profile-nav-open",
      sidebarOpen
    );

    return () => {
      document.body.classList.remove(
        "student-profile-nav-open"
      );
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () =>
      window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!saveNotice) return undefined;

    const timer = setTimeout(() => setSaveNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [saveNotice]);

  useEffect(() => {
    if (!passwordNotice) return undefined;

    const timer = setTimeout(
      () => setPasswordNotice(""),
      5000
    );
    return () => clearTimeout(timer);
  }, [passwordNotice]);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const userData = await requestJson(
        "/auth/me",
        token
      );

      setUser(userData.user || null);

      try {
        const studentData = await requestJson(
          "/students/me",
          token
        );

        setStudent(
          studentData.student || studentData || null
        );
      } catch {
        setStudent(null);
      }

      try {
        const attendanceData = await requestJson(
          "/attendance/my",
          token
        );

        setAttendance(
          Array.isArray(attendanceData)
            ? attendanceData
            : Array.isArray(attendanceData.data)
              ? attendanceData.data
              : []
        );
      } catch {
        setAttendance([]);
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          t("stuProfile.loadError")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  const displayUser = user || savedUser || {};

  function getInitials() {
    const first =
      displayUser.first_name ||
      displayUser.firstName ||
      "";
    const last =
      displayUser.last_name ||
      displayUser.lastName ||
      "";

    return `${first.charAt(0)}${last.charAt(0)}`
      .toUpperCase()
      .trim() || "S";
  }

  function getFullName() {
    const full =
      `${displayUser.first_name || displayUser.firstName || ""} ${
        displayUser.last_name || displayUser.lastName || ""
      }`.trim();

    return full || "Student";
  }

  const presentCount = attendance.filter(
    (item) =>
      String(
        item.status || item.attendance_status || ""
      ).toLowerCase() === "present"
  ).length;

  const lateCount = attendance.filter(
    (item) =>
      String(
        item.status || item.attendance_status || ""
      ).toLowerCase() === "late"
  ).length;

  const recordsCount = attendance.length;

  const attendanceRate =
    recordsCount > 0
      ? Math.round(
          ((presentCount + lateCount) / recordsCount) * 100
        )
      : 0;

  const recentActivity = useMemo(
    () => attendance.slice(0, 5),
    [attendance]
  );

  const studentCode =
    student?.student_code || student?.studentCode || "";

  const accountStatus = String(
    displayUser.status || "active"
  ).toLowerCase();

  const department =
    student?.department_name || student?.department || "";

  const level =
    student?.level || student?.academic_level || "";

  function navigateAndClose(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  const isActive = (path) => location.pathname === path;

  function handleLogout() {
    setSidebarOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/logout");
  }

  function startEditing() {
    setEditForm({
      firstName:
        displayUser.first_name ||
        displayUser.firstName ||
        "",
      lastName:
        displayUser.last_name ||
        displayUser.lastName ||
        "",
      email: displayUser.email || "",
      phone: displayUser.phone || "",
    });
    setSaveError("");
    setSaveNotice("");
    setEditing(true);

    document
      .getElementById("personal-information")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    if (
      !editForm.firstName.trim() ||
      !editForm.lastName.trim() ||
      !editForm.email.trim()
    ) {
      setSaveError(
        t("stuProfile.requiredError")
      );
      return;
    }

    if (!isValidName(normalizeName(editForm.firstName))) {
      setSaveError(
        t("stuProfile.firstNameError")
      );
      return;
    }

    if (!isValidName(normalizeName(editForm.lastName))) {
      setSaveError(
        t("stuProfile.lastNameError")
      );
      return;
    }

    const normalizedProfilePhone = normalizePhone(
      editForm.phone
    );

    if (
      normalizedProfilePhone &&
      !isValidEgyptianPhone(normalizedProfilePhone)
    ) {
      setSaveError(
        t("stuProfile.phoneError")
      );
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const data = await requestJson(
        "/auth/me",
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            firstName: normalizeName(editForm.firstName),
            lastName: normalizeName(editForm.lastName),
            email: editForm.email.trim(),
            phone: normalizedProfilePhone || null,
          }),
        }
      );

      if (data.user) {
        setUser(data.user);

        try {
          const saved = getSavedUser() || {};
          localStorage.setItem(
            "user",
            JSON.stringify({ ...saved, ...data.user })
          );
        } catch {
          // Cached header info is optional.
        }
      }

      setEditing(false);
      setSaveNotice(t("stuProfile.saveNotice"));
    } catch (requestError) {
      setSaveError(
        requestError.message ||
          t("stuProfile.saveError")
      );
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSavePassword(event) {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword
    ) {
      setPasswordError(
        t("stuProfile.passwordRequired")
      );
      return;
    }

    if (
      !isValidPassword(passwordForm.newPassword)
    ) {
      setPasswordError(PASSWORD_ERROR);
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError(t("stuProfile.passwordMismatch"));
      return;
    }

    setChangingPassword(true);
    setPasswordError("");

    try {
      const data = await requestJson(
        "/auth/me/password",
        token,
        {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setPasswordNotice(
        data.message || t("stuProfile.passwordNotice")
      );
    } catch (requestError) {
      setPasswordError(
        requestError.message ||
          t("stuProfile.passwordError")
      );
    } finally {
      setChangingPassword(false);
    }
  }

  const navItems = [
    { path: "/dashboard", label: "nav.dashboard" },
    { path: "/student/attendance", label: "nav.myAttendance" },
    { path: "/student/scan", label: "nav.scan" },
    {
      path: "/student/correction-requests",
      label: "nav.corrections",
    },
  ];

  return (
    <div
      className={`student-profile-page ${
        sidebarOpen ? "mobile-nav-open" : ""
      }`}
    >
      <header className="student-topbar">
        <button
          type="button"
          className="student-brand"
          onClick={() => navigateAndClose("/dashboard")}
          aria-label={t("a11y.goDashboard")}
        >
          <span
            className="brand-icon"
            aria-hidden="true"
          >
            <span className="brand-mark" />
          </span>

          <span className="brand-text">
            <strong>{platformName}</strong>
            <span>{t("brand.tagline")}</span>
          </span>
        </button>

        <button
          type="button"
          className="student-profile-mobile-menu"
          aria-label={t("a11y.openNav")}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>

        {sidebarOpen && (
          <button
            type="button"
            className="student-profile-nav-overlay"
            aria-label={t("a11y.closeNav")}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <nav
          className="student-main-nav"
          aria-label="Student pages"
        >
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={isActive(item.path) ? "active" : ""}
              onClick={() => navigateAndClose(item.path)}
            >
              {t(item.label)}
            </button>
          ))}

          <LanguageToggle />
        </nav>

        <div className="top-profile">
          <NotificationBell />
          <div className="top-avatar">{getInitials()}</div>

          <div className="top-profile-info">
            <strong>{getFullName()}</strong>
            <span>{t("role.student")}</span>
          </div>

          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
            aria-label={t("a11y.logout")}
            title={t("action.logout")}
          >
            <Icon name="logout" size={15} />{t("action.logout")}</button>
        </div>
      </header>

      <main className="student-profile-main">
        <div className="profile-page-heading">
          <div>
            <p className="breadcrumb">
              <span>{t("nav.home")}</span>
              <span aria-hidden="true">/</span>
              <span>{t("stuProfile.title")}</span>
            </p>

            <h1>{t("stuProfile.title")}</h1>

            <p>
              {t("stuProfile.headingSub")}
            </p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={loadProfile}
            disabled={loading}
          >
            <Icon name="refresh" size={15} />
            {loading ? t("stuProfile.loading") : t("action.refresh")}
          </button>
        </div>

        {loading && (
          <div
            className="profile-loading"
            aria-live="polite"
          >
            <div className="loading-spinner" aria-hidden="true" />
            <p>{t("stuProfile.loadingProfile")}</p>
          </div>
        )}

        {!loading && error && (
          <div className="profile-error" role="alert">
            <strong>{t("stuProfile.errorTitle")}</strong>
            <span>{error}</span>

            <button type="button" onClick={loadProfile}>
              {t("stuProfile.tryAgain")}
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="profile-hero">
              <div className="hero-left">
                <div className="hero-avatar">
                  {getInitials()}
                  <span
                    className="avatar-status"
                    aria-hidden="true"
                  />
                </div>

                <div className="hero-user-info">
                  <span className="hero-label">
                    {t("stuProfile.accountLabel")}
                  </span>

                  <h2>{getFullName()}</h2>

                  <div className="hero-contact">
                    <span>
                      <Icon name="mail" size={14} />
                      {displayUser.email || t("stuProfile.noEmail")}
                    </span>

                    <span>
                      <Icon name="phone" size={14} />
                      {displayUser.phone || t("stuProfile.noPhone")}
                    </span>
                  </div>

                  <div className="hero-badges">
                    <span className="badge role">{t("role.student")}</span>

                    <span
                      className={`badge status ${accountStatus}`}
                    >
                      {formatStatus(accountStatus)}
                    </span>

                    <span className="badge code">
                      {t("stuProfile.idLabel").replace("{n}", studentCode || t("stuProfile.notAssigned"))}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="edit-profile-btn"
                onClick={startEditing}
              >
                <Icon name="edit" size={15} />
                {t("stuProfile.editProfile")}
              </button>
            </section>

            <section
              className="profile-stats"
              aria-label="Attendance statistics"
            >
              <div className="profile-stat-card blue">
                <span className="profile-stat-icon">
                  <Icon name="chart" size={18} />
                </span>

                <div>
                  <span>{t("stuProfile.totalLabel")}</span>
                  <strong>{attendanceRate}%</strong>
                  <small>{t("stuProfile.totalHint")}</small>
                </div>
              </div>

              <div className="profile-stat-card green">
                <span className="profile-stat-icon">
                  <Icon name="calendar" size={18} />
                </span>

                <div>
                  <span>{t("stuProfile.presentLabel")}</span>
                  <strong>{presentCount}</strong>
                  <small>{t("stuProfile.presentHint")}</small>
                </div>
              </div>

              <div className="profile-stat-card orange">
                <span className="profile-stat-icon">
                  <Icon name="clock" size={18} />
                </span>

                <div>
                  <span>{t("stuProfile.lateLabel")}</span>
                  <strong>{lateCount}</strong>
                  <small>{t("stuProfile.lateHint")}</small>
                </div>
              </div>

              <div className="profile-stat-card purple">
                <span className="profile-stat-icon">
                  <Icon name="layers" size={18} />
                </span>

                <div>
                  <span>{t("stuProfile.recordsLabel")}</span>
                  <strong>{recordsCount}</strong>
                  <small>{t("stuProfile.recordsHint")}</small>
                </div>
              </div>
            </section>

            <section className="profile-content-grid">
              <div
                className="profile-card personal-card"
                id="personal-information"
              >
                <div className="card-header">
                  <div>
                    <h3>{t("stuProfile.personalTitle")}</h3>
                    <p>{t("stuProfile.personalSub")}</p>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      className="small-edit-btn"
                      onClick={startEditing}
                    >
                      {t("stuProfile.editBtn")}
                    </button>
                  )}
                </div>

                {saveNotice && (
                  <p className="form-notice" role="status">
                    {saveNotice}
                  </p>
                )}

                {editing ? (
                  <form
                    className="profile-form"
                    onSubmit={handleSaveProfile}
                  >
                    <label>
                      {t("stuProfile.firstName")}
                      <input
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleEditChange}
                        required
                        autoComplete="given-name"
                      />
                    </label>

                    <label>
                      {t("stuProfile.lastName")}
                      <input
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleEditChange}
                        required
                        autoComplete="family-name"
                      />
                    </label>

                    <label className="form-full">
                      {t("stuProfile.email")}
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        required
                        autoComplete="email"
                      />
                    </label>

                    <label>
                      {t("stuProfile.phone")}
                      <input
                        name="phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        placeholder="01012345678"
                        autoComplete="tel"
                      />
                      <small className="profile-hint">
                        {t("stuProfile.phoneHint")}
                      </small>
                    </label>

                    <label>
                      {t("stuProfile.accountStatus")}
                      <input
                        value={formatStatus(accountStatus)}
                        disabled
                      />
                    </label>

                    {saveError && (
                      <p
                        className="form-error"
                        role="alert"
                      >
                        {saveError}
                      </p>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-btn"
                        disabled={saving}
                        onClick={() => {
                          setEditing(false);
                          setSaveError("");
                        }}
                      >
                        {t("stuProfile.cancelBtn")}
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                        disabled={saving}
                      >
                        {saving
                          ? t("stuProfile.saving")
                          : t("stuProfile.saveBtn")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="information-grid">
                    <div className="info-item">
                      <span>{t("stuProfile.firstName")}</span>
                      <strong>
                        {displayUser.first_name ||
                          displayUser.firstName ||
                          t("stuProfile.notProvided")}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>{t("stuProfile.lastName")}</span>
                      <strong>
                        {displayUser.last_name ||
                          displayUser.lastName ||
                          t("stuProfile.notProvided")}
                      </strong>
                    </div>

                    <div className="info-item info-full">
                      <span>{t("stuProfile.email")}</span>
                      <strong>
                        {displayUser.email ||
                          t("stuProfile.notProvided")}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>{t("stuProfile.phone")}</span>
                      <strong>
                        {displayUser.phone ||
                          t("stuProfile.notProvided")}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>{t("stuProfile.accountStatus")}</span>
                      <strong>
                        <span
                          className={`badge status ${accountStatus}`}
                        >
                          {formatStatus(accountStatus)}
                        </span>
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-card academic-card">
                <div className="card-header">
                  <div>
                    <h3>{t("stuProfile.academicTitle")}</h3>
                    <p>
                      {t("stuProfile.academicSub")}
                    </p>
                  </div>
                </div>

                <div className="information-grid">
                  <div className="info-item">
                    <span>{t("stuProfile.studentId")}</span>
                    <strong>
                      {studentCode || t("stuProfile.notAssigned")}
                    </strong>
                  </div>

                  {department && (
                    <div className="info-item">
                      <span>{t("stuProfile.department")}</span>
                      <strong>{department}</strong>
                    </div>
                  )}

                  {level && (
                    <div className="info-item">
                      <span>{t("stuProfile.level")}</span>
                      <strong>{level}</strong>
                    </div>
                  )}

                  {!department && !level && (
                    <p className="info-note">
                      {t("stuProfile.academicEmpty")}
                    </p>
                  )}
                </div>
              </div>

              <div className="side-card security-card">
                <h3>{t("stuProfile.securityTitle")}</h3>

                <p>
                  {t("stuProfile.securityText")}
                </p>

                {passwordNotice && (
                  <p
                    className="form-notice"
                    role="status"
                  >
                    {passwordNotice}
                  </p>
                )}

                {showPasswordForm ? (
                  <form
                    className="profile-form"
                    onSubmit={handleSavePassword}
                  >
                    <label className="form-full">
                      {t("stuProfile.currentPassword")}
                      <input
                        type="password"
                        name="currentPassword"
                        value={
                          passwordForm.currentPassword
                        }
                        onChange={handlePasswordChange}
                        required
                        autoComplete="current-password"
                      />
                    </label>

                    <label className="form-full">
                      {t("stuProfile.newPassword")}
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                    </label>

                    <label className="form-full">
                      {t("stuProfile.confirmPassword")}
                      <input
                        type="password"
                        name="confirmPassword"
                        value={
                          passwordForm.confirmPassword
                        }
                        onChange={handlePasswordChange}
                        required
                        autoComplete="new-password"
                      />
                    </label>

                    {passwordError && (
                      <p
                        className="form-error"
                        role="alert"
                      >
                        {passwordError}
                      </p>
                    )}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-btn"
                        disabled={changingPassword}
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordError("");
                          setPasswordForm({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        {t("stuProfile.cancelBtn")}
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                        disabled={changingPassword}
                      >
                        {changingPassword
                          ? t("stuProfile.saving")
                          : t("stuProfile.changePassword")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError("");
                      setShowPasswordForm(true);
                    }}
                  >
                    {t("stuProfile.changePassword")}
                  </button>
                )}
              </div>

              <div className="side-card actions-card">
                <h3>{t("stuProfile.quickTitle")}</h3>

                <p>{t("stuProfile.quickSub")}</p>

                <button
                  type="button"
                  className="action-button"
                  onClick={() =>
                    navigateAndClose("/student/attendance")
                  }
                >
                  {t("stuProfile.viewAttendance")}
                  <Icon name="arrow" size={15} />
                </button>

                <button
                  type="button"
                  className="action-button"
                  onClick={() =>
                    navigateAndClose("/student/scan")
                  }
                >
                  {t("stuProfile.scanQr")}
                  <Icon name="arrow" size={15} />
                </button>

                <button
                  type="button"
                  className="action-button"
                  onClick={() =>
                    navigateAndClose(
                      "/student/correction-requests"
                    )
                  }
                >{t("nav.corrections")}<Icon name="arrow" size={15} />
                </button>
              </div>
            </section>

            <section className="recent-card">
              <div className="recent-header">
                <div>
                  <h3>{t("stuProfile.recentTitle")}</h3>
                  <p>{t("stuProfile.recentSub")}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigateAndClose("/student/attendance")
                  }
                >{t("stuProfile.viewAll")}<Icon name="arrow" size={14} />
                </button>
              </div>

              {recentActivity.length === 0 ? (
                <div className="empty-activity">
                  <span className="empty-activity-icon">
                    <Icon name="clock" size={20} />
                  </span>

                  <strong>{t("stuProfile.noActivity")}</strong>

                  <span>
                    {t("stuProfile.noActivityText")}
                  </span>
                </div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((item, index) => {
                    const course =
                      item.course_name ||
                      item.course_code ||
                      t("stuProfile.sessionFallback");

                    const when = formatDateTime(
                      item.scanned_at || item.session_date
                    );

                    return (
                      <div
                        className="activity-row"
                        key={item.id || `${when}-${index}`}
                      >
                        <div>
                          <strong>
                            {t("stuProfile.recordedLabel")}
                          </strong>
                          <span>{course}</span>
                          {when && <small>{when}</small>}
                        </div>

                        <span
                          className={`activity-status ${statusClass(
                            item.status ||
                              item.attendance_status
                          )}`}
                        >
                          {formatStatus(
                            item.status ||
                              item.attendance_status
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="profile-footer">
        <span>
          © {new Date().getFullYear()} {platformName}.{" "}
          {lang === "ar"
            ? "جميع الحقوق محفوظة."
            : "All rights reserved."}
        </span>

        <button type="button" onClick={handleLogout}>
          <Icon name="logout" size={14} />{t("action.logout")}</button>
      </footer>
    </div>
  );
}