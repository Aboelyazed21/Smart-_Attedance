import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Register from "./Register";

import AdminDashboard from "./pages/dashboard/AdminDashboard";
import Users from "./pages/admin/Users";
import Courses from "./pages/admin/Courses";
import CourseDetails from "./pages/admin/CourseDetails";
import Sections from "./pages/admin/Sections";
import Rooms from "./pages/admin/Rooms";
import Timetable from "./pages/admin/Timetable";
import Attendance from "./pages/admin/Attendance";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import AdminLayout from "./components/admin/AdminLayout";

import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import LecturerSessions from "./pages/lecturer/LecturerSessions";
import LecturerQRSession from "./pages/lecturer/LecturerQRSession";
import LecturerLayout from "./components/lecturer/LecturerLayout";
import LecturerAttendance from "./pages/lecturer/LecturerAttendance";
import LecturerReports from "./pages/lecturer/LecturerReports";

import AttendanceScanner from "./pages/student/AttendanceScanner";
import StudentAttendance from "./pages/student/StudentAttendance";
import AttendanceConfirmation from "./pages/student/AttendanceConfirmation";
import CorrectionRequests from "./pages/student/CorrectionRequests";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";

import { loginUser } from "./services/api";

import "./App.css";
import "./pages/student/StudentDashboard.css";

/* =========================================================
   GET SAVED USER
========================================================= */

function getSavedUser() {
  try {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    return null;
  }
}

/* =========================================================
   ADMIN AUTH CHECK
========================================================= */

function isAdminAuthenticated() {
  const user = getSavedUser();

  if (!user) {
    return false;
  }

  const role = String(
    user.role_name ||
      user.role ||
      user.roleName ||
      ""
  )
    .toLowerCase()
    .trim();

  return (
    role === "admin" ||
    role === "administrator"
  );
}

/* =========================================================
   LECTURER AUTH CHECK
========================================================= */

