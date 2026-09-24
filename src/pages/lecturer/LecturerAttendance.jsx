import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../utils/i18n";
import { getLecturerAttendanceReport, getLecturerSections } from "../../services/api";
import "./LecturerAttendance.css";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getAttendanceStatus(row) {
  return String(
    row?.attendance_status ??
      row?.attendanceStatus ??
      row?.status ??
      "absent"
  ).toLowerCase();
}

function getStudentName(row) {
  return (
    row?.student_name ||
    row?.studentName ||
    `${row?.first_name || ""} ${row?.last_name || ""}`.trim() ||
    "Student"
  );
}

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName).trim().charAt(0);
  const last = String(lastName).trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "ST";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";
  return String(value).substring(0, 5);
}

function getSectionId(section) {
  return section?.section_id ?? section?.sectionId ?? section?.id;
}

function getSectionLabel(section) {
  const code =
    section?.course_code ||
    section?.courseCode ||
    "Course";

  const name =
    section?.section_name ||
    section?.sectionName ||
    `Section ${getSectionId(section) ?? "-"}`;

  return `${code} - ${name}`;
}

export default function LecturerAttendance() {
  const { t } = useLanguage();

  const savedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const lecturerName =
    savedUser?.name ||
    savedUser?.full_name ||
    savedUser?.fullName ||
    savedUser?.username ||
    savedUser?.email ||
    t("role.lecturer");

  const lecturerInitials = lecturerName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "L";

  const [records, setRecords] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [sectionsError, setSectionsError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function loadSections() {
    try {
      setSectionsLoading(true);
      setSectionsError("");

      const data = await getLecturerSections();
      setSections(normalizeArray(data));
    } catch (err) {
      console.error("Lecturer sections error:", err);
      setSectionsError(
        err?.message || t("lecAttendance.sectionsError")
      );
    } finally {
      setSectionsLoading(false);
    }
  }

  async function loadAttendance(showRefreshState = false) {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const filters = {};

      if (sectionFilter !== "all") {
        filters.sectionId = Number(sectionFilter);
      }

      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      if (startDate) {
        filters.startDate = startDate;
      }

      if (endDate) {
        filters.endDate = endDate;
      }

      const data = await getLecturerAttendanceReport(filters);
      setRecords(normalizeArray(data));
    } catch (err) {
      console.error("Lecturer attendance error:", err);
      setError(
        err?.message || t("lecAttendance.loadError")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [sectionFilter, statusFilter, startDate, endDate]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return records;

    return records.filter((row) => {
      const searchableText = [
        getStudentName(row),
        row?.student_code,
        row?.studentCode,
        row?.university_id,
        row?.course_code,
        row?.courseCode,
        row?.course_name,
        row?.courseName,
        row?.section_name,
        row?.sectionName,
        row?.source,
        getAttendanceStatus(row),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [records, search]);

  const stats = useMemo(() => {
    const statuses = filteredRecords.map(getAttendanceStatus);

    const present = statuses.filter(
      (status) => status === "present"
    ).length;

    const late = statuses.filter(
      (status) => status === "late"
    ).length;

    const absent = statuses.filter(
      (status) => status === "absent"
    ).length;

    const excused = statuses.filter(
      (status) => status === "excused"
    ).length;

    const total = statuses.length;

    const attendanceRate =
      total > 0
        ? Math.round(((present + late) / total) * 100)
        : 0;

    return {
      total,
      present,
      late,
      absent,
      excused,
      attendanceRate,
    };
  }, [filteredRecords]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSectionFilter("all");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div
      className="lecturer-attendance-page"
    >
      <main className="lecturer-attendance-main">
          <header className="lecturer-attendance-topbar">
            <div>
              <span className="topbar-label">{t("lecAttendance.eyebrow")}</span>
              <h1>{t("nav.attendance")}</h1>
              <p>
                {t("lecAttendance.subtitle")}
              </p>
            </div>

            <div className="topbar-user">
              <span className="topbar-user-context">
                {t("lecAttendance.workspaceLabel")}
              </span>
              <div className="topbar-avatar">
                {lecturerInitials}
              </div>
            </div>
          </header>

          <section className="lecturer-attendance-content">
            <div className="attendance-hero">
              <div>
                <span className="hero-label">
                  {t("lecAttendance.heroEyebrow")}
                </span>

                <h2>{t("lecAttendance.heroTitle")}</h2>

                <p>
                  {t("lecAttendance.heroDesc")}
                </p>
              </div>

              <button
                type="button"
                className="attendance-refresh-button"
                onClick={() => loadAttendance(true)}
                disabled={refreshing}
              >
                {refreshing ? t("lecAttendance.refreshing") : t("action.refresh")}
              </button>
            </div>

            {error && (
              <div className="attendance-alert">
                <div className="alert-icon">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 4v9" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
                  </svg>
                </div>

                <div className="alert-content">
                  <strong>
                    {t("lecAttendance.errorTitle")}
                  </strong>
                  <p>{error}</p>
                </div>

                <button
                  type="button"
                  onClick={() => loadAttendance(true)}
                  disabled={refreshing}
                >
                  {refreshing ? t("lecAttendance.retrying") : t("lecAttendance.retry")}
                </button>
              </div>
            )}

            <div className="attendance-stat-grid">
              <div className="attendance-stat-card">
                <div className="stat-icon">AT</div>
                <div>
                  <span>{t("lecAttendance.statTotal")}</span>
                  <strong>{stats.total}</strong>
                  <small>
                    {t("lecAttendance.statTotalDesc")}
                  </small>
                </div>
              </div>

              <div className="attendance-stat-card">
                <div className="stat-icon">PR</div>
                <div>
                  <span>{t("lecAttendance.statPresent")}</span>
                  <strong>{stats.present}</strong>
                  <small>{t("lecAttendance.statPresentDesc")}</small>
                </div>
              </div>

              <div className="attendance-stat-card">
                <div className="stat-icon">LT</div>
                <div>
                  <span>{t("lecAttendance.statLate")}</span>
                  <strong>{stats.late}</strong>
                  <small>{t("lecAttendance.statLateDesc")}</small>
                </div>
              </div>

              <div className="attendance-stat-card">
                <div className="stat-icon">AR</div>
                <div>
                  <span>{t("lecAttendance.statRate")}</span>
                  <strong>{stats.attendanceRate}%</strong>
                  <small>{t("lecAttendance.statRateDesc")}</small>
                </div>
              </div>
            </div>

            <section className="attendance-panel">
              <div className="attendance-panel-header">
                <div>
                  <span className="panel-label">
                    {t("lecAttendance.filtersEyebrow")}
                  </span>

                  <h3>{t("lecAttendance.filtersTitle")}</h3>

                  <p>
                    {t("lecAttendance.filtersDesc")}
                  </p>
                </div>
              </div>

              <div className="attendance-filters">
                <div className="attendance-search">
                  <span>Q</span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder={t("lecAttendance.searchPh")}
                    aria-label={t("lecAttendance.searchAria")}
                  />
                </div>

                <div className="attendance-filter-field">
                  <label htmlFor="attendance-section">
                    {t("lecAttendance.fieldSection")}
                  </label>

                  <select
                    id="attendance-section"
                    value={sectionFilter}
                    onChange={(event) =>
                      setSectionFilter(event.target.value)
                    }
                    disabled={sectionsLoading}
                  >
                    <option value="all">{t("lecAttendance.allSections")}</option>

                    {sections.map((section) => {
                      const id = getSectionId(section);

                      return (
                        <option key={id} value={id}>
                          {getSectionLabel(section)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="attendance-filter-field">
                  <label htmlFor="attendance-status">
                    {t("lecAttendance.fieldStatus")}
                  </label>

                  <select
                    id="attendance-status"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                  >
                    <option value="all">{t("lecAttendance.allStatuses")}</option>
                    <option value="present">{t("lecAttendance.statusPresent")}</option>
                    <option value="late">{t("lecAttendance.statusLate")}</option>
                    <option value="absent">{t("lecAttendance.statusAbsent")}</option>
                    <option value="excused">{t("lecAttendance.statusExcused")}</option>
                  </select>
                </div>

                <div className="attendance-filter-field">
                  <label htmlFor="attendance-from">{t("lecAttendance.fieldFrom")}</label>

                  <input
                    id="attendance-from"
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(event.target.value)
                    }
                  />
                </div>

                <div className="attendance-filter-field">
                  <label htmlFor="attendance-to">{t("lecAttendance.fieldTo")}</label>

                  <input
                    id="attendance-to"
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(event.target.value)
                    }
                  />
                </div>

                <button
                  type="button"
                  className="clear-attendance-filters"
                  onClick={clearFilters}
                >
                  {t("lecAttendance.clear")}
                </button>
              </div>

              {sectionsError && (
                <div className="sections-inline-warning">
                  {sectionsError}
                </div>
              )}

              <div className="attendance-table-wrap">
                {loading ? (
                  <div className="attendance-loading">
                    <div className="loading-spinner" />

                    <strong>
                      {t("lecAttendance.loadingTitle")}
                    </strong>

                    <span>
                      {t("lecAttendance.loadingDesc")}
                    </span>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="attendance-empty">
                    <div className="empty-icon">AT</div>

                    <h3>{t("lecAttendance.emptyTitle")}</h3>

                    <p>
                      {t("lecAttendance.emptyDesc")}
                    </p>

                    <button
                      type="button"
                      onClick={clearFilters}
                    >
                      {t("lecAttendance.clearFilters")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="attendance-mobile-list">
                      {filteredRecords.map((row, index) => {
                        const status =
                          getAttendanceStatus(row);

                        const studentName =
                          getStudentName(row);

                        const rowKey =
                          row?.attendance_id ??
                          row?.attendanceId ??
                          `${row?.student_code || index}-${row?.session_date || index}`;

                        return (
                          <article
                            className="attendance-mobile-card"
                            key={rowKey}
                          >
                            <div className="attendance-mobile-card-header">
                              <div className="attendance-student">
                                <div className="student-avatar">
                                  {getInitials(
                                    row?.first_name,
                                    row?.last_name
                                  )}
                                </div>

                                <div>
                                  <strong>
                                    {studentName}
                                  </strong>

                                  <span>
                                    {row?.student_code ||
                                      row?.studentCode ||
                                      row?.email ||
                                      t("lecAttendance.studentFallback")}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`attendance-status attendance-status-${status}`}
                              >
                                <span className="status-dot" />
                                {status}
                              </span>
                            </div>

                            <div className="attendance-mobile-grid">
                              <div>
                                <span>{t("lecAttendance.colCourse")}</span>
                                <strong>
                                  {row?.course_code ||
                                    row?.courseCode ||
                                    "-"}
                                </strong>
                              </div>

                              <div>
                                <span>{t("lecAttendance.colSection")}</span>
                                <strong>
                                  {row?.section_name ||
                                    row?.sectionName ||
                                    "-"}
                                </strong>
                              </div>

                              <div>
                                <span>{t("lecAttendance.colDate")}</span>
                                <strong>
                                  {formatDate(
                                    row?.session_date ||
                                      row?.sessionDate
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>{t("lecAttendance.colTime")}</span>
                                <strong>
                                  {formatTime(
                                    row?.scheduled_start ||
                                      row?.scheduledStart
                                  )}
                                  {" - "}
                                  {formatTime(
                                    row?.scheduled_end ||
                                      row?.scheduledEnd
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>{t("lecAttendance.colSource")}</span>
                                <strong>
                                  {row?.source || "-"}
                                </strong>
                              </div>

                              <div>
                                <span>{t("lecAttendance.colValidation")}</span>
                                <strong>
                                  {row?.validation_status ||
                                    row?.validationStatus ||
                                    "-"}
                                </strong>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="attendance-desktop-table">
                      <table className="lecturer-attendance-table">
                        <thead>
                          <tr>
                            <th>{t("lecAttendance.colStudent")}</th>
                            <th>{t("lecAttendance.colCourse")}</th>
                            <th>{t("lecAttendance.colSection")}</th>
                            <th>{t("lecAttendance.colDate")}</th>
                            <th>{t("lecAttendance.colTime")}</th>
                            <th>{t("lecAttendance.colStatus")}</th>
                            <th>{t("lecAttendance.colSource")}</th>
                            <th>{t("lecAttendance.colValidation")}</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredRecords.map((row, index) => {
                            const status =
                              getAttendanceStatus(row);

                            const studentName =
                              getStudentName(row);

                            const rowKey =
                              row?.attendance_id ??
                              row?.attendanceId ??
                              `${row?.student_code || index}-${row?.session_date || index}`;

                            return (
                              <tr key={rowKey}>
                                <td>
                                  <div className="attendance-student">
                                    <div className="student-avatar">
                                      {getInitials(
                                        row?.first_name,
                                        row?.last_name
                                      )}
                                    </div>

                                    <div>
                                      <strong>
                                        {studentName}
                                      </strong>

                                      <span>
                                        {row?.student_code ||
                                          row?.studentCode ||
                                          row?.email ||
                                          t("lecAttendance.studentFallback")}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  <div className="course-info">
                                    <strong>
                                      {row?.course_code ||
                                        row?.courseCode ||
                                        "-"}
                                    </strong>

                                    <span>
                                      {row?.course_name ||
                                        row?.courseName ||
                                        t("lecAttendance.courseFallback")}
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  {row?.section_name ||
                                    row?.sectionName ||
                                    "-"}
                                </td>

                                <td>
                                  {formatDate(
                                    row?.session_date ||
                                      row?.sessionDate
                                  )}
                                </td>

                                <td>
                                  <div className="time-info">
                                    <strong>
                                      {formatTime(
                                        row?.scheduled_start ||
                                          row?.scheduledStart
                                      )}
                                    </strong>

                                    <span>
                                      {formatTime(
                                        row?.scheduled_end ||
                                          row?.scheduledEnd
                                      )}
                                    </span>
                                  </div>
                                </td>

                                <td>
                                  <span
                                    className={`attendance-status attendance-status-${status}`}
                                  >
                                    <span className="status-dot" />
                                    {status}
                                  </span>
                                </td>

                                <td>
                                  <span className="source-badge">
                                    {row?.source || "-"}
                                  </span>
                                </td>

                                <td>
                                  <span className="validation-badge">
                                    {row?.validation_status ||
                                      row?.validationStatus ||
                                      "-"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </section>
          </section>
        </main>
    </div>
  );
}
