import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardReport } from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    students: 0,
    sessions: 0,
    attendanceRecords: 0,
    pendingCorrections: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
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
      }
    }

    loadDashboard();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  return (
    <div className="dashboard-page">

      {/* ================= SIDEBAR ================= */}
      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            A
          </div>

          <div>
            <h2>Attendify</h2>
            <span>Smart Attendance</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user.first_name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div>
            <strong>
              {user.first_name || "Admin"} {user.last_name || ""}
            </strong>

            <span>Administrator</span>
          </div>
        </div>

        {/* ================= NAVIGATION ================= */}
        <nav className="dashboard-nav">

          <button className="nav-item active">
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/users")}
          >
            <span>👥</span>
            Users
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/courses")}
          >
            <span>📚</span>
            Courses
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/sections")}
          >
            <span>▤</span>
            Sections
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/rooms")}
          >
            <span>🏫</span>
            Rooms
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/timetable")}
          >
            <span>🗓</span>
            Timetable
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/attendance")}
          >
            <span>✓</span>
            Attendance
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/reports")}
          >
            <span>▥</span>
            Reports
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/settings")}
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <button className="nav-item logout-item" onClick={handleLogout}>
          <span>↪</span>
          Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">

          <div>
            <h1>Dashboard</h1>
            <p>
              Welcome back, {user.first_name || "Admin"}!
              Here's what's happening today.
            </p>
          </div>

          <div className="dashboard-header-user">
            <div className="profile-avatar small">
              {user.first_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>

        </header>

        <section className="dashboard-content">

          {/* ERROR */}
          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          {/* ================= STATS ================= */}
          <div className="dashboard-stats">

            <div className="stat-card">

              <div className="stat-icon">
                👨‍🎓
              </div>

              <div>
                <span>Total Students</span>

                <strong>
                  {loading ? "..." : dashboardData.students}
                </strong>

                <small>Registered students</small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                🗓
              </div>

              <div>
                <span>Total Sessions</span>

                <strong>
                  {loading ? "..." : dashboardData.sessions}
                </strong>

                <small>Attendance sessions</small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ✓
              </div>

              <div>
                <span>Attendance Records</span>

                <strong>
                  {loading ? "..." : dashboardData.attendanceRecords}
                </strong>

                <small>Accepted attendance</small>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon">
                ⏳
              </div>

              <div>
                <span>Pending Corrections</span>

                <strong>
                  {loading ? "..." : dashboardData.pendingCorrections}
                </strong>

                <small>Awaiting review</small>
              </div>

            </div>

          </div>

          {/* ================= GRID ================= */}
          <div className="dashboard-grid">

            {/* SYSTEM OVERVIEW */}
            <section className="dashboard-panel">

              <div className="panel-header">
                <div>
                  <h2>System Overview</h2>
                  <p>Current attendance system statistics</p>
                </div>
              </div>

              <div className="overview-list">

                <div className="overview-item">
                  <span>Students</span>
                  <strong>
                    {loading ? "..." : dashboardData.students}
                  </strong>
                </div>

                <div className="overview-item">
                  <span>Sessions</span>
                  <strong>
                    {loading ? "..." : dashboardData.sessions}
                  </strong>
                </div>

                <div className="overview-item">
                  <span>Accepted Attendance</span>
                  <strong>
                    {loading ? "..." : dashboardData.attendanceRecords}
                  </strong>
                </div>

                <div className="overview-item">
                  <span>Pending Corrections</span>
                  <strong>
                    {loading ? "..." : dashboardData.pendingCorrections}
                  </strong>
                </div>

              </div>

            </section>

            {/* QUICK ACTIONS */}
            <section className="dashboard-panel">

              <div className="panel-header">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Common administrator actions</p>
                </div>
              </div>

              <div className="quick-actions">

                <button
                  className="quick-action"
                  onClick={() => navigate("/admin/users")}
                >
                  <span>👥</span>

                  <div>
                    <strong>Manage Users</strong>
                    <small>View and manage system users</small>
                  </div>
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/admin/courses")}
                >
                  <span>📚</span>

                  <div>
                    <strong>Manage Courses</strong>
                    <small>View and manage courses</small>
                  </div>
                </button>

                <button
                  className="quick-action"
                  onClick={() => navigate("/admin/reports")}
                >
                  <span>📊</span>

                  <div>
                    <strong>View Reports</strong>
                    <small>Analyze attendance reports</small>
                  </div>
                </button>

              </div>

            </section>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AdminDashboard;