function isLecturerAuthenticated() {
  const user = getSavedUser();

  if (!user) {
    return false;
  }

  const role = String(
    user.role_name ||
      user.role ||
      ""
  )
    .toLowerCase()
    .trim();

  return (
    role === "lecturer" ||
    role === "instructor"
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const location = useLocation();

  /* =========================================================
     REGISTER
  ========================================================= */

  if (location.pathname === "/register") {
    return <Register />;
  }

  /* =========================================================
     ADMIN USERS
  ========================================================= */

  if (location.pathname === "/admin/users") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Users />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN COURSES
  ========================================================= */

  if (location.pathname === "/admin/courses") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Courses />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN COURSE DETAILS
  ========================================================= */

  const courseDetailsMatch =
    location.pathname.match(
      /^\/admin\/courses\/(\d+)$/
    );

  if (courseDetailsMatch) {
    const user = getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role = String(
      user.role_name ||
        user.role ||
        ""
    )
      .toLowerCase()
      .trim();

    if (
      role !== "admin" &&
      role !== "administrator" &&
      role !== "lecturer" &&
      role !== "instructor"
    ) {
      return <Login />;
    }

    if (
      role === "admin" ||
      role === "administrator"
    ) {
      return (
        <AdminLayout>
          <CourseDetails />
        </AdminLayout>
      );
    }

    return <CourseDetails />;
  }

  /* =========================================================
     ADMIN SECTIONS
  ========================================================= */

  if (location.pathname === "/admin/sections") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Sections />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN ROOMS
  ========================================================= */

  if (location.pathname === "/admin/rooms") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Rooms />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN TIMETABLE
  ========================================================= */

  if (location.pathname === "/admin/timetable") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Timetable />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN ATTENDANCE
  ========================================================= */

  if (location.pathname === "/admin/attendance") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Attendance />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN REPORTS
  ========================================================= */

  if (location.pathname === "/admin/reports") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Reports />
      </AdminLayout>
    );
  }

  /* =========================================================
     ADMIN SETTINGS
  ========================================================= */

  if (location.pathname === "/admin/settings") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <Settings />
      </AdminLayout>
    );
  }

  /* =========================================================
     LECTURER QR ATTENDANCE SESSION
  ========================================================= */

  if (
    location.pathname.startsWith(
      "/lecturer/sessions/"
    )
  ) {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return (
      <LecturerLayout>
        <LecturerQRSession />
      </LecturerLayout>
    );
  }

  /* =========================================================
     LECTURER ATTENDANCE SESSIONS
  ========================================================= */

  if (location.pathname === "/lecturer/sessions") {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return (
      <LecturerLayout>
        <LecturerSessions />
      </LecturerLayout>
    );
  }

  /* =========================================================
     LECTURER SECTIONS
  ========================================================= */

  if (location.pathname === "/lecturer/sections") {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return (
      <LecturerLayout>
        <LecturerSections />
      </LecturerLayout>
    );
  }

  /* =========================================================
     LECTURER ATTENDANCE
  ========================================================= */

  if (location.pathname === "/lecturer/attendance") {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return (
      <LecturerLayout>
        <LecturerAttendance />
      </LecturerLayout>
    );
  }

  /* =========================================================
     LECTURER REPORTS
  ========================================================= */

  if (location.pathname === "/lecturer/reports") {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return (
      <LecturerLayout>
        <LecturerReports />
      </LecturerLayout>
    );
  }

  /* =========================================================
     STUDENT ATTENDANCE SCANNER
  ========================================================= */

  if (location.pathname === "/student/scan") {
    const user = getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role = String(
      user.role_name ||
        user.role ||
        ""
    )
      .toLowerCase()
      .trim();

    if (role !== "student") {
      return <Login />;
    }

    return <AttendanceScanner />;
  }

  /* =========================================================
     STUDENT ATTENDANCE
  ========================================================= */

  if (location.pathname === "/student/attendance") {
    const user = getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role = String(
      user.role_name ||
        user.role ||
        ""
    )
      .toLowerCase()
      .trim();

    if (role !== "student") {
      return <Login />;
    }

    return <StudentAttendance />;
  }

  /* =========================================================
     STUDENT CORRECTION REQUESTS
  ========================================================= */

  if (
    location.pathname ===
    "/student/correction-requests"
  ) {
    const user = getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role = String(
      user.role_name ||
        user.role ||
        ""
    )
      .toLowerCase()
      .trim();

    if (role !== "student") {
      return <Login />;
    }

    return <CorrectionRequests />;
  }

  /* =========================================================
     STUDENT ATTENDANCE CONFIRMATION
  ========================================================= */

  if (
    location.pathname ===
    "/student/attendance-confirmed"
  ) {
    const user = getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role = String(
      user.role_name ||
        user.role ||
        ""
    )
      .toLowerCase()
      .trim();

    if (role !== "student") {
      return <Login />;
    }

    return <AttendanceConfirmation />;
  }

  /* =========================================================
     ADMIN ENROLLMENT MANAGEMENT
  ========================================================= */

  if (
    location.pathname ===
    "/admin/enrollments"
  ) {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return (
      <AdminLayout>
        <EnrollmentManagement />
      </AdminLayout>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  if (location.pathname === "/dashboard") {
    const user = getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role = String(
      user.role_name ||
        user.role ||
        ""
    )
      .toLowerCase()
      .trim();

    if (
      role === "admin" ||
      role === "administrator"
    ) {
      return (
        <AdminLayout>
          <AdminDashboard />
        </AdminLayout>
      );
    }

    if (
      role === "lecturer" ||
      role === "instructor"
    ) {
      return (
        <LecturerLayout>
          <LecturerDashboard />
        </LecturerLayout>
      );
    }

    return <StudentDashboard />;
  }

  /* =========================================================
     LOGIN
  ========================================================= */

  return <Login />;
}

/* =========================================================
   LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert(
        "Please enter email and password"
      );

      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(
        email,
        password
      );

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      console.log(
        "Login successful:",
        data.user
      );

      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      alert(
        error.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="top-header">

        <div className="brand">

          <div className="brand-logo">
            <span>🎓</span>
          </div>

          <div className="brand-text">
            <h1>
              Attendify
            </h1>

            <p>
              SMART ATTENDANCE SYSTEM
            </p>
          </div>

        </div>

        <button
          type="button"
          className="language-button"
        >
          <span>
            English
          </span>

          <span className="chevron">
            ⌄
          </span>
        </button>

      </header>

      {/* =====================================================
          LOGIN
      ===================================================== */}

      <main className="login-area">

        <div className="login-card">

          <div className="login-logo">
            <span>🎓</span>
          </div>

          <h2 className="app-name">
            Attendify
          </h2>

          <p className="app-description">
            Smart Attendance System
          </p>

          <div className="welcome-section">

            <h3>
              Welcome Back
            </h3>

            <p>
              Sign in to your account
            </p>

          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="form-group">

              <label>
                Email or University ID
              </label>

              <div className="input-container">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  type="text"
                  placeholder="Email or University ID"
                  autoComplete="username"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />

              </div>

            </div>

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
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "◉"
                    : "◌"}
                </button>

              </div>

            </div>

            <div className="forgot-container">

              <button
                type="button"
                className="forgot-password"
              >
                Forgot password?
              </button>

            </div>

            <button
              type="submit"
              className="sign-in-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </span>

              {!loading && (
                <span className="sign-arrow">
                  →
                </span>
              )}

            </button>

            <div className="or-divider">

              <span></span>

              <p>
                OR
              </p>

              <span></span>

            </div>

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

      {/* =====================================================
          FOOTER
      ===================================================== */}

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

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

