import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyAttendance } from "../../services/api";
import "../../App.css";

function StudentAttendance() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================
  // LOAD ATTENDANCE
  // ============================================================

  const loadAttendance = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await getMyAttendance();

      const data = Array.isArray(response)
        ? response
        : response?.data ||
          response?.attendance ||
          [];

      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load my attendance error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load attendance"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const statistics = useMemo(() => {
    const total = attendance.length;

    const present = attendance.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "present"
    ).length;

    const late = attendance.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "late"
    ).length;

    const absent = attendance.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "absent"
    ).length;

    const excused = attendance.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "excused"
    ).length;

    const attended = present + late;

    const rate =
      total > 0
        ? Math.round((attended / total) * 100)
        : 0;

    return {
      total,
      present,
      late,
      absent,
      excused,
      rate,
    };
  }, [attendance]);

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-GB");
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    const normalized = String(
      status || ""
    ).toLowerCase();

    if (normalized === "present") {
      return "status-badge status-present";
    }

    if (normalized === "late") {
      return "status-badge status-late";
    }

    if (normalized === "absent") {
      return "status-badge status-absent";
    }

    if (normalized === "excused") {
      return "status-badge status-excused";
    }

    return "status-badge";
  };

  // ============================================================
  // STATUS TEXT
  // ============================================================

  const getStatusText = (status) => {
    if (!status) return "-";

    const value = String(status);

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1).toLowerCase()
    );
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="dashboard-page">
      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            SA
          </div>

          <div>
            <h2>Smart Attendance</h2>
            <span>Student Portal</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            S
          </div>

          <div>
            <strong>Student</strong>
            <span>Student Account</span>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            type="button"
            className="nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>▣</span>
            Dashboard
          </button>

          <button
            type="button"
            className="nav-item active"
            onClick={() =>
              navigate("/student/attendance")
            }
          >
            <span>✓</span>
            My Attendance
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/student/scan")
            }
          >
            <span>▦</span>
            Scan QR
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => {}}
          >
            <span>◷</span>
            My Sessions
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => {}}
          >
            <span>!</span>
            Correction Requests
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => {}}
          >
            <span>🔔</span>
            Notifications
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-item logout-item"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="dashboard-main">
        {/* HEADER */}

        <header className="dashboard-header">
          <div>
            <h1>My Attendance</h1>

            <p>
              Track your attendance records and
              attendance rate.
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                loadAttendance(true)
              }
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                navigate("/student/scan")
              }
            >
              Scan QR
            </button>
          </div>
        </header>

        <section className="dashboard-content">
          {/* ERROR */}

          {error && (
            <div
              className="alert alert-error"
              style={{
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {/* ==================================================
              STATISTICS
          =================================================== */}

          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">
                📚
              </div>

              <div>
                <span>Total Sessions</span>
                <strong>
                  {statistics.total}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ✓
              </div>

              <div>
                <span>Present</span>
                <strong>
                  {statistics.present}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ⏰
              </div>

              <div>
                <span>Late</span>
                <strong>
                  {statistics.late}
                </strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                ✕
              </div>

              <div>
                <span>Absent</span>
                <strong>
                  {statistics.absent}
                </strong>
              </div>
            </div>
          </div>

          {/* ==================================================
              ATTENDANCE RATE
          =================================================== */}

          <div className="dashboard-grid">
            <section className="dashboard-panel">
              <div className="panel-header">
                <div>
                  <h2>Attendance Rate</h2>

                  <p>
                    Your current attendance
                    percentage.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "30px",
                  padding: "25px",
                }}
              >
                <div
                  style={{
                    width: "130px",
                    height: "130px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `conic-gradient(#2563eb ${statistics.rate}%, #e5e7eb ${statistics.rate}% 100%)`,
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "96px",
                      height: "96px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "700",
                    }}
                  >
                    {statistics.rate}%
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      margin: "0 0 8px",
                    }}
                  >
                    Attendance Overview
                  </h3>

                  <p
                    style={{
                      margin: "0 0 8px",
                      color: "#6b7280",
                    }}
                  >
                    Present:{" "}
                    {statistics.present}
                  </p>

                  <p
                    style={{
                      margin: "0 0 8px",
                      color: "#6b7280",
                    }}
                  >
                    Late:{" "}
                    {statistics.late}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#6b7280",
                    }}
                  >
                    Excused:{" "}
                    {statistics.excused}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              ATTENDANCE HISTORY
          =================================================== */}

          <section className="dashboard-panel recent-panel">
            <div className="panel-header">
              <div>
                <h2>Attendance History</h2>

                <p>
                  All your attendance records.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  ⏳
                </div>

                <h3>
                  Loading attendance...
                </h3>

                <p>
                  Please wait.
                </p>
              </div>
            ) : attendance.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  📋
                </div>

                <h3>
                  No attendance records
                </h3>

                <p>
                  You do not have any attendance
                  records yet.
                </p>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    navigate("/student/scan")
                  }
                  style={{
                    marginTop: "15px",
                  }}
                >
                  Scan QR
                </button>
              </div>
            ) : (
              <div
                className="table-container"
                style={{
                  overflowX: "auto",
                }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Source</th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendance.map(
                      (item, index) => (
                        <tr
                          key={
                            item.id ||
                            item.attendance_id ||
                            item.event_id ||
                            index
                          }
                        >
                          <td>{index + 1}</td>

                          <td>
                            {item.course_code ||
                              item.course_name ||
                              item.course ||
                              "-"}
                          </td>

                          <td>
                            {item.section_name ||
                              item.section ||
                              "-"}
                          </td>

                          <td>
                            {formatDate(
                              item.session_date ||
                                item.attendance_date ||
                                item.date ||
                                item.created_at
                            )}
                          </td>

                          <td>
                            {formatTime(
                              item.actual_start ||
                                item.session_start ||
                                item.created_at
                            )}
                          </td>

                          <td>
                            <span
                              className={getStatusClass(
                                item.status
                              )}
                            >
                              {getStatusText(
                                item.status
                              )}
                            </span>
                          </td>

                          <td>
                            {item.source
                              ? String(
                                  item.source
                                )
                                  .charAt(0)
                                  .toUpperCase() +
                                String(
                                  item.source
                                ).slice(1)
                              : "-"}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default StudentAttendance;