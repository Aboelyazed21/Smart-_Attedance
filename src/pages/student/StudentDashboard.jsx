import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyAttendance } from "../../services/api";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");
      const data = await getMyAttendance();
      setAttendance(
        Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []
      );
    } catch (err) {
      console.error("Attendance fetch error:", err);
      setError(err.message || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  const stats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter(
      (item) =>
        String(item.attendance_status || item.status || "").toLowerCase() === "present" ||
        String(item.validation_status || "").toLowerCase() === "accepted"
    ).length;
    const late = attendance.filter(
      (item) => String(item.attendance_status || item.status || "").toLowerCase() === "late"
    ).length;
    const absent = attendance.filter(
      (item) => String(item.attendance_status || item.status || "").toLowerCase() === "absent"
    ).length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, late, absent, percentage };
  }, [attendance]);

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        const dateA = new Date(a.attendance_time || a.created_at || a.session_date || 0);
        const dateB = new Date(b.attendance_time || b.created_at || b.session_date || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [attendance]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const firstName = user?.first_name || "Student";
  const lastName = user?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const avatar = firstName.charAt(0).toUpperCase();

  function getStatus(item) {
    const status = String(item.attendance_status || item.status || "").toLowerCase();
    if (status === "present" || String(item.validation_status || "").toLowerCase() === "accepted") {
      return "Present";
    }
    if (status === "late") return "Late";
    if (status === "absent") return "Absent";
    return "Recorded";
  }

  function getStatusClass(status) {
    switch (status) {
      case "Present": return "status-present";
      case "Late": return "status-late";
      case "Absent": return "status-absent";
      default: return "status-recorded";
    }
  }

  function formatDate(item) {
    const value = item.attendance_time || item.created_at || item.session_date;
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCourse(item) {
    return item.course_name || item.course_code || item.section_name || "Attendance Session";
  }

  return (
    <div className="dashboard-wrapper">
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside className={`dashboard-sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="brand-section">
          <div className="brand-logo">🎓</div>
          <div className="brand-text">
            <h2>Attendify</h2>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="profile-widget" onClick={() => navigate("/student/profile")}>
          <div className="avatar">{avatar}</div>
          <div className="user-info">
            <strong>{fullName}</strong>
            <span>Student</span>
          </div>
        </div>

        <nav className="main-nav">
          <button className="nav-item active" onClick={() => navigate("/dashboard")}>
            <span className="nav-icon">▦</span> Dashboard
          </button>
          <button className="nav-item" onClick={() => navigate("/student/attendance")}>
            <span className="nav-icon">✓</span> My Attendance
          </button>
          <button className="nav-item" onClick={() => navigate("/student/scan")}>
            <span className="nav-icon">▣</span> Scan QR
          </button>
          <button className="nav-item" onClick={() => navigate("/student/sessions")}>
            <span className="nav-icon">◫</span> My Sessions
          </button>
          <button className="nav-item" onClick={() => navigate("/student/corrections")}>
            <span className="nav-icon">⚑</span> Correction Requests
          </button>
          <button className="nav-item" onClick={() => navigate("/student/notifications")}>
            <span className="nav-icon">🔔</span> Notifications
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon">↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsSidebarOpen(true)}
            >
              ☰
            </button>
            <div className="header-greeting">
              <h1>Student Dashboard</h1>
              <p>Welcome back, {firstName}! 👋</p>
            </div>
          </div>
          
          <div className="header-right" onClick={() => navigate("/student/profile")}>
            <div className="avatar-small">{avatar}</div>
          </div>
        </header>

        <div className="dashboard-content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={loadAttendance}>Retry</button>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">✓</div>
              <div className="stat-details">
                <span className="stat-label">Attendance Rate</span>
                <strong className="stat-value">{loading ? "..." : `${stats.percentage}%`}</strong>
                <span className="stat-sub">Overall attendance</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div className="stat-details">
                <span className="stat-label">Present</span>
                <strong className="stat-value">{loading ? "..." : stats.present}</strong>
                <span className="stat-sub">Accepted attendance</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange">⏱</div>
              <div className="stat-details">
                <span className="stat-label">Late</span>
                <strong className="stat-value">{loading ? "..." : stats.late}</strong>
                <span className="stat-sub">Late attendance</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">!</div>
              <div className="stat-details">
                <span className="stat-label">Absent</span>
                <strong className="stat-value">{loading ? "..." : stats.absent}</strong>
                <span className="stat-sub">Missing attendance</span>
              </div>
            </div>
          </div>

          <div className="main-grid">
            <div className="panel recent-attendance-panel">
              <div className="panel-header">
                <div>
                  <h2>Recent Attendance</h2>
                  <p>Your latest attendance records</p>
                </div>
                <button className="btn-link" onClick={() => navigate("/student/attendance")}>View All</button>
              </div>
              
              <div className="panel-body">
                {loading ? (
                  <div className="empty-state">Loading attendance...</div>
                ) : recentAttendance.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✓</div>
                    <h3>No attendance records</h3>
                    <p>Your attendance records will appear here.</p>
                    <button className="btn-primary" onClick={() => navigate("/student/scan")}>
                      Scan QR Code
                    </button>
                  </div>
                ) : (
                  <div className="list-group">
                    {recentAttendance.map((item, index) => {
                      const status = getStatus(item);
                      return (
                        <div className="list-item" key={item.attendance_id || item.id || index}>
                          <div className="item-icon">📚</div>
                          <div className="item-details">
                            <strong>{getCourse(item)}</strong>
                            <span>{formatDate(item)}</span>
                          </div>
                          <span className={`badge ${getStatusClass(status)}`}>{status}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="panel side-panel">
              <div className="panel-header">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Frequently used actions</p>
                </div>
              </div>
              <div className="quick-actions-grid">
                <button className="action-card" onClick={() => navigate("/student/scan")}>
                  <span className="action-icon">▣</span>
                  <div className="action-text">
                    <strong>Scan QR Code</strong>
                    <span>Mark your attendance</span>
                  </div>
                </button>
                <button className="action-card" onClick={() => navigate("/student/attendance")}>
                  <span className="action-icon">✓</span>
                  <div className="action-text">
                    <strong>My Attendance</strong>
                    <span>View full attendance</span>
                  </div>
                </button>
                <button className="action-card" onClick={() => navigate("/student/sessions")}>
                  <span className="action-icon">◫</span>
                  <div className="action-text">
                    <strong>My Sessions</strong>
                    <span>View your classes</span>
                  </div>
                </button>
                <button className="action-card" onClick={() => navigate("/student/corrections")}>
                  <span className="action-icon">⚑</span>
                  <div className="action-text">
                    <strong>Correction Request</strong>
                    <span>Report an issue</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="panel info-panel">
            <div className="panel-header">
              <div>
                <h2>My Information</h2>
                <p>Your account information</p>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Full Name</span>
                <strong className="info-value">{fullName}</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <strong className="info-value">{user?.email || "—"}</strong>
              </div>
              <div className="info-item">
                <span className="info-label">Student ID</span>
                <strong className="info-value">
                  {user?.student_code || user?.university_id || user?.student_id || "—"}
                </strong>
              </div>
              <div className="info-item">
                <span className="info-label">Account Status</span>
                <strong className="info-value text-success">Active</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;