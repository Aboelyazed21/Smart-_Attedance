import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLecturerAttendanceReport,
  getLecturerSections,
} from "../../services/api";

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

function normalizeArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  if (Array.isArray(data?.records)) {
    return data.records;
  }

  if (Array.isArray(data?.attendance)) {
    return data.attendance;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

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

function formatDate(value) {
  if (!value) {
    return "-";
  }

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
  if (!value) {
    return "-";
  }

  return String(value).substring(0, 5);
}

export default function LecturerAttendance() {
  const navigate = useNavigate();

  const savedUser = useMemo(() => getSavedUser(), []);

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

  const firstName =
    savedUser?.first_name ||
    savedUser?.firstName ||
    "Lecturer";

  const lastName =
    savedUser?.last_name ||
    savedUser?.lastName ||
    "";

  const initials = getInitials(firstName, lastName);

  async function loadSections() {
    try {
      setSectionsLoading(true);
      setSectionsError("");

      const data = await getLecturerSections();

      setSections(normalizeArray(data));
    } catch (err) {
      console.error("Lecturer sections error:", err);

      setSectionsError(
        err?.message ||
          "Failed to load lecturer sections."
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

      const data = await getLecturerAttendanceReport(
        filters
      );

      setRecords(normalizeArray(data));
    } catch (err) {
      console.error("Lecturer attendance error:", err);

      setError(
        err?.message ||
          "Failed to load attendance records."
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
  }, [
    sectionFilter,
    statusFilter,
    startDate,
    endDate,
  ]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

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
    const statuses = filteredRecords.map(
      getAttendanceStatus
    );

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
        ? Math.round(
            ((present + late) / total) * 100
          )
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  return (
    <div className="lecturer-attendance-page">
      <aside className="lecturer-attendance-sidebar">
        <div className="lecturer-attendance-brand">
          <div className="brand-mark">
            A
          </div>

          <div>
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="lecturer-attendance-profile">
          <div className="profile-avatar">
            {initials}
          </div>

          <div>
            <strong>
              {firstName} {lastName}
            </strong>

            <span>Lecturer</span>
          </div>
        </div>

        <nav className="lecturer-attendance-nav">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <span>DB</span>
            Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/lecturer/sessions")
            }
          >
            <span>AS</span>
            Attendance Sessions
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/lecturer/sections")
            }
          >
            <span>SC</span>
            My Sections
          </button>

          <button
            type="button"
            className="active"
            onClick={() =>
              navigate("/lecturer/attendance")
            }
          >
            <span>AT</span>
            Attendance
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/lecturer/reports")
            }
          >
            <span>RP</span>
            Reports
          </button>
        </nav>

        <div className="lecturer-attendance-sidebar-footer">
          <div className="sidebar-info">
            <span className="live-badge">
              LIVE
            </span>

            <strong>
              Attendance monitoring
            </strong>

            <p>
              Review attendance records from your
              assigned sections.
            </p>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            <span>LO</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="lecturer-attendance-main">
        <header className="lecturer-attendance-topbar">
          <div>
            <span className="topbar-label">
              LECTURER PORTAL
            </span>

            <h1>Attendance</h1>

            <p>
              Review attendance records for your
              assigned sections.
            </p>
          </div>

          <div className="topbar-user">
            <div>
              <strong>
                {firstName} {lastName}
              </strong>

              <span>Lecturer</span>
            </div>

            <div className="topbar-avatar">
              {initials}
            </div>
          </div>
        </header>

        <section className="lecturer-attendance-content">
          <div className="attendance-hero">
            <div>
              <span className="hero-label">
                ATTENDANCE MONITORING
              </span>

              <h2>
                Attendance records
              </h2>

              <p>
                Filter and review attendance activity
                across your teaching sections.
              </p>
            </div>

            <button
              type="button"
              className="attendance-refresh-button"
              onClick={() =>
                loadAttendance(true)
              }
              disabled={refreshing}
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {error && (
            <div className="attendance-alert">
              <div className="alert-icon">
                !
              </div>

              <div>
                <strong>
                  Unable to load attendance
                </strong>

                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={() =>
                  loadAttendance(true)
                }
              >
                Retry
              </button>
            </div>
          )}

          <div className="attendance-stat-grid">
            <div className="attendance-stat-card">
              <div className="stat-icon">
                AT
              </div>

              <div>
                <span>Total records</span>
                <strong>{stats.total}</strong>
                <small>
                  Records matching the current filters
                </small>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="stat-icon">
                PR
              </div>

              <div>
                <span>Present</span>
                <strong>{stats.present}</strong>
                <small>
                  Students marked present
                </small>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="stat-icon">
                LT
              </div>

              <div>
                <span>Late</span>
                <strong>{stats.late}</strong>
                <small>
                  Students marked late
                </small>
              </div>
            </div>

            <div className="attendance-stat-card">
              <div className="stat-icon">
                AR
              </div>

              <div>
                <span>Attendance rate</span>
                <strong>
                  {stats.attendanceRate}%
                </strong>
                <small>
                  Present + late records
                </small>
              </div>
            </div>
          </div>

          <section className="attendance-panel">
            <div className="attendance-panel-header">
              <div>
                <span className="panel-label">
                  RECORD FILTERS
                </span>

                <h3>
                  Attendance history
                </h3>

                <p>
                  Use the filters to inspect specific
                  attendance records.
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
                  placeholder="Search student, course or section..."
                />
              </div>

              <div className="attendance-filter-field">
                <label>Section</label>

                <select
                  value={sectionFilter}
                  onChange={(event) =>
                    setSectionFilter(
                      event.target.value
                    )
                  }
                  disabled={sectionsLoading}
                >
                  <option value="all">
                    All sections
                  </option>

                  {sections.map((section) => {
                    const id =
                      section?.section_id ??
                      section?.sectionId ??
                      section?.id;

                    return (
                      <option
                        key={id}
                        value={id}
                      >
                        {section?.course_code ||
                          section?.courseCode ||
                          "Course"}{" "}
                        -{" "}
                        {section?.section_name ||
                          section?.sectionName ||
                          `Section ${id}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="attendance-filter-field">
                <label>Status</label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    All statuses
                  </option>

                  <option value="present">
                    Present
                  </option>

                  <option value="late">
                    Late
                  </option>

                  <option value="absent">
                    Absent
                  </option>

                  <option value="excused">
                    Excused
                  </option>
                </select>
              </div>

              <div className="attendance-filter-field">
                <label>From</label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="attendance-filter-field">
                <label>To</label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(
                      event.target.value
                    )
                  }
                />
              </div>

              <button
                type="button"
                className="clear-attendance-filters"
                onClick={clearFilters}
              >
                Clear
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
                    Loading attendance records
                  </strong>

                  <span>
                    Reading attendance data...
                  </span>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="attendance-empty">
                  <div className="empty-icon">
                    AT
                  </div>

                  <h3>
                    No attendance records
                  </h3>

                  <p>
                    No records match the current
                    filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <table className="lecturer-attendance-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Source</th>
                      <th>Validation</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRecords.map(
                      (row, index) => {
                        const status =
                          getAttendanceStatus(
                            row
                          );

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
                                      "Student"}
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
                                    "Course"}
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
                                {row?.source ||
                                  "-"}
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
                      }
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}