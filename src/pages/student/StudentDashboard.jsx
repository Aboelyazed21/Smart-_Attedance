import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyAttendance,
} from "../../services/api";
import "../../App.css";
import "./StudentDashboard.css";


function StudentIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      );

    case "attendance":
      return (
        <svg {...common}>
          <path d="M5 19V11" />
          <path d="M12 19V6" />
          <path d="M19 19v-9" />
          <path d="M3 19h18" />
        </svg>
      );

    case "scan":
      return (
        <svg {...common}>
          <path d="M5 5h5v5H5z" />
          <path d="M14 5h5v5h-5z" />
          <path d="M5 14h5v5H5z" />
          <path d="M14 14h2" />
          <path d="M19 14v5h-3" />
          <path d="M14 19v-2" />
        </svg>
      );

    case "sessions":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="M8 14h3M13 14h3M8 17h3" />
        </svg>
      );

    case "correction":
      return (
        <svg {...common}>
          <path d="M12 4v8l5 3" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );

    case "notifications":
      return (
        <svg {...common}>
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M10 5H5v14h5" />
          <path d="M13 8l4 4-4 4" />
          <path d="M17 12H8" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <path d="M5 19V10" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );

    case "present":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M8 12h8" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );

    case "absent":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );

    case "book":
      return (
        <svg {...common}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 0 5 21z" />
          <path d="M5 5.5v15" />
          <path d="M9 7h6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h13" />
          <path d="m13 7 5 5-5 5" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common} size={size}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      );

    default:
      return null;
  }
}

function StudentDashboard() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function navigateStudent(path) {
    setSidebarOpen(false);
    navigate(path);
  }

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
    <div className="student-dashboard">

      {/* =====================================================
          MOBILE NAVIGATION
      ===================================================== */}

      <button
        type="button"
        className="mobile-menu-btn"
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <StudentIcon name="menu" size={21} />
      </button>

      <button
        type="button"
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className={`student-sidebar ${sidebarOpen ? "open" : ""}`}>

        <div className="student-brand">

          <div className="student-brand-logo" aria-hidden="true">
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
            <StudentIcon name="dashboard" size={18} />
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
            <StudentIcon name="attendance" size={18} />
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
            <StudentIcon name="scan" size={18} />
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
            <StudentIcon name="sessions" size={18} />
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
            <StudentIcon name="correction" size={18} />
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
            <StudentIcon name="notifications" size={18} />
            Notifications
          </button>

        </nav>

        {/* LOGOUT */}

        <div className="student-sidebar-bottom">

          <button
            className="student-nav-item"
            onClick={handleLogout}
          >
            <StudentIcon name="logout" size={18} />
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
              Welcome back, {firstName}!
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
                <StudentIcon name="chart" size={19} />
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
                <StudentIcon name="present" size={19} />
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
                <StudentIcon name="clock" size={19} />
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
                <StudentIcon name="absent" size={19} />
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
                    <StudentIcon name="attendance" size={23} />
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
                            <StudentIcon name="book" size={18} />
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
                  <span className="student-action-icon">
                    <StudentIcon name="scan" size={17} />
                  </span>

                  <div>
                    <strong>
                      Scan QR Code
                    </strong>

                    <small>
                      Mark your attendance
                    </small>
                  </div>

                  <b className="student-action-arrow"><StudentIcon name="arrow" size={15} /></b>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >
                  <span className="student-action-icon">
                    <StudentIcon name="attendance" size={17} />
                  </span>

                  <div>
                    <strong>
                      My Attendance
                    </strong>

                    <small>
                      View full attendance
                    </small>
                  </div>

                  <b className="student-action-arrow"><StudentIcon name="arrow" size={15} /></b>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/student/sessions"
                    )
                  }
                >
                  <span className="student-action-icon">
                    <StudentIcon name="sessions" size={17} />
                  </span>

                  <div>
                    <strong>
                      My Sessions
                    </strong>

                    <small>
                      View your classes
                    </small>
                  </div>

                  <b className="student-action-arrow"><StudentIcon name="arrow" size={15} /></b>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/student/corrections"
                    )
                  }
                >
                  <span className="student-action-icon">
                    <StudentIcon name="correction" size={17} />
                  </span>

                  <div>
                    <strong>
                      Correction Request
                    </strong>

                    <small>
                      Report an issue
                    </small>
                  </div>

                  <b className="student-action-arrow"><StudentIcon name="arrow" size={15} /></b>
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