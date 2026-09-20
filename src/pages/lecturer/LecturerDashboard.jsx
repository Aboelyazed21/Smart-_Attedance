import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getLecturerDashboardStats,
  getLecturerSections,
} from "../../services/api";

export default function LecturerDashboard() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [data, setData] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [
        statsResult,
        sectionsResult,
      ] = await Promise.all([
        getLecturerDashboardStats(),
        getLecturerSections(),
      ]);

      setData(statsResult || {});

      setSections(
        Array.isArray(sectionsResult?.sections)
          ? sectionsResult.sections
          : Array.isArray(sectionsResult)
          ? sectionsResult
          : []
      );

    } catch (error) {
      console.error(
        "Lecturer dashboard error:",
        error
      );

      setError(
        error.message ||
          "Failed to load lecturer dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     DATA
  ========================================================= */

  const stats =
    data?.stats || {};

  const lecturer =
    data?.lecturer || {};

  const firstName =
    user?.first_name ||
    user?.firstName ||
    lecturer.firstName ||
    "Lecturer";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    lecturer.lastName ||
    "";

  /* =========================================================
     LOGOUT
  ========================================================= */

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  /* =========================================================
     DASHBOARD CARDS
  ========================================================= */

  const cards = [
    [
      "Courses",
      stats.totalCourses || 0,
    ],

    [
      "Sections",
      stats.totalSections ||
        sections.length ||
        0,
    ],

    [
      "Enrolled Students",
      stats.totalEnrolledStudents ||
        stats.totalStudents ||
        0,
    ],

    [
      "Attendance Rate",
      `${stats.attendancePercentage || 0}%`,
    ],

    [
      "Total Sessions",
      stats.totalSessions || 0,
    ],

    [
      "Active Sessions",
      stats.activeSessions || 0,
    ],

    [
      "Attendance Records",
      stats.totalAttendanceEvents ||
        stats.attendanceEvents ||
        0,
    ],

    [
      "Pending Corrections",
      stats.correctionRequests?.pending ||
        stats.correctionRequests ||
        0,
    ],
  ];

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="lecturer-dashboard">

      <style>{`

        .lecturer-dashboard{
          min-height:100vh;
          background:#f6f8fc;
          color:#172033;
          font-family:Arial,sans-serif;
          display:flex;
        }

        .ld-side{
          width:245px;
          background:#111827;
          color:#fff;
          padding:22px 14px;
          box-sizing:border-box;
          min-height:100vh;
        }

        .ld-brand{
          font-size:20px;
          font-weight:800;
          padding:10px;
        }

        .ld-sub{
          display:block;
          color:#9ca3af;
          font-size:10px;
          letter-spacing:1px;
          margin-top:4px;
        }

        .ld-profile{
          border-block:1px solid #263044;
          padding:15px 8px;
          margin:18px 0;
          display:flex;
          gap:10px;
          align-items:center;
        }

        .ld-avatar{
          width:40px;
          height:40px;
          border-radius:50%;
          background:#2563eb;
          display:grid;
          place-items:center;
          font-weight:800;
          flex-shrink:0;
        }

        .ld-nav button{
          width:100%;
          border:0;
          background:transparent;
          color:#cbd5e1;
          text-align:left;
          padding:12px;
          border-radius:9px;
          cursor:pointer;
          margin:3px 0;
        }

        .ld-nav button:hover,
        .ld-nav .active{
          background:#253044;
          color:#fff;
        }

        .ld-bottom{
          margin-top:28px;
        }

        .ld-main{
          flex:1;
          min-width:0;
        }

        .ld-head{
          background:#fff;
          border-bottom:1px solid #e5e7eb;
          padding:25px 32px;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .ld-head h1{
          margin:0;
        }

        .ld-head p{
          margin:6px 0 0;
          color:#64748b;
        }

        .ld-refresh{
          border:0;
          background:#2563eb;
          color:#fff;
          padding:10px 18px;
          border-radius:8px;
          cursor:pointer;
        }

        .ld-refresh:disabled{
          opacity:.6;
          cursor:not-allowed;
        }

        .ld-content{
          padding:28px 32px;
        }

        .ld-error{
          background:#fff1f2;
          border:1px solid #fecdd3;
          color:#be123c;
          padding:12px;
          border-radius:10px;
          margin-bottom:18px;
        }

        .ld-cards{
          display:grid;
          grid-template-columns:
            repeat(4,1fr);
          gap:15px;
          margin-bottom:20px;
        }

        .ld-card,
        .ld-panel{
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:14px;
          padding:18px;
          box-shadow:
            0 4px 16px #0f172a0a;
        }

        .ld-card span{
          color:#64748b;
          font-size:12px;
        }

        .ld-card strong{
          display:block;
          font-size:26px;
          margin-top:8px;
        }

        .ld-grid{
          display:grid;
          grid-template-columns:
            1.4fr 1fr;
          gap:18px;
        }

        .ld-panel h2{
          margin:0;
          font-size:17px;
        }

        .ld-panel p{
          color:#64748b;
          font-size:13px;
        }

        .ld-row{
          display:flex;
          justify-content:space-between;
          gap:10px;
          padding:13px;
          border:1px solid #edf1f5;
          border-radius:10px;
          margin-top:9px;
        }

        .ld-row small{
          display:block;
          color:#64748b;
          margin-top:4px;
        }

        .ld-badge{
          background:#eff6ff;
          color:#2563eb;
          padding:6px 9px;
          border-radius:8px;
          font-size:11px;
          white-space:nowrap;
        }

        .ld-actions{
          display:grid;
          grid-template-columns:
            1fr 1fr;
          gap:10px;
        }

        .ld-action{
          padding:14px;
          border:1px solid #e2e8f0;
          background:#fff;
          border-radius:10px;
          text-align:left;
          cursor:pointer;
        }

        .ld-action:hover{
          border-color:#2563eb;
        }

        @media(max-width:1000px){

          .ld-cards{
            grid-template-columns:
              1fr 1fr;
          }

          .ld-grid{
            grid-template-columns:1fr;
          }

        }

        @media(max-width:700px){

          .ld-side{
            width:72px;
          }

          .ld-brand span,
          .ld-sub,
          .ld-profile div:last-child,
          .ld-nav span:last-child{
            display:none;
          }

          .ld-content{
            padding:18px;
          }

          .ld-head{
            padding:20px;
          }

          .ld-cards{
            grid-template-columns:
              1fr 1fr;
          }

        }

      `}</style>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="ld-side">

        <div className="ld-brand">
          🎓 <span>Attendify</span>

          <small className="ld-sub">
            LECTURER PORTAL
          </small>
        </div>

        <div className="ld-profile">

          <div className="ld-avatar">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {firstName} {lastName}
            </strong>

            <small className="ld-sub">
              Lecturer
            </small>
          </div>

        </div>

        <nav className="ld-nav">

          <button
            className="active"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ▦ <span>Dashboard</span>
          </button>

          <button
            onClick={() =>
              navigate(
                "/lecturer/sessions"
              )
            }
          >
            ◫{" "}
            <span>
              Attendance Sessions
            </span>
          </button>

          <button
            onClick={() =>
              navigate(
                "/lecturer/sections"
              )
            }
          >
            ▤{" "}
            <span>
              My Sections
            </span>
          </button>

          <button
            onClick={() =>
              navigate(
                "/lecturer/attendance"
              )
            }
          >
            ✓{" "}
            <span>
              Attendance
            </span>
          </button>

          <button
            onClick={() =>
              navigate(
                "/lecturer/reports"
              )
            }
          >
            ▥{" "}
            <span>
              Reports
            </span>
          </button>

        </nav>

        <div className="ld-bottom ld-nav">

          <button onClick={logout}>
            ↪ <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="ld-main">

        <header className="ld-head">

          <div>
            <h1>
              Lecturer Dashboard
            </h1>

            <p>
              Manage your courses,
              sessions and attendance.
            </p>
          </div>

          <button
            className="ld-refresh"
            onClick={load}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </header>

        <section className="ld-content">

          {error && (
            <div className="ld-error">
              {error}
            </div>
          )}

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="ld-cards">

            {cards.map(
              ([label, value]) => (
                <div
                  className="ld-card"
                  key={label}
                >
                  <span>
                    {label}
                  </span>

                  <strong>
                    {loading
                      ? "..."
                      : value}
                  </strong>
                </div>
              )
            )}

          </div>

          {/* =================================================
              SECTIONS + ACTIONS
          ================================================= */}

          <div className="ld-grid">

            <div className="ld-panel">

              <h2>
                My Sections
              </h2>

              <p>
                Sections assigned to you
              </p>

              {sections.length === 0 ? (

                <p>
                  No assigned sections
                  found.
                </p>

              ) : (

                sections
                  .slice(0, 6)
                  .map((section) => (

                    <div
                      className="ld-row"
                      key={
                        section.section_id ||
                        section.id
                      }
                    >

                      <div>

                        <strong>
                          {section.course_code ||
                            "Course"}

                          {" — "}

                          Section{" "}

                          {section.section_name ||
                            "-"}
                        </strong>

                        <small>
                          {section.course_name ||
                            ""}

                          {" · "}

                          {section.academic_year ||
                            ""}
                        </small>

                      </div>

                      <span className="ld-badge">
                        {section.enrolled_students ||
                          0}{" "}
                        students
                      </span>

                    </div>

                  ))
              )}

            </div>

            <div className="ld-panel">

              <h2>
                Quick Actions
              </h2>

              <p>
                Lecturer tools
              </p>

              <div className="ld-actions">

                <button
                  className="ld-action"
                  onClick={() =>
                    navigate(
                      "/lecturer/sessions"
                    )
                  }
                >
                  <b>
                    Sessions
                  </b>

                  <br />

                  <small>
                    Create QR sessions
                  </small>
                </button>

                <button
                  className="ld-action"
                  onClick={() =>
                    navigate(
                      "/lecturer/attendance"
                    )
                  }
                >
                  <b>
                    Attendance
                  </b>

                  <br />

                  <small>
                    Review attendance
                  </small>
                </button>

                <button
                  className="ld-action"
                  onClick={() =>
                    navigate(
                      "/lecturer/reports"
                    )
                  }
                >
                  <b>
                    Reports
                  </b>

                  <br />

                  <small>
                    View summaries
                  </small>
                </button>

                <button
                  className="ld-action"
                  onClick={() =>
                    navigate(
                      "/lecturer/sections"
                    )
                  }
                >
                  <b>
                    Sections
                  </b>

                  <br />

                  <small>
                    View assigned
                    sections
                  </small>
                </button>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}