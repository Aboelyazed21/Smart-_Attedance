import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyAttendance,
} from "../../services/api";
import "../../App.css";

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

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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

      <aside className="student-sidebar">

        <div className="student-brand">

          <div className="student-brand-logo">
            🎓
          </div>

          <div>
            <h2>Attendify</h2>

            <span>
              SMART ATTENDANCE
            </span>
          </div>

        </div>

        {/* PROFILE */}

        <div
          className="student-profile"
          onClick={() => navigate("/student/profile")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate("/student/profile");
            }
          }}
          title="Open Student Profile"
          style={{ cursor: "pointer" }}
        >

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

        <nav className="student-nav">

          <button
            className="student-nav-item active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate(
                "/student/attendance"
              )
            }
          >
            <span>✓</span>
            My Attendance
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate(
                "/student/scan"
              )
            }
          >
            <span>▣</span>
            Scan QR
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate(
                "/student/sessions"
              )
            }
          >
            <span>◫</span>
            My Sessions
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate(
                "/student/corrections"
              )
            }
          >
            <span>⚑</span>
            Correction Requests
          </button>

          <button
            className="student-nav-item"
            onClick={() =>
              navigate(
                "/student/notifications"
              )
            }
          >
            <span>🔔</span>
            Notifications
          </button>

        </nav>

        {/* LOGOUT */}

        <div className="student-sidebar-bottom">

          <button
            className="student-nav-item"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="student-dashboard-main">

        {/* HEADER */}

        <header className="student-dashboard-header">

          <div>
            <h1>
              Student Dashboard
            </h1>

            <p>
              Welcome back, {firstName}! 👋
            </p>
          </div>

          <div
            className="student-header-user"
            onClick={() => navigate("/student/profile")}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate("/student/profile");
              }
            }}
            title="Open Student Profile"
            style={{ cursor: "pointer" }}
          >

            <div className="student-header-avatar">
              {avatar}
            </div>

          </div>

        </header>

        <section className="student-dashboard-content">

          {/* ERROR */}

          {error && (
            <div className="student-dashboard-error">
              {error}

              <button
                onClick={loadAttendance}
              >
                Retry
              </button>
            </div>
          )}

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="student-stat-grid">

            <div className="student-stat-card">

              <div className="student-stat-icon blue">
                ✓
              </div>

              <div>
                <span>
                  Attendance Rate
                </span>

                <strong>
                  {loading
                    ? "..."
                    : `${stats.percentage}%`}
                </strong>

                <small>
                  Overall attendance
                </small>
              </div>

            </div>

            <div className="student-stat-card">

              <div className="student-stat-icon green">
                ✓
              </div>

              <div>
                <span>
                  Present
                </span>

                <strong>
                  {loading
                    ? "..."
                    : stats.present}
                </strong>

                <small>
                  Accepted attendance
                </small>
              </div>

            </div>

            <div className="student-stat-card">

              <div className="student-stat-icon orange">
                ⏱
              </div>

              <div>
                <span>
                  Late
                </span>

                <strong>
                  {loading
                    ? "..."
                    : stats.late}
                </strong>

                <small>
                  Late attendance
                </small>
              </div>

            </div>

            <div className="student-stat-card">

              <div className="student-stat-icon red">
                !
              </div>

              <div>
                <span>
                  Absent
                </span>

                <strong>
                  {loading
                    ? "..."
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
                  <div className="student-loading">
                    Loading attendance...
                  </div>
                </div>
              ) : recentAttendance.length ===
                0 ? (
                <div className="student-empty-state">

                  <div className="student-empty-icon">
                    ✓
                  </div>

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
                      navigate(
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

                          <div className="student-course-icon">
                            📚
                          </div>

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
                  onClick={() =>
                    navigate(
                      "/student/scan"
                    )
                  }
                >
                  <span>▣</span>

                  <div>
                    <strong>
                      Scan QR Code
                    </strong>

                    <small>
                      Mark your attendance
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >
                  <span>✓</span>

                  <div>
                    <strong>
                      My Attendance
                    </strong>

                    <small>
                      View full attendance
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/student/sessions"
                    )
                  }
                >
                  <span>◫</span>

                  <div>
                    <strong>
                      My Sessions
                    </strong>

                    <small>
                      View your classes
                    </small>
                  </div>

                  <b>→</b>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/student/corrections"
                    )
                  }
                >
                  <span>⚑</span>

                  <div>
                    <strong>
                      Correction Request
                    </strong>

                    <small>
                      Report an issue
                    </small>
                  </div>

                  <b>→</b>
                </button>

              </div>

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

      </main>

    </div>
  );
}

export default StudentDashboard;