function StudentDashboard() {
  const navigate = useNavigate();

  const [user] = useState(() =>
    getSavedUser()
  );

  const firstName =
    user?.first_name ||
    user?.firstName ||
    (user?.name
      ? String(user.name).split(" ")[0]
      : "Student");

  const lastName =
    user?.last_name ||
    user?.lastName ||
    (user?.name
      ? String(user.name)
          .split(" ")
          .slice(1)
          .join(" ")
      : "");

  const fullName =
    `${firstName} ${lastName}`.trim() ||
    "Student";

  const initial =
    firstName.charAt(0).toUpperCase() ||
    "S";

  const today = new Date();

  const formattedDate =
    today.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  const monthName =
    today.toLocaleDateString(
      "en-US",
      {
        month: "long",
      }
    );

  const year =
    today.getFullYear();

  const currentDay =
    today.getDate();

  const daysInMonth =
    new Date(
      year,
      today.getMonth() + 1,
      0
    ).getDate();

  const firstDay =
    new Date(
      year,
      today.getMonth(),
      1
    ).getDay();

  const calendarCells =
    Array.from(
      {
        length:
          Math.ceil(
            (firstDay +
              daysInMonth) /
              7
          ) * 7,
      },
      (_, index) => {
        const day =
          index -
          firstDay +
          1;

        return day >= 1 &&
          day <= daysInMonth
          ? day
          : null;
      }
    );

  const Icon = ({
    name,
    size = 20,
    stroke = 2,
  }) => {
    const paths = {
      home: (
        <>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
          <path d="M9 21v-6h6v6" />
        </>
      ),

      chart: (
        <>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19H2" />
        </>
      ),

      calendar: (
        <>
          <rect
            x="3"
            y="4.5"
            width="18"
            height="16"
            rx="2"
          />
          <path d="M7 2.5v4M17 2.5v4M3 9h18" />
          <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" />
        </>
      ),

      qr: (
        <>
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
          <path d="M14 14h3v3h-3zM19 14v3M14 19h3M19 19h2v-2" />
        </>
      ),

      bell: (
        <>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </>
      ),

      search: (
        <>
          <circle
            cx="10.5"
            cy="10.5"
            r="6.5"
          />
          <path d="m16 16 5 5" />
        </>
      ),

      check: (
        <path d="m5 12 4 4L19 6" />
      ),

      alert: (
        <>
          <path d="M12 4v9" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
        </>
      ),

      clock: (
        <>
          <circle
            cx="12"
            cy="12"
            r="8.5"
          />
          <path d="M12 7v5l3 2" />
        </>
      ),

      arrow: (
        <>
          <path d="M5 12h14" />
          <path d="m14 7 5 5-5 5" />
        </>
      ),

      target: (
        <>
          <circle
            cx="12"
            cy="12"
            r="8.5"
          />
          <circle
            cx="12"
            cy="12"
            r="4.5"
          />
          <circle
            cx="12"
            cy="12"
            r="1"
          />
        </>
      ),

      light: (
        <>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M8 14c-1.2-1.1-2-2.7-2-4.5a6 6 0 1 1 12 0c0 1.8-.8 3.4-2 4.5-.7.6-1 1.1-1 2H9c0-.9-.3-1.4-1-2z" />
        </>
      ),

      logout: (
        <>
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 4v16" />
        </>
      ),
    };

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths[name] ||
          paths.home}
      </svg>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  const stats = [
    {
      title: "Attendance Rate",
      value: "0%",
      note: "No attendance recorded yet",
      icon: "chart",
      tone: "blue",
    },
    {
      title: "Total Sessions",
      value: "0",
      note: "Sessions attended this semester",
      icon: "calendar",
      tone: "purple",
    },
    {
      title: "Present",
      value: "0",
      note: "Keep building your streak",
      icon: "check",
      tone: "green",
    },
    {
      title: "Absent",
      value: "0",
      note: "Stay consistent",
      icon: "alert",
      tone: "red",
    },
  ];

  const tips = [
    "Attend classes regularly",
    "Check your timetable",
    "Scan the QR code on time",
    "Keep track of your progress",
  ];

  return (
    <div className="student-dashboard">
      <aside className="student-sidebar">

        <div>

          <div className="student-brand">
            <div className="student-brand-logo">
              ✓
            </div>

            <div>
              <h2>Attendify</h2>
              <span>
                SMART ATTENDANCE
              </span>
            </div>
          </div>

          <div className="student-profile-card">
            <div className="student-profile-avatar">
              {initial}
            </div>

            <div className="student-profile-copy">
              <strong>
                {fullName}
              </strong>

              <span>
                Student
              </span>
            </div>
          </div>

          <nav className="student-navigation">

            <button
              className="student-nav-item active"
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <Icon
                name="home"
                size={18}
              />

              <span>
                Dashboard
              </span>
            </button>

            <button
              className="student-nav-item"
              type="button"
              onClick={() =>
                navigate(
                  "/student/attendance"
                )
              }
            >
              <Icon
                name="chart"
                size={18}
              />

              <span>
                My Attendance
              </span>
            </button>

            <button
              className="student-nav-item"
              type="button"
              onClick={() =>
                navigate(
                  "/student/scan"
                )
              }
            >
              <Icon
                name="qr"
                size={18}
              />

              <span>
                Scan Attendance
              </span>
            </button>

            <button
              className="student-nav-item"
              type="button"
              onClick={() =>
                navigate(
                  "/student/correction-requests"
                )
              }
            >
              <Icon
                name="clock"
                size={18}
              />

              <span>
                Correction Requests
              </span>
            </button>

            <button
              className="student-nav-item"
              type="button"
            >
              <Icon
                name="bell"
                size={18}
              />

              <span>
                Notifications
              </span>

              <b className="student-notification-badge">
                3
              </b>
            </button>

          </nav>
        </div>

        <div className="student-sidebar-bottom">

          <div className="student-sidebar-tip">

            <div className="student-sidebar-tip-icon">
              <Icon
                name="light"
                size={17}
              />
            </div>

            <div>
              <strong>
                Keep going!
              </strong>

              <span>
                Every class counts.
              </span>
            </div>

          </div>

          <button
            className="student-logout"
            type="button"
            onClick={handleLogout}
          >
            <Icon
              name="logout"
              size={17}
            />

            Logout
          </button>

        </div>

      </aside>

      <main className="student-main">

        <header className="student-topbar">

          <div className="student-search">

            <Icon
              name="search"
              size={18}
            />

            <input
              type="text"
              placeholder="Search courses, sessions, or anything..."
            />

            <span>
              Ctrl + K
            </span>

          </div>

          <div className="student-topbar-right">

            <button
              className="student-notification-button"
              type="button"
              aria-label="Notifications"
            >
              <Icon
                name="bell"
                size={18}
              />

              <b>3</b>
            </button>

            <div className="student-header-divider" />

            <div className="student-header-profile">

              <div className="student-header-avatar">
                {initial}
              </div>

              <div>
                <strong>
                  {fullName}
                </strong>

                <span>
                  Student
                </span>
              </div>

              <span className="student-header-chevron">
                ⌄
              </span>

            </div>

          </div>

        </header>

        <section className="student-content">

          <div className="student-hero">

            <div className="student-hero-copy">

              <span className="student-hero-date">
                {formattedDate}
              </span>

              <h1>
                Good morning, {firstName}!
              </h1>

              <p>
                Stay consistent, keep learning,
                and make every class count.
              </p>

            </div>

            <div
              className="student-hero-art"
              aria-hidden="true"
            >
              <div className="student-hero-orb orb-one" />
              <div className="student-hero-orb orb-two" />
              <div className="student-hero-cap">
                ◆
              </div>
              <div className="student-hero-quote">
                Small steps today,
                <br />
                a brighter tomorrow.
              </div>
            </div>

          </div>

          <div className="student-stats">

            {stats.map((stat) => (
              <article
                className={`student-stat-card ${stat.tone}`}
                key={stat.title}
              >
                <div className="student-stat-icon">
                  <Icon
                    name={stat.icon}
                    size={20}
                  />
                </div>

                <div className="student-stat-content">
                  <span>
                    {stat.title}
                  </span>

                  <strong>
                    {stat.value}
                  </strong>

                  <small>
                    {stat.note}
                  </small>
                </div>

                <span className="student-stat-glow" />
              </article>
            ))}

          </div>

          <div className="student-main-grid">

            <section className="student-panel sessions-panel">

              <div className="student-panel-header">

                <div className="student-panel-title">

                  <div className="student-panel-icon blue">
                    <Icon
                      name="calendar"
                      size={18}
                    />
                  </div>

                  <div>
                    <h2>
                      Today's Sessions
                    </h2>

                    <p>
                      Your scheduled classes for today
                    </p>
                  </div>

                </div>

                <button
                  className="student-view-all"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >
                  View attendance

                  <Icon
                    name="arrow"
                    size={14}
                  />
                </button>

              </div>

              <div className="student-empty-session">

                <div className="student-empty-icon">
                  <Icon
                    name="calendar"
                    size={28}
                  />
                </div>

                <h3>
                  No sessions today
                </h3>

                <p>
                  You don't have any scheduled
                  classes for today.
                </p>

                <button
                  className="student-primary-button"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/scan"
                    )
                  }
                >
                  <Icon
                    name="qr"
                    size={16}
                  />

                  Scan Attendance
                </button>

              </div>

            </section>

            <section className="student-panel quick-panel">

              <div className="student-panel-header">

                <div className="student-panel-title">

                  <div className="student-panel-icon purple">
                    <Icon
                      name="target"
                      size={18}
                    />
                  </div>

                  <div>
                    <h2>
                      Quick Actions
                    </h2>

                    <p>
                      Frequently used actions
                    </p>
                  </div>

                </div>

              </div>

              <div className="student-quick-actions">

                <button
                  className="student-action-card scan"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/scan"
                    )
                  }
                >
                  <div className="student-action-icon">
                    <Icon
                      name="qr"
                      size={20}
                    />
                  </div>

                  <div>
                    <strong>
                      Scan QR Code
                    </strong>

                    <span>
                      Mark your attendance
                    </span>
                  </div>

                  <Icon
                    name="arrow"
                    size={17}
                  />
                </button>

                <button
                  className="student-action-card history"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >
                  <div className="student-action-icon">
                    <Icon
                      name="chart"
                      size={20}
                    />
                  </div>

                  <div>
                    <strong>
                      My Attendance
                    </strong>

                    <span>
                      View your attendance history
                    </span>
                  </div>

                  <Icon
                    name="arrow"
                    size={17}
                  />
                </button>

                <button
                  className="student-action-card correction"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/correction-requests"
                    )
                  }
                >
                  <div className="student-action-icon">
                    <Icon
                      name="clock"
                      size={20}
                    />
                  </div>

                  <div>
                    <strong>
                      Request Correction
                    </strong>

                    <span>
                      Report an attendance issue
                    </span>
                  </div>

                  <Icon
                    name="arrow"
                    size={17}
                  />
                </button>

              </div>

            </section>

            <section className="student-panel calendar-panel">

              <div className="student-panel-header calendar-heading">

                <div className="student-panel-title">

                  <div className="student-panel-icon blue">
                    <Icon
                      name="calendar"
                      size={17}
                    />
                  </div>

                  <div>
                    <h2>
                      Calendar
                    </h2>

                    <p>
                      {monthName} {year}
                    </p>
                  </div>

                </div>

              </div>

              <div className="student-calendar-week">
                {[
                  "Sun",
                  "Mon",
                  "Tue",
                  "Wed",
                  "Thu",
                  "Fri",
                  "Sat",
                ].map((day) => (
                  <span key={day}>
                    {day}
                  </span>
                ))}
              </div>

              <div className="student-calendar-grid">

                {calendarCells.map(
                  (day, index) => (
                    <span
                      key={`${day}-${index}`}
                      className={
                        day === currentDay
                          ? "today"
                          : ""
                      }
                    >
                      {day || ""}
                    </span>
                  )
                )}

              </div>

            </section>

          </div>

          <div className="student-bottom-grid">

            <section className="student-panel recent-panel">

              <div className="student-panel-header">

                <div className="student-panel-title">

                  <div className="student-panel-icon blue">
                    <Icon
                      name="clock"
                      size={18}
                    />
                  </div>

                  <div>
                    <h2>
                      Recent Activity
                    </h2>

                    <p>
                      Your latest attendance activity
                    </p>
                  </div>

                </div>

                <button
                  className="student-view-all"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >
                  View all

                  <Icon
                    name="arrow"
                    size={14}
                  />
                </button>

              </div>

              <div className="student-empty-activity">

                <div className="student-empty-icon soft">
                  <Icon
                    name="clock"
                    size={25}
                  />
                </div>

                <h3>
                  No recent activity
                </h3>

                <p>
                  Your attendance records will appear
                  here once you start attending classes.
                </p>

              </div>

            </section>

            <section className="student-side-card motivation-card">

              <div className="motivation-bubble bubble-one" />
              <div className="motivation-bubble bubble-two" />

              <div className="motivation-icon-large">
                ✦
              </div>

              <div className="motivation-copy">

                <span>
                  STAY CONSISTENT
                </span>

                <h2>
                  Every class
                  <br />
                  <strong>
                    matters.
                  </strong>
                </h2>

                <p>
                  Regular attendance keeps you
                  on track and helps you get the
                  most out of every class.
                </p>

              </div>

              <div
                className="motivation-books"
                aria-hidden="true"
              >
                ▰
                <br />
                ▰▰
              </div>

            </section>

            <div className="student-right-column">

              <section className="student-side-card goal-card">

                <div className="student-side-title">

                  <span>
                    <Icon
                      name="target"
                      size={17}
                    />
                  </span>

                  <strong>
                    Attendance Goal
                  </strong>

                </div>

                <p>
                  Target: 75% this semester
                </p>

                <div className="student-goal-content">

                  <div className="student-goal-circle">
                    <div>
                      <strong>
                        0%
                      </strong>

                      <span>
                        Progress
                      </span>
                    </div>
                  </div>

                  <div className="student-goal-stats">

                    <div>
                      <i className="green-dot" />
                      Present
                      <strong>
                        0
                      </strong>
                    </div>

                    <div>
                      <i className="red-dot" />
                      Absent
                      <strong>
                        0
                      </strong>
                    </div>

                    <div>
                      <i className="blue-dot" />
                      Total
                      <strong>
                        0
                      </strong>
                    </div>

                  </div>

                </div>

                <div className="student-goal-message">
                  <Icon
                    name="light"
                    size={14}
                  />

                  Regular attendance leads to
                  better academic progress.
                </div>

              </section>

              <section className="student-side-card tips-card">

                <div className="student-side-title">

                  <span>
                    <Icon
                      name="light"
                      size={17}
                    />
                  </span>

                  <strong>
                    Attendance Tips
                  </strong>

                </div>

                <ul>
                  {tips.map((tip) => (
                    <li key={tip}>
                      <span>
                        ✓
                      </span>

                      {tip}
                    </li>
                  ))}
                </ul>

              </section>

            </div>

          </div>

          <footer className="student-footer">

            <span>
              Attendify
            </span>

            <b>•</b>

            <span>
              Port Said University
            </span>

            <b>•</b>

            <span>
              A Smarter Campus for a Brighter Tomorrow
            </span>

            <small>
              v1.0.0
            </small>

          </footer>

        </section>

      </main>
    </div>
  );
}

/* =========================================================
   LECTURER SECTIONS
========================================================= */

function LecturerSections() {
  const [
    Component,
    setComponent,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  useState(() => {
    import(
      "./pages/lecturer/LecturerSections"
    )
      .then((module) => {
        setComponent(
          () => module.default
        );
      })
      .catch((err) => {
        console.error(
          "Failed to load LecturerSections:",
          err
        );

        setError(
          "Failed to load lecturer sections."
        );
      });
  });

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f8fc",
          color: "#991b1b",
        }}
      >
        {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div 
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f6f8fc",
          color: "#64748b",
        }}
      >
        Loading sections...
      </div>
    );
  }

  return <Component />;
}

export default App;