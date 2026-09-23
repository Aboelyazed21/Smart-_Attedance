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

function LecturerIcon({ name, size = 18 }) {
  const paths = {
    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 6.3" />
        <path d="M20 5v6h-6" />
      </>
    ),

    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,

    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M16 5a3.5 3.5 0 0 1 0 7" />
        <path d="M18 14.5A6 6 0 0 1 21 20" />
      </>
    ),

    chart: (
      <>
        <path d="M5 19V10" />
        <path d="M12 19V5" />
        <path d="M19 19v-6" />
        <path d="M3 19h18" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    file: (
      <>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </>
    ),

    alert: (
      <>
        <path d="M12 4v9" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
      </>
    ),

    qr: (
      <>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 12h16" />
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
      {paths[name] || paths.grid}
    </svg>
  );
}

const STAT_TONE_ICONS = {
  blue: "grid",
  violet: "layers",
  green: "users",
  amber: "chart",
  cyan: "calendar",
  red: "clock",
  indigo: "file",
  orange: "alert",
};

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
      action: () => navigate("/lecturer/sections"),
    },
    {
      label: "Sections",
      value: formatNumber(
        stats.totalSections ?? sections.length
      ),
      tone: "violet",
      action: () => navigate("/lecturer/sections"),
    },
    {
      label: "Enrolled Students",
      value: formatNumber(stats.totalEnrolledStudents),
      tone: "green",
      action: () => navigate("/lecturer/sections"),
    },
    {
      label: "Attendance Rate",
      value: formatPercent(stats.attendancePercentage),
      tone: "amber",
      action: () => navigate("/lecturer/attendance"),
    },
    {
      label: "Total Sessions",
      value: formatNumber(stats.totalSessions),
      tone: "cyan",
      action: () => navigate("/lecturer/sessions"),
    },
    {
      label: "Active Sessions",
      value: formatNumber(stats.activeSessions),
      tone: "red",
      action: () => navigate("/lecturer/sessions"),
    },
    {
      label: "Attendance Records",
      value: formatNumber(stats.totalAttendanceEvents),
      tone: "indigo",
      action: () => navigate("/lecturer/attendance"),
    },
    {
      label: "Pending Corrections",
      value: formatNumber(
        stats?.correctionRequests?.pending
      ),
      tone: "orange",
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
          <span className="lecturer-dashboard-refresh-icon">
            <LecturerIcon name="refresh" size={15} />
          </span>

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="lecturer-dashboard-error">
          <div>
            <strong>Could not load dashboard data</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
          >
            Retry
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

              <span className="lecturer-dashboard-stat-icon">
                <LecturerIcon
                  name={STAT_TONE_ICONS[card.tone] || "grid"}
                  size={18}
                />
              </span>
            </span>

            <strong className="lecturer-dashboard-stat-value">
              {loading ? "..." : card.value}
            </strong>

            <span className="lecturer-dashboard-stat-link">
              View details
              <LecturerIcon name="arrow" size={13} />
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
              <div className="lecturer-dashboard-empty-icon">
                <LecturerIcon name="layers" size={22} />
              </div>

              <strong>No assigned sections</strong>

              <p>
                No sections are currently assigned to this
                lecturer account.
              </p>
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
                        {getCourseCode(section)}, Section{" "}
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

                    <span className="lecturer-dashboard-section-arrow">
                      <LecturerIcon name="arrow" size={15} />
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
                <LecturerIcon name="qr" size={19} />
              </span>

              <span>
                <strong>Attendance Sessions</strong>
                <small>
                  Create or manage QR sessions
                </small>
              </span>

              <b>
                <LecturerIcon name="arrow" size={15} />
              </b>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/attendance")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <LecturerIcon name="calendar" size={19} />
              </span>

              <span>
                <strong>Review Attendance</strong>
                <small>
                  Check attendance records
                </small>
              </span>

              <b>
                <LecturerIcon name="arrow" size={15} />
              </b>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/reports")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <LecturerIcon name="file" size={19} />
              </span>

              <span>
                <strong>Reports</strong>
                <small>
                  Review attendance summaries
                </small>
              </span>

              <b>
                <LecturerIcon name="arrow" size={15} />
              </b>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/lecturer/sections")
              }
            >
              <span className="lecturer-dashboard-action-icon">
                <LecturerIcon name="layers" size={19} />
              </span>

              <span>
                <strong>My Sections</strong>
                <small>
                  View assigned sections
                </small>
              </span>

              <b>
                <LecturerIcon name="arrow" size={15} />
              </b>
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
          <LecturerIcon name="arrow" size={15} />
        </button>
      </section>
    </div>
  );
}