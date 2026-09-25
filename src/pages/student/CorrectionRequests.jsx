import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createCorrection,
  getMyAttendance,
  getMyCorrections,
} from "../../services/api";
import StudentAssistant from "../../components/student/StudentAssistant";
import ThemeToggle from "../../components/ThemeToggle";
import "../../components/student/StudentAssistant.css";
import StudentMobileNav from "./StudentMobileNav";
import { useLanguage } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";
import "./CorrectionRequests.css";

function Icon({ name, size = 18 }) {
  const paths = {
    grid: (
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

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
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
      {paths[name]}
    </svg>
  );
}

const REQUESTED_STATUS_OPTIONS = [
  { value: "present", labelKey: "stuCorrections.statusPresent" },
  { value: "late", labelKey: "stuCorrections.statusLate" },
  { value: "excused", labelKey: "stuCorrections.statusExcused" },
  { value: "absent", labelKey: "stuCorrections.statusAbsent" },
];

const EMPTY_FORM = {
  attendanceEventId: "",
  requestedStatus: "present",
  reason: "",
  evidenceUrl: "",
};

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "";

  const raw = String(value).slice(0, 10);
  const parts = raw.split("-");

  if (parts.length === 3) {
    const date = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "";

  const normalized = String(value).includes("T")
    ? String(value)
    : String(value).replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function CorrectionRequests() {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSavedUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [requests, setRequests] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [recordsError, setRecordsError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all-courses");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const locked =
      sidebarOpen || showModal || Boolean(selectedRequest);

    document.body.classList.toggle(
      "correction-sidebar-open",
      locked
    );

    return () =>
      document.body.classList.remove("correction-sidebar-open");
  }, [sidebarOpen, showModal, selectedRequest]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      if (selectedRequest) {
        setSelectedRequest(null);
      } else if (showModal) {
        setShowModal(false);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, selectedRequest]);

  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function loadRequests() {
    setLoading(true);
    setLoadError("");

    try {
      const data = await getMyCorrections();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(
        error.message ||
          t("stuCorrections.loadError")
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRecords() {
    setRecordsError("");

    try {
      const data = await getMyAttendance();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      setRecordsError(
        error.message ||
          t("stuCorrections.recordsError")
      );
    }
  }

  useEffect(() => {
    loadRequests();
    loadRecords();
  }, []);

  const recordMap = useMemo(() => {
    const map = new Map();

    records.forEach((record) => {
      map.set(Number(record.id), record);
    });

    return map;
  }, [records]);

  const normalizedRequests = useMemo(() => {
    return requests.map((row) => {
      const event = row.attendance_event_id
        ? recordMap.get(Number(row.attendance_event_id))
        : null;

      return {
        id: row.id,
        course: event?.course_name || "",
        courseCode: event?.course_code || "",
        section: event?.section_name || "",
        attendanceDate: event?.session_date || "",
        requested: String(row.requested_status || "").toLowerCase(),
        status: String(row.status || "pending").toLowerCase(),
        reason: row.reason || "",
        evidenceUrl: row.evidence_url || "",
        reviewerComment: row.reviewer_comment || "",
        reviewedAt: row.reviewed_at || "",
        submittedAt: row.created_at || "",
        hasRecord: Boolean(event),
      };
    });
  }, [requests, recordMap]);

  const courseOptions = useMemo(() => {
    const unique = new Set();

    normalizedRequests.forEach((request) => {
      if (request.course) unique.add(request.course);
    });

    return ["all-courses", ...Array.from(unique).sort()];
  }, [normalizedRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return normalizedRequests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        String(request.id).includes(normalizedSearch) ||
        request.course.toLowerCase().includes(normalizedSearch) ||
        request.courseCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.section
          .toLowerCase()
          .includes(normalizedSearch) ||
        request.reason.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      const matchesCourse =
        courseFilter === "all-courses" ||
        request.course === courseFilter;

      const reference =
        request.attendanceDate || String(request.submittedAt);

      const matchesFrom =
        !fromDate || String(reference) >= fromDate;

      const matchesTo =
        !toDate || String(reference).slice(0, 10) <= toDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCourse &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    normalizedRequests,
    search,
    statusFilter,
    courseFilter,
    fromDate,
    toDate,
  ]);

  const pendingCount = normalizedRequests.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedCount = normalizedRequests.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedCount = normalizedRequests.filter(
    (item) => item.status === "rejected"
  ).length;

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setCourseFilter("all-courses");
    setFromDate("");
    setToDate("");
  }

  function handleLogout() {
    setSidebarOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/logout");
  }

  const closeSidebar = () => setSidebarOpen(false);

  const navigateAndClose = (path) => {
    closeSidebar();
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  function openNewRequest() {
    setForm(EMPTY_FORM);
    setSubmitError("");
    setShowModal(true);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitRequest(event) {
    event.preventDefault();

    if (!form.attendanceEventId) {
      setSubmitError(
        t("stuCorrections.selectRecordError")
      );
      return;
    }

    if (!form.reason.trim()) {
      setSubmitError(t("stuCorrections.reasonRequired"));
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await createCorrection({
        attendanceEventId:
          form.attendanceEventId === "none"
            ? null
            : Number(form.attendanceEventId),
        requestedStatus: form.requestedStatus,
        reason: form.reason.trim(),
        evidenceUrl: form.evidenceUrl.trim() || null,
      });

      setShowModal(false);
      setForm(EMPTY_FORM);
      setNotice(t("stuCorrections.submitNotice"));
      await loadRequests();
    } catch (error) {
      setSubmitError(
        error.message || t("stuCorrections.submitError")
      );
    } finally {
      setSubmitting(false);
    }
  }

  const firstName =
    user?.first_name || user?.firstName || t("role.student");
  const lastName = user?.last_name || user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const avatarLetter = firstName.charAt(0).toUpperCase() || "S";

  return (
    <div className={`correction-page ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button
        type="button"
        className="correction-mobile-menu-button"
        aria-label={t("a11y.openNav")}
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
          className="correction-sidebar-overlay"
          aria-label={t("a11y.closeNav")}
          onClick={closeSidebar}
        />
      )}

      <aside className={`correction-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="correction-brand">
          <div className="correction-brand-logo">
            <span className="brand-mark" />
          </div>

          <div>
            <strong>{platformName}</strong>
            <span>{t("brand.tagline")}</span>
          </div>
        </div>

        <div className="correction-profile">
          <div className="correction-avatar">{avatarLetter}</div>

          <div className="correction-profile-info">
            <strong>{fullName}</strong>
            <span>{t("role.student")}</span>
          </div>
        </div>

        <nav className="correction-nav">
          <button
            type="button"
            className={isActive("/dashboard") ? "active" : ""}
            onClick={() => navigateAndClose("/dashboard")}
          >
            <span className="nav-icon">
              <Icon name="grid" size={16} />
            </span>{t("nav.dashboard")}</button>

          <button
            type="button"
            className={
              isActive("/student/attendance") ? "active" : ""
            }
            onClick={() => navigateAndClose("/student/attendance")}
          >
            <span className="nav-icon">
              <Icon name="calendar" size={16} />
            </span>{t("nav.myAttendance")}</button>

          <button
            type="button"
            className={isActive("/student/scan") ? "active" : ""}
            onClick={() => navigateAndClose("/student/scan")}
          >
            <span className="nav-icon">
              <Icon name="scan" size={16} />
            </span>{t("nav.scan")}</button>

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
            <span className="nav-icon">
              <Icon name="edit" size={16} />
            </span>{t("nav.corrections")}</button>

          <button
            type="button"
            className={
              isActive("/student/profile") ? "active" : ""
            }
            onClick={() => navigateAndClose("/student/profile")}
          >
            <span className="nav-icon">
              <Icon name="user" size={16} />
            </span>{t("nav.profile")}</button>
        </nav>

        <div className="correction-sidebar-bottom">
          <div className="correction-side-tip">
            <div>
              <strong>{t("stuCorrections.keepGoing")}</strong>
              <span>{t("stuCorrections.keepGoingSub")}</span>
            </div>
          </div>

          <button
            type="button"
            className="correction-logout"
            onClick={handleLogout}
          >
            <span className="logout-icon">
              <Icon name="logout" size={16} />
            </span>
            {t("action.logout")}
          </button>
        </div>
      </aside>

      <main className="correction-main">
        <header className="correction-topbar">
          <ThemeToggle />
          <div className="correction-global-search">
            <Icon name="search" size={16} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("stuCorrections.globalSearchPh")}
              aria-label={t("stuCorrections.globalSearchLabel")}
            />
          </div>

          <div className="correction-user-area">
            <div className="top-avatar">{avatarLetter}</div>

            <div className="top-user-info">
              <strong>{fullName}</strong>
              <span>{t("role.student")}</span>
            </div>
          </div>
        </header>

        <section className="correction-content">
          <div className="correction-hero">
            <div className="hero-copy">
              <div>
                <span className="hero-label">{t("stuCorrections.eyebrow")}</span>
                <h1>{t("stuCorrections.title")}</h1>
                <p>
                  {t("stuCorrections.heroDesc")}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="new-request-button"
              onClick={openNewRequest}
            >
              <Icon name="plus" size={16} />
              {t("stuCorrections.newRequest")}
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card pending">
              <div className="stat-body">
                <span>{t("stuCorrections.pendingTitle")}</span>
                <strong>{pendingCount}</strong>
                <small>{t("stuCorrections.pendingSub")}</small>
              </div>
            </div>

            <div className="stat-card approved">
              <div className="stat-body">
                <span>{t("stuCorrections.approvedTitle")}</span>
                <strong>{approvedCount}</strong>
                <small>{t("stuCorrections.approvedSub")}</small>
              </div>
            </div>

            <div className="stat-card rejected">
              <div className="stat-body">
                <span>{t("stuCorrections.rejectedTitle")}</span>
                <strong>{rejectedCount}</strong>
                <small>{t("stuCorrections.rejectedSub")}</small>
              </div>
            </div>

            <div className="stat-card total">
              <div className="stat-body">
                <span>{t("stuCorrections.totalTitle")}</span>
                <strong>{normalizedRequests.length}</strong>
                <small>{t("stuCorrections.totalSub")}</small>
              </div>
            </div>
          </div>

          <div className="correction-layout">
            <div className="correction-left">
              <div className="filter-card">
                <div className="filter-field search-field">
                  <label htmlFor="correction-search">{t("stuCorrections.searchLabel")}</label>
                  <div className="input-with-prefix">
                    <Icon name="search" size={15} />
                    <input
                      id="correction-search"
                      type="text"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder={t("stuCorrections.searchPh")}
                    />
                  </div>
                </div>

                <div className="filter-field">
                  <label htmlFor="correction-status">{t("stuCorrections.statusLabel")}</label>
                  <select
                    id="correction-status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">{t("stuCorrections.allStatuses")}</option>
                    <option value="pending">{t("stuCorrections.statusPending")}</option>
                    <option value="approved">{t("stuCorrections.statusApproved")}</option>
                    <option value="rejected">{t("stuCorrections.statusRejected")}</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="correction-course">{t("stuCorrections.courseLabel")}</label>
                  <select
                    id="correction-course"
                    value={courseFilter}
                    onChange={(event) =>
                      setCourseFilter(event.target.value)
                    }
                  >
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course === "all-courses"
                          ? t("stuCorrections.allCourses")
                          : course}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="correction-from">{t("stuCorrections.fromLabel")}</label>
                  <input
                    id="correction-from"
                    className="date-input"
                    type="date"
                    value={fromDate}
                    onChange={(event) =>
                      setFromDate(event.target.value)
                    }
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="correction-to">{t("stuCorrections.toLabel")}</label>
                  <input
                    id="correction-to"
                    className="date-input"
                    type="date"
                    value={toDate}
                    onChange={(event) =>
                      setToDate(event.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="reset-filter-button"
                  onClick={resetFilters}
                >
                  {t("stuCorrections.reset")}
                </button>
              </div>

              <div className="requests-card">
                <div className="requests-card-header">
                  <div className="section-title">
                    <div>
                      <h2>{t("stuCorrections.listTitle")}</h2>
                      <p>
                        {t("stuCorrections.listSub")}
                      </p>
                    </div>
                  </div>

                  {!loading && !loadError && (
                    <span className="result-count">
                      {t("stuCorrections.resultCount").replace("{shown}", filteredRequests.length).replace("{total}", normalizedRequests.length)}
                    </span>
                  )}
                </div>

                {notice && (
                  <div className="inline-notice" role="status">
                    {notice}
                  </div>
                )}

                {loadError ? (
                  <div className="requests-error" role="alert">
                    <p>{loadError}</p>
                    <button
                      type="button"
                      className="retry-button"
                      onClick={loadRequests}
                    >
                      {t("stuCorrections.tryAgain")}
                    </button>
                  </div>
                ) : loading ? (
                  <div className="requests-skeleton" aria-hidden="true">
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </div>
                ) : normalizedRequests.length === 0 ? (
                  <div className="empty-state">
                    <h3>{t("stuCorrections.emptyTitle")}</h3>
                    <p>
                      {t("stuCorrections.emptyText")}
                    </p>
                    <button
                      type="button"
                      className="new-request-button"
                      onClick={openNewRequest}
                    >
                      <Icon name="plus" size={16} />
                      {t("stuCorrections.newRequest")}
                    </button>
                  </div>
                ) : (
                  <div className="requests-table-wrap">
                    <table className="requests-table">
                      <thead>
                        <tr>
                          <th>{t("stuCorrections.thRequest_ID")}</th>
                          <th>{t("stuCorrections.thCourse")}</th>
                          <th>{t("stuCorrections.thSection")}</th>
                          <th>{t("stuCorrections.thAttendance_Date")}</th>
                          <th>{t("stuCorrections.thRequested")}</th>
                          <th>{t("stuCorrections.thStatus")}</th>
                          <th>{t("stuCorrections.thReason")}</th>
                          <th>{t("stuCorrections.thSubmitted_At")}</th>
                          <th>{t("stuCorrections.thAction")}</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredRequests.map((request) => (
                          <tr key={request.id}>
                            <td data-label={t("stuCorrections.thRequest_ID")}>
                              <strong className="request-id">
                                #{request.id}
                              </strong>
                            </td>

                            <td data-label={t("stuCorrections.thCourse")}>
                              {request.hasRecord ? (
                                <strong>{request.course}</strong>
                              ) : (
                                <span className="muted-cell">
                                  {t("stuCorrections.notLinked")}
                                </span>
                              )}
                            </td>

                            <td data-label={t("stuCorrections.thSection")}>
                              {request.section || t("stuCorrections.notApplicable")}
                            </td>

                            <td data-label={t("stuCorrections.thAttendance_Date")}>
                              {formatDate(request.attendanceDate) ||
                                t("stuCorrections.notApplicable")}
                            </td>

                            <td data-label={t("stuCorrections.thRequested")}>
                              {capitalize(request.requested)}
                            </td>

                            <td data-label={t("stuCorrections.thStatus")}>
                              <span
                                className={`status-badge ${request.status}`}
                              >
                                {capitalize(request.status)}
                              </span>
                            </td>

                            <td data-label={t("stuCorrections.thReason")} className="reason-cell">
                              {request.reason}
                            </td>

                            <td data-label={t("stuCorrections.thSubmitted_At")}>
                              {formatDateTime(request.submittedAt)}
                            </td>

                            <td data-label={t("stuCorrections.thAction")}>
                              <button
                                type="button"
                                className="view-button"
                                onClick={() =>
                                  setSelectedRequest(request)
                                }
                              >
                                {t("stuCorrections.viewBtn")}
                              </button>
                            </td>
                          </tr>
                        ))}

                        {filteredRequests.length === 0 && (
                          <tr>
                            <td
                              colSpan="9"
                              className="empty-table"
                            >
                              {t("stuCorrections.noMatch")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <aside className="correction-right">
              <div className="side-card">
                <div className="side-card-title">
                  <h3>{t("stuCorrections.howTitle")}</h3>
                </div>

                <div className="process-list">
                  <div className="process-item">
                    <span>1</span>
                    <div>
                      <strong>{t("stuCorrections.step1Title")}</strong>
                      <p>
                        {t("stuCorrections.step1Text")}
                      </p>
                    </div>
                  </div>

                  <div className="process-item">
                    <span>2</span>
                    <div>
                      <strong>{t("stuCorrections.step2Title")}</strong>
                      <p>
                        {t("stuCorrections.step2Text")}
                      </p>
                    </div>
                  </div>

                  <div className="process-item">
                    <span>3</span>
                    <div>
                      <strong>{t("stuCorrections.step3Title")}</strong>
                      <p>
                        {t("stuCorrections.step3Text")}
                      </p>
                    </div>
                  </div>

                  <div className="process-item">
                    <span>4</span>
                    <div>
                      <strong>{t("stuCorrections.step4Title")}</strong>
                      <p>
                        {t("stuCorrections.step4Text")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="side-card help-card">
                <div className="side-card-title">
                  <h3>{t("stuCorrections.helpTitle")}</h3>
                </div>

                <p>
                  {t("stuCorrections.helpText")}
                </p>
              </div>

              <div className="side-card tips-card">
                <div className="side-card-title">
                  <h3>{t("stuCorrections.tipsTitle")}</h3>
                </div>

                <ul>
                  <li>{t("stuCorrections.tip1")}</li>
                  <li>{t("stuCorrections.tip2")}</li>
                  <li>
                    {t("stuCorrections.tip3")}</li>
                  <li>
                    {t("stuCorrections.tip4")}</li>
                  <li>{t("stuCorrections.tip5")}</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {showModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="request-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("stuCorrections.modalLabel")}
          >
            <div className="modal-header">
              <div>
                <span>{t("stuCorrections.eyebrow")}</span>
                <h2>{t("stuCorrections.modalTitle")}</h2>
                <p>
                  {t("stuCorrections.modalSub")}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
              >{t("stuCorrections.closeBtn")}</button>
            </div>

            <form onSubmit={submitRequest}>
              <div className="modal-grid">
                <label className="full-width">
                  {t("stuCorrections.recordLabel")}
                  <select
                    name="attendanceEventId"
                    value={form.attendanceEventId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">
                      {t("stuCorrections.selectRecordPh")}
                    </option>

                    {records.map((record) => (
                      <option
                        key={record.id}
                        value={String(record.id)}
                      >
                        {record.course_name}
                        {record.course_code
                          ? ` (${record.course_code})`
                          : ""}
                        {" — "}
                        {record.section_name}
                        {" — "}
                        {formatDate(record.session_date)}
                        {" — current: "}
                        {record.status}
                      </option>
                    ))}

                    <option value="none">
                      {t("stuCorrections.noMatchOption")}
                    </option>
                  </select>
                </label>

                {recordsError && (
                  <div className="form-error full-width" role="alert">
                    <p>{recordsError}</p>
                    <button
                      type="button"
                      className="retry-button"
                      onClick={loadRecords}
                    >
                      {t("stuCorrections.tryAgain")}
                    </button>
                  </div>
                )}

                {!recordsError && records.length === 0 && (
                  <p className="form-hint full-width">
                    {t("stuCorrections.noRecordsHint")}
                  </p>
                )}

                <label>
                  {t("stuCorrections.requestedLabel")}
                  <select
                    name="requestedStatus"
                    value={form.requestedStatus}
                    onChange={handleFormChange}
                    required
                  >
                    {REQUESTED_STATUS_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  {t("stuCorrections.evidenceLabel")}
                  <input
                    type="url"
                    name="evidenceUrl"
                    value={form.evidenceUrl}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </label>

                <label className="full-width">
                  {t("stuCorrections.reasonLabel")}
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleFormChange}
                    placeholder={t("stuCorrections.reasonPh")}
                    rows="4"
                    required
                  />
                </label>

                {submitError && (
                  <div className="form-error full-width" role="alert">
                    <p>{submitError}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  {t("stuCorrections.cancelBtn")}
                </button>

                <button
                  type="submit"
                  className="submit-request-button"
                  disabled={submitting}
                >
                  {submitting ? t("stuCorrections.submitting") : t("stuCorrections.submitBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRequest(null);
            }
          }}
        >
          <div
            className="request-modal details-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("stuCorrections.detailsLabel")}
          >
            <div className="modal-header">
              <div>
                <span>{t("stuCorrections.detailsEyebrow")}</span>
                <h2>#{selectedRequest.id}</h2>
                <p>
                  {t("stuCorrections.submittedAt").replace("{n}", formatDateTime(selectedRequest.submittedAt))}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedRequest(null)}
              >{t("stuCorrections.closeBtn")}</button>
            </div>

            <div className="details-grid">
              <div>
                <span>{t("stuCorrections.dCourse")}</span>
                <strong>
                  {selectedRequest.hasRecord
                    ? `${selectedRequest.course}${
                        selectedRequest.courseCode
                          ? ` (${selectedRequest.courseCode})`
                          : ""
                      }`
                    : t("stuCorrections.notLinked")}
                </strong>
              </div>

              <div>
                <span>{t("stuCorrections.dSection")}</span>
                <strong>{selectedRequest.section || t("stuCorrections.notApplicable")}</strong>
              </div>

              <div>
                <span>{t("stuCorrections.dDate")}</span>
                <strong>
                  {formatDate(selectedRequest.attendanceDate) ||
                    t("stuCorrections.notApplicable")}
                </strong>
              </div>

              <div>
                <span>{t("stuCorrections.dRequested")}</span>
                <strong>
                  {capitalize(selectedRequest.requested)}
                </strong>
              </div>

              <div>
                <span>{t("stuCorrections.dStatus")}</span>
                <strong>
                  <span
                    className={`status-badge ${selectedRequest.status}`}
                  >
                    {capitalize(selectedRequest.status)}
                  </span>
                </strong>
              </div>

              <div>
                <span>{t("stuCorrections.dReviewed")}</span>
                <strong>
                  {formatDateTime(selectedRequest.reviewedAt) ||
                    t("stuCorrections.notReviewed")}
                </strong>
              </div>

              <div className="details-full">
                <span>{t("stuCorrections.dReason")}</span>
                <strong>{selectedRequest.reason}</strong>
              </div>

              {selectedRequest.evidenceUrl && (
                <div className="details-full">
                  <span>{t("stuCorrections.dEvidence")}</span>
                  <a
                    href={selectedRequest.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedRequest.evidenceUrl}
                  </a>
                </div>
              )}

              {selectedRequest.reviewerComment && (
                <div className="details-full">
                  <span>{t("stuCorrections.dComment")}</span>
                  <p>{selectedRequest.reviewerComment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <StudentAssistant />
      <StudentMobileNav />
    </div>
  );
}

export default CorrectionRequests;