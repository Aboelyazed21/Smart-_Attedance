import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardReport } from "../../services/api";
import "./AdminDashboard.css";
function Icon({ type, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    courses: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21" />
        <path d="M6.5 2H21v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    sections: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
    rooms: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    attendance: (
      <>
        <path d="M20 6 9 17l-5-5" />
      </>
    ),
    reports: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h17" />
        <path d="m7 15 3-4 3 2 5-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.9 1.9-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.7v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.9-1.9.06-.06A1.7 1.7 0 0 0 7.76 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.7h.2a1.7 1.7 0 0 0 1.56-1.03 1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.9-1.9.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.23 5V4h2.7v1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.9 1.9-.06.06a1.7 1.7 0 0 0-.34 1.88A1.7 1.7 0 0 0 21 11.27h.2v2.7h-.2A1.7 1.7 0 0 0 19.4 15Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      </>
    ),
    students: (
      <>
        <circle cx="9" cy="7" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 5.5a3.5 3.5 0 0 1 0 7" />
        <path d="M18 14.5a5.5 5.5 0 0 1 3.5 5" />
      </>
    ),
    sessions: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    pending: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
        <path d="M3 5v5h5" />
        <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
        <path d="M21 19v-5h-5" />
      </>
    ),
  };

  return <svg {...common}>{icons[type] || icons.dashboard}</svg>;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    students: 0,
    sessions: 0,
    attendanceRecords: 0,
    pendingCorrections: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getDashboardReport();

      setDashboardData({
        students: Number(data.students || 0),
        sessions: Number(data.sessions || 0),
        attendanceRecords: Number(data.attendanceRecords || 0),
        pendingCorrections: Number(data.pendingCorrections || 0),
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);



  const firstName = user.first_name || "Admin";
  const lastName = user.last_name || "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const stats = [
    {
      key: "students",
      label: "Total Students",
      value: dashboardData.students,
      description: "Registered students",
      icon: "students",
      tone: "blue",
    },
    {
      key: "sessions",
      label: "Total Sessions",
      value: dashboardData.sessions,
      description: "Attendance sessions",
      icon: "sessions",
      tone: "violet",
    },
    {
      key: "attendance",
      label: "Attendance Records",
      value: dashboardData.attendanceRecords,
      description: "Accepted attendance",
      icon: "check",
      tone: "green",
    },
    {
      key: "corrections",
      label: "Pending Corrections",
      value: dashboardData.pendingCorrections,
      description: "Awaiting review",
      icon: "pending",
      tone: "orange",
    },
  ];



  return (
    <div className="dashboard-page admin-dashboard">


      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-title-area">
            <div className="breadcrumb">
              <span>Attendify</span>
              <span>/</span>
              <strong>Dashboard</strong>
            </div>

            <h1>Dashboard</h1>

            <p>
              Welcome back, {firstName}. Here&apos;s what&apos;s happening
              today.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className={`header-refresh ${refreshing ? "is-refreshing" : ""}`}
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              title="Refresh dashboard"
            >
              <Icon type="refresh" size={18} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <div className="header-divider" />

            <div className="header-account">
              <div className="header-avatar">{initials || "A"}</div>

              <div className="header-account-info">
                <strong>
                  {firstName} {lastName}
                </strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-hero">
            <div>
              <span className="hero-eyebrow">SYSTEM OVERVIEW</span>
              <h2>Attendance management at a glance</h2>
              <p>
                Monitor students, sessions, attendance activity and pending
                corrections from one place.
              </p>
            </div>

            <div className="hero-badge">
              <span className="hero-status-dot" />
              System Active
            </div>
          </div>

          {error && (
            <div className="dashboard-error">
              <span className="error-mark">!</span>
              <div>
                <strong>Unable to load dashboard data</strong>
                <p>{error}</p>
              </div>

              <button type="button" onClick={() => loadDashboard()}>
                Try again
              </button>
            </div>
          )}

          <div className="dashboard-stats">
            {stats.map((stat) => (
              <article
                className={`stat-card stat-card-${stat.tone}`}
                key={stat.key}
              >
                <div className="stat-card-top">
                  <div className="stat-icon">
                    <Icon type={stat.icon} size={21} />
                  </div>

                  <span className="stat-menu">•••</span>
                </div>

                <div className="stat-value">
                  {loading ? (
                    <span className="stat-skeleton">---</span>
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </div>

                <div className="stat-label">{stat.label}</div>
                <div className="stat-description">{stat.description}</div>
              </article>
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-panel overview-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">STATISTICS</span>
                  <h2>System Overview</h2>
                  <p>Current attendance system statistics</p>
                </div>
              </div>

              <div className="overview-list">
                <div className="overview-item">
                  <div className="overview-item-left">
                    <span className="overview-icon overview-blue">
                      <Icon type="students" size={18} />
                    </span>
                    <div>
                      <strong>Students</strong>
                      <small>Registered accounts</small>
                    </div>
                  </div>

                  <strong className="overview-number">
                    {loading ? "—" : dashboardData.students.toLocaleString()}
                  </strong>
                </div>

                <div className="overview-item">
                  <div className="overview-item-left">
                    <span className="overview-icon overview-violet">
                      <Icon type="sessions" size={18} />
                    </span>
                    <div>
                      <strong>Sessions</strong>
                      <small>Attendance sessions</small>
                    </div>
                  </div>

                  <strong className="overview-number">
                    {loading ? "—" : dashboardData.sessions.toLocaleString()}
                  </strong>
                </div>

                <div className="overview-item">
                  <div className="overview-item-left">
                    <span className="overview-icon overview-green">
                      <Icon type="check" size={18} />
                    </span>
                    <div>
                      <strong>Accepted Attendance</strong>
                      <small>Validated attendance records</small>
                    </div>
                  </div>

                  <strong className="overview-number">
                    {loading
                      ? "—"
                      : dashboardData.attendanceRecords.toLocaleString()}
                  </strong>
                </div>

                <div className="overview-item">
                  <div className="overview-item-left">
                    <span className="overview-icon overview-orange">
                      <Icon type="pending" size={18} />
                    </span>
                    <div>
                      <strong>Pending Corrections</strong>
                      <small>Requests awaiting review</small>
                    </div>
                  </div>

                  <strong className="overview-number">
                    {loading
                      ? "—"
                      : dashboardData.pendingCorrections.toLocaleString()}
                  </strong>
                </div>
              </div>
            </section>

            <section className="dashboard-panel quick-panel">
              <div className="panel-header">
                <div>
                  <span className="panel-kicker">SHORTCUTS</span>
                  <h2>Quick Actions</h2>
                  <p>Frequently used administrator actions</p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/admin/users")}
                >
                  <span className="quick-action-icon blue">
                    <Icon type="users" size={20} />
                  </span>

                  <span className="quick-action-content">
                    <strong>Manage Users</strong>
                    <small>View and manage system users</small>
                  </span>

                  <span className="quick-arrow">
                    <Icon type="arrow" size={18} />
                  </span>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/admin/courses")}
                >
                  <span className="quick-action-icon violet">
                    <Icon type="courses" size={20} />
                  </span>

                  <span className="quick-action-content">
                    <strong>Manage Courses</strong>
                    <small>View and manage courses</small>
                  </span>

                  <span className="quick-arrow">
                    <Icon type="arrow" size={18} />
                  </span>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => navigate("/admin/reports")}
                >
                  <span className="quick-action-icon green">
                    <Icon type="reports" size={20} />
                  </span>

                  <span className="quick-action-content">
                    <strong>View Reports</strong>
                    <small>Analyze attendance reports</small>
                  </span>

                  <span className="quick-arrow">
                    <Icon type="arrow" size={18} />
                  </span>
                </button>
              </div>
            </section>
          </div>

          <section className="dashboard-panel activity-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">ACTIVITY</span>
                <h2>System Status</h2>
                <p>Quick view of your attendance platform</p>
              </div>

              <span className="status-pill">
                <span />
                Operational
              </span>
            </div>

            <div className="status-grid">
              <div className="status-card">
                <div className="status-card-icon">
                  <Icon type="users" size={19} />
                </div>
                <div>
                  <strong>Students</strong>
                  <span>
                    {loading ? "Loading..." : `${dashboardData.students} registered`}
                  </span>
                </div>
              </div>

              <div className="status-card">
                <div className="status-card-icon">
                  <Icon type="sessions" size={19} />
                </div>
                <div>
                  <strong>Sessions</strong>
                  <span>
                    {loading ? "Loading..." : `${dashboardData.sessions} created`}
                  </span>
                </div>
              </div>

              <div className="status-card">
                <div className="status-card-icon">
                  <Icon type="check" size={19} />
                </div>
                <div>
                  <strong>Attendance</strong>
                  <span>
                    {loading
                      ? "Loading..."
                      : `${dashboardData.attendanceRecords} accepted`}
                  </span>
                </div>
              </div>

              <div className="status-card">
                <div className="status-card-icon">
                  <Icon type="pending" size={19} />
                </div>
                <div>
                  <strong>Corrections</strong>
                  <span>
                    {loading
                      ? "Loading..."
                      : `${dashboardData.pendingCorrections} pending`}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
