import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getMyAttendance,
} from "../../services/api";
import StudentAssistant from "../../components/student/StudentAssistant";
import "../../components/student/StudentAssistant.css";
import NotificationBell from "../../components/NotificationBell";
import "../../components/NotificationBell.css";
import { useLanguage } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";
import "../../App.css";
import "./StudentDashboard.css";

function Icon({ name, size = 18 }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    scan: (
      <>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 12h16" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),

    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5Z" />
        <path d="m3 13 9 5 9-5" />
      </>
    ),

    chart: (
      <>
        <path d="M21 12a9 9 0 1 1-9-9" />
        <path d="M12 3v9h9" />
      </>
    ),

    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
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
      {icons[name]}
    </svg>
  );
}

function formatStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  if (!status) return "Not provided";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function StudentDashboard() {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  });

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyAttendance();

      setAttendance(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          t("stuDash.loadError")
      );
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
        String(
          item.attendance_status ||
            item.status ||
            ""
        ).toLowerCase() === "present" ||
        String(
          item.validation_status || ""
        ).toLowerCase() === "accepted"
    ).length;

    const late = attendance.filter(
      (item) =>
        String(
          item.attendance_status ||
            item.status ||
            ""
        ).toLowerCase() === "late"
    ).length;

    const absent = attendance.filter(
      (item) =>
        String(
          item.attendance_status ||
            item.status ||
            ""
        ).toLowerCase() === "absent"
    ).length;

    const percentage =
      total > 0
        ? Math.round(
            ((present + late) / total) * 100
          )
        : 0;

    return {
      total,
      present,
      late,
      absent,
      percentage,
    };
  }, [attendance]);

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        const dateA = new Date(
          a.attendance_time ||
            a.created_at ||
            a.session_date ||
            0
        );

        const dateB = new Date(
          b.attendance_time ||
            b.created_at ||
            b.session_date ||
            0
        );

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [attendance]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/logout");
  }

  const firstName =
    user?.first_name || user?.firstName || t("role.student");

  const lastName =
    user?.last_name || user?.lastName || "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const avatar =
    (firstName.charAt(0) || "S").toUpperCase();

  const isActive = (path) => location.pathname === path;

  function getStatus(item) {
    const status = String(
      item.attendance_status ||
        item.status ||
        ""
    ).toLowerCase();

    if (
      status === "present" ||
      String(
        item.validation_status || ""
      ).toLowerCase() === "accepted"
    ) {
      return "Present";
    }

    if (status === "late") {
      return "Late";
    }

    if (status === "absent") {
      return "Absent";
    }

    return "Recorded";
  }

  function getStatusClass(status) {
    if (status === "Present") {
      return "student-status-present";
    }

    if (status === "Late") {
      return "student-status-late";
    }

    if (status === "Absent") {
      return "student-status-absent";
    }

    return "student-status-recorded";
  }

  function formatDate(item) {
    const value =
      item.attendance_time ||
      item.created_at ||
      item.session_date;

    if (!value) {
      return t("stuDash.notAvailable");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getCourse(item) {
    return (
      item.course_name ||
      item.course_code ||
      item.section_name ||
      t("stuDash.sessionFallback")
    );
  }

  const navItems = [
    {
      path: "/dashboard",
      label: t("nav.dashboard"),
      icon: "dashboard",
    },
    {
      path: "/student/attendance",
      label: t("nav.myAttendance"),
      icon: "calendar",
    },
    {
      path: "/student/scan",
      label: t("nav.scan"),
      icon: "scan",
    },
    {
      path: "/student/correction-requests",
      label: t("nav.corrections"),
      icon: "edit",
    },
  ];

  const quickActions = [
    {
      path: "/student/scan",
      title: t("stuDash.quickScanTitle"),
      text: t("stuDash.quickScanText"),
      icon: "scan",
    },
    {
      path: "/student/attendance",
      title: t("stuDash.quickHistoryTitle"),
      text: t("stuDash.quickHistoryText"),
      icon: "calendar",
    },
    {
      path: "/student/correction-requests",
      title: t("stuDash.quickCorrectionTitle"),
      text: t("stuDash.quickCorrectionText"),
      icon: "edit",
    },
  ];

  const statCards = [
    {
      tone: "blue",
      icon: "chart",
      label: t("stuDash.rateLabel"),
      value: loading ? "..." : `${stats.percentage}%`,
      hint: t("stuDash.rateHint"),
    },
    {
      tone: "green",
      icon: "calendar",
      label: t("stuDash.presentLabel"),
      value: loading ? "..." : stats.present,
      hint: t("stuDash.presentHint"),
    },
    {
      tone: "orange",
      icon: "clock",
      label: t("stuDash.lateLabel"),
      value: loading ? "..." : stats.late,
      hint: t("stuDash.lateHint"),
    },
    {
      tone: "red",
      icon: "layers",
      label: t("stuDash.absentLabel"),
      value: loading ? "..." : stats.absent,
      hint: t("stuDash.absentHint"),
    },
  ];

  return (
    <div className="student-dashboard">
      <input
        type="checkbox"
        id="student-dashboard-drawer"
        className="student-drawer-toggle"
      />

      <aside className="student-sidebar">

        <div className="student-brand">

          <div
            className="student-brand-logo"
            aria-hidden="true"
          >
            A
          </div>

          <div>
            <h2>{platformName}</h2>

            <span>
              {t("brand.tagline")}
            </span>
          </div>

        </div>

        <div className="student-profile">

          <div className="student-profile-avatar">
            {avatar}
          </div>

          <div>
            <strong>
              {fullName}
            </strong>

            <span>
              {t("role.student")}
            </span>
          </div>

        </div>

        <nav className="student-nav" aria-label={t("stuDash.navLabel")}>

          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={
                isActive(item.path)
                  ? "student-nav-item active"
                  : "student-nav-item"
              }
              onClick={() => navigate(item.path)}
            >
              <span>
                <Icon name={item.icon} size={16} />
              </span>
              {item.label}
            </button>
          ))}

        </nav>

        <div className="student-sidebar-bottom">

          <button
            type="button"
            className="student-nav-item"
            onClick={handleLogout}
          >
            <span>
              <Icon name="logout" size={16} />
            </span>
            {t("action.logout")}
          </button>

        </div>

      </aside>

      <label
        htmlFor="student-dashboard-drawer"
        className="sidebar-overlay"
        aria-label={t("a11y.closeNav")}
      />

      <label
        htmlFor="student-dashboard-drawer"
        className="mobile-menu-btn"
        aria-label={t("a11y.openNav")}
      >
        <span />
        <span />
        <span />
      </label>

      <main className="student-dashboard-main">

        <header className="student-dashboard-header">

          <div>
            <h1>
              {t("stuDash.title")}
            </h1>

            <p>
              {t("stuDash.welcome").replace("{n}", firstName)}
            </p>
          </div>

          <div className="student-header-user">

            <NotificationBell />

            <div className="student-header-avatar">
              {avatar}
            </div>

          </div>

        </header>

        <section className="student-dashboard-content">

          {error && (
            <div
              className="student-dashboard-error"
              role="alert"
            >
              {error}

              <button
                type="button"
                onClick={loadAttendance}
              >
                {t("stuDash.tryAgain")}
              </button>
            </div>
          )}

          <div className="student-stat-grid">

            {statCards.map((card) => (
              <div
                className="student-stat-card"
                key={card.label}
              >

                <div
                  className={`student-stat-icon ${card.tone}`}
                >
                  <Icon name={card.icon} size={18} />
                </div>

                <div>
                  <span>
                    {card.label}
                  </span>

                  <strong>
                    {card.value}
                  </strong>

                  <small>
                    {card.hint}
                  </small>
                </div>

              </div>
            ))}

          </div>

          <div className="student-dashboard-grid">

            <section className="student-panel">

              <div className="student-panel-header">

                <div>
                  <h2>
                    {t("stuDash.recentTitle")}
                  </h2>

                  <p>
                    {t("stuDash.recentSub")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/student/attendance"
                    )
                  }
                >{t("stuDash.viewAll")}</button>

              </div>

              {loading ? (
                <div className="student-empty-state">
                  <div className="student-loading">
                    {t("stuDash.loading")}
                  </div>
                </div>
              ) : recentAttendance.length ===
                0 ? (
                <div className="student-empty-state">

                  <div className="student-empty-icon">
                    <Icon name="calendar" size={20} />
                  </div>

                  <h3>
                    {t("stuDash.emptyTitle")}
                  </h3>

                  <p>
                    {t("stuDash.emptyText")}
                  </p>

                  <button
                    type="button"
                    className="student-primary-button"
                    onClick={() =>
                      navigate(
                        "/student/scan"
                      )
                    }
                  >
                    {t("nav.scan")}
                  </button>

                </div>
              ) : (
                <div className="student-attendance-list">

                  {recentAttendance.map(
                    (item, index) => {
                      const status =
                        getStatus(item);

                      return (
                        <div
                          className="student-attendance-row"
                          key={
                            item.attendance_id ||
                            item.id ||
                            index
                          }
                        >

                          <div className="student-course-icon">
                            <Icon
                              name="calendar"
                              size={16}
                            />
                          </div>

                          <div className="student-attendance-info">

                            <strong>
                              {getCourse(item)}
                            </strong>

                            <span>
                              {formatDate(item)}
                            </span>

                          </div>

                          <span
                            className={`student-status ${getStatusClass(
                              status
                            )}`}
                          >
                            {status}
                          </span>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </section>

            <section className="student-panel">

              <div className="student-panel-header">

                <div>
                  <h2>
                    {t("stuDash.quickTitle")}
                  </h2>

                  <p>
                    Frequently used actions
                  </p>
                </div>

              </div>

              <div className="student-quick-actions">

                {quickActions.map((action) => (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() =>
                      navigate(action.path)
                    }
                  >
                    <span className="student-action-icon">
                      <Icon
                        name={action.icon}
                        size={17}
                      />
                    </span>

                    <div>
                      <strong>
                        {action.title}
                      </strong>

                      <small>
                        {action.text}
                      </small>
                    </div>

                    <b
                      className="student-action-arrow"
                      aria-hidden="true"
                    >
                      <Icon name="arrow" size={15} />
                    </b>
                  </button>
                ))}

              </div>

            </section>

          </div>

          <section className="student-panel student-information-panel">

            <div className="student-panel-header">

              <div>
                <h2>
                  {t("stuDash.infoTitle")}
                </h2>

                <p>
                  {t("stuDash.infoSub")}
                </p>
              </div>

            </div>

            <div className="student-information-grid">

              <div>
                <span>
                  {t("stuDash.fullName")}
                </span>

                <strong>
                  {fullName}
                </strong>
              </div>

              <div>
                <span>
                  {t("stuDash.email")}
                </span>

                <strong>
                  {user?.email || t("stuDash.notProvided")}
                </strong>
              </div>

              <div>
                <span>
                  {t("stuDash.studentId")}
                </span>

                <strong>
                  {user?.student_code ||
                    user?.studentCode ||
                    user?.university_id ||
                    user?.student_id ||
                    t("stuDash.notAssigned")}
                </strong>
              </div>

              <div>
                <span>
                  {t("stuDash.accountStatus")}
                </span>

                <strong className="student-active-text">
                  {formatStatus(
                    user?.status || "active"
                  )}
                </strong>
              </div>

            </div>

          </section>

        </section>

      </main>

      <StudentAssistant />

    </div>
  );
}

export default StudentDashboard;