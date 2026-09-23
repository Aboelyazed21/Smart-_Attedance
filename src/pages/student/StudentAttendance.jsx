import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const studentName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    "Student";

  const firstName = studentName.split(" ")[0];

  const today = new Date();

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stats = [
    {
      title: "Attendance Rate",
      value: "0%",
      subtitle: "+0% from last month",
      type: "attendance",
      icon: "▥",
      trend: "↗",
    },
    {
      title: "Total Sessions",
      value: "0",
      subtitle: "No sessions yet",
      type: "sessions",
      icon: "▣",
      trend: "☷",
    },
    {
      title: "Present",
      value: "0",
      subtitle: "Keep it up!",
      type: "present",
      icon: "✓",
      trend: "↗",
    },
    {
      title: "Absent",
      value: "0",
      subtitle: "Let's do better",
      type: "absent",
      icon: "!",
      trend: "↗",
    },
  ];

  const quickActions = [
    {
      title: "Scan QR Code",
      description: "Mark your attendance",
      icon: "▦",
      type: "blue",
      action: () => navigate("/student/scan"),
    },
    {
      title: "My Attendance",
      description: "View your attendance history",
      icon: "▥",
      type: "green",
      action: () => navigate("/student/attendance"),
    },
    {
      title: "Request Correction",
      description: "Report an attendance issue",
      icon: "▤",
      type: "purple",
      action: () => {
        // Reserved for correction page
      },
    },
  ];

  const tips = [
    "Attend classes regularly",
    "Check your timetable",
    "Scan the QR code on time",
    "Keep track of your progress",
  ];

  const calendarDays = [
    "",
    "",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
  ];

  return (
    <div className="student-dashboard">
      {/* ================= SIDEBAR ================= */}
      <aside className="student-sidebar">
        <div className="sidebar-top">
          {/* Brand */}
          <div className="student-brand">
            <div className="brand-logo">
              <span>🎓</span>
            </div>

            <div className="brand-text">
              <strong>Attendify</strong>
              <small>SMART ATTENDANCE</small>
            </div>
          </div>

          {/* Profile */}
          <div className="student-profile-card">
            <div className="student-avatar">
              {studentName.charAt(0).toUpperCase()}
            </div>

            <div className="student-profile-info">
              <strong>{studentName}</strong>
              <span>Student</span>
            </div>

            <button className="profile-more">•••</button>
          </div>

          {/* Navigation */}
          <nav className="student-nav">
            <button className="student-nav-item active">
              <span className="nav-icon">⌂</span>
              <span>Dashboard</span>
            </button>

            <button
              className="student-nav-item"
              onClick={() => navigate("/student/attendance")}
            >
              <span className="nav-icon">▥</span>
              <span>My Attendance</span>
            </button>

            <button
              className="student-nav-item"
              onClick={() => navigate("/student/scan")}
            >
              <span className="nav-icon">▦</span>
              <span>Scan Attendance</span>
            </button>

            <button className="student-nav-item">
              <span className="nav-icon">▤</span>
              <span>Correction Requests</span>
            </button>

            <button className="student-nav-item">
              <span className="nav-icon">♟</span>
              <span>Notifications</span>

              <span className="notification-badge">3</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-motivation">
            <div className="motivation-icon">🎓</div>

            <div>
              <strong>Keep going!</strong>
              <span>Every class counts.</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/");
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="student-main">
        {/* Header */}
        <header className="student-header">
          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search courses, sessions, or anything..."
            />

            <span className="search-shortcut">Ctrl + K</span>
          </div>

          <div className="header-right">
            <button className="header-notification">
              ♧
              <span>3</span>
            </button>

            <div className="header-user">
              <div className="header-avatar">
                {studentName.charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{studentName}</strong>
                <small>Student</small>
              </div>

              <span className="header-arrow">⌄</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="student-content">
          {/* ================= HERO ================= */}
          <section className="dashboard-hero">
            <div className="hero-left">
              <div className="hero-title-row">
                <h1>
                  Good Morning, {firstName}! <span>👋</span>
                </h1>
              </div>

              <p>
                Stay consistent, keep learning, and make every class count.
              </p>
            </div>

            <div className="hero-date">
              <div className="date-icon">▣</div>

              <div>
                <strong>{formattedDate}</strong>
                <span>Here's your overview for today</span>
              </div>
            </div>

            <div className="hero-decoration">
              <div className="hero-decoration-shape shape-one" />
              <div className="hero-decoration-shape shape-two" />

              <div className="hero-graduation">🎓</div>

              <div className="hero-quote">
                <span>“</span>
                Small steps
                <br />
                today, a brighter
                <br />
                tomorrow.
                <span>”</span>
              </div>
            </div>
          </section>

          {/* ================= STATS ================= */}
          <section className="stats-grid">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className={`stat-card stat-${stat.type}`}
              >
                <div className="stat-icon">{stat.icon}</div>

                <div className="stat-content">
                  <span>{stat.title}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.subtitle}</small>
                </div>

                <div className="stat-trend">{stat.trend}</div>
              </div>
            ))}
          </section>

          {/* ================= TOP GRID ================= */}
          <section className="dashboard-grid-top">
            {/* Today's Sessions */}
            <div className="dashboard-card sessions-card">
              <div className="card-header">
                <div className="card-title-wrapper">
                  <div className="card-icon blue-icon">▣</div>

                  <div>
                    <h2>Today's Sessions</h2>
                    <p>Your scheduled classes for today</p>
                  </div>
                </div>

                <button className="view-all-button">
                  View All →
                </button>
              </div>

              <div className="empty-session">
                <div className="empty-session-icon">
                  <span>▣</span>
                  <small>◷</small>
                </div>

                <h3>No sessions today</h3>

                <p>
                  You don't have any scheduled classes for today.
                </p>

                <button
                  className="primary-button"
                  onClick={() => navigate("/student/scan")}
                >
                  <span>▣</span>
                  Scan Attendance
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card quick-card">
              <div className="card-header">
                <div className="card-title-wrapper">
                  <div className="card-icon yellow-icon">ϟ</div>

                  <div>
                    <h2>Quick Actions</h2>
                    <p>Frequently used actions</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    className={`quick-action ${action.type}`}
                    onClick={action.action}
                  >
                    <div className="quick-action-icon">
                      {action.icon}
                    </div>

                    <div className="quick-action-content">
                      <strong>{action.title}</strong>
                      <span>{action.description}</span>
                    </div>

                    <span className="quick-arrow">›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="dashboard-card calendar-card">
              <div className="calendar-header">
                <div className="card-title-wrapper">
                  <div className="card-icon blue-icon">▣</div>

                  <div>
                    <h2>Calendar</h2>
                  </div>
                </div>

                <div className="calendar-month">
                  <button>‹</button>
                  <strong>
                    {today.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  <button>›</button>
                </div>
              </div>

              <div className="calendar-week">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <span key={day}>{day}</span>
                  )
                )}
              </div>

              <div className="calendar-days">
                {calendarDays.map((day, index) => (
                  <span
                    key={`${day}-${index}`}
                    className={
                      day === String(today.getDate())
                        ? "calendar-today"
                        : ""
                    }
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ================= BOTTOM GRID ================= */}
          <section className="dashboard-grid-bottom">
            {/* Recent Activity */}
            <div className="dashboard-card activity-card">
              <div className="card-header">
                <div className="card-title-wrapper">
                  <div className="card-icon blue-icon">◷</div>

                  <div>
                    <h2>Recent Activity</h2>
                    <p>Your latest attendance activity</p>
                  </div>
                </div>

                <button className="view-all-button">
                  View All →
                </button>
              </div>

              <div className="empty-activity">
                <div className="empty-activity-icon">▱</div>

                <h3>No recent activity</h3>

                <p>
                  Your attendance records will appear here once you start
                  attending classes.
                </p>
              </div>
            </div>

            {/* Motivation */}
            <div className="motivation-card">
              <div className="motivation-background-circle circle-a" />
              <div className="motivation-background-circle circle-b" />

              <div className="motivation-content">
                <h2>
                  Stay consistent
                  <br />
                  every class <strong>matters.</strong>
                </h2>

                <div className="books-illustration">
                  📚
                </div>

                <div className="quote-box">
                  <span>“</span>

                  <p>
                    The expert in anything
                    <br />
                    was once a beginner.
                  </p>

                  <small>— Helen Hayes</small>
                </div>
              </div>
            </div>

            {/* Attendance Goal */}
            <div className="dashboard-card goal-card">
              <div className="card-header">
                <div className="card-title-wrapper">
                  <div className="card-icon red-icon">◎</div>

                  <div>
                    <h2>Attendance Goal</h2>
                    <p>Target: 75% this semester</p>
                  </div>
                </div>
              </div>

              <div className="goal-content">
                <div className="progress-ring">
                  <div className="progress-ring-inner">
                    <strong>0%</strong>
                    <span>Progress</span>
                  </div>
                </div>

                <div className="goal-legend">
                  <div>
                    <span className="legend-dot green-dot" />
                    <label>Present</label>
                    <strong>0</strong>
                  </div>

                  <div>
                    <span className="legend-dot red-dot" />
                    <label>Absent</label>
                    <strong>0</strong>
                  </div>

                  <div>
                    <span className="legend-dot blue-dot" />
                    <label>Total</label>
                    <strong>0</strong>
                  </div>
                </div>
              </div>

              <div className="goal-tip">
                <span>💡</span>
                Regular attendance leads to better academic progress and
                more opportunities.
              </div>
            </div>

            {/* Tips */}
            <div className="dashboard-card tips-card">
              <div className="card-header">
                <div className="card-title-wrapper">
                  <div className="card-icon yellow-icon">💡</div>

                  <div>
                    <h2>Tips for Better Attendance</h2>
                  </div>
                </div>
              </div>

              <div className="tips-list">
                {tips.map((tip) => (
                  <div className="tip-item" key={tip}>
                    <span>✓</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="student-footer">
          <span>Attendify</span>
          <b>•</b>
          <span>Port Said University</span>
          <b>•</b>
          <span>A Smarter Campus for a Brighter Tomorrow</span>

          <span className="footer-version">v1.0.0</span>
        </footer>
      </main>
    </div>
  );
};

export default StudentDashboard;