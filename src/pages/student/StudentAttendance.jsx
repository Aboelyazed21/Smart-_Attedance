import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { getMyAttendance } from "../../services/api";
import ThemeToggle from "../../components/ThemeToggle";
import StudentAssistant from "../../components/student/StudentAssistant";
import "../../components/student/StudentAssistant.css";
import StudentMobileNav from "./StudentMobileNav";

import "../../App.css";
import "./StudentDashboard.css";

/* =========================================================
   ICONS — inline SVG, usability only
   (no emoji, no check/cross marks, no decorative symbols)
========================================================= */

const iconPaths = {
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
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
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

  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
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
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),

  menu: <path d="M4 7h16M4 12h16M4 17h16" />,

  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
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

  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

function Icon({ name, size = 20, stroke = 1.8 }) {
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
      focusable="false"
    >
      {iconPaths[name] || iconPaths.home}
    </svg>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value) {
  if (!value) return "—";

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return String(value);
  }

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (status === "present") return "student-status-present";
  if (status === "absent") return "student-status-absent";
  if (status === "late") return "student-status-late";

  return "student-status-recorded";
}

/* =========================================================
   MY ATTENDANCE PAGE
========================================================= */

function StudentAttendance() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] =
    useSearchParams();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const firstName =
    user?.first_name ||
    user?.firstName ||
    (user?.name ? String(user.name).split(" ")[0] : "Student");

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
    `${firstName} ${lastName}`.trim() || "Student";

  const initial =
    firstName.charAt(0).toUpperCase() || "S";

  const today = useMemo(() => new Date(), []);

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const monthName = today.toLocaleDateString("en-US", {
    month: "long",
  });

  const year = today.getFullYear();
  const currentDay = today.getDate();

  const daysInMonth = new Date(
    year,
    today.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    year,
    today.getMonth(),
    1
  ).getDay();

  const calendarCells = Array.from(
    { length: Math.ceil((firstDay + daysInMonth) / 7) * 7 },
    (_, index) => {
      const day = index - firstDay + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    }
  );

  /* ---------------------------------------------------------
     ATTENDANCE DATA — real records from the API
  ---------------------------------------------------------- */

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyAttendance();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.attendances)
            ? data.attendances
            : [];

      setRecords(list);
    } catch (err) {
      console.error("Attendance loading error:", err);

      setRecords([]);
      setError(
        err?.message || "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  /* Close the mobile drawer on Escape */
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

  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const timeA = Date.parse(
        String(
          a?.session_date || a?.date || a?.created_at || ""
        )
      );
      const timeB = Date.parse(
        String(
          b?.session_date || b?.date || b?.created_at || ""
        )
      );

      return (
        (Number.isNaN(timeB) ? 0 : timeB) -
        (Number.isNaN(timeA) ? 0 : timeA)
      );
    });
  }, [records]);

  /* ---------------------------------------------------------
     FILTERS — driven by the URL so dashboard cards and
     sections can deep-link here (?status=present&course=X).
     Same course_key contract as the dashboard:
     course_code, course_name, course, section_name, section.
  ---------------------------------------------------------- */

  const VALID_STATUSES = useMemo(
    () => ["all", "present", "absent", "late"],
    []
  );

  function courseKey(row) {
    return String(
      row?.course_code ||
        row?.course_name ||
        row?.course ||
        row?.section_name ||
        row?.section ||
        "Course"
    );
  }

  function courseLabel(row) {
    return String(
      row?.course_name ||
        row?.course ||
        row?.course_code ||
        "Course"
    );
  }

  const statusParam = (
    searchParams.get("status") || "all"
  ).toLowerCase();

  const activeStatus = VALID_STATUSES.includes(
    statusParam
  )
    ? statusParam
    : "all";

  const activeCourse =
    searchParams.get("course") || "";

  const courseOptions = useMemo(() => {
    const map = new Map();

    for (const row of records) {
      const key = courseKey(row);

      if (!map.has(key)) {
        map.set(key, courseLabel(row));
      }
    }

    return [...map.entries()]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) =>
        a.label.localeCompare(b.label)
      );
  }, [records]);

  // Drop unknown course keys from the URL (e.g. stale link).
  useEffect(() => {
    if (
      activeCourse &&
      records.length > 0 &&
      !courseOptions.some(
        (option) => option.key === activeCourse
      )
    ) {
      const next = new URLSearchParams(searchParams);
      next.delete("course");
      setSearchParams(next, { replace: true });
    }
  }, [
    activeCourse,
    records.length,
    courseOptions,
    searchParams,
    setSearchParams,
  ]);

  function updateFilter(nextStatus, nextCourse) {
    const next = new URLSearchParams();

    if (nextStatus && nextStatus !== "all") {
      next.set("status", nextStatus);
    }

    if (nextCourse) {
      next.set("course", nextCourse);
    }

    setSearchParams(next);
  }

  const filteredRecords = useMemo(() => {
    return sortedRecords.filter((row) => {
      const status = String(row?.status || "")
        .trim()
        .toLowerCase();

      if (
        activeStatus !== "all" &&
        status !== activeStatus
      ) {
        return false;
      }

      if (
        activeCourse &&
        courseKey(row) !== activeCourse
      ) {
        return false;
      }

      return true;
    });
  }, [sortedRecords, activeStatus, activeCourse]);

  const hasActiveFilter =
    activeStatus !== "all" || activeCourse !== "";

  const stats = useMemo(() => {
    const total = records.length;

    const present = records.filter(
      (row) =>
        String(row?.status || "").trim().toLowerCase() ===
        "present"
    ).length;

    const absent = records.filter(
      (row) =>
        String(row?.status || "").trim().toLowerCase() ===
        "absent"
    ).length;

    const rate =
      total > 0 ? Math.round((present / total) * 100) : 0;

    return [
      {
        title: "Attendance Rate",
        value: `${rate}%`,
        note: loading
          ? "Loading attendance data"
          : total > 0
            ? "Based on recorded sessions"
            : "No attendance recorded yet",
        icon: "chart",
        tone: "blue",
      },
      {
        title: "Total Sessions",
        value: String(total),
        note: "Sessions recorded this semester",
        icon: "calendar",
        tone: "purple",
      },
      {
        title: "Present",
        value: String(present),
        note: "Sessions marked present",
        icon: "user",
        tone: "green",
      },
      {
        title: "Absent",
        value: String(absent),
        note: "Sessions marked absent",
        icon: "user",
        tone: "red",
      },
    ];
  }, [records, loading]);

  /* ---------------------------------------------------------
     NAVIGATION
  ---------------------------------------------------------- */

  const currentPath = location.pathname;

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "home",
    },
    {
      label: "My Attendance",
      path: "/student/attendance",
      icon: "chart",
    },
    {
      label: "Scan Attendance",
      path: "/student/scan",
      icon: "qr",
    },
    {
      label: "Correction Requests",
      path: "/student/correction-requests",
      icon: "clock",
    },
    {
      label: "Profile",
      path: "/student/profile",
      icon: "user",
    },
  ];

  const quickActions = [
    {
      title: "Scan QR Code",
      description: "Mark your attendance",
      icon: "qr",
      tone: "scan",
      path: "/student/scan",
    },
    {
      title: "My Attendance",
      description: "View your attendance history",
      icon: "chart",
      tone: "history",
      path: "/student/attendance",
    },
    {
      title: "Request Correction",
      description: "Report an attendance issue",
      icon: "clock",
      tone: "correction",
      path: "/student/correction-requests",
    },
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }

    return currentPath.startsWith(path);
  };

  const go = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  /* ---------------------------------------------------------
     RENDER
  ---------------------------------------------------------- */

  return (
    <div className="student-dashboard">
      {/* ============ SIDEBAR ============ */}
      <aside
        id="student-attendance-sidebar"
        className={
          sidebarOpen
            ? "student-sidebar open"
            : "student-sidebar"
        }
      >
        <div>
          <div className="student-brand">
            <div
              className="student-brand-logo"
              aria-hidden="true"
            >
              A
            </div>

            <div>
              <h2>Attendify</h2>
              <span>SMART ATTENDANCE</span>
            </div>
          </div>

          <div className="student-profile-card">
            <div className="student-profile-avatar">
              {initial}
            </div>

            <div className="student-profile-copy">
              <strong>{fullName}</strong>
              <span>Student</span>
            </div>
          </div>

          <nav
            className="student-navigation"
            aria-label="Student navigation"
          >
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={
                  isActive(item.path)
                    ? "student-nav-item active"
                    : "student-nav-item"
                }
                aria-current={
                  isActive(item.path) ? "page" : undefined
                }
                onClick={() => go(item.path)}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="student-sidebar-bottom">
          <div className="student-sidebar-tip">
            <div className="student-sidebar-tip-icon">
              <Icon name="light" size={17} />
            </div>

            <div>
              <strong>Keep going!</strong>
              <span>Every class counts.</span>
            </div>
          </div>

          <button
            className="student-logout"
            type="button"
            onClick={handleLogout}
          >
            <Icon name="logout" size={17} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay — closes the drawer when the page background is tapped. */}
      <button
        type="button"
        className={
          sidebarOpen
            ? "sidebar-overlay show"
            : "sidebar-overlay"
        }
        aria-label="Close menu"
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile menu button — direct child of the page root.
          It stays above the overlay and drawer on small screens. */}
      <button
        className="mobile-menu-btn"
        type="button"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
        aria-controls="student-attendance-sidebar"
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <Icon name="menu" size={20} />
      </button>

      {/* ============ MAIN ============ */}
      <main className="student-main">
        <header className="student-topbar">
          <ThemeToggle />
          <div
            className="student-topbar-right"
            style={{ marginLeft: "auto" }}
          >
            <div className="student-header-profile">
              <div className="student-header-avatar">
                {initial}
              </div>

              <div>
                <strong>{fullName}</strong>
                <span>Student</span>
              </div>
            </div>
          </div>
        </header>

        <section className="student-content">
          {/* ============ HERO ============ */}
          <div className="student-hero">
            <div className="student-hero-copy">
              <span className="student-hero-date">
                {formattedDate}
              </span>

              <h1>My Attendance</h1>

              <p>
                Your attendance history for this semester,
                updated after every class.
              </p>
            </div>
          </div>

          {/* ============ STATS ============ */}
          <div className="student-stats">
            {stats.map((stat) => (
              <article
                key={stat.title}
                className={`student-stat-card ${stat.tone}`}
              >
                <div className="student-stat-icon">
                  <Icon name={stat.icon} size={20} />
                </div>

                <div className="student-stat-content">
                  <span>{stat.title}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.note}</small>
                </div>
              </article>
            ))}
          </div>

          {/* ============ FILTERS ============ */}
          <div
            className="student-filter-bar"
            role="group"
            aria-label="Filter attendance records"
          >
            <div className="student-filter-pills">
              {[
                { value: "all", label: "All" },
                { value: "present", label: "Present" },
                { value: "absent", label: "Absent" },
                { value: "late", label: "Late" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="student-filter-pill"
                  aria-pressed={
                    activeStatus === option.value
                  }
                  onClick={() =>
                    updateFilter(
                      option.value,
                      activeCourse
                    )
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            <select
              className="student-filter-select"
              aria-label="Filter by course or section"
              value={activeCourse}
              onChange={(event) =>
                updateFilter(
                  activeStatus,
                  event.target.value
                )
              }
            >
              <option value="">
                All courses &amp; sections
              </option>

              {courseOptions.map((option) => (
                <option
                  key={option.key}
                  value={option.key}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                className="student-filter-clear"
                onClick={() =>
                  updateFilter("all", "")
                }
              >
                Clear filters
              </button>
            )}

            <span
              className="student-filter-count"
              role="status"
            >
              {loading
                ? "Loading records…"
                : `${filteredRecords.length} of ${records.length} sessions shown`}
            </span>
          </div>

          {/* ============ MAIN GRID ============ */}
          <div className="student-main-grid">
            {/* Attendance history — real data */}
            <section className="student-panel sessions-panel">
              <div className="student-panel-header">
                <div className="student-panel-title">
                  <div className="student-panel-icon blue">
                    <Icon name="chart" size={18} />
                  </div>

                  <div>
                    <h2>Attendance History</h2>
                    <p>All recorded sessions</p>
                  </div>
                </div>
              </div>

              {loading && (
                <p className="student-loading" role="status">
                  Loading attendance…
                </p>
              )}

              {!loading && error && (
                <div
                  className="student-dashboard-error"
                  role="alert"
                >
                  <p>{error}</p>

                  <button
                    type="button"
                    onClick={loadAttendance}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !error && (
                <>
                  {sortedRecords.length === 0 ? (
                    <div className="student-empty-state">
                      <div className="student-empty-icon">
                        <Icon name="chart" size={26} />
                      </div>

                      <h3>No attendance records yet</h3>

                      <p>
                        Your records will appear here after
                        your lecturers mark attendance.
                      </p>
                    </div>
                  ) : filteredRecords.length === 0 ? (
                    <div className="student-empty-state">
                      <div className="student-empty-icon">
                        <Icon name="search" size={26} />
                      </div>

                      <h3>No sessions match these filters</h3>

                      <p>
                        Try a different status or course,
                        or clear the filters to see
                        everything.
                      </p>

                      <button
                        type="button"
                        className="student-filter-clear"
                        onClick={() =>
                          updateFilter("all", "")
                        }
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    <div className="student-attendance-list">
                      {filteredRecords.map((row, index) => {
                        const status = String(
                          row?.status || ""
                        )
                          .trim()
                          .toLowerCase();

                        const statusLabel = status
                          ? status.charAt(0).toUpperCase() +
                            status.slice(1)
                          : "Recorded";

                        const course =
                          row?.course_name ||
                          row?.course ||
                          row?.course_code ||
                          "Course";

                        const section =
                          row?.section_name ||
                          row?.section ||
                          "";

                        const dateValue =
                          row?.session_date ||
                          row?.date ||
                          row?.attendance_date ||
                          row?.created_at;

                        return (
                          <div
                            className="student-attendance-row"
                            key={
                              row?.id ??
                              `${dateValue}-${index}`
                            }
                          >
                            <div className="student-course-icon">
                              <Icon
                                name="calendar"
                                size={18}
                              />
                            </div>

                            <div className="student-attendance-info">
                              <strong>{course}</strong>
                              <span>
                                {formatDate(dateValue)}
                                {section
                                  ? ` · Section ${section}`
                                  : ""}
                              </span>
                            </div>

                            <span
                              className={`student-status ${getStatusClass(
                                status
                              )}`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Quick actions — all functional */}
            <section className="student-panel quick-panel">
              <div className="student-panel-header">
                <div className="student-panel-title">
                  <div className="student-panel-icon purple">
                    <Icon name="arrow" size={18} />
                  </div>

                  <div>
                    <h2>Quick Actions</h2>
                    <p>Frequently used actions</p>
                  </div>
                </div>
              </div>

              <div className="student-quick-actions">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    className={`student-action-card ${action.tone}`}
                    type="button"
                    onClick={() => go(action.path)}
                  >
                    <div className="student-action-icon">
                      <Icon name={action.icon} size={20} />
                    </div>

                    <div>
                      <strong>{action.title}</strong>
                      <span>{action.description}</span>
                    </div>

                    <Icon name="arrow" size={17} />
                  </button>
                ))}
              </div>
            </section>

            {/* Calendar — current month */}
            <section className="student-panel calendar-panel">
              <div className="student-panel-header calendar-heading">
                <div className="student-panel-title">
                  <div className="student-panel-icon blue">
                    <Icon name="calendar" size={17} />
                  </div>

                  <div>
                    <h2>Calendar</h2>
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
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="student-calendar-grid">
                {calendarCells.map((day, index) => (
                  <span
                    key={`${day}-${index}`}
                    className={
                      day === currentDay ? "today" : ""
                    }
                  >
                    {day || ""}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* ============ FOOTER ============ */}
          <footer className="student-footer">
            <span>© Aboelyazed Hatem Aboelyazed</span>
            <span aria-hidden="true">·</span>
            <span>Badr University in Assiut</span>
          </footer>
        </section>
      </main>

      <StudentAssistant />
      <StudentMobileNav />
    </div>
  );
}

export default StudentAttendance;