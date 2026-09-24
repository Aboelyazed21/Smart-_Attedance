import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyAttendance,
} from "../../services/api";
import {
  deriveWarnings,
  getWeeklySummary,
  toRecords,
} from "../../utils/attendanceInsights";
import Footer from "../../components/Footer";
import StudentAssistant from "../../components/student/StudentAssistant";
import "../../components/student/StudentAssistant.css";
import "../../App.css";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  function goTo(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  /* =========================================================
     LOAD ATTENDANCE
  ========================================================= */

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyAttendance();

      setAttendance(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : []
      );
    } catch (err) {
      console.error(
        "Student dashboard attendance error:",
        err
      );

      setError(
        err.message ||
          "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  /* =========================================================
     ATTENDANCE STATS
  ========================================================= */

  const stats = useMemo(() => {
    const total = attendance.length;

    const present = attendance.filter(
      (item) =>
        String(
          item.attendance_status ||
            item.status ||
            ""
        ).toLowerCase() === "present" ||
        String(
          item.validation_status || ""
        ).toLowerCase() === "accepted"
    ).length;

    const late = attendance.filter(
      (item) =>
        String(
          item.attendance_status ||
            item.status ||
            ""
        ).toLowerCase() === "late"
    ).length;

    const absent = attendance.filter(
      (item) =>
        String(
          item.attendance_status ||
            item.status ||
            ""
        ).toLowerCase() === "absent"
    ).length;

    const percentage =
      total > 0
        ? Math.round(
            ((present + late) / total) * 100
          )
        : 0;

    return {
      total,
      present,
      late,
      absent,
      percentage,
    };
  }, [attendance]);

  /* =========================================================
     RECENT ATTENDANCE
  ========================================================= */

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        const dateA = new Date(
          a.attendance_time ||
            a.created_at ||
            a.session_date ||
            0
        );

        const dateB = new Date(
          b.attendance_time ||
            b.created_at ||
            b.session_date ||
            0
        );

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [attendance]);

  const normalizedRecords = useMemo(
    () => toRecords(attendance),
    [attendance]
  );

  const weekly = useMemo(
    () => getWeeklySummary(normalizedRecords),
    [normalizedRecords]
  );

  const warnings = useMemo(
    () => deriveWarnings(normalizedRecords, weekly),
    [normalizedRecords, weekly]
  );

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setSidebarOpen(false);
    navigate("/");
  }

  const firstName =
    user?.first_name || "Student";

  const lastName =
    user?.last_name || "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const avatar =
    firstName.charAt(0).toUpperCase();

  /* =========================================================
     STATUS
  ========================================================= */

  function getStatus(item) {
    const status = String(
      item.attendance_status ||
        item.status ||
        ""
    ).toLowerCase();

    if (
      status === "present" ||
      String(
        item.validation_status || ""
      ).toLowerCase() === "accepted"
    ) {
      return "Present";
    }

    if (status === "late") {
      return "Late";
    }

    if (status === "absent") {
      return "Absent";
    }

    return "Recorded";
  }

  function getStatusClass(status) {
    if (status === "Present") {
      return "student-status-present";
    }

    if (status === "Late") {
      return "student-status-late";
    }

    if (status === "Absent") {
      return "student-status-absent";
    }

    return "student-status-recorded";
  }

  function formatDate(item) {
    const value =
      item.attendance_time ||
      item.created_at ||
      item.session_date;

    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getCourse(item) {
    return (
      item.course_name ||
      item.course_code ||
      item.section_name ||
      "Attendance Session"
    );
  }

  return (
    <div className="student-dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        id="student-sidebar"
        className={
          sidebarOpen
            ? "student-sidebar open"
            : "student-sidebar"
        }
      >

        <div className="student-brand">

          <div className="student-brand-logo">
            A
          </div>

          <div>
            <h2>Attendify</h2>

            <span>
              SMART ATTENDANCE
            </span>
          </div>

        </div>

        {/* PROFILE */}

        <div className="student-profile">

          <div className="student-profile-avatar">
            {avatar}
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

        <nav
          className="student-nav"
          aria-label="Student navigation"
        >

          <button
            type="button"
            className="student-nav-item active"
            aria-current="page"
            onClick={() =>
              goTo("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            className="student-nav-item"
            onClick={() =>
              goTo(
                "/student/attendance"
              )
            }
          >
            My Attendance
          </button>

          <button
            type="button"
            className="student-nav-item"
            onClick={() =>
              goTo(
                "/student/scan"
              )
            }
          >
            Scan QR
          </button>

          <button
            type="button"
            className="student-nav-item"
            onClick={() =>
              goTo(
                "/student/correction-requests"
              )
            }
          >
            Correction Requests
          </button>

          <button
            type="button"
            className="student-nav-item"
            onClick={() =>
              goTo("/student/chatbot")
            }
          >
            Attendance Assistant
          </button>

        </nav>

        {/* LOGOUT */}

        <div className="student-sidebar-bottom">

          <button
            type="button"
            className="student-nav-item"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="student-sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-dashboard-main">

        {/* HEADER */}

        <header className="student-dashboard-header">

          <div className="student-header-leading">

            <button
              type="button"
              className="student-menu-button hamburger"
              aria-expanded={sidebarOpen}
              aria-controls="student-sidebar"
              aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
              onClick={() =>
                setSidebarOpen((open) => !open)
              }
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>

            <div>
              <h1>
                Student Dashboard
              </h1>

              <p>
                Welcome back, {firstName}
              </p>
            </div>

          </div>

          <div className="student-header-user">

            <div className="student-header-avatar">
              {avatar}
            </div>

          </div>

        </header>

        <section className="student-dashboard-content">

          {/* ERROR */}

          {error && (
            <div
              className="student-dashboard-error"
              role="alert"
            >
              {error}

              <button
                type="button"
                onClick={loadAttendance}
              >
                Try again
              </button>
            </div>
          )}

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="student-stat-grid">

            <div className="student-stat-card">

              <div>
                <span>
                  Attendance Rate
                </span>

                <strong>
                  {loading
                    ? "—"
                    : `${stats.percentage}%`}
                </strong>

                <small>
                  Overall attendance
                </small>
              </div>

            </div>

            <div className="student-stat-card">

              <div>
                <span>
                  Present
                </span>

                <strong>
                  {loading
                    ? "—"
                    : stats.present}
                </strong>

                <small>
                  Accepted attendance
                </small>
              </div>

            </div>

            <div className="student-stat-card">

              <div>
                <span>
                  Late
                </span>

                <strong>
                  {loading
                    ? "—"
                    : stats.late}
                </strong>

                <small>
                  Late attendance
                </small>
              </div>

            </div>

            <div className="student-stat-card">

              <div>
                <span>
                  Absent
                </span>

                <strong>
                  {loading
                    ? "—"
                    : stats.absent}
                </strong>

                <small>
                  Missing attendance
                </small>
              </div>

            </div>

          </div>

          {/* =================================================
              TOP GRID
          ================================================= */}

          <div className="student-dashboard-grid">

            {/* RECENT ATTENDANCE */}

            <section className="student-panel">

              <div className="student-panel-header">

                <div>
                  <h2>
                    Recent Attendance
                  </h2>

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
                  View All
                </button>

              </div>

              {loading ? (
                <div className="student-empty-state">
                  <div
                    className="student-loading"
                    role="status"
                  >
                    Loading attendance...
                  </div>
                </div>
              ) : recentAttendance.length ===
                0 ? (
                <div className="student-empty-state">

                  <h3>
                    No attendance records
                  </h3>

                  <p>
                    Your attendance records
                    will appear here.
                  </p>

                  <button
                    className="student-primary-button"
                    onClick={() =>
                      goTo(
                        "/student/scan"
                      )
                    }
                  >
                    Scan QR Code
                  </button>

                </div>
              ) : (
                <div className="student-attendance-list">

                  {recentAttendance.map(
                    (item, index) => {
                      const status =
                        getStatus(item);

                      return (
                        <div
                          className="student-attendance-row"
                          key={
                            item.attendance_id ||
                            item.id ||
                            index
                          }
                        >

                          <div className="student-attendance-info">

                            <strong>
                              {getCourse(item)}
                            </strong>

                            <span>
                              {formatDate(item)}
                            </span>

                          </div>

                          <span
                            className={`student-status ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            {/* QUICK ACTIONS */}

            <section className="student-panel">

              <div className="student-panel-header">

                <div>
                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Frequently used actions
                  </p>
                </div>

              </div>

              <div className="student-quick-actions">

                <button
                  type="button"
                  onClick={() =>
                    goTo(
                      "/student/scan"
                    )
                  }
                >
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
                  type="button"
                  onClick={() =>
                    goTo(
                      "/student/attendance"
                    )
                  }
                >
                  <div>
                    <strong>
                      My Attendance
                    </strong>

                    <small>
                      View full attendance
                    </small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    goTo(
                      "/student/correction-requests"
                    )
                  }
                >
                  <div>
                    <strong>
                      Correction Request
                    </strong>

                    <small>
                      Report an issue
                    </small>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    goTo("/student/chatbot")
                  }
                >
                  <div>
                    <strong>
                      Attendance Assistant
                    </strong>

                    <small>
                      Weekly summary and warnings
                    </small>
                  </div>
                </button>

              </div>

            </section>

          </div>

          {/* =================================================
              WEEKLY SUMMARY + WARNINGS (real data)
          ================================================= */}

          <div className="student-dashboard-grid">

            <section className="student-panel" aria-label="Weekly attendance summary">

              <div className="student-panel-header">

                <div>
                  <h2>
                    Weekly Attendance Summary
                  </h2>

                  <p>
                    Current week from your recorded sessions
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => goTo("/student/chatbot")}
                >
                  Ask assistant
                </button>

              </div>

              <div className="student-week-grid">
                <div>
                  <span>Total sessions</span>
                  <strong>{loading ? "—" : weekly.total}</strong>
                </div>
                <div>
                  <span>Attended</span>
                  <strong>{loading ? "—" : weekly.attended}</strong>
                </div>
                <div>
                  <span>Present</span>
                  <strong>{loading ? "—" : weekly.present}</strong>
                </div>
                <div>
                  <span>Absent</span>
                  <strong>{loading ? "—" : weekly.absent}</strong>
                </div>
                <div>
                  <span>Late</span>
                  <strong>{loading ? "—" : weekly.late}</strong>
                </div>
                <div>
                  <span>Rate</span>
                  <strong>{loading ? "—" : `${weekly.rate}%`}</strong>
                </div>
              </div>

            </section>

            <section className="student-panel" aria-label="Warnings summary">

              <div className="student-panel-header">

                <div>
                  <h2>
                    Warnings Summary
                  </h2>

                  <p>
                    Derived from your attendance records
                  </p>
                </div>

                <strong className="student-warnings-count">
                  {loading ? "—" : `${warnings.length} warnings`}
                </strong>

              </div>

              {loading ? (
                <div className="student-empty-state">
                  <p>Loading warnings…</p>
                </div>
              ) : warnings.length === 0 ? (
                <div className="student-empty-state">
                  <h3>No warnings</h3>
                  <p>
                    {normalizedRecords.length === 0
                      ? "No attendance records yet. Warnings will appear here once sessions are recorded."
                      : "Your attendance looks consistent."}
                  </p>
                </div>
              ) : (
                <ul className="student-warnings-list">
                  {warnings.map((w) => (
                    <li key={w.id}>
                      <div>
                        <strong>{w.type}</strong>
                        <span>{w.date}</span>
                      </div>
                      {w.course && w.course !== "—" && (
                        <small>Course: {w.course}</small>
                      )}
                      <p>{w.message}</p>
                    </li>
                  ))}
                </ul>
              )}

            </section>

          </div>

          {/* =================================================
              STUDENT INFORMATION
          ================================================= */}

          <section className="student-panel student-information-panel">

            <div className="student-panel-header">

              <div>
                <h2>
                  My Information
                </h2>

                <p>
                  Your account information
                </p>
              </div>

            </div>

            <div className="student-information-grid">

              <div>
                <span>
                  Full Name
                </span>

                <strong>
                  {fullName}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {user?.email || "—"}
                </strong>
              </div>

              <div>
                <span>
                  Student ID
                </span>

                <strong>
                  {user?.student_code ||
                    user?.university_id ||
                    user?.student_id ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Account Status
                </span>

                <strong className="student-active-text">
                  Active
                </strong>
              </div>

            </div>

          </section>

        </section>

        <Footer />

      </main>

      <StudentAssistant />

    </div>
  );
}

export default StudentDashboard;