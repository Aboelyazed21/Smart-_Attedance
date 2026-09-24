import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const savedUser = useMemo(() => getSavedUser(), []);

  // Client mirrors of the backend authority in
  // src/utils/validation.js (backend repo).
  const PASSWORD_ERROR =
    "Password must be 8–12 characters and contain uppercase, lowercase, number, and special character.";

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
          "Could not load your profile."
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
    navigate("/");
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
        "First name, last name, and email are required."
      );
      return;
    }

    if (!isValidName(normalizeName(editForm.firstName))) {
      setSaveError(
        "Please enter a valid first name."
      );
      return;
    }

    if (!isValidName(normalizeName(editForm.lastName))) {
      setSaveError(
        "Please enter a valid last name."
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
        "Phone number must start with 010, 011, or 012 and contain exactly 11 digits."
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
      setSaveNotice("Your profile was updated.");
    } catch (requestError) {
      setSaveError(
        requestError.message ||
          "Could not update your profile."
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
        "Enter your current and new password."
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
      setPasswordError("The new passwords do not match.");
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
        data.message || "Your password was changed."
      );
    } catch (requestError) {
      setPasswordError(
        requestError.message ||
          "Could not change your password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/student/attendance", label: "My Attendance" },
    { path: "/student/scan", label: "Scan Attendance" },
    {
      path: "/student/correction-requests",
      label: "Correction Requests",
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
          aria-label="Go to dashboard"
        >
          <span
            className="brand-icon"
            aria-hidden="true"
          >
            <span className="brand-mark" />
          </span>

          <span className="brand-text">
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </span>
        </button>

        <button
          type="button"
          className="student-profile-mobile-menu"
          aria-label="Open navigation"
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
            aria-label="Close navigation"
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
              {item.label}
            </button>
          ))}
        </nav>

        <div className="top-profile">
          <div className="top-avatar">{getInitials()}</div>

          <div className="top-profile-info">
            <strong>{getFullName()}</strong>
            <span>Student</span>
          </div>

          <button
            type="button"
            className="profile-logout-btn"
            onClick={handleLogout}
          >
            <Icon name="logout" size={15} />
            Logout
          </button>
        </div>
      </header>

      <main className="student-profile-main">
        <div className="profile-page-heading">
          <div>
            <p className="breadcrumb">
              <span>Home</span>
              <span aria-hidden="true">/</span>
              <span>My Profile</span>
            </p>

            <h1>My Profile</h1>

            <p>
              View and manage your personal account
              information.
            </p>
          </div>

          <button
            type="button"
            className="refresh-btn"
            onClick={loadProfile}
            disabled={loading}
          >
            <Icon name="refresh" size={15} />
            {loading ? "Loading" : "Refresh"}
          </button>
        </div>

        {loading && (
          <div
            className="profile-loading"
            aria-live="polite"
          >
            <div className="loading-spinner" aria-hidden="true" />
            <p>Loading profile...</p>
          </div>
        )}

        {!loading && error && (
          <div className="profile-error" role="alert">
            <strong>Profile Error</strong>
            <span>{error}</span>

            <button type="button" onClick={loadProfile}>
              Try Again
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
                    STUDENT ACCOUNT
                  </span>

                  <h2>{getFullName()}</h2>

                  <div className="hero-contact">
                    <span>
                      <Icon name="mail" size={14} />
                      {displayUser.email || "No email"}
                    </span>

                    <span>
                      <Icon name="phone" size={14} />
                      {displayUser.phone || "No phone"}
                    </span>
                  </div>

                  <div className="hero-badges">
                    <span className="badge role">Student</span>

                    <span
                      className={`badge status ${accountStatus}`}
                    >
                      {formatStatus(accountStatus)}
                    </span>

                    <span className="badge code">
                      ID: {studentCode || "Not assigned"}
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
                Edit Profile
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
                  <span>Total Attendance</span>
                  <strong>{attendanceRate}%</strong>
                  <small>Present and late records</small>
                </div>
              </div>

              <div className="profile-stat-card green">
                <span className="profile-stat-icon">
                  <Icon name="calendar" size={18} />
                </span>

                <div>
                  <span>Present</span>
                  <strong>{presentCount}</strong>
                  <small>Classes attended</small>
                </div>
              </div>

              <div className="profile-stat-card orange">
                <span className="profile-stat-icon">
                  <Icon name="clock" size={18} />
                </span>

                <div>
                  <span>Late</span>
                  <strong>{lateCount}</strong>
                  <small>Arrived late</small>
                </div>
              </div>

              <div className="profile-stat-card purple">
                <span className="profile-stat-icon">
                  <Icon name="layers" size={18} />
                </span>

                <div>
                  <span>Records</span>
                  <strong>{recordsCount}</strong>
                  <small>Total records</small>
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
                    <h3>Personal Information</h3>
                    <p>Your basic account details</p>
                  </div>

                  {!editing && (
                    <button
                      type="button"
                      className="small-edit-btn"
                      onClick={startEditing}
                    >
                      Edit
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
                      First Name
                      <input
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleEditChange}
                        required
                        autoComplete="given-name"
                      />
                    </label>

                    <label>
                      Last Name
                      <input
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleEditChange}
                        required
                        autoComplete="family-name"
                      />
                    </label>

                    <label className="form-full">
                      Email Address
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
                      Phone Number
                      <input
                        name="phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        placeholder="01012345678"
                        autoComplete="tel"
                      />
                      <small className="profile-hint">
                        Egyptian mobile starting
                        with 010, 011, or 012.
                      </small>
                    </label>

                    <label>
                      Account Status
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
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                        disabled={saving}
                      >
                        {saving
                          ? "Saving..."
                          : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="information-grid">
                    <div className="info-item">
                      <span>First Name</span>
                      <strong>
                        {displayUser.first_name ||
                          displayUser.firstName ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>Last Name</span>
                      <strong>
                        {displayUser.last_name ||
                          displayUser.lastName ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="info-item info-full">
                      <span>Email Address</span>
                      <strong>
                        {displayUser.email ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>Phone Number</span>
                      <strong>
                        {displayUser.phone ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>Account Status</span>
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
                    <h3>Academic Information</h3>
                    <p>
                      Information linked to your student
                      record
                    </p>
                  </div>
                </div>

                <div className="information-grid">
                  <div className="info-item">
                    <span>Student ID</span>
                    <strong>
                      {studentCode || "Not assigned"}
                    </strong>
                  </div>

                  {department && (
                    <div className="info-item">
                      <span>Department</span>
                      <strong>{department}</strong>
                    </div>
                  )}

                  {level && (
                    <div className="info-item">
                      <span>Level / Year</span>
                      <strong>{level}</strong>
                    </div>
                  )}

                  {!department && !level && (
                    <p className="info-note">
                      Additional academic details are not
                      available for this account yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="side-card security-card">
                <h3>Account Security</h3>

                <p>
                  Keep your account secure by using a
                  strong private password.
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
                      Current Password
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
                      New Password
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
                      Confirm New Password
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
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="save-btn"
                        disabled={changingPassword}
                      >
                        {changingPassword
                          ? "Saving..."
                          : "Change Password"}
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
                    Change Password
                  </button>
                )}
              </div>

              <div className="side-card actions-card">
                <h3>Quick Actions</h3>

                <p>Common account actions</p>

                <button
                  type="button"
                  className="action-button"
                  onClick={() =>
                    navigateAndClose("/student/attendance")
                  }
                >
                  View My Attendance
                  <Icon name="arrow" size={15} />
                </button>

                <button
                  type="button"
                  className="action-button"
                  onClick={() =>
                    navigateAndClose("/student/scan")
                  }
                >
                  Scan Attendance QR
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
                >
                  Correction Requests
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </section>

            <section className="recent-card">
              <div className="recent-header">
                <div>
                  <h3>Recent Activity</h3>
                  <p>Your latest attendance activity</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigateAndClose("/student/attendance")
                  }
                >
                  View All
                  <Icon name="arrow" size={14} />
                </button>
              </div>

              {recentActivity.length === 0 ? (
                <div className="empty-activity">
                  <span className="empty-activity-icon">
                    <Icon name="clock" size={20} />
                  </span>

                  <strong>No recent activity</strong>

                  <span>
                    Your latest attendance actions will
                    appear here.
                  </span>
                </div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((item, index) => {
                    const course =
                      item.course_name ||
                      item.course_code ||
                      "Attendance session";

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
                            Attendance Recorded
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
          2026 Attendify. All rights reserved.
        </span>

        <button type="button" onClick={handleLogout}>
          <Icon name="logout" size={14} />
          Logout
        </button>
      </footer>
    </div>
  );
}