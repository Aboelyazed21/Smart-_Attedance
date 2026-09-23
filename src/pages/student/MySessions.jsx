import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { getMySessions } from "../../services/api";
import "./MySessions.css";

function Icon({ name, size = 18 }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    scan: (
      <>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 12h16" />
      </>
    ),

    sessions: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 2v4M17 2v4M3 9h18M7 13h4M7 16h7" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),

    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
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
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "Not available";

  const raw = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00`
    : raw.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return "";

  const raw = String(value);

  if (!raw.includes("T") && !raw.includes("-")) {
    return raw.length >= 5 ? raw.slice(0, 5) : raw;
  }

  const date = new Date(raw.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return raw.length >= 5 ? raw.slice(0, 5) : raw;
  }

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSessionStatus(session) {
  const raw = String(session.status || "scheduled")
    .toLowerCase()
    .trim();

  const aliases = {
    open: "active",
    running: "active",
    completed: "closed",
    ended: "closed",
  };

  return aliases[raw] || raw;
}

function formatStatus(value) {
  const status = String(value || "").trim();

  if (!status) return "Not recorded";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getAttendanceStatus(session) {
  const attendanceStatus = String(
    session.attendance_status ||
      session.attendance?.status ||
      ""
  )
    .toLowerCase()
    .trim();

  const validationStatus = String(
    session.validation_status || ""
  )
    .toLowerCase()
    .trim();

  if (attendanceStatus === "late") {
    return {
      label: "Late",
      className: "late",
    };
  }

  if (attendanceStatus === "absent") {
    return {
      label: "Absent",
      className: "absent",
    };
  }

  if (attendanceStatus === "excused") {
    return {
      label: "Excused",
      className: "excused",
    };
  }

  if (
    attendanceStatus === "present" ||
    attendanceStatus === "accepted" ||
    attendanceStatus === "on_time" ||
    validationStatus === "accepted"
  ) {
    return {
      label: "Present",
      className: "present",
    };
  }

  if (session.attendance_id || session.attendance?.id) {
    return {
      label: "Recorded",
      className: "recorded",
    };
  }

  return {
    label: "Not recorded",
    className: "not-recorded",
  };
}

function MySessions() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSavedUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();
  const avatarLetter = firstName.charAt(0).toUpperCase() || "S";

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getMySessions();

      const records = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.sessions)
            ? data.sessions
            : [];

      setSessions(records);
    } catch (requestError) {
      setSessions([]);
      setError(
        requestError.message ||
          "Could not load your sessions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    document.body.classList.toggle(
      "sessions-sidebar-open",
      sidebarOpen
    );

    return () =>
      document.body.classList.remove(
        "sessions-sidebar-open"
      );
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const navigateAndClose = (path) => {
    closeSidebar();
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const counts = useMemo(
    () => ({
      all: sessions.length,
      scheduled: sessions.filter(
        (session) => getSessionStatus(session) === "scheduled"
      ).length,
      active: sessions.filter(
        (session) => getSessionStatus(session) === "active"
      ).length,
      closed: sessions.filter(
        (session) => getSessionStatus(session) === "closed"
      ).length,
    }),
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sessions.filter((session) => {
      const sessionStatus = getSessionStatus(session);

      const matchesStatus =
        statusFilter === "all" ||
        sessionStatus === statusFilter;

      const searchableText = [
        session.course_code,
        session.course_name,
        session.section_name,
        session.room_name,
        session.building,
        session.session_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [search, sessions, statusFilter]);

  const filterOptions = [
    { value: "all", label: "All", count: counts.all },
    {
      value: "scheduled",
      label: "Scheduled",
      count: counts.scheduled,
    },
    { value: "active", label: "Active", count: counts.active },
    { value: "closed", label: "Closed", count: counts.closed },
  ];

  function handleLogout() {
    closeSidebar();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="sessions-page">
      <button
        type="button"
        className="sessions-mobile-menu-button"
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
          className="sessions-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`sessions-sidebar ${
          sidebarOpen ? "is-open" : ""
        }`}
      >
        <div className="sessions-brand">
          <div className="sessions-brand-logo" aria-hidden="true">
            <span className="brand-mark" />
          </div>

          <div>
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="sessions-profile">
          <div className="sessions-avatar">{avatarLetter}</div>

          <div className="sessions-profile-info">
            <strong>{fullName}</strong>
            <span>Student</span>
          </div>
        </div>

        <nav className="sessions-nav">
          <button
            type="button"
            className={isActive("/dashboard") ? "active" : ""}
            onClick={() => navigateAndClose("/dashboard")}
          >
            <span className="sessions-nav-icon">
              <Icon name="dashboard" size={16} />
            </span>
            Dashboard
          </button>

          <button
            type="button"
            className={
              isActive("/student/attendance") ? "active" : ""
            }
            onClick={() =>
              navigateAndClose("/student/attendance")
            }
          >
            <span className="sessions-nav-icon">
              <Icon name="calendar" size={16} />
            </span>
            My Attendance
          </button>

          <button
            type="button"
            className={
              isActive("/student/scan") ? "active" : ""
            }
            onClick={() => navigateAndClose("/student/scan")}
          >
            <span className="sessions-nav-icon">
              <Icon name="scan" size={16} />
            </span>
            Scan Attendance
          </button>

          <button
            type="button"
            className={
              isActive("/student/sessions") ? "active" : ""
            }
            onClick={() =>
              navigateAndClose("/student/sessions")
            }
          >
            <span className="sessions-nav-icon">
              <Icon name="sessions" size={16} />
            </span>
            My Sessions
          </button>

          <button
            type="button"
            className={
              isActive("/student/correction-requests")
                ? "active"
                : ""
            }
            onClick={() =>
              navigateAndClose("/student/correction-requests")
            }
          >
            <span className="sessions-nav-icon">
              <Icon name="edit" size={16} />
            </span>
            Correction Requests
          </button>
        </nav>

        <div className="sessions-sidebar-bottom">
          <div className="sessions-side-tip">
            <strong>Keep going</strong>
            <span>Every class counts.</span>
          </div>

          <button
            type="button"
            className="sessions-logout"
            onClick={handleLogout}
          >
            <span>
              <Icon name="logout" size={16} />
            </span>
            Logout
          </button>
        </div>
      </aside>

      <main className="sessions-main">
        <header className="sessions-topbar">
          <div className="sessions-user-area">
            <div className="sessions-top-avatar">
              {avatarLetter}
            </div>

            <div className="sessions-top-user-info">
              <strong>{fullName}</strong>
              <span>Student</span>
            </div>
          </div>
        </header>

        <section className="sessions-content">
          <div className="sessions-hero">
            <div>
              <span className="sessions-eyebrow">ATTENDANCE</span>
              <h1>My Sessions</h1>
              <p>
                View class sessions available to your enrolled
                sections.
              </p>
            </div>

            <button
              type="button"
              className="sessions-refresh-button"
              onClick={loadSessions}
              disabled={loading}
            >
              {loading ? "Loading" : "Refresh"}
            </button>
          </div>

          <div className="sessions-stats">
            <div className="sessions-stat-card total">
              <span>All Sessions</span>
              <strong>{loading ? "Loading" : counts.all}</strong>
              <small>Available sessions</small>
            </div>

            <div className="sessions-stat-card scheduled">
              <span>Scheduled</span>
              <strong>
                {loading ? "Loading" : counts.scheduled}
              </strong>
              <small>Upcoming sessions</small>
            </div>

            <div className="sessions-stat-card active">
              <span>Active</span>
              <strong>{loading ? "Loading" : counts.active}</strong>
              <small>Open for attendance</small>
            </div>

            <div className="sessions-stat-card closed">
              <span>Closed</span>
              <strong>{loading ? "Loading" : counts.closed}</strong>
              <small>Completed sessions</small>
            </div>
          </div>

          <section className="sessions-panel">
            <div className="sessions-panel-header">
              <div>
                <h2>Class Sessions</h2>
                <p>Sessions from your enrolled sections.</p>
              </div>

              {!loading && !error && (
                <span className="sessions-result-count">
                  Showing {filteredSessions.length} of{" "}
                  {sessions.length} sessions
                </span>
              )}
            </div>

            <div className="sessions-filters">
              <label className="sessions-search">
                <Icon name="search" size={16} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search course, section, or room"
                  aria-label="Search sessions"
                />
              </label>

              <div
                className="sessions-filter-buttons"
                aria-label="Filter sessions by status"
              >
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      statusFilter === option.value ? "active" : ""
                    }
                    aria-pressed={
                      statusFilter === option.value
                    }
                    onClick={() =>
                      setStatusFilter(option.value)
                    }
                  >
                    {option.label}
                    <span>{option.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <div className="sessions-error" role="alert">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={loadSessions}
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div
                className="sessions-skeleton-grid"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="sessions-empty">
                <h3>
                  {sessions.length
                    ? "No sessions match your filters"
                    : "No sessions are available yet"}
                </h3>

                <p>
                  {sessions.length
                    ? "Change the search or status filter to see other sessions."
                    : "Your enrolled class sessions will appear here when available."}
                </p>

                {sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                    }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="sessions-card-grid">
                {filteredSessions.map((session, index) => {
                  const sessionStatus = getSessionStatus(session);
                  const attendanceStatus =
                    getAttendanceStatus(session);

                  const startTime = formatTime(
                    session.scheduled_start
                  );

                  const endTime = formatTime(
                    session.scheduled_end
                  );

                  const timeRange =
                    startTime && endTime
                      ? `${startTime} to ${endTime}`
                      : startTime || endTime || "Not available";

                  const room = [
                    session.building,
                    session.room_name,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  const canScan =
                    sessionStatus === "active" &&
                    attendanceStatus.className === "not-recorded";

                  return (
                    <article
                      className="session-card"
                      key={session.id || `${sessionStatus}-${index}`}
                    >
                      <div className="session-card-header">
                        <div>
                          {session.course_code && (
                            <span className="session-course-code">
                              {session.course_code}
                            </span>
                          )}

                          <h3>
                            {session.course_name ||
                              "Course not available"}
                          </h3>

                          <p>
                            {session.section_name
                              ? `Section ${session.section_name}`
                              : "Section not available"}
                          </p>
                        </div>

                        <span
                          className={`session-status ${sessionStatus}`}
                        >
                          {formatStatus(sessionStatus)}
                        </span>
                      </div>

                      <div className="session-meta">
                        <div>
                          <span>Date</span>
                          <strong>
                            {formatDate(session.session_date)}
                          </strong>
                        </div>

                        <div>
                          <span>Time</span>
                          <strong>{timeRange}</strong>
                        </div>

                        <div>
                          <span>Room</span>
                          <strong>{room || "Not assigned"}</strong>
                        </div>
                      </div>

                      <div className="session-card-footer">
                        <span
                          className={`attendance-status ${attendanceStatus.className}`}
                        >
                          {attendanceStatus.label}
                        </span>

                        {canScan && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/student/scan")
                            }
                          >
                            Scan attendance
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default MySessions;