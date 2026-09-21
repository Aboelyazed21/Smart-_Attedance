import { useEffect, useMemo, useState } from "react";
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

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [stats, assigned] = await Promise.all([
        getLecturerDashboardStats(),
        getLecturerSections(),
      ]);

      setData(stats || {});

      setSections(
        Array.isArray(assigned?.sections)
          ? assigned.sections
          : Array.isArray(assigned)
            ? assigned
            : []
      );
    } catch (e) {
      console.error(
        "Lecturer dashboard error:",
        e
      );

      setError(
        e.message ||
          "Failed to load lecturer dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats || {};
  const lecturer = data?.lecturer || {};

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

  const fullName =
    `${firstName} ${lastName}`.trim();

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase();

  const totalStudents =
    Number(stats.totalEnrolledStudents || 0);

  const attendanceRate =
    Number(stats.attendancePercentage || 0);

  const activeSessions =
    Number(stats.activeSessions || 0);

  const totalSessions =
    Number(stats.totalSessions || 0);

  const totalAttendance =
    Number(stats.totalAttendanceEvents || 0);

  const pendingCorrections =
    Number(
      stats.correctionRequests?.pending || 0
    );

  const totalCourses =
    Number(stats.totalCourses || 0);

  const totalSections =
    Number(
      stats.totalSections ||
        sections.length ||
        0
    );

  const displayedSections = useMemo(() => {
    return sections.slice(0, 6);
  }, [sections]);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function goToCourse(section) {
    const courseId =
      section.course_id ||
      section.courseId;

    if (courseId) {
      navigate(
        `/admin/courses/${courseId}`
      );
      return;
    }

    navigate("/lecturer/sections");
  }

  return (
    <div className="lecturer-dashboard">
      <style>{`

        * {
          box-sizing: border-box;
        }

        .lecturer-dashboard {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
          color: #172033;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* ================================
           SIDEBAR
        ================================= */

        .ld-sidebar {
          width: 250px;
          min-height: 100vh;
          background: #101828;
          color: #ffffff;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          align-self: flex-start;
        }

        .ld-brand {
          padding: 6px 10px 22px;
          border-bottom: 1px solid #253044;
        }

        .ld-brand-title {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        .ld-brand-subtitle {
          display: block;
          margin-top: 5px;
          color: #94a3b8;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.4px;
        }

        .ld-profile {
          margin: 20px 0;
          padding: 14px 10px;
          border-bottom: 1px solid #253044;
          display: flex;
          align-items: center;
          gap: 11px;
        }

        .ld-avatar {
          width: 42px;
          height: 42px;
          min-width: 42px;
          border-radius: 12px;
          background: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
        }

        .ld-profile-name {
          font-size: 14px;
          font-weight: 700;
          line-height: 1.35;
        }

        .ld-profile-role {
          margin-top: 3px;
          color: #94a3b8;
          font-size: 11px;
        }

        .ld-navigation {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ld-nav-button {
          width: 100%;
          border: 0;
          background: transparent;
          color: #cbd5e1;
          padding: 12px 13px;
          border-radius: 9px;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition:
            background 0.2s ease,
            color 0.2s ease;
        }

        .ld-nav-button:hover {
          background: #1d2939;
          color: #ffffff;
        }

        .ld-nav-button.active {
          background: #253653;
          color: #ffffff;
        }

        .ld-logout-area {
          margin-top: auto;
          padding-top: 20px;
        }

        .ld-logout-button {
          width: 100%;
          border: 1px solid #344054;
          background: transparent;
          color: #cbd5e1;
          padding: 11px 13px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
        }

        .ld-logout-button:hover {
          background: #1d2939;
          color: #ffffff;
        }

        /* ================================
           MAIN
        ================================= */

        .ld-main {
          flex: 1;
          min-width: 0;
        }

        .ld-header {
          background: #ffffff;
          border-bottom: 1px solid #e4e7ec;
          padding: 25px 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .ld-header-title {
          margin: 0;
          font-size: 27px;
          line-height: 1.2;
          letter-spacing: -0.5px;
          color: #101828;
        }

        .ld-header-description {
          margin: 7px 0 0;
          color: #667085;
          font-size: 13px;
        }

        .ld-refresh {
          border: 1px solid #d0d5dd;
          background: #ffffff;
          color: #344054;
          padding: 10px 17px;
          border-radius: 9px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .ld-refresh:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #98a2b3;
        }

        .ld-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ld-content {
          padding: 30px 34px 40px;
        }

        /* ================================
           ERROR
        ================================= */

        .ld-error {
          margin-bottom: 20px;
          padding: 13px 15px;
          border-radius: 10px;
          background: #fff4f4;
          border: 1px solid #fecdca;
          color: #b42318;
          font-size: 13px;
        }

        /* ================================
           STATISTICS
        ================================= */

        .ld-stat-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .ld-stat-card {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 14px;
          padding: 19px;
          box-shadow:
            0 2px 8px rgba(16, 24, 40, 0.03);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .ld-stat-card:hover {
          transform: translateY(-2px);
          box-shadow:
            0 8px 20px rgba(16, 24, 40, 0.06);
        }

        .ld-stat-label {
          color: #667085;
          font-size: 12px;
          font-weight: 600;
        }

        .ld-stat-value {
          display: block;
          margin-top: 8px;
          color: #101828;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .ld-stat-description {
          margin-top: 5px;
          color: #98a2b3;
          font-size: 11px;
        }

        /* ================================
           SECONDARY STATS
        ================================= */

        .ld-secondary-grid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .ld-secondary-card {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 14px;
          padding: 17px 18px;
        }

        .ld-secondary-label {
          color: #667085;
          font-size: 12px;
        }

        .ld-secondary-value {
          display: block;
          margin-top: 6px;
          color: #172033;
          font-size: 20px;
          font-weight: 750;
        }

        /* ================================
           MAIN GRID
        ================================= */

        .ld-main-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.45fr)
            minmax(300px, 0.85fr);
          gap: 20px;
          margin-bottom: 22px;
        }

        .ld-panel {
          background: #ffffff;
          border: 1px solid #e4e7ec;
          border-radius: 15px;
          padding: 21px;
          box-shadow:
            0 2px 8px rgba(16, 24, 40, 0.03);
        }

        .ld-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
          margin-bottom: 17px;
        }

        .ld-panel-title {
          margin: 0;
          color: #101828;
          font-size: 17px;
          font-weight: 750;
        }

        .ld-panel-subtitle {
          margin: 5px 0 0;
          color: #667085;
          font-size: 12px;
        }

        .ld-view-all {
          border: 0;
          background: transparent;
          color: #2563eb;
          padding: 5px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 650;
        }

        .ld-view-all:hover {
          text-decoration: underline;
        }

        /* ================================
           SECTION LIST
        ================================= */

        .ld-section-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .ld-section-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 14px;
          border: 1px solid #eaecf0;
          border-radius: 11px;
          background: #ffffff;
          transition:
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .ld-section-item:hover {
          border-color: #cbd5e1;
          background: #fafcff;
        }

        .ld-section-info {
          min-width: 0;
        }

        .ld-section-code {
          display: inline-block;
          color: #175cd3;
          background: #eff8ff;
          border: 1px solid #d1e9ff;
          padding: 4px 7px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 750;
          margin-bottom: 6px;
        }

        .ld-section-title {
          color: #101828;
          font-size: 14px;
          font-weight: 700;
        }

        .ld-section-meta {
          margin-top: 4px;
          color: #667085;
          font-size: 11px;
        }

        .ld-section-right {
          display: flex;
          align-items: center;
          gap: 9px;
          flex-shrink: 0;
        }

        .ld-student-count {
          background: #f2f4f7;
          color: #344054;
          border-radius: 7px;
          padding: 7px 9px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .ld-section-manage {
          border: 1px solid #d0d5dd;
          background: #ffffff;
          color: #344054;
          border-radius: 7px;
          padding: 7px 9px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 650;
          white-space: nowrap;
        }

        .ld-section-manage:hover {
          border-color: #2563eb;
          color: #2563eb;
        }

        /* ================================
           QUICK ACTIONS
        ================================= */

        .ld-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
        }

        .ld-action {
          min-height: 104px;
          border: 1px solid #e4e7ec;
          background: #ffffff;
          border-radius: 11px;
          padding: 15px;
          text-align: left;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        }

        .ld-action:hover {
          border-color: #b2ccff;
          background: #f8fbff;
          transform: translateY(-1px);
        }

        .ld-action-title {
          display: block;
          color: #101828;
          font-size: 13px;
          font-weight: 750;
        }

        .ld-action-description {
          display: block;
          margin-top: 7px;
          color: #667085;
          font-size: 11px;
          line-height: 1.5;
        }

        /* ================================
           ATTENDANCE SUMMARY
        ================================= */

        .ld-attendance-panel {
          display: grid;
          grid-template-columns:
            minmax(220px, 0.7fr)
            minmax(280px, 1.3fr);
          gap: 25px;
          align-items: center;
        }

        .ld-rate {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .ld-rate-circle {
          width: 82px;
          height: 82px;
          border-radius: 50%;
          border: 7px solid #e8eefc;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ld-rate-circle span {
          color: #175cd3;
          font-size: 17px;
          font-weight: 800;
        }

        .ld-rate-title {
          color: #101828;
          font-size: 14px;
          font-weight: 700;
        }

        .ld-rate-text {
          margin-top: 5px;
          color: #667085;
          font-size: 11px;
          line-height: 1.5;
        }

        .ld-progress-area {
          width: 100%;
        }

        .ld-progress-header {
          display: flex;
          justify-content: space-between;
          color: #667085;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .ld-progress {
          width: 100%;
          height: 8px;
          background: #eaecf0;
          border-radius: 20px;
          overflow: hidden;
        }

        .ld-progress-bar {
          height: 100%;
          background: #2563eb;
          border-radius: inherit;
          transition: width 0.4s ease;
        }

        /* ================================
           EMPTY / LOADING
        ================================= */

        .ld-empty {
          padding: 35px 15px;
          text-align: center;
          color: #667085;
          border: 1px dashed #d0d5dd;
          border-radius: 10px;
          font-size: 12px;
        }

        .ld-loading {
          padding: 35px;
          text-align: center;
          color: #667085;
          font-size: 13px;
        }

        /* ================================
           RESPONSIVE
        ================================= */

        @media (max-width: 1150px) {
          .ld-stat-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .ld-secondary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .ld-main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 800px) {
          .lecturer-dashboard {
            display: block;
          }

          .ld-sidebar {
            width: 100%;
            min-height: auto;
            position: relative;
            padding: 14px;
          }

          .ld-brand {
            padding-bottom: 14px;
          }

          .ld-profile {
            margin: 12px 0;
          }

          .ld-navigation {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .ld-logout-area {
            margin-top: 10px;
          }

          .ld-header {
            padding: 20px;
          }

          .ld-content {
            padding: 20px;
          }

          .ld-attendance-panel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .ld-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .ld-stat-grid,
          .ld-secondary-grid {
            grid-template-columns: 1fr;
          }

          .ld-actions {
            grid-template-columns: 1fr;
          }

          .ld-section-item {
            align-items: flex-start;
            flex-direction: column;
          }

          .ld-section-right {
            width: 100%;
            justify-content: space-between;
          }

          .ld-section-manage {
            flex: 1;
          }

          .ld-navigation {
            grid-template-columns: 1fr;
          }

          .ld-header-title {
            font-size: 23px;
          }
        }

      `}</style>

      <aside className="ld-sidebar">

        <div className="ld-brand">
          <div className="ld-brand-title">
            Attendify
          </div>

          <span className="ld-brand-subtitle">
            LECTURER PORTAL
          </span>
        </div>

        <div className="ld-profile">

          <div className="ld-avatar">
            {initials || "L"}
          </div>

          <div>
            <div className="ld-profile-name">
              {fullName}
            </div>

            <div className="ld-profile-role">
              Lecturer
            </div>
          </div>

        </div>

        <nav className="ld-navigation">

          <button
            className="ld-nav-button active"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className="ld-nav-button"
            type="button"
            onClick={() =>
              navigate("/lecturer/sessions")
            }
          >
            Attendance Sessions
          </button>

          <button
            className="ld-nav-button"
            type="button"
            onClick={() =>
              navigate("/lecturer/sections")
            }
          >
            My Sections
          </button>

          <button
            className="ld-nav-button"
            type="button"
            onClick={() =>
              navigate("/lecturer/attendance")
            }
          >
            Attendance
          </button>

          <button
            className="ld-nav-button"
            type="button"
            onClick={() =>
              navigate("/lecturer/reports")
            }
          >
            Reports
          </button>

        </nav>

        <div className="ld-logout-area">

          <button
            className="ld-logout-button"
            type="button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </aside>

      <main className="ld-main">

        <header className="ld-header">

          <div>
            <h1 className="ld-header-title">
              Lecturer Dashboard
            </h1>

            <p className="ld-header-description">
              Manage your courses, sections,
              sessions and attendance.
            </p>
          </div>

          <button
            className="ld-refresh"
            type="button"
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

          {/* ================================
              MAIN STATISTICS
          ================================= */}

          <div className="ld-stat-grid">

            <div className="ld-stat-card">
              <span className="ld-stat-label">
                Courses
              </span>

              <strong className="ld-stat-value">
                {loading
                  ? "..."
                  : totalCourses}
              </strong>

              <div className="ld-stat-description">
                Assigned courses
              </div>
            </div>

            <div className="ld-stat-card">
              <span className="ld-stat-label">
                Sections
              </span>

              <strong className="ld-stat-value">
                {loading
                  ? "..."
                  : totalSections}
              </strong>

              <div className="ld-stat-description">
                Active teaching sections
              </div>
            </div>

            <div className="ld-stat-card">
              <span className="ld-stat-label">
                Enrolled Students
              </span>

              <strong className="ld-stat-value">
                {loading
                  ? "..."
                  : totalStudents}
              </strong>

              <div className="ld-stat-description">
                Students across your sections
              </div>
            </div>

            <div className="ld-stat-card">
              <span className="ld-stat-label">
                Attendance Rate
              </span>

              <strong className="ld-stat-value">
                {loading
                  ? "..."
                  : `${attendanceRate}%`}
              </strong>

              <div className="ld-stat-description">
                Overall attendance
              </div>
            </div>

          </div>

          {/* ================================
              SECONDARY STATISTICS
          ================================= */}

          <div className="ld-secondary-grid">

            <div className="ld-secondary-card">
              <span className="ld-secondary-label">
                Total Sessions
              </span>

              <strong className="ld-secondary-value">
                {loading
                  ? "..."
                  : totalSessions}
              </strong>
            </div>

            <div className="ld-secondary-card">
              <span className="ld-secondary-label">
                Active Sessions
              </span>

              <strong className="ld-secondary-value">
                {loading
                  ? "..."
                  : activeSessions}
              </strong>
            </div>

            <div className="ld-secondary-card">
              <span className="ld-secondary-label">
                Attendance Records
              </span>

              <strong className="ld-secondary-value">
                {loading
                  ? "..."
                  : totalAttendance}
              </strong>
            </div>

            <div className="ld-secondary-card">
              <span className="ld-secondary-label">
                Pending Corrections
              </span>

              <strong className="ld-secondary-value">
                {loading
                  ? "..."
                  : pendingCorrections}
              </strong>
            </div>

          </div>

          {/* ================================
              SECTIONS + QUICK ACTIONS
          ================================= */}

          <div className="ld-main-grid">

            <div className="ld-panel">

              <div className="ld-panel-header">

                <div>
                  <h2 className="ld-panel-title">
                    My Sections
                  </h2>

                  <p className="ld-panel-subtitle">
                    Sections assigned to you
                  </p>
                </div>

                <button
                  className="ld-view-all"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/lecturer/sections"
                    )
                  }
                >
                  View all
                </button>

              </div>

              {loading ? (
                <div className="ld-loading">
                  Loading sections...
                </div>
              ) : displayedSections.length === 0 ? (
                <div className="ld-empty">
                  No assigned sections found.
                </div>
              ) : (
                <div className="ld-section-list">

                  {displayedSections.map(
                    (section) => {

                      const sectionId =
                        section.section_id ||
                        section.id;

                      const courseCode =
                        section.course_code ||
                        "COURSE";

                      const courseName =
                        section.course_name ||
                        "Course";

                      const sectionName =
                        section.section_name ||
                        "-";

                      const students =
                        Number(
                          section.enrolled_students ||
                            section.student_count ||
                            0
                        );

                      return (
                        <div
                          className="ld-section-item"
                          key={sectionId}
                        >

                          <div className="ld-section-info">

                            <span className="ld-section-code">
                              {courseCode}
                            </span>

                            <div className="ld-section-title">
                              {courseName}
                              {" — "}
                              Section {sectionName}
                            </div>

                            <div className="ld-section-meta">
                              {section.academic_year ||
                                "-"}
                              {" · "}
                              {section.semester ||
                                "Current semester"}
                            </div>

                          </div>

                          <div className="ld-section-right">

                            <span className="ld-student-count">
                              {students} students
                            </span>

                            <button
                              className="ld-section-manage"
                              type="button"
                              onClick={() =>
                                goToCourse(
                                  section
                                )
                              }
                            >
                              Manage
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

            <div className="ld-panel">

              <div className="ld-panel-header">

                <div>
                  <h2 className="ld-panel-title">
                    Quick Actions
                  </h2>

                  <p className="ld-panel-subtitle">
                    Frequently used lecturer tools
                  </p>
                </div>

              </div>

              <div className="ld-actions">

                <button
                  className="ld-action"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/lecturer/sessions"
                    )
                  }
                >
                  <span className="ld-action-title">
                    Attendance Sessions
                  </span>

                  <span className="ld-action-description">
                    Create and manage QR attendance
                    sessions.
                  </span>
                </button>

                <button
                  className="ld-action"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/lecturer/sections"
                    )
                  }
                >
                  <span className="ld-action-title">
                    My Sections
                  </span>

                  <span className="ld-action-description">
                    View your assigned sections and
                    enrolled students.
                  </span>
                </button>

                <button
                  className="ld-action"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/lecturer/attendance"
                    )
                  }
                >
                  <span className="ld-action-title">
                    Attendance
                  </span>

                  <span className="ld-action-description">
                    Review attendance records and
                    student status.
                  </span>
                </button>

                <button
                  className="ld-action"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/lecturer/reports"
                    )
                  }
                >
                  <span className="ld-action-title">
                    Reports
                  </span>

                  <span className="ld-action-description">
                    View attendance summaries and
                    reports.
                  </span>
                </button>

              </div>

            </div>

          </div>

          {/* ================================
              ATTENDANCE SUMMARY
          ================================= */}

          <div className="ld-panel">

            <div className="ld-panel-header">

              <div>
                <h2 className="ld-panel-title">
                  Attendance Overview
                </h2>

                <p className="ld-panel-subtitle">
                  Overall attendance performance
                  across your sections
                </p>
              </div>

              <button
                className="ld-view-all"
                type="button"
                onClick={() =>
                  navigate(
                    "/lecturer/attendance"
                  )
                }
              >
                View attendance
              </button>

            </div>

            <div className="ld-attendance-panel">

              <div className="ld-rate">

                <div className="ld-rate-circle">
                  <span>
                    {attendanceRate}%
                  </span>
                </div>

                <div>
                  <div className="ld-rate-title">
                    Attendance Rate
                  </div>

                  <div className="ld-rate-text">
                    Current overall attendance
                    percentage for your students.
                  </div>
                </div>

              </div>

              <div className="ld-progress-area">

                <div className="ld-progress-header">
                  <span>
                    Attendance progress
                  </span>

                  <span>
                    {attendanceRate}%
                  </span>
                </div>

                <div className="ld-progress">
                  <div
                    className="ld-progress-bar"
                    style={{
                      width: `${Math.min(
                        Math.max(
                          attendanceRate,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}