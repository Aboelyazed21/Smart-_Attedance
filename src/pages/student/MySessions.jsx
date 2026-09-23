import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMySessions } from "../../services/api";
import "../../App.css";

function MySessions() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  })();

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  /* =========================================================
     LOAD SESSIONS
  ========================================================= */

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMySessions();

      const records =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.sessions)
              ? data.sessions
              : [];

      setSessions(records);
    } catch (err) {
      console.error(
        "My sessions loading error:",
        err
      );

      setSessions([]);

      setError(
        err.message ||
          "Failed to load sessions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const getStatus = (session) =>
    String(
      session.status || "scheduled"
    )
      .toLowerCase()
      .trim();

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatTime = (value) => {
    if (!value) {
      return "—";
    }

    const text = String(value);

    if (
      text.includes("T") ||
      text.includes("-")
    ) {
      const date = new Date(value);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );
      }
    }

    return text.length >= 5
      ? text.substring(0, 5)
      : text;
  };

  /* =========================================================
     FILTERED SESSIONS
  ========================================================= */

  const filteredSessions = useMemo(() => {
    if (filter === "all") {
      return sessions;
    }

    return sessions.filter(
      (session) =>
        getStatus(session) === filter
    );
  }, [sessions, filter]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = useMemo(() => {
    return {
      all: sessions.length,

      scheduled:
        sessions.filter(
          (session) =>
            getStatus(session) ===
            "scheduled"
        ).length,

      active:
        sessions.filter(
          (session) =>
            getStatus(session) ===
            "active"
        ).length,

      closed:
        sessions.filter(
          (session) =>
            getStatus(session) ===
            "closed"
        ).length,
    };
  }, [sessions]);

  /* =========================================================
     ATTENDANCE STATUS
  ========================================================= */

  const getAttendanceStatus = (
    session
  ) => {
    const attendanceStatus =
      String(
        session.attendance_status ||
          ""
      )
        .toLowerCase()
        .trim();

    const validationStatus =
      String(
        session.validation_status ||
          ""
      )
        .toLowerCase()
        .trim();

    if (
      session.attendance_id ||
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

    if (
      attendanceStatus === "late"
    ) {
      return {
        label: "Late",
        className: "late",
      };
    }

    if (
      attendanceStatus === "absent"
    ) {
      return {
        label: "Absent",
        className: "absent",
      };
    }

    return {
      label: "Not Recorded",
      className: "not-recorded",
    };
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/");
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            🎓
          </div>

          <div>
            <h2>
              Attendify
            </h2>

            <span>
              SMART ATTENDANCE
            </span>
          </div>

        </div>

        {/* PROFILE */}

        <div className="sidebar-profile">

          <div className="profile-avatar">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-info">

            <strong>
              {firstName}
            </strong>

            <span>
              Student
            </span>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="dashboard-nav">

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <span>
              ▦
            </span>

            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/attendance"
              )
            }
          >
            <span>
              ✓
            </span>

            My Attendance
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/scan"
              )
            }
          >
            <span>
              ▣
            </span>

            Scan QR
          </button>

          <button
            className="nav-item active"
            onClick={() =>
              navigate(
                "/student/sessions"
              )
            }
          >
            <span>
              ◫
            </span>

            My Sessions
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={() =>
              alert(
                "Correction Requests page will be added next."
              )
            }
          >
            <span>
              ⚑
            </span>

            Correction Requests
          </button>

          <button
            className="nav-item"
            type="button"
            onClick={() =>
              alert(
                "Notifications page will be added next."
              )
            }
          >
            <span>
              🔔
            </span>

            Notifications
          </button>

        </nav>

        {/* LOGOUT */}

        <div className="sidebar-bottom">

          <button
            className="nav-item logout-button"
            onClick={
              handleLogout
            }
          >
            <span>
              ↪
            </span>

            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">

        {/* HEADER */}

        <header className="dashboard-header">

          <div>

            <h1>
              My Sessions
            </h1>

            <p>
              View your enrolled class sessions
            </p>

          </div>

          <div className="dashboard-user">

            <div className="header-avatar">
              {firstName
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        {/* CONTENT */}

        <section className="dashboard-content">

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="dashboard-stats">

            <div className="stat-card">

              <div className="stat-icon session-icon">
                ◫
              </div>

              <div>

                <span>
                  All Sessions
                </span>

                <strong>
                  {loading
                    ? "..."
                    : counts.all}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon attendance-icon">
                ◷
              </div>

              <div>

                <span>
                  Scheduled
                </span>

                <strong>
                  {loading
                    ? "..."
                    : counts.scheduled}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon present-icon">
                ●
              </div>

              <div>

                <span>
                  Active
                </span>

                <strong>
                  {loading
                    ? "..."
                    : counts.active}
                </strong>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-icon absent-icon">
                ✓
              </div>

              <div>

                <span>
                  Closed
                </span>

                <strong>
                  {loading
                    ? "..."
                    : counts.closed}
                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              SESSIONS PANEL
          ================================================= */}

          <div className="dashboard-panel">

            <div className="panel-header">

              <div>

                <h2>
                  Class Sessions
                </h2>

                <p>
                  Sessions for your enrolled sections
                </p>

              </div>

              <button
                type="button"
                onClick={
                  loadSessions
                }
                disabled={
                  loading
                }
              >
                {loading
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

            {/* FILTERS */}

            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >

              {[
                ["all", "All"],
                [
                  "scheduled",
                  "Scheduled",
                ],
                [
                  "active",
                  "Active",
                ],
                [
                  "closed",
                  "Closed",
                ],
              ].map(
                ([value, label]) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        value
                      )
                    }
                    style={{
                      border:
                        filter ===
                        value
                          ? "none"
                          : "1px solid #dfe4ea",

                      background:
                        filter ===
                        value
                          ? "#4f46e5"
                          : "#fff",

                      color:
                        filter ===
                        value
                          ? "#fff"
                          : "#4b5563",

                      padding:
                        "9px 16px",

                      borderRadius:
                        "8px",

                      cursor:
                        "pointer",

                      fontWeight:
                        600,
                    }}
                  >
                    {label}
                  </button>

                )
              )}

            </div>

            {/* ERROR */}

            {error && (
              <div
                style={{
                  background:
                    "#fff1f2",

                  color:
                    "#be123c",

                  border:
                    "1px solid #fecdd3",

                  padding:
                    "14px 16px",

                  borderRadius:
                    "10px",

                  marginBottom:
                    "18px",
                }}
              >
                {error}
              </div>
            )}

            {/* LOADING */}

            {loading ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ◷
                </div>

                <h3>
                  Loading sessions...
                </h3>

                <p>
                  Please wait while we load
                  your sessions.
                </p>

              </div>

            ) : filteredSessions.length ===
              0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  ◫
                </div>

                <h3>
                  No sessions found
                </h3>

                <p>
                  There are no sessions matching
                  the selected filter.
                </p>

              </div>

            ) : (

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "16px",
                }}
              >

                {filteredSessions.map(
                  (session) => {

                    const attendance =
                      getAttendanceStatus(
                        session
                      );

                    const status =
                      getStatus(
                        session
                      );

                    return (

                      <div
                        key={
                          session.id
                        }
                        style={{
                          border:
                            "1px solid #e7eaf0",

                          borderRadius:
                            "14px",

                          padding:
                            "20px",

                          background:
                            "#fff",

                          boxShadow:
                            "0 4px 16px rgba(15,23,42,0.05)",
                        }}
                      >

                        {/* COURSE HEADER */}

                        <div
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "flex-start",

                            gap:
                              "12px",

                            marginBottom:
                              "16px",
                          }}
                        >

                          <div>

                            <div
                              style={{
                                fontSize:
                                  "13px",

                                fontWeight:
                                  700,

                                color:
                                  "#6366f1",

                                marginBottom:
                                  "5px",
                              }}
                            >
                              {session.course_code ||
                                "COURSE"}
                            </div>

                            <h3
                              style={{
                                margin:
                                  0,

                                fontSize:
                                  "18px",

                                color:
                                  "#111827",
                              }}
                            >
                              {session.course_name ||
                                "Course"}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "5px 0 0",

                                color:
                                  "#6b7280",

                                fontSize:
                                  "14px",
                              }}
                            >
                              Section{" "}
                              {session.section_name ||
                                "—"}
                            </p>

                          </div>

                          {/* SESSION STATUS */}

                          <span
                            style={{
                              padding:
                                "6px 10px",

                              borderRadius:
                                "999px",

                              fontSize:
                                "12px",

                              fontWeight:
                                700,

                              background:
                                status ===
                                "active"
                                  ? "#dcfce7"
                                  : status ===
                                      "closed"
                                    ? "#f3f4f6"
                                    : "#fef3c7",

                              color:
                                status ===
                                "active"
                                  ? "#166534"
                                  : status ===
                                      "closed"
                                    ? "#4b5563"
                                    : "#92400e",
                            }}
                          >
                            {status
                              .charAt(
                                0
                              )
                              .toUpperCase() +
                              status.slice(
                                1
                              )}
                          </span>

                        </div>

                        {/* SESSION INFO */}

                        <div
                          style={{
                            display:
                              "grid",

                            gap:
                              "11px",

                            marginBottom:
                              "18px",
                          }}
                        >

                          {/* DATE */}

                          <div
                            style={{
                              display:
                                "flex",

                              justifyContent:
                                "space-between",

                              gap:
                                "10px",

                              color:
                                "#6b7280",

                              fontSize:
                                "14px",
                            }}
                          >

                            <span>
                              📅 Date
                            </span>

                            <strong
                              style={{
                                color:
                                  "#374151",
                              }}
                            >
                              {formatDate(
                                session.session_date
                              )}
                            </strong>

                          </div>

                          {/* TIME */}

                          <div
                            style={{
                              display:
                                "flex",

                              justifyContent:
                                "space-between",

                              gap:
                                "10px",

                              color:
                                "#6b7280",

                              fontSize:
                                "14px",
                            }}
                          >

                            <span>
                              🕐 Time
                            </span>

                            <strong
                              style={{
                                color:
                                  "#374151",
                              }}
                            >
                              {formatTime(
                                session.scheduled_start
                              )}

                              {" - "}

                              {formatTime(
                                session.scheduled_end
                              )}
                            </strong>

                          </div>

                          {/* ROOM */}

                          <div
                            style={{
                              display:
                                "flex",

                              justifyContent:
                                "space-between",

                              gap:
                                "10px",

                              color:
                                "#6b7280",

                              fontSize:
                                "14px",
                            }}
                          >

                            <span>
                              📍 Room
                            </span>

                            <strong
                              style={{
                                color:
                                  "#374151",

                                textAlign:
                                  "right",
                              }}
                            >
                              {session.building
                                ? `${session.building} - `
                                : ""}

                              {session.room_name ||
                                "Not assigned"}
                            </strong>

                          </div>

                        </div>

                        {/* FOOTER */}

                        <div
                          style={{
                            borderTop:
                              "1px solid #eef0f3",

                            paddingTop:
                              "14px",

                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            gap:
                              "10px",
                          }}
                        >

                          <span
                            style={{
                              fontSize:
                                "13px",

                              fontWeight:
                                700,

                              color:
                                attendance.className ===
                                "present"
                                  ? "#15803d"
                                  : attendance.className ===
                                      "late"
                                    ? "#b45309"
                                    : attendance.className ===
                                        "absent"
                                      ? "#dc2626"
                                      : "#6b7280",
                            }}
                          >
                            {attendance.label}
                          </span>

                          {/* SCAN QR */}

                          {status ===
                            "active" &&
                            !session.attendance_id && (

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    "/student/scan"
                                  )
                                }
                                style={{
                                  border:
                                    "none",

                                  background:
                                    "#4f46e5",

                                  color:
                                    "#fff",

                                  padding:
                                    "9px 14px",

                                  borderRadius:
                                    "8px",

                                  cursor:
                                    "pointer",

                                  fontWeight:
                                    700,
                                }}
                              >
                                Scan QR
                              </button>

                            )}

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default MySessions;