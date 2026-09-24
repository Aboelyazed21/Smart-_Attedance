import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { getMyAttendance } from "../../services/api";
import Footer from "../../components/Footer";

import "./AttendanceConfirmation.css";

/* =========================================================
   HELPERS
========================================================= */

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function statusLabel(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "present") return "Present";
  if (normalized === "absent") return "Absent";
  if (normalized === "late") return "Late";
  if (normalized === "excused") return "Excused";

  return status || "Unknown";
}

function statusPillClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "present") return "present";
  if (normalized === "absent") return "absent";
  if (normalized === "late") return "late";
  if (normalized === "excused") return "excused";

  return "default";
}

function getCourseName(item) {
  return (
    item.course_name ||
    item.course_title ||
    item.courseName ||
    item.course_code ||
    item.courseCode ||
    "Unknown Course"
  );
}

function getSectionName(item) {
  return (
    item.section_name ||
    item.sectionName ||
    item.section ||
    "-"
  );
}

function getSessionDate(item) {
  return (
    item.session_date ||
    item.sessionDate ||
    item.date ||
    item.attendance_date ||
    item.created_at
  );
}

function getSource(item) {
  return item.source || item.attendance_source || "QR";
}

function sourceLabel(source) {
  const text = String(source || "").trim();

  if (!text) return "-";
  if (text.toLowerCase().includes("qr")) return "QR code";

  return text;
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function recordTimestamp(item) {
  const date = new Date(getSessionDate(item));

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

/* =========================================================
   ATTENDANCE CONFIRMATION
========================================================= */

function AttendanceConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const scanData = location.state || {};

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
        "—",

      courseCode:
        scanData.courseCode ||
        "—",

      section:
        scanData.section ||
        scanData.sectionName ||
        "—",

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
     RECENT ATTENDANCE RECORDS
  ========================================================= */

  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] =
    useState(true);
  const [recordsError, setRecordsError] =
    useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function goTo(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return undefined;
    }
    document.body.style.overflow = "hidden";
    function onKeyDown(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  async function loadRecords() {
    try {
      const data = await getMyAttendance();

      const rows = Array.isArray(data)
        ? data
        : data?.rows ||
          data?.attendance ||
          data?.records ||
          data?.data ||
          [];

      setRecords(
        Array.isArray(rows) ? rows : []
      );
    } catch (err) {
      console.error(
        "My attendance error:",
        err
      );

      setRecordsError(
        err?.message ||
          "Failed to load your attendance records."
      );
    } finally {
      setRecordsLoading(false);
    }
  }

  function retryRecords() {
    setRecordsLoading(true);
    setRecordsError("");

    loadRecords();
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort(
        (a, b) =>
          recordTimestamp(b) - recordTimestamp(a)
      )
      .slice(0, 5);
  }, [records]);

  const summary = useMemo(() => {
    const total = records.length;

    const present = records.filter(
      (item) =>
        normalizeStatus(item.status) === "present"
    ).length;

    const rate =
      total > 0
        ? Math.round((present / total) * 100)
        : 0;

    return {
      total,
      present,
      rate,
    };
  }, [records]);

  const summaryEmptyText = recordsLoading
    ? "Loading..."
    : "No records yet";

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setSidebarOpen(false);
    navigate("/");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="confirmation-page">

      {sidebarOpen && (
        <button
          type="button"
          className="confirmation-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        id="confirmation-sidebar"
        className={
          sidebarOpen
            ? "confirmation-sidebar open"
            : "confirmation-sidebar"
        }
      >

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

        <nav className="confirmation-nav" aria-label="Student navigation">

          <button
            type="button"
            onClick={() => goTo("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => goTo("/student/attendance")}
          >
            My Attendance
          </button>

          <button
            type="button"
            className="active"
            aria-current="page"
            onClick={() => goTo("/student/scan")}
          >
            Scan Attendance
          </button>

          <button
            type="button"
            onClick={() => goTo("/student/correction-requests")}
          >
            Correction Requests
          </button>

          <button
            type="button"
            onClick={() => goTo("/student/chatbot")}
          >
            Attendance Assistant
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="confirmation-sidebar-bottom">

          <button
            type="button"
            className="confirmation-logout"
            onClick={handleLogout}
          >
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

          <button
            type="button"
            className="hamburger confirmation-menu-button"
            aria-expanded={sidebarOpen}
            aria-controls="confirmation-sidebar"
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <div className="confirmation-user">

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

          </div>

        </header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section className="confirmation-content">

          {/* HERO */}

          <div className="confirmation-hero">

            <div className="confirmation-hero-left">

              <div>

                <span className="hero-eyebrow">
                  ATTENDANCE
                </span>

                <h1>
                  Attendance Confirmed
                </h1>

                <p>
                  Your attendance has been recorded successfully.
                </p>

                <span
                  className={`status-pill hero-pill ${statusPillClass(
                    attendance.status
                  )}`}
                >
                  {statusLabel(attendance.status)}
                </span>

              </div>

            </div>

          </div>

          {/* MAIN GRID */}

          <div className="confirmation-grid">

            {/* =================================================
                LEFT
            ================================================= */}

            <div className="confirmation-left">

              {/* SUCCESS CARD — centered professional confirmation */}

              <div
                className="success-card centered-success"
                role="status"
                aria-live="polite"
              >

                <h2>
                  Your attendance has been recorded successfully.
                </h2>

                <p>
                  {attendance.message}
                </p>

                {/* DETAILS */}

                <div className="attendance-details">

                  <div className="details-header">

                    <div className="details-title">

                      <h3>
                        Attendance Details
                      </h3>

                    </div>

                    <span className="verified-badge">
                      Recorded via {attendance.markedBy}
                    </span>

                  </div>

                  <div className="details-grid">

                    <div className="detail-box">

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

                      <div>
                        <small>
                          Status
                        </small>

                        <strong
                          className={`detail-status ${statusPillClass(
                            attendance.status
                          )}`}
                        >
                          {statusLabel(
                            attendance.status
                          )}
                        </strong>

                      </div>

                    </div>

                    <div className="detail-box">

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

                </div>

                {/* ACTIONS */}

                <div className="confirmation-actions">

                  <button
                    type="button"
                    className="primary-confirmation-button"
                    onClick={() =>
                      navigate(
                        "/student/attendance"
                      )
                    }
                  >
                    View My Attendance
                  </button>

                  <button
                    type="button"
                    className="secondary-confirmation-button"
                    onClick={() =>
                      navigate(
                        "/dashboard"
                      )
                    }
                  >
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

                {recordsLoading ? (
                  <div className="recent-state">
                    <div className="recent-spinner" />

                    <p>
                      Loading recent attendance...
                    </p>
                  </div>
                ) : recordsError ? (
                  <div
                    className="recent-error"
                    role="alert"
                  >
                    <span>
                      {recordsError}
                    </span>

                    <button
                      type="button"
                      onClick={retryRecords}
                    >
                      Try again
                    </button>
                  </div>
                ) : !recentRecords.length ? (
                  <div className="recent-state">
                    <p>
                      No attendance records yet.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/student/scan")
                      }
                    >
                      Scan Attendance QR
                    </button>
                  </div>
                ) : (
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

                    {recentRecords.map((item, index) => (
                      <div
                        className="recent-table-row"
                        key={
                          item.id ||
                          item.attendance_id ||
                          `${getSessionDate(item)}-${index}`
                        }
                      >
                        <span>
                          {index + 1}
                        </span>

                        <span>
                          {formatDateTime(
                            getSessionDate(item)
                          )}
                        </span>

                        <span>
                          {getCourseName(item)}
                        </span>

                        <span>
                          {getSectionName(item)}
                        </span>

                        <span>
                          <b
                            className={`status-pill ${statusPillClass(
                              item.status
                            )}`}
                          >
                            {statusLabel(item.status)}
                          </b>
                        </span>

                        <span>
                          {sourceLabel(getSource(item))}
                        </span>
                      </div>
                    ))}

                  </div>
                )}

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

                    <h3>
                      Attendance Summary
                    </h3>

                  </div>

                </div>

                <div className="summary-stats">

                  <div className="summary-stat present">

                    <small>
                      Present
                    </small>

                    <strong>
                      {summary.present}
                    </strong>

                    <em>
                      {summary.total
                        ? `out of ${summary.total} sessions`
                        : summaryEmptyText}
                    </em>

                  </div>

                  <div className="summary-stat sessions">

                    <small>
                      Total Sessions
                    </small>

                    <strong>
                      {summary.total}
                    </strong>

                    <em>
                      {summary.total
                        ? "All records"
                        : summaryEmptyText}
                    </em>

                  </div>

                  <div className="summary-stat rate">

                    <small>
                      Attendance Rate
                    </small>

                    <strong>
                      {summary.rate}%
                    </strong>

                    <em>
                      {summary.total
                        ? summary.rate >= 75
                          ? "On track"
                          : "Keep improving"
                        : summaryEmptyText}
                    </em>

                  </div>

                </div>

                {summary.total > 0 && (
                  <div className="progress-area">

                    <div className="progress-bar">

                      <div
                        className="progress-value"
                        style={{
                          width: `${summary.rate}%`,
                        }}
                      />

                    </div>

                    <strong>
                      {summary.rate}%
                    </strong>

                  </div>
                )}

                <p className="summary-message">
                  {summary.total > 0
                    ? `Based on ${summary.total} recorded session${
                        summary.total === 1 ? "" : "s"
                      }.`
                    : summaryEmptyText}
                </p>

              </div>

              {/* WHAT'S NEXT */}

              <div className="next-card">

                <div className="next-title">

                  <h3>
                    What's Next?
                  </h3>

                </div>

                <div className="next-list">

                  <div className="next-item">

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

              </div>

            </aside>

          </div>

        </section>

        <Footer />

      </main>

    </div>
  );
}

export default AttendanceConfirmation;