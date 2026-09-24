import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getLecturerDashboardStats,
  getLecturerSections,
} from "../../services/api";

import "./LecturerDashboard.css";

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName).trim().charAt(0);
  const last = String(lastName).trim().charAt(0);

  return `${first}${last}`.toUpperCase() || "L";
}

function normalizeSections(payload) {
  if (Array.isArray(payload?.sections)) {
    return payload.sections;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getSectionId(section) {
  return section?.section_id ?? section?.id ?? section?.sectionId;
}

function getSectionName(section) {
  return (
    section?.section_name ??
    section?.sectionName ??
    section?.name ??
    "-"
  );
}

function getCourseCode(section) {
  return (
    section?.course_code ??
    section?.courseCode ??
    section?.code ??
    "Course"
  );
}

function getCourseName(section) {
  return (
    section?.course_name ??
    section?.courseName ??
    ""
  );
}

function getStudentCount(section) {
  return Number(
    section?.enrolled_students ??
      section?.enrolledStudents ??
      section?.student_count ??
      section?.studentCount ??
      0
  );
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function formatPercent(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0%";
  }

  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function StatIcon({ name }) {
  const paths = {
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
    students: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    sessions: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    live: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    records: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
    corrections: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    qr: (
      <>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
        <path d="M14 14h3v3h-3zM19 14v3M14 19h3M19 19h2v-2" />
      </>
    ),
    attendance: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
    reports: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </>
    ),
  };

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.sessions}
    </svg>
  );
}

