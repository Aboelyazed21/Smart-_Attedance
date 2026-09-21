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

import LecturerSessions from "./pages/lecturer/LecturerSessions";

import AttendanceScanner from "./pages/student/AttendanceScanner";
import StudentAttendance from "./pages/student/StudentAttendance";
import EnrollmentManagement from "./pages/admin/EnrollmentManagement";

import { loginUser } from "./services/api";

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
     ADMIN COURSE DETAILS
  ========================================================= */

  const courseDetailsMatch =
    location.pathname.match(
      /^\/admin\/courses\/(\d+)$/
    );

  if (courseDetailsMatch) {

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


    /*
      Admin OR Lecturer can open
      course details.

      This is important because
      LecturerSections navigates to:

      /admin/courses/:courseId
    */

    if (
      role !== "admin" &&
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
     ADMIN ATTENDANCE
  ========================================================= */

  if (
    location.pathname ===
    "/admin/attendance"
  ) {
    if (
      !isAdminAuthenticated()
    ) {
      return <Login />;
    }

    return <Attendance />;
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

    return <LecturerSessions />;
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

    /*
      Lazy import is not used here
      because LecturerSections is
      handled below by the existing
      application structure.
    */

    return <LecturerSections />;
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
     ADMIN DASHBOARD
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


    if (
      role === "admin"
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
  const navigate =
    useNavigate();

  const [user] =
    useState(() => {
      return getSavedUser();
    });


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


  const firstName =
    user?.first_name ||
    "Student";

  const lastName =
    user?.last_name ||
    "";


  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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


        <div className="sidebar-profile">

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
            <span>▦</span>
            Dashboard
          </button>


          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/scan"
              )
            }
          >
            <span>✓</span>
            My Attendance
          </button>


          <button
            className="nav-item"
          >
            <span>◫</span>
            My Sessions
          </button>


          <button
            className="nav-item"
          >
            <span>⚑</span>
            Correction Requests
          </button>


          <button
            className="nav-item"
          >
            <span>🔔</span>
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


      {/* =====================================================
          MAIN
      ===================================================== */}

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

            <div className="header-avatar">

              {firstName
                .charAt(0)
                .toUpperCase()}

            </div>

          </div>

        </header>


        <section className="dashboard-content">

          {/* =================================================
              STATS
          ================================================= */}

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
                  0%
                </strong>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon session-icon">
                ◫
              </div>

              <div>

                <span>
                  Total Sessions
                </span>

                <strong>
                  0
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
                  0
                </strong>

              </div>

            </div>


            <div className="stat-card">

              <div className="stat-icon absent-icon">
                !
              </div>

              <div>

                <span>
                  Absent
                </span>

                <strong>
                  0
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              DASHBOARD GRID
          ================================================= */}

          <div className="dashboard-grid">

            <div className="dashboard-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Today's Sessions
                  </h2>

                  <p>
                    Your scheduled classes
                  </p>

                </div>

                <button>
                  View All
                </button>

              </div>


              <div className="empty-state">

                <div className="empty-icon">
                  ◫
                </div>

                <h3>
                  No sessions yet
                </h3>

                <p>
                  Your sessions will appear here.
                </p>

              </div>

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
                >

                  <span>
                    ⚑
                  </span>

                  <div>

                    <strong>
                      Request Correction
                    </strong>

                    <small>
                      Report attendance issue
                    </small>

                  </div>

                </button>

              </div>

            </div>

          </div>


          {/* =================================================
              RECENT ACTIVITY
          ================================================= */}

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

            </div>


            <div className="empty-state small-empty">

              <div className="empty-icon">
                ◷
              </div>

              <p>
                No recent activity
              </p>

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

/*
  LecturerSections is loaded lazily here.

  This prevents App.jsx from breaking if the
  component is maintained separately.
*/

function LecturerSections() {
  const [
    Component,
    setComponent,
  ] = useState(null);

  const [error, setError] =
    useState("");


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