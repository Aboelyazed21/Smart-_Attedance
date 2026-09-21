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

import LecturerSessions from "./pages/lecturer/LecturerSessions";

import AttendanceScanner from "./pages/student/AttendanceScanner";
import StudentAttendance from "./pages/student/StudentAttendance";
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

    return <Users />;
  }


  /* =========================================================
     ADMIN COURSES
  ========================================================= */

  if (location.pathname === "/admin/courses") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Courses />;
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

    return <CourseDetails />;
  }


  /* =========================================================
     ADMIN SECTIONS
  ========================================================= */

  if (location.pathname === "/admin/sections") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Sections />;
  }


  /* =========================================================
     ADMIN ROOMS
  ========================================================= */

  if (location.pathname === "/admin/rooms") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Rooms />;
  }


  /* =========================================================
     ADMIN TIMETABLE
  ========================================================= */

  if (location.pathname === "/admin/timetable") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Timetable />;
  }


  /* =========================================================
     ADMIN ATTENDANCE
  ========================================================= */

  if (location.pathname === "/admin/attendance") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Attendance />;
  }


  /* =========================================================
     ADMIN REPORTS
  ========================================================= */

  if (location.pathname === "/admin/reports") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Reports />;
  }


  /* =========================================================
     ADMIN SETTINGS
  ========================================================= */

  if (location.pathname === "/admin/settings") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <Settings />;
  }


  /* =========================================================
     LECTURER ATTENDANCE SESSIONS
  ========================================================= */

  if (location.pathname === "/lecturer/sessions") {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return <LecturerSessions />;
  }


  /* =========================================================
     LECTURER SECTIONS
  ========================================================= */

  if (location.pathname === "/lecturer/sections") {
    if (!isLecturerAuthenticated()) {
      return <Login />;
    }

    return <LecturerSections />;
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
     ADMIN ENROLLMENT MANAGEMENT
  ========================================================= */

  if (location.pathname === "/admin/enrollments") {
    if (!isAdminAuthenticated()) {
      return <Login />;
    }

    return <EnrollmentManagement />;
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
      return <AdminDashboard />;
    }

    if (
      role === "lecturer" ||
      role === "instructor"
    ) {
      return <LecturerSessions />;
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

  const [user] = useState(() => {
    return getSavedUser();
  });


  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const initial =
    firstName
      .charAt(0)
      .toUpperCase();


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


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };


  return (
    <div className="student-dashboard">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="student-sidebar">

        {/* Brand */}
        <div className="student-brand">

          <div className="student-brand-logo">
            ✓
          </div>

          <div className="student-brand-text">

            <h2>
              Attendify
            </h2>

            <span>
              SMART ATTENDANCE
            </span>

          </div>

        </div>


        {/* Profile */}
        <div className="student-sidebar-profile">

          <div className="student-profile-avatar">
            {initial}
          </div>

          <div className="student-profile-info">

            <strong>
              {fullName}
            </strong>

            <span>
              Student
            </span>

          </div>

        </div>


        {/* Navigation */}
        <nav className="student-navigation">

          <button
            className="student-nav-item active"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >

            <span className="student-nav-icon">
              ⌂
            </span>

            <span>
              Dashboard
            </span>

          </button>


          <button
            className="student-nav-item"
            type="button"
            onClick={() =>
              navigate("/student/attendance")
            }
          >

            <span className="student-nav-icon">
              ✓
            </span>

            <span>
              My Attendance
            </span>

          </button>


          <button
            className="student-nav-item"
            type="button"
            onClick={() =>
              navigate("/student/scan")
            }
          >

            <span className="student-nav-icon">
              ▣
            </span>

            <span>
              Scan Attendance
            </span>

          </button>


          <button
            className="student-nav-item"
            type="button"
          >

            <span className="student-nav-icon">
              ⚑
            </span>

            <span>
              Correction Requests
            </span>

          </button>


          <button
            className="student-nav-item"
            type="button"
          >

            <span className="student-nav-icon">
              ♧
            </span>

            <span>
              Notifications
            </span>

            <span className="student-notification-badge">
              3
            </span>

          </button>

        </nav>


        {/* Sidebar Bottom */}
        <div className="student-sidebar-footer">

          <div className="student-sidebar-tip">

            <div className="student-sidebar-tip-icon">
              ✦
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

            <span>
              ↪
            </span>

            Logout

          </button>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-main">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header className="student-topbar">

          <div className="student-search">

            <span className="student-search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search courses, sessions..."
            />

            <span className="student-search-shortcut">
              Ctrl K
            </span>

          </div>


          <div className="student-topbar-right">

            <button
              className="student-topbar-notification"
              type="button"
            >

              ♧

              <span>
                3
              </span>

            </button>


            <div className="student-header-divider"></div>


            <div className="student-header-profile">

              <div className="student-header-avatar">
                {initial}
              </div>

              <div className="student-header-user">

                <strong>
                  {fullName}
                </strong>

                <span>
                  Student
                </span>

              </div>

              <span className="student-profile-arrow">
                ▾
              </span>

            </div>

          </div>

        </header>


        {/* ===================================================
            CONTENT
        =================================================== */}

        <section className="student-content">

          {/* =================================================
              HERO
          ================================================= */}

          <div className="student-hero">

            <div className="student-hero-left">

              <div className="student-hero-icon">
                ✦
              </div>

              <div>

                <div className="student-hero-date">
                  {formattedDate}
                </div>

                <h1>
                  Good Morning, {firstName}! 👋
                </h1>

                <p>
                  Stay consistent, keep learning,
                  and make every class count.
                </p>

              </div>

            </div>


            <div className="student-hero-message">

              <span className="student-hero-message-icon">
                ✦
              </span>

              <div>

                <strong>
                  Your attendance
                </strong>

                <span>
                  is your first step
                </span>

                <b>
                  to success.
                </b>

              </div>

            </div>

          </div>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="student-stats">

            {/* Attendance */}
            <div className="student-stat-card attendance">

              <div className="student-stat-icon">
                %
              </div>

              <div className="student-stat-content">

                <span>
                  Attendance Rate
                </span>

                <strong>
                  0%
                </strong>

                <small>
                  No attendance recorded yet
                </small>

              </div>

              <div className="student-stat-decoration">
                ↗
              </div>

            </div>


            {/* Sessions */}
            <div className="student-stat-card sessions">

              <div className="student-stat-icon">
                ▣
              </div>

              <div className="student-stat-content">

                <span>
                  Total Sessions
                </span>

                <strong>
                  0
                </strong>

                <small>
                  Sessions attended this semester
                </small>

              </div>

              <div className="student-stat-decoration">
                ≋
              </div>

            </div>


            {/* Present */}
            <div className="student-stat-card present">

              <div className="student-stat-icon">
                ✓
              </div>

              <div className="student-stat-content">

                <span>
                  Present
                </span>

                <strong>
                  0
                </strong>

                <small>
                  Keep building your streak
                </small>

              </div>

              <div className="student-stat-decoration">
                ✓
              </div>

            </div>


            {/* Absent */}
            <div className="student-stat-card absent">

              <div className="student-stat-icon">
                !
              </div>

              <div className="student-stat-content">

                <span>
                  Absent
                </span>

                <strong>
                  0
                </strong>

                <small>
                  Stay consistent
                </small>

              </div>

              <div className="student-stat-decoration">
                ↘
              </div>

            </div>

          </div>


          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="student-main-grid">

            {/* ===============================================
                TODAY'S SESSIONS
            =============================================== */}

            <div className="student-panel sessions-panel">

              <div className="student-panel-header">

                <div className="student-panel-title">

                  <div className="student-panel-icon blue">
                    ▣
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
                  type="button"
                  className="student-view-all"
                  onClick={() =>
                    navigate("/student/attendance")
                  }
                >
                  View Attendance →
                </button>

              </div>


              <div className="student-empty-session">

                <div className="student-session-illustration">

                  <div className="student-calendar-icon">
                    ▣
                  </div>

                  <span>
                    00
                  </span>

                </div>

                <h3>
                  No sessions today
                </h3>

                <p>
                  You don't have any scheduled
                  classes for today.
                </p>

                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() =>
                    navigate("/student/scan")
                  }
                >
                  <span>
                    ▣
                  </span>

                  Scan Attendance
                </button>

              </div>

            </div>


            {/* ===============================================
                QUICK ACTIONS
            =============================================== */}

            <div className="student-panel quick-panel">

              <div className="student-panel-header">

                <div className="student-panel-title">

                  <div className="student-panel-icon purple">
                    ⚡
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
                    navigate("/student/scan")
                  }
                >

                  <div className="student-action-icon">
                    ▣
                  </div>

                  <div className="student-action-text">

                    <strong>
                      Scan QR Code
                    </strong>

                    <span>
                      Mark your attendance
                    </span>

                  </div>

                  <span className="student-action-arrow">
                    →
                  </span>

                </button>


                <button
                  className="student-action-card history"
                  type="button"
                  onClick={() =>
                    navigate("/student/attendance")
                  }
                >

                  <div className="student-action-icon">
                    ✓
                  </div>

                  <div className="student-action-text">

                    <strong>
                      My Attendance
                    </strong>

                    <span>
                      View your attendance history
                    </span>

                  </div>

                  <span className="student-action-arrow">
                    →
                  </span>

                </button>


                <button
                  className="student-action-card correction"
                  type="button"
                >

                  <div className="student-action-icon">
                    ⚑
                  </div>

                  <div className="student-action-text">

                    <strong>
                      Request Correction
                    </strong>

                    <span>
                      Report an attendance issue
                    </span>

                  </div>

                  <span className="student-action-arrow">
                    →
                  </span>

                </button>

              </div>

            </div>

          </div>


          {/* =================================================
              BOTTOM GRID
          ================================================= */}

          <div className="student-bottom-grid">

            {/* ===============================================
                RECENT ACTIVITY
            =============================================== */}

            <div className="student-panel recent-panel">

              <div className="student-panel-header">

                <div className="student-panel-title">

                  <div className="student-panel-icon blue">
                    ◷
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
                  type="button"
                  className="student-view-all"
                  onClick={() =>
                    navigate("/student/attendance")
                  }
                >
                  View All →
                </button>

              </div>


              <div className="student-empty-activity">

                <div className="student-activity-icon">
                  ◷
                </div>

                <h3>
                  No recent activity
                </h3>

                <p>
                  Your attendance records will appear
                  here once you start attending classes.
                </p>

              </div>

            </div>


            {/* ===============================================
                RIGHT COLUMN
            =============================================== */}

            <div className="student-right-column">

              {/* Motivation */}
              <div className="student-side-card motivation-card">

                <div className="student-side-card-top">

                  <div className="student-side-icon">
                    ✦
                  </div>

                  <div>

                    <strong>
                      Stay consistent
                    </strong>

                    <span>
                      every class
                    </span>

                    <b>
                      matters.
                    </b>

                  </div>

                </div>


                <div className="student-motivation-art">
                  📚
                </div>

                <p className="student-motivation-text">
                  Regular attendance helps you
                  stay on track and get the most
                  out of every class.
                </p>

              </div>


              {/* Attendance Goal */}
              <div className="student-side-card goal-card">

                <div className="student-side-title">

                  <span>
                    ◎
                  </span>

                  <strong>
                    Attendance Goal
                  </strong>

                </div>

                <p>
                  Target: 75% this semester
                </p>


                <div className="student-goal-wrapper">

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

                </div>


                <div className="student-goal-stats">

                  <div>
                    <span className="green-dot"></span>
                    Present
                    <strong>
                      0
                    </strong>
                  </div>

                  <div>
                    <span className="red-dot"></span>
                    Absent
                    <strong>
                      0
                    </strong>
                  </div>

                  <div>
                    <span className="blue-dot"></span>
                    Total
                    <strong>
                      0
                    </strong>
                  </div>

                </div>


                <div className="student-goal-message">
                  💡 Regular attendance leads
                  to better academic progress.
                </div>

              </div>


              {/* Tips */}
              <div className="student-side-card tips-card">

                <div className="student-side-title">

                  <span>
                    💡
                  </span>

                  <strong>
                    Attendance Tips
                  </strong>

                </div>


                <ul>

                  <li>
                    <span>
                      ✓
                    </span>

                    Attend classes regularly
                  </li>

                  <li>
                    <span>
                      ✓
                    </span>

                    Check your timetable
                  </li>

                  <li>
                    <span>
                      ✓
                    </span>

                    Scan the QR code on time
                  </li>

                  <li>
                    <span>
                      ✓
                    </span>

                    Keep track of your progress
                  </li>

                </ul>

              </div>

            </div>

          </div>

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