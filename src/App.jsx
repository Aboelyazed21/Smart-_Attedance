import { useEffect, useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Register from "./Register";

import AdminDashboard from "./pages/dashboard/AdminDashboard";
import Users from "./pages/admin/Users";
import Courses from "./pages/admin/Courses";
import Sections from "./pages/admin/Sections";
import Rooms from "./pages/admin/Rooms";
import Timetable from "./pages/admin/Timetable";
import AttendanceSessions from "./pages/lecturer/AttendanceSessions";
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import LecturerSections from "./pages/lecturer/LecturerSections";
import LecturerAttendance from "./pages/lecturer/LecturerAttendance";
import LecturerReports from "./pages/lecturer/LecturerReports";
import AttendanceScanner from "./pages/student/AttendanceScanner";
import StudentAttendance from "./pages/student/StudentAttendance";
import MySessions from "./pages/student/MySessions";
import StudentProfile from "./pages/student/StudentProfile";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";

import {
  loginUser,
  getMyAttendance,
} from "./services/api";

import "./App.css";

/* =========================================================
   GET SAVED USER
========================================================= */

function getSavedUser() {
  try {
    const savedUser =
      localStorage.getItem("user");

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
  const user =
    getSavedUser();

  if (!user) {
    return false;
  }

  return (
    String(
      user.role_name || ""
    ).toLowerCase() ===
    "admin"
  );
}

/* =========================================================
   LECTURER AUTH CHECK
========================================================= */

function isLecturerAuthenticated() {
  const user =
    getSavedUser();

  if (!user) {
    return false;
  }

  const role =
    String(
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
  const location =
    useLocation();

  /* =========================================================
     REGISTER
  ========================================================= */

  if (
    location.pathname ===
    "/register"
  ) {
    return <Register />;
  }

  /* =========================================================
     ADMIN USERS
  ========================================================= */

  if (
    location.pathname ===
    "/admin/users"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <Users />;
  }

  /* =========================================================
     ADMIN COURSES
  ========================================================= */

  if (
    location.pathname ===
    "/admin/courses"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <Courses />;
  }

  /* =========================================================
     ADMIN SECTIONS
  ========================================================= */

  if (
    location.pathname ===
    "/admin/sections"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <Sections />;
  }

  /* =========================================================
     ADMIN ROOMS
  ========================================================= */

  if (
    location.pathname ===
    "/admin/rooms"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <Rooms />;
  }

  /* =========================================================
     ADMIN TIMETABLE
  ========================================================= */

  if (
    location.pathname ===
    "/admin/timetable"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <Timetable />;
  }

  /* =========================================================
     LECTURER ATTENDANCE SESSIONS
  ========================================================= */

  if (
    location.pathname ===
    "/lecturer/sessions"
  ) {
    if (
      !isLecturerAuthenticated()
    ) {
      return <Login />;
    }

    return <AttendanceSessions />;
  }

  /* =========================================================
     LECTURER SECTIONS
  ========================================================= */

  if (
    location.pathname ===
    "/lecturer/sections"
  ) {
    if (
      !isLecturerAuthenticated()
    ) {
      return <Login />;
    }

    return <LecturerSections />;
  }

  /* =========================================================
     LECTURER ATTENDANCE
  ========================================================= */

  if (
    location.pathname ===
    "/lecturer/attendance"
  ) {
    if (
      !isLecturerAuthenticated()
    ) {
      return <Login />;
    }

    return <LecturerAttendance />;
  }

  /* =========================================================
     LECTURER REPORTS
  ========================================================= */

  if (
    location.pathname ===
    "/lecturer/reports"
  ) {
    if (
      !isLecturerAuthenticated()
    ) {
      return <Login />;
    }

    return <LecturerReports />;
  }

  /* =========================================================
     STUDENT ATTENDANCE SCANNER
  ========================================================= */

  if (
    location.pathname ===
    "/student/scan"
  ) {
    const user =
      getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role =
      String(
        user.role_name ||
          user.role ||
          ""
      )
        .toLowerCase()
        .trim();

    if (
      role !== "student"
    ) {
      return <Login />;
    }

    return <AttendanceScanner />;
  }

  /* =========================================================
     STUDENT PROFILE
     ========================================================= */

  if (
    location.pathname ===
    "/student/profile"
  ) {
    const user =
      getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role =
      String(
        user.role_name ||
          user.role ||
          ""
      )
        .toLowerCase()
        .trim();

    if (role !== "student") {
      return <Login />;
    }

    return <StudentProfile />;
  }

  /* =========================================================
     STUDENT MY SESSIONS
  ========================================================= */

  if (
    location.pathname ===
    "/student/sessions"
  ) {
    const user =
      getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role =
      String(
        user.role_name ||
          user.role ||
          ""
      )
        .toLowerCase()
        .trim();

    if (
      role !== "student"
    ) {
      return <Login />;
    }

    return <MySessions />;
  }

  /* =========================================================
     STUDENT ATTENDANCE
  ========================================================= */

  if (
    location.pathname ===
    "/student/attendance"
  ) {
    const user =
      getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role =
      String(
        user.role_name ||
          user.role ||
          ""
      )
        .toLowerCase()
        .trim();

    if (
      role !== "student"
    ) {
      return <Login />;
    }

    return <StudentAttendance />;
  }

  /* =========================================================
     ADMIN ENROLLMENT MANAGEMENT
  ========================================================= */

  if (
    location.pathname ===
    "/admin/enrollments"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <EnrollmentManagement />;
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  if (
    location.pathname ===
    "/dashboard"
  ) {
    const user =
      getSavedUser();

    if (!user) {
      return <Login />;
    }

    const role =
      String(
        user.role_name ||
          user.role ||
          ""
      )
        .toLowerCase()
        .trim();

    /* ADMIN */

    if (
      role === "admin"
    ) {
      return <AdminDashboard />;
    }

    /* LECTURER */

    if (
      role === "lecturer" ||
      role === "instructor"
    ) {
      return <LecturerDashboard />;
    }

    /* STUDENT */

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
  const navigate =
    useNavigate();

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

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (
        !email ||
        !password
      ) {
        alert(
          "Please enter email and password"
        );

        return;
      }

      try {
        setLoading(true);

        const data =
          await loginUser(
            email,
            password
          );

        localStorage.setItem(
          "token",
          data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            data.user
          )
        );

        console.log(
          "Login successful:",
          data.user
        );

        navigate(
          "/dashboard"
        );
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
            onSubmit={
              handleSubmit
            }
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
                    setEmail(
                      e.target.value
                    )
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
                  value={
                    password
                  }
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
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
              disabled={
                loading
              }
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
  const navigate =
    useNavigate();

  const [user] =
    useState(() => {
      return getSavedUser();
    });

  const [
    attendance,
    setAttendance,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const handleLogout =
    () => {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      navigate("/");
    };

  const loadAttendance =
    async () => {
      try {
        setLoading(true);

        const data =
          await getMyAttendance();

        const records =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(
                  data?.attendance
                )
                ? data.attendance
                : [];

        setAttendance(
          records
        );
      } catch (error) {
        console.error(
          "Student attendance loading error:",
          error
        );

        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadAttendance();
  }, []);

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const getStatus =
    (item) =>
      String(
        item.status ||
          item.attendance_status ||
          item.validation_status ||
          ""
      ).toLowerCase();

  const totalSessions =
    attendance.length;

  const presentCount =
    attendance.filter(
      (item) => {
        const status =
          getStatus(item);

        return (
          status ===
            "present" ||
          status ===
            "accepted" ||
          status ===
            "on_time"
        );
      }
    ).length;

  const lateCount =
    attendance.filter(
      (item) =>
        getStatus(item) ===
        "late"
    ).length;

  const absentCount =
    attendance.filter(
      (item) =>
        getStatus(item) ===
        "absent"
    ).length;

  const attendanceRate =
    totalSessions > 0
      ? Math.round(
          (
            (
              presentCount +
              lateCount
            ) /
            totalSessions
          ) *
            100
        )
      : 0;

  const recentAttendance =
    attendance.slice(0, 5);

  return (
    <div className="dashboard-page">

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            🎓
          </div>

          <div>

            <h2>
              Attendify
            </h2>

            <span>
              SMART ATTENDANCE
            </span>

          </div>

        </div>

        <div
          className="sidebar-profile"
          role="button"
          tabIndex={0}
          onClick={() => navigate("/student/profile")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              navigate("/student/profile");
            }
          }}
          style={{ cursor: "pointer" }}
          title="Open Student Profile"
        >

          <div className="profile-avatar">

            {firstName
              .charAt(0)
              .toUpperCase()}

          </div>

          <div className="profile-info">

            <strong>
              {firstName}{" "}
              {lastName}
            </strong>

            <span>
              Student
            </span>

          </div>

        </div>

        <nav className="dashboard-nav">

          <button
            className="nav-item active"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <span>
              ▦
            </span>

            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/attendance"
              )
            }
          >
            <span>
              ✓
            </span>

            My Attendance
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/scan"
              )
            }
          >
            <span>
              ▣
            </span>

            Scan QR
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/sessions"
              )
            }
          >
            <span>
              ◫
            </span>

            My Sessions
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={() =>
              alert(
                "Correction Requests page will be added next."
              )
            }
          >
            <span>
              ⚑
            </span>

            Correction Requests
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={() =>
              alert(
                "Notifications page will be added next."
              )
            }
          >
            <span>
              🔔
            </span>

            Notifications
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="nav-item logout-button"
            onClick={
              handleLogout
            }
          >
            <span>
              ↪
            </span>

            Logout
          </button>

        </div>

      </aside>

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <h1>
              Student Dashboard
            </h1>

            <p>
              Welcome back,{" "}
              {firstName} 👋
            </p>

          </div>

          <div className="dashboard-user">

            <button
              type="button"
              className="header-avatar"
              onClick={() => navigate("/student/profile")}
              title="Open Student Profile"
              aria-label="Open Student Profile"
              style={{
                cursor: "pointer",
                border: "none",
                background: "transparent",
                padding: 0,
                font: "inherit"
              }}
            >

              {firstName
                .charAt(0)
                .toUpperCase()}

            </button>

          </div>

        </header>

        <section className="dashboard-content">

          <div className="dashboard-stats">

            <div className="stat-card">

              <div className="stat-icon attendance-icon">
                ✓
              </div>

              <div>

                <span>
                  Attendance Rate
                </span>

                <strong>
                  {loading
                    ? "..."
                    : `${attendanceRate}%`}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon session-icon">
                ◫
              </div>

              <div>

                <span>
                  Attendance Records
                </span>

                <strong>
                  {loading
                    ? "..."
                    : totalSessions}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon present-icon">
                ✓
              </div>

              <div>

                <span>
                  Present
                </span>

                <strong>
                  {loading
                    ? "..."
                    : presentCount}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon absent-icon">
                !
              </div>

              <div>

                <span>
                  Late
                </span>

                <strong>
                  {loading
                    ? "..."
                    : lateCount}
                </strong>

              </div>

            </div>

          </div>

          <div className="dashboard-grid">

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Recent Attendance
                  </h2>

                  <p>
                    Your attendance activity
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >
                  View All
                </button>

              </div>

              {recentAttendance.length ===
              0 ? (

                <div className="empty-state">

                  <div className="empty-icon">
                    ◫
                  </div>

                  <h3>
                    No attendance yet
                  </h3>

                  <p>
                    Your attendance records
                    will appear here.
                  </p>

                </div>

              ) : (

                <div className="recent-attendance-list">

                  {recentAttendance
                    .slice(0, 3)
                    .map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          className="recent-attendance-item"
                          key={
                            item.id ||
                            item.attendance_id ||
                            index
                          }
                        >

                          <div>

                            <strong>
                              {
                                item.course_name ||
                                item.course ||
                                "Course"
                              }
                            </strong>

                            <small>
                              {
                                item.section_name ||
                                item.section ||
                                "Section"
                              }
                            </small>

                          </div>

                          <span>
                            {
                              item.status ||
                              item.attendance_status ||
                              item.validation_status ||
                              "Recorded"
                            }
                          </span>

                        </div>

                      )
                    )}

                </div>

              )}

            </div>

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Frequently used actions
                  </p>

                </div>

              </div>

              <div className="quick-actions">

                <button
                  className="quick-action"
                  onClick={() =>
                    navigate(
                      "/student/scan"
                    )
                  }
                >

                  <span>
                    ▣
                  </span>

                  <div>

                    <strong>
                      Scan QR Code
                    </strong>

                    <small>
                      Mark your attendance
                    </small>

                  </div>

                </button>

                <button
                  className="quick-action"
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >

                  <span>
                    ✓
                  </span>

                  <div>

                    <strong>
                      My Attendance
                    </strong>

                    <small>
                      View attendance history
                    </small>

                  </div>

                </button>

                <button
                  className="quick-action"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/sessions"
                    )
                  }
                >

                  <span>
                    ◫
                  </span>

                  <div>

                    <strong>
                      My Sessions
                    </strong>

                    <small>
                      View your class sessions
                    </small>

                  </div>

                </button>

              </div>

            </div>

          </div>

          <div className="dashboard-panel recent-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Recent Activity
                </h2>

                <p>
                  Your latest attendance activity
                </p>

              </div>

              <button
                type="button"
                onClick={
                  loadAttendance
                }
                disabled={
                  loading
                }
              >

                {loading
                  ? "Loading..."
                  : "Refresh"}

              </button>

            </div>

            {recentAttendance.length ===
            0 ? (

              <div className="empty-state small-empty">

                <div className="empty-icon">
                  ◷
                </div>

                <p>
                  No recent activity
                </p>

              </div>

            ) : (

              <div className="recent-attendance-list">

                {recentAttendance.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      className="recent-attendance-item"
                      key={
                        item.id ||
                        item.attendance_id ||
                        index
                      }
                    >

                      <div>

                        <strong>
                          {
                            item.course_name ||
                            item.course ||
                            "Attendance"
                          }
                        </strong>

                        <small>
                          {
                            item.attendance_date ||
                            item.session_date ||
                            item.date ||
                            "Recent"
                          }
                        </small>

                      </div>

                      <span>
                        {
                          item.status ||
                          item.attendance_status ||
                          item.validation_status ||
                          "Recorded"
                        }
                      </span>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;