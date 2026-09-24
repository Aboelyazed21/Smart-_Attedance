import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyAttendance } from "../../services/api";
import StudentAssistant from "../../components/student/StudentAssistant";
import "../../components/student/StudentAssistant.css";
import "./AttendanceConfirmation.css";

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

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function toDate(value) {
  if (!value) return null;

  const raw = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00`
    : raw.replace(" ", "T");

  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
  const date = toDate(value);

  if (!date) return "Not available";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(value) {
  const date = toDate(value);

  if (!date) return "Not available";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeekday(value) {
  const date = toDate(value);

  if (!date) return "";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

function formatStatus(value) {
  const status = String(value || "recorded").trim().toLowerCase();

  if (!status) return "Recorded";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatSource(value) {
  const source = String(value || "").trim().toLowerCase();

  const labels = {
    qr: "QR code",
    scan: "QR code",
    manual: "Manual code",
    correction: "Correction",
    recorded: "Recorded",
  };

  return labels[source] || (source ? formatStatus(source) : "Recorded");
}

function AttendanceConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSavedUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const scanData =
    location.state && typeof location.state === "object"
      ? location.state
      : null;

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();
  const avatarLetter = firstName.charAt(0).toUpperCase() || "S";

  const closeSidebar = () => setSidebarOpen(false);

  const navigateAndClose = (path) => {
    closeSidebar();
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const loadAttendanceHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await getMyAttendance();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setHistoryError(
        error.message ||
          "Could not load your attendance history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  useEffect(() => {
    document.body.classList.toggle(
      "confirmation-sidebar-open",
      sidebarOpen
    );

    return () =>
      document.body.classList.remove(
        "confirmation-sidebar-open"
      );
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const confirmation = useMemo(() => {
    const hasResult = Boolean(
      scanData?.success ||
        scanData?.scannedAt ||
        scanData?.message
    );

    if (!hasResult) return null;

    return {
      course:
        scanData.course ||
        scanData.courseName ||
        "Not available",
      courseCode:
        scanData.courseCode ||
        scanData.attendance?.course_code ||
        "",
      section:
        scanData.section ||
        scanData.sectionName ||
        scanData.attendance?.section_name ||
        "Not available",
      status: String(
        scanData.status ||
          scanData.attendance?.status ||
          "recorded"
      ).toLowerCase(),
      scannedAt:
        scanData.scannedAt ||
        scanData.date ||
        null,
      method:
        scanData.method ||
        scanData.markedBy ||
        "Not available",
      duplicate: Boolean(scanData.duplicate),
      message:
        scanData.message ||
        "Attendance result received from the attendance service.",
    };
  }, [scanData]);

  const latestAttendance = useMemo(
    () => history.slice(0, 5),
    [history]
  );

  const summary = useMemo(() => {
    const present = history.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "present"
    ).length;

    const late = history.filter(
      (item) =>
        String(item.status || "").toLowerCase() === "late"
    ).length;

    return {
      present,
      late,
      total: history.length,
    };
  }, [history]);

  function handleLogout() {
    closeSidebar();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const scanRouteActive =
    isActive("/student/scan") ||
    isActive("/student/attendance-confirmed");

  return (
    <div className="confirmation-page">
      <button
        type="button"
        className="confirmation-mobile-menu-button"
        aria-label="Open navigation menu"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="confirmation-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`confirmation-sidebar ${
          sidebarOpen ? "is-open" : ""
        }`}
      >
        <div className="confirmation-brand">
          <div className="confirmation-logo" aria-hidden="true">
            <span className="brand-mark" />
          </div>

          <div>
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="confirmation-profile">
          <div className="confirmation-avatar">
            {avatarLetter}
          </div>

          <div className="confirmation-profile-info">
            <strong>{fullName}</strong>
            <span>Student</span>
          </div>
        </div>

        <nav className="confirmation-nav">
          <button
            type="button"
            className={isActive("/dashboard") ? "active" : ""}
            onClick={() => navigateAndClose("/dashboard")}
          >
            <span className="confirmation-nav-icon">
              <Icon name="dashboard" size={16} />
            </span>
            Dashboard
          </button>

          <button
            type="button"
            className={
              isActive("/student/attendance") ? "active" : ""
            }
            onClick={() =>
              navigateAndClose("/student/attendance")
            }
          >
            <span className="confirmation-nav-icon">
              <Icon name="calendar" size={16} />
            </span>
            My Attendance
          </button>

          <button
            type="button"
            className={scanRouteActive ? "active" : ""}
            onClick={() => navigateAndClose("/student/scan")}
          >
            <span className="confirmation-nav-icon">
              <Icon name="scan" size={16} />
            </span>
            Scan Attendance
          </button>

          <button
            type="button"
            className={
              isActive("/student/correction-requests")
                ? "active"
                : ""
            }
            onClick={() =>
              navigateAndClose("/student/correction-requests")
            }
          >
            <span className="confirmation-nav-icon">
              <Icon name="edit" size={16} />
            </span>
            Correction Requests
          </button>
        </nav>

        <div className="confirmation-sidebar-bottom">
          <div className="confirmation-motivation">
            <strong>Keep going</strong>
            <span>Every class counts.</span>
          </div>

          <button
            type="button"
            className="confirmation-logout"
            onClick={handleLogout}
          >
            <span>
              <Icon name="logout" size={16} />
            </span>
            Logout
          </button>
        </div>
      </aside>

      <main className="confirmation-main">
        <header className="confirmation-topbar">
          <div className="confirmation-user">
            <div className="header-avatar">{avatarLetter}</div>

            <div className="header-user-info">
              <strong>{fullName}</strong>
              <span>Student</span>
            </div>
          </div>
        </header>

        <section className="confirmation-content">
          <div className="confirmation-hero">
            <div>
              <span className="hero-label">ATTENDANCE</span>

              <h1>
                {confirmation
                  ? confirmation.duplicate
                    ? "Attendance Already Recorded"
                    : "Attendance Recorded"
                  : "Attendance Status"}
              </h1>

              <p>
                {confirmation
                  ? confirmation.message
                  : "Review a recent attendance result or scan a new code."}
              </p>
            </div>

            <p className="hero-note">
              Attendance records are shown from your student account.
            </p>
          </div>

          <div className="confirmation-grid">
            <div className="confirmation-left">
              {confirmation ? (
                <section className="confirmation-card">
                  <div className="confirmation-card-header">
                    <div>
                      <span className="confirmation-label">
                        {confirmation.duplicate
                          ? "ALREADY RECORDED"
                          : "ATTENDANCE"}
                      </span>

                      <h2>
                        {confirmation.duplicate
                          ? "This attendance record already exists"
                          : "Your attendance was recorded"}
                      </h2>

                      <p>{confirmation.message}</p>
                    </div>

                    <span
                      className={`confirmation-status ${confirmation.status}`}
                    >
                      {formatStatus(confirmation.status)}
                    </span>
                  </div>

                  <div className="attendance-details">
                    <h3>Attendance Details</h3>

                    <div className="details-grid">
                      <div className="detail-box">
                        <span>Course</span>
                        <strong>{confirmation.course}</strong>

                        {confirmation.courseCode && (
                          <small>{confirmation.courseCode}</small>
                        )}
                      </div>

                      <div className="detail-box">
                        <span>Section</span>
                        <strong>{confirmation.section}</strong>
                      </div>

                      <div className="detail-box">
                        <span>Date</span>
                        <strong>
                          {formatDate(confirmation.scannedAt)}
                        </strong>
                        <small>
                          {formatWeekday(confirmation.scannedAt)}
                        </small>
                      </div>

                      <div className="detail-box">
                        <span>Time</span>
                        <strong>
                          {formatTime(confirmation.scannedAt)}
                        </strong>
                      </div>

                      <div className="detail-box">
                        <span>Status</span>
                        <strong>
                          <span
                            className={`confirmation-status ${confirmation.status}`}
                          >
                            {formatStatus(confirmation.status)}
                          </span>
                        </strong>
                      </div>

                      <div className="detail-box">
                        <span>Recorded Through</span>
                        <strong>{confirmation.method}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="confirmation-actions">
                    <button
                      type="button"
                      className="primary-confirmation-button"
                      onClick={() =>
                        navigate("/student/attendance")
                      }
                    >
                      <Icon name="calendar" size={17} />
                      View My Attendance
                    </button>

                    <button
                      type="button"
                      className="secondary-confirmation-button"
                      onClick={() =>
                        navigate("/student/scan")
                      }
                    >
                      <Icon name="scan" size={17} />
                      Scan Another Code
                    </button>
                  </div>
                </section>
              ) : (
                <section className="no-confirmation-card">
                  <h2>No scan confirmation is available</h2>

                  <p>
                    This page is opened without a current scan result.
                    Scan the lecturer's active QR code to record
                    attendance.
                  </p>

                  <div className="confirmation-actions">
                    <button
                      type="button"
                      className="primary-confirmation-button"
                      onClick={() =>
                        navigate("/student/scan")
                      }
                    >
                      <Icon name="scan" size={17} />
                      Scan Attendance
                    </button>

                    <button
                      type="button"
                      className="secondary-confirmation-button"
                      onClick={() =>
                        navigate("/student/attendance")
                      }
                    >
                      <Icon name="calendar" size={17} />
                      View My Attendance
                    </button>
                  </div>
                </section>
              )}

              <section className="recent-attendance-card">
                <div className="recent-header">
                  <div>
                    <h2>Recent Attendance</h2>
                    <p>Your latest attendance records.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/student/attendance")
                    }
                  >
                    View all
                  </button>
                </div>

                {historyLoading ? (
                  <div
                    className="recent-skeleton"
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                ) : historyError ? (
                  <div className="history-error" role="alert">
                    <p>{historyError}</p>

                    <button
                      type="button"
                      onClick={loadAttendanceHistory}
                    >
                      Try again
                    </button>
                  </div>
                ) : latestAttendance.length === 0 ? (
                  <div className="history-empty">
                    No attendance records are available yet.
                  </div>
                ) : (
                  <div className="recent-table">
                    <div className="recent-table-row table-header">
                      <span>Date and Time</span>
                      <span>Course</span>
                      <span>Section</span>
                      <span>Status</span>
                      <span>Source</span>
                    </div>

                    {latestAttendance.map((record) => (
                      <div
                        className="recent-table-row"
                        key={`${record.id}-${record.scanned_at}`}
                      >
                        <span data-label="Date and Time">
                          {formatDate(
                            record.scanned_at ||
                              record.session_date
                          )}
                          <small>
                            {formatTime(
                              record.scanned_at ||
                                record.session_date
                            )}
                          </small>
                        </span>

                        <span data-label="Course">
                          <strong>
                            {record.course_name ||
                              "Not available"}
                          </strong>

                          {record.course_code && (
                            <small>{record.course_code}</small>
                          )}
                        </span>

                        <span data-label="Section">
                          {record.section_name ||
                            "Not available"}
                        </span>

                        <span data-label="Status">
                          <b
                            className={`recent-status ${
                              record.status || "recorded"
                            }`}
                          >
                            {formatStatus(record.status)}
                          </b>
                        </span>

                        <span data-label="Source">
                          {formatSource(record.source)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="confirmation-right">
              <section className="summary-card">
                <h2>Attendance Overview</h2>

                <div className="summary-stats">
                  <div className="summary-stat present">
                    <small>Present Records</small>
                    <strong>{summary.present}</strong>
                  </div>

                  <div className="summary-stat late">
                    <small>Late Records</small>
                    <strong>{summary.late}</strong>
                  </div>

                  <div className="summary-stat total">
                    <small>Total Records</small>
                    <strong>{summary.total}</strong>
                  </div>
                </div>

                <p className="summary-message">
                  {summary.total
                    ? `Overview based on ${summary.total} attendance records returned by your account.`
                    : "No attendance records are available for this overview yet."}
                </p>
              </section>

              <section className="next-card">
                <h2>Next Steps</h2>

                <div className="next-list">
                  <div className="next-item">
                    <span>1</span>

                    <div>
                      <strong>Review your attendance</strong>
                      <p>
                        Open your attendance history to review past
                        sessions.
                      </p>
                    </div>
                  </div>

                  <div className="next-item">
                    <span>2</span>

                    <div>
                      <strong>Request a correction if needed</strong>
                      <p>
                        Submit a request if a verified attendance
                        record needs review.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="next-actions">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/student/attendance")
                    }
                  >
                    Open Attendance History
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/student/correction-requests")
                    }
                  >
                    Open Correction Requests
                  </button>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <StudentAssistant />
    </div>
  );
}

export default AttendanceConfirmation;