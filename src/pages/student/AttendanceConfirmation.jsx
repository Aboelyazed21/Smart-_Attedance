import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./AttendanceConfirmation.css";

function AttendanceConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scanData = location.state || {};

  useEffect(() => {
    document.body.classList.toggle("confirmation-sidebar-open", sidebarOpen);

    return () => {
      document.body.classList.remove("confirmation-sidebar-open");
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const navigateAndClose = (path) => {
    closeSidebar();
    navigate(path);
  };

  /* =========================================================
     USER
  ========================================================= */

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    user = null;
  }

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

  const avatarLetter =
    firstName.charAt(0).toUpperCase();

  /* =========================================================
     ATTENDANCE DATA
  ========================================================= */

  const attendance = useMemo(() => {
    const rawDate =
      scanData.scannedAt ||
      scanData.date ||
      new Date();

    const date =
      new Date(rawDate);

    return {
      course:
        scanData.course ||
        scanData.courseName ||
        "Course",

      courseCode:
        scanData.courseCode ||
        "—",

      section:
        scanData.section ||
        scanData.sectionName ||
        "Section 1",

      date,

      status:
        scanData.status ||
        "present",

      markedBy:
        scanData.markedBy ||
        "QR Code",

      message:
        scanData.message ||
        "Your attendance has been recorded successfully.",
    };
  }, [scanData]);

  const formattedDate =
    attendance.date.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }
    );

  const formattedTime =
    attendance.date.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    closeSidebar();
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="confirmation-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <button
        type="button"
        className="confirmation-mobile-menu-button"
        aria-label="Open navigation menu"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="confirmation-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      <aside className={`confirmation-sidebar ${sidebarOpen ? "is-open" : ""}`}>

        {/* BRAND */}

        <div className="confirmation-brand">

          <div className="confirmation-logo">
            A
          </div>

          <div>
            <strong>
              Attendify
            </strong>

            <span>
              SMART ATTENDANCE
            </span>
          </div>

        </div>

        {/* PROFILE */}

        <div className="confirmation-profile">

          <div className="confirmation-avatar">
            {avatarLetter}
          </div>

          <div>
            <strong>
              {fullName}
            </strong>

            <span>
              Student
            </span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="confirmation-nav">

          <button
            onClick={() => navigateAndClose("/dashboard")}
          >
            <span>DB</span>
            Dashboard
          </button>

          <button
            onClick={() => navigateAndClose("/student/attendance")}
          >
            <span>AT</span>
            My Attendance
          </button>

          <button
            className="active"
            onClick={() => navigateAndClose("/student/scan")}
          >
            <span>SC</span>
            Scan Attendance
          </button>

          <button>
            <span>CR</span>
            Correction Requests
          </button>

          <button>
            <span>NT</span>
            Notifications

            <b>
              3
            </b>
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="confirmation-sidebar-bottom">

          <div className="confirmation-motivation">

            <div>
              +
            </div>

            <section>
              <strong>
                Keep going!
              </strong>

              <span>
                Every class counts.
              </span>
            </section>

          </div>

          <button
            className="confirmation-logout"
            onClick={handleLogout}
          >
            <span>LO</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="confirmation-main">

        {/* TOP BAR */}

        <header className="confirmation-topbar">

          <div className="confirmation-search">

            <span>
              Search
            </span>

            <input
              placeholder="Search courses, sessions, or anything..."
            />

            <kbd>
              Ctrl + K
            </kbd>

          </div>

          <div className="confirmation-user">

            <button className="notification-button">

              N

              <b>
                3
              </b>

            </button>

            <div className="header-avatar">
              {avatarLetter}
            </div>

            <div className="header-user-info">

              <strong>
                {fullName}
              </strong>

              <span>
                Student
              </span>

            </div>

            <span>
              Menu
            </span>

          </div>

        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section className="confirmation-content">

          {/* HERO */}

          <div className="confirmation-hero">

            <div className="confirmation-hero-left">

              <div className="hero-success-icon">
                OK
              </div>

              <div>

                <span>
                  ATTENDANCE
                </span>

                <h1>
                  Attendance Confirmed
                </h1>

                <p>
                  Your attendance has been recorded successfully.
                </p>

              </div>

            </div>

            <div className="hero-decoration">

              <div className="hero-calendar">
                AT
              </div>

              <strong>
                Consistency
                <br />
                today, success
                <br />
                tomorrow.
              </strong>

            </div>

          </div>

          {/* MAIN GRID */}

          <div className="confirmation-grid">

            {/* =================================================
                LEFT
            ================================================= */}

            <div className="confirmation-left">

              {/* SUCCESS CARD */}

              <div className="success-card">

                <div className="success-animation">

                  <div className="success-ring ring-one" />
                  <div className="success-ring ring-two" />

                  <div className="big-success">
                    OK
                  </div>

                </div>

                <h2>
                  Attendance Recorded Successfully
                </h2>

                <p>
                  {attendance.message}
                </p>

                {/* DETAILS */}

                <div className="attendance-details">

                  <div className="details-header">

                    <div className="details-title">

                      <div className="details-icon">
                        AD
                      </div>

                      <h3>
                        Attendance Details
                      </h3>

                    </div>

                    <span className="verified-badge">
                      Verified & Secure
                    </span>

                  </div>

                  <div className="details-grid">

                    <div className="detail-box">

                      <span className="detail-icon">
                        CR
                      </span>

                      <div>
                        <small>
                          Course
                        </small>

                        <strong>
                          {attendance.course}
                        </strong>

                        <em>
                          {attendance.courseCode}
                        </em>
                      </div>

                    </div>

                    <div className="detail-box">

                      <span className="detail-icon">
                        SC
                      </span>

                      <div>
                        <small>
                          Section
                        </small>

                        <strong>
                          {attendance.section}
                        </strong>

                      </div>

                    </div>

                    <div className="detail-box">

                      <span className="detail-icon">
                        CR
                      </span>

                      <div>
                        <small>
                          Date
                        </small>

                        <strong>
                          {formattedDate}
                        </strong>

                        <em>
                          {attendance.date.toLocaleDateString(
                            "en-US",
                            {
                              weekday:
                                "long",
                            }
                          )}
                        </em>
                      </div>

                    </div>

                    <div className="detail-box">

                      <span className="detail-icon">
                        TM
                      </span>

                      <div>
                        <small>
                          Time
                        </small>

                        <strong>
                          {formattedTime}
                        </strong>

                      </div>

                    </div>

                    <div className="detail-box">

                      <span className="detail-icon green">
                        ST
                      </span>

                      <div>
                        <small>
                          Status
                        </small>

                        <strong className="present-text">
                          Present
                        </strong>

                      </div>

                    </div>

                    <div className="detail-box">

                      <span className="detail-icon">
                        QR
                      </span>

                      <div>
                        <small>
                          Marked By
                        </small>

                        <strong>
                          {attendance.markedBy}
                        </strong>

                      </div>

                    </div>

                  </div>

                  {/* VERIFICATION STEPS */}

                  <div className="verification-line">

                    <div className="verification-step">

                      <div className="verification-check">OK</div>

                      <strong>
                        QR Scanned
                      </strong>

                      <span>
                        Code detected
                      </span>

                    </div>

                    <div className="verification-connector" />

                    <div className="verification-step">

                      <div className="verification-check">OK</div>

                      <strong>
                        Session Verified
                      </strong>

                      <span>
                        Valid active session
                      </span>

                    </div>

                    <div className="verification-connector" />

                    <div className="verification-step">

                      <div className="verification-check">OK</div>

                      <strong>
                        Enrollment Verified
                      </strong>

                      <span>
                        You are enrolled
                      </span>

                    </div>

                    <div className="verification-connector" />

                    <div className="verification-step">

                      <div className="verification-check">OK</div>

                      <strong>
                        Attendance Recorded
                      </strong>

                      <span>
                        Successfully saved
                      </span>

                    </div>

                  </div>

                </div>

                {/* ACTIONS */}

                <div className="confirmation-actions">

                  <button
                    className="primary-confirmation-button"
                    onClick={() =>
                      navigate(
                        "/student/attendance"
                      )
                    }
                  >
                    <span>
                      AT
                    </span>

                    View My Attendance

                    <b>
                      →
                    </b>
                  </button>

                  <button
                    className="secondary-confirmation-button"
                    onClick={() =>
                      navigate(
                        "/dashboard"
                      )
                    }
                  >
                    <span>
                      DB
                    </span>

                    Back to Dashboard
                  </button>

                </div>

              </div>

              {/* RECENT ATTENDANCE */}

              <div className="recent-attendance-card">

                <div className="recent-header">

                  <div>

                    <h3>
                      Recent Attendance
                    </h3>

                    <p>
                      Your latest attendance records
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        "/student/attendance"
                      )
                    }
                  >
                    View All →
                  </button>

                </div>

                <div className="recent-table">

                  <div className="recent-table-row table-header">

                    <span>
                      #
                    </span>

                    <span>
                      Date & Time
                    </span>

                    <span>
                      Course
                    </span>

                    <span>
                      Section
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Marked By
                    </span>

                  </div>

                  <div className="recent-table-row">

                    <span>
                      1
                    </span>

                    <span>
                      {formattedDate} {formattedTime}
                    </span>

                    <span>
                      {attendance.course}
                    </span>

                    <span>
                      {attendance.section}
                    </span>

                    <span>
                      <b className="present-badge">
                        Present
                      </b>
                    </span>

                    <span>
                      QR Code
                    </span>

                  </div>

                  <div className="recent-table-row">

                    <span>
                      2
                    </span>

                    <span>
                      Sep 20, 2026 09:05 AM
                    </span>

                    <span>
                      Web Development
                    </span>

                    <span>
                      Sec 2
                    </span>

                    <span>
                      <b className="present-badge">
                        Present
                      </b>
                    </span>

                    <span>
                      QR Code
                    </span>

                  </div>

                  <div className="recent-table-row">

                    <span>
                      3
                    </span>

                    <span>
                      Sep 17, 2026 11:30 AM
                    </span>

                    <span>
                      Database Systems
                    </span>

                    <span>
                      Sec 1
                    </span>

                    <span>
                      <b className="absent-badge">
                        Absent
                      </b>
                    </span>

                    <span>
                      —
                    </span>

                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                RIGHT
            ================================================= */}

            <aside className="confirmation-right">

              {/* SUMMARY */}

              <div className="summary-card">

                <div className="summary-header">

                  <div>

                    <div className="summary-title-icon">
                      AS
                    </div>

                    <h3>
                      Attendance Summary
                    </h3>

                  </div>

                  <select defaultValue="semester">
                    <option value="semester">
                      This Semester
                    </option>

                    <option value="year">
                      This Year
                    </option>
                  </select>

                </div>

                <div className="summary-stats">

                  <div className="summary-stat present">

                    <span>
                      P
                    </span>

                    <small>
                      Present
                    </small>

                    <strong>
                      19
                    </strong>

                    <em>
                      out of 25 sessions
                    </em>

                  </div>

                  <div className="summary-stat sessions">

                    <span>
                      TS
                    </span>

                    <small>
                      Total Sessions
                    </small>

                    <strong>
                      25
                    </strong>

                    <em>
                      This semester
                    </em>

                  </div>

                  <div className="summary-stat rate">

                    <span>
                      AR
                    </span>

                    <small>
                      Attendance Rate
                    </small>

                    <strong>
                      76%
                    </strong>

                    <em>
                      On track
                    </em>

                  </div>

                </div>

                <div className="progress-area">

                  <div className="progress-bar">

                    <div
                      className="progress-value"
                      style={{
                        width: "76%",
                      }}
                    />

                  </div>

                  <strong>
                    76%
                  </strong>

                </div>

                <p className="summary-message">
                  You are doing great! Keep attending your classes.
                </p>

              </div>

              {/* WHAT'S NEXT */}

              <div className="next-card">

                <div className="next-title">

                  <div>
                    N
                  </div>

                  <h3>
                    What's Next?
                  </h3>

                </div>

                <div className="next-list">

                  <div className="next-item">

                    <span className="next-green">
                      01
                    </span>

                    <div>
                      <strong>
                        Keep Attending
                      </strong>

                      <p>
                        Maintain your attendance to reach your goals
                      </p>
                    </div>

                  </div>

                  <div className="next-item">

                    <span className="next-blue">
                      02
                    </span>

                    <div>
                      <strong>
                        Check Your Progress
                      </strong>

                      <p>
                        View detailed attendance in My Attendance
                      </p>
                    </div>

                  </div>

                  <div className="next-item">

                    <span className="next-red">
                      03
                    </span>

                    <div>
                      <strong>
                        Set Reminders
                      </strong>

                      <p>
                        Enable notifications for upcoming classes
                      </p>
                    </div>

                  </div>

                  <div className="next-item">

                    <span className="next-purple">
                      04
                    </span>

                    <div>
                      <strong>
                        Stay Consistent
                      </strong>

                      <p>
                        Regular attendance leads to better academic performance
                      </p>
                    </div>

                  </div>

                </div>

                <div className="quote-box">

                  <span>
                    “
                  </span>

                  <p>
                    Success is the sum of small efforts,
                    repeated day in and day out.
                  </p>

                  <small>
                    — Robert Collier
                  </small>

                </div>

              </div>

            </aside>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AttendanceConfirmation;