export default function LecturerDashboard() {
  const navigate = useNavigate();

  const [user] = useState(getSavedUser);
  const [data, setData] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, sectionsResponse] = await Promise.all([
        getLecturerDashboardStats(),
        getLecturerSections(),
      ]);

      setData(statsResponse || {});
      setSections(normalizeSections(sectionsResponse));
    } catch (requestError) {
      console.error("Lecturer dashboard error:", requestError);

      setError(
        requestError?.message ||
          "Failed to load lecturer dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = data?.stats || {};
  const lecturer = data?.lecturer || {};

  const firstName =
    user?.first_name ||
    user?.firstName ||
    lecturer?.firstName ||
    lecturer?.first_name ||
    "Lecturer";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    lecturer?.lastName ||
    lecturer?.last_name ||
    "";

  const initials = useMemo(
    () => getInitials(firstName, lastName),
    [firstName, lastName]
  );

  const statCards = [
    {
      label: "Courses",
      value: formatNumber(stats.totalCourses),
      tone: "blue",
      icon: "courses",
      action: () => navigate("/lecturer/sections"),
    },
    {
      label: "Sections",
      value: formatNumber(
        stats.totalSections ?? sections.length
      ),
      tone: "blue",
      icon: "sections",
      action: () => navigate("/lecturer/sections"),
    },
    {
      label: "Enrolled Students",
      value: formatNumber(stats.totalEnrolledStudents),
      tone: "green",
      icon: "students",
      action: () => navigate("/lecturer/sections"),
    },
    {
      label: "Attendance Rate",
      value: formatPercent(stats.attendancePercentage),
      tone: "amber",
      icon: "attendance",
      action: () => navigate("/lecturer/attendance"),
    },
    {
      label: "Total Sessions",
      value: formatNumber(stats.totalSessions),
      tone: "neutral",
      icon: "sessions",
      action: () => navigate("/lecturer/sessions"),
    },
    {
      label: "Active Sessions",
      value: formatNumber(stats.activeSessions),
      tone: "red",
      icon: "live",
      pulse: true,
      action: () => navigate("/lecturer/sessions"),
    },
    {
      label: "Attendance Records",
      value: formatNumber(stats.totalAttendanceEvents),
      tone: "blue",
      icon: "records",
      action: () => navigate("/lecturer/attendance"),
    },
    {
      label: "Pending Corrections",
      value: formatNumber(
        stats?.correctionRequests?.pending
      ),
      tone: "amber",
      icon: "corrections",
      action: () => navigate("/lecturer/attendance"),
    },
  ];

  return (
    <div className="lecturer-dashboard-page">
      <header className="lecturer-dashboard-header">
        <div className="lecturer-dashboard-heading">
          <span className="lecturer-dashboard-eyebrow">
            LECTURER PORTAL
          </span>

          <h1>Good to see you, {firstName}</h1>

          <p>
            Manage your assigned sections, attendance sessions,
            and teaching activity from one place.
          </p>
        </div>

        <button
          type="button"
          className="lecturer-dashboard-refresh"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div
          className="lecturer-dashboard-error"
          role="alert"
        >
          <div>
            <strong>Could not load dashboard data</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}

      <section className="lecturer-dashboard-stats">
        {statCards.map((card) => (
          <button
            key={card.label}
            type="button"
            className={`lecturer-dashboard-stat ${card.tone}`}
            onClick={card.action}
          >
            <span className="lecturer-dashboard-stat-top">
              <span className="lecturer-dashboard-stat-label">
                {card.label}
              </span>

              <span
                className={
                  card.pulse
                    ? "lecturer-dashboard-stat-icon lecturer-attendance-pulse"
                    : "lecturer-dashboard-stat-icon"
                }
              >
                <StatIcon name={card.icon} />
              </span>
            </span>

            <strong className="lecturer-dashboard-stat-value">
              {loading ? (
                <span
                  className="lecturer-dashboard-stat-skeleton"
                  aria-hidden="true"
                />
              ) : (
                card.value
              )}
            </strong>

            <span className="lecturer-dashboard-stat-link">
              View details
            </span>
          </button>
        ))}
      </section>

      <section className="lecturer-dashboard-main-grid">
        <div className="lecturer-dashboard-panel lecturer-dashboard-sections-panel">
          <div className="lecturer-dashboard-panel-header">
            <div>
              <span className="lecturer-dashboard-panel-eyebrow">
                TEACHING
              </span>

              <h2>My Sections</h2>

              <p>
                Sections currently assigned to your account.
              </p>
            </div>

            <button
              type="button"
              className="lecturer-dashboard-text-button"
              onClick={() => navigate("/lecturer/sections")}
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="lecturer-dashboard-section-list">
              {[1, 2, 3].map((item) => (
                <div
                  className="lecturer-dashboard-skeleton-row"
                  key={item}
                >
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="lecturer-dashboard-empty">
              <strong>No assigned sections</strong>

              <p>
                No sections are currently assigned to this
                lecturer account.
              </p>

              <button
                type="button"
                onClick={loadDashboard}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          ) : (
            <div className="lecturer-dashboard-section-list">
              {sections.slice(0, 6).map((section) => {
                const sectionId = getSectionId(section);

                return (
                  <button
                    type="button"
                    className="lecturer-dashboard-section-row"
                    key={
                      sectionId ??
                      `${getCourseCode(section)}-${getSectionName(section)}`
                    }
                    onClick={() =>
                      navigate("/lecturer/sections")
                    }
                  >
                    <span className="lecturer-dashboard-section-icon">
                      {String(getCourseCode(section))
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>

                    <span className="lecturer-dashboard-section-info">
                      <strong>
                        {getCourseCode(section)} - Section{" "}
                        {getSectionName(section)}
                      </strong>

                      <small>
                        {getCourseName(section) ||
                          "Assigned teaching section"}
                      </small>
                    </span>

                    <span className="lecturer-dashboard-section-count">
                      {formatNumber(
                        getStudentCount(section)
                      )}

                      <small>students</small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lecturer-dashboard-panel">
          <div className="lecturer-dashboard-panel-header">
            <div>
              <span className="lecturer-dashboard-panel-eyebrow">
                WORKSPACE
              </span>

              <h2>Quick Actions</h2>

              <p>
                Jump directly to common tasks.
              </p>
            </div>
          </div>

          <div className="lecturer-dashboard-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/sessions")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <StatIcon name="qr" />
              </span>

              <span>
                <strong>Attendance Sessions</strong>
                <small>
                  Create or manage QR sessions
                </small>
              </span>

            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/attendance")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <StatIcon name="attendance" />
              </span>

              <span>
                <strong>Review Attendance</strong>
                <small>
                  Check attendance records
                </small>
              </span>

            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/reports")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <StatIcon name="reports" />
              </span>

              <span>
                <strong>Reports</strong>
                <small>
                  Review attendance summaries
                </small>
              </span>

            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/sections")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <StatIcon name="sections" />
              </span>

              <span>
                <strong>My Sections</strong>
                <small>
                  View assigned sections
                </small>
              </span>

            </button>
          </div>
        </div>
      </section>

      <section className="lecturer-dashboard-footer-card">
        <div className="lecturer-dashboard-footer-avatar">
          {initials}
        </div>

        <div>
          <span className="lecturer-dashboard-panel-eyebrow">
            TEACHING WORKSPACE
          </span>

          <strong>
            {firstName} {lastName}
          </strong>

          <p>
            Your lecturer dashboard is connected to your
            assigned sections and attendance services.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/lecturer/sessions")
          }
        >
          Open Sessions
        </button>
      </section>
    </div>
  );
}