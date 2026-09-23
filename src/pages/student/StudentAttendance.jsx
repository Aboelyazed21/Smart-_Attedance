import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getMyAttendance } from "../../services/api";

import "../../App.css";
import "./StudentAttendance.css";

/* =========================================================
   HELPERS
========================================================= */

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";

  const text = String(value);

  if (text.includes("T")) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const match = text.match(/(\d{1,2}):(\d{2})/);

  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];

  const suffix = hour >= 12 ? "PM" : "AM";

  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;

  return `${hour}:${minute} ${suffix}`;
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function statusLabel(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "present") return "Present";
  if (normalized === "absent") return "Absent";
  if (normalized === "late") return "Late";
  if (normalized === "excused") return "Excused";

  return status || "Unknown";
}

function statusClass(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "present") return "attendance-status-present";
  if (normalized === "absent") return "attendance-status-absent";
  if (normalized === "late") return "attendance-status-late";
  if (normalized === "excused") return "attendance-status-excused";

  return "attendance-status-default";
}

function getCourseName(item) {
  return (
    item.course_name ||
    item.course_title ||
    item.courseName ||
    item.course_code ||
    item.courseCode ||
    "Unknown Course"
  );
}

function getSectionName(item) {
  return (
    item.section_name ||
    item.sectionName ||
    item.section ||
    "-"
  );
}

function getSessionDate(item) {
  return (
    item.session_date ||
    item.sessionDate ||
    item.date ||
    item.attendance_date ||
    item.created_at
  );
}

function getMarkedAt(item) {
  return (
    item.scanned_at ||
    item.marked_at ||
    item.markedAt ||
    item.created_at
  );
}

function getSource(item) {
  return item.source || item.attendance_source || "QR";
}

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

/* =========================================================
   STUDENT ATTENDANCE
========================================================= */

function StudentAttendance() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [page, setPage] = useState(1);

  const rowsPerPage = 10;

  const user = useMemo(() => getUser(), []);

  const firstName =
    user?.first_name ||
    user?.firstName ||
    user?.name?.split(" ")?.[0] ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const initial = firstName
    .charAt(0)
    .toUpperCase();

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyAttendance();

      const rows = Array.isArray(data)
        ? data
        : data?.rows ||
          data?.attendance ||
          data?.records ||
          data?.data ||
          [];

      setAttendance(
        Array.isArray(rows) ? rows : []
      );
    } catch (err) {
      console.error(
        "My attendance error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load your attendance records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.classList.remove("student-attendance-menu-open");
      return undefined;
    }

    document.body.classList.add("student-attendance-menu-open");

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("student-attendance-menu-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    return () => {
      document.body.classList.remove("student-attendance-menu-open");
    };
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  const courseOptions = useMemo(() => {
    const values = attendance
      .map((item) => getCourseName(item))
      .filter(Boolean);

    return [...new Set(values)].sort(
      (a, b) =>
        String(a).localeCompare(String(b))
    );
  }, [attendance]);

  const stats = useMemo(() => {
    const total = attendance.length;

    const present = attendance.filter(
      (item) =>
        normalizeStatus(item.status) ===
        "present"
    ).length;

    const late = attendance.filter(
      (item) =>
        normalizeStatus(item.status) ===
        "late"
    ).length;

    const absent = attendance.filter(
      (item) =>
        normalizeStatus(item.status) ===
        "absent"
    ).length;

    const excused = attendance.filter(
      (item) =>
        normalizeStatus(item.status) ===
        "excused"
    ).length;

    const attended =
      present + late + excused;

    const rate =
      total > 0
        ? Math.round(
            (attended / total) * 100
          )
        : 0;

    return {
      total,
      present,
      late,
      absent,
      excused,
      rate,
    };
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const course = getCourseName(item);
      const status = normalizeStatus(
        item.status
      );

      const rawDate = getSessionDate(item);

      let matchesCourse =
        courseFilter === "all" ||
        course === courseFilter;

      let matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      let matchesFrom = true;
      let matchesTo = true;

      if (rawDate) {
        const date = new Date(rawDate);

        if (!Number.isNaN(date.getTime())) {
          const dateOnly = date
            .toISOString()
            .slice(0, 10);

          if (fromDate) {
            matchesFrom =
              dateOnly >= fromDate;
          }

          if (toDate) {
            matchesTo =
              dateOnly <= toDate;
          }
        }
      }

      return (
        matchesCourse &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    attendance,
    courseFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    courseFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAttendance.length /
        rowsPerPage
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedAttendance = useMemo(() => {
    const start =
      (page - 1) * rowsPerPage;

    return filteredAttendance.slice(
      start,
      start + rowsPerPage
    );
  }, [
    filteredAttendance,
    page,
  ]);

  const courseSummary = useMemo(() => {
    const map = new Map();

    attendance.forEach((item) => {
      const course = getCourseName(item);
      const status = normalizeStatus(
        item.status
      );

      if (!map.has(course)) {
        map.set(course, {
          course,
          total: 0,
          attended: 0,
          present: 0,
          absent: 0,
        });
      }

      const current = map.get(course);

      current.total += 1;

      if (
        status === "present" ||
        status === "late" ||
        status === "excused"
      ) {
        current.attended += 1;
      }

      if (status === "present") {
        current.present += 1;
      }

      if (status === "absent") {
        current.absent += 1;
      }
    });

    return [...map.values()]
      .map((item) => ({
        ...item,
        rate:
          item.total > 0
            ? Math.round(
                (item.attended /
                  item.total) *
                  100
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.rate - a.rate
      )
      .slice(0, 5);
  }, [attendance]);

  const overview = useMemo(() => {
    const buckets = [
      {
        label: "Week 1",
        present: 0,
        absent: 0,
      },
      {
        label: "Week 2",
        present: 0,
        absent: 0,
      },
      {
        label: "Week 3",
        present: 0,
        absent: 0,
      },
      {
        label: "Week 4",
        present: 0,
        absent: 0,
      },
    ];

    attendance.forEach((item) => {
      const dateValue = getSessionDate(item);

      if (!dateValue) return;

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const day = date.getDate();

      let index = 0;

      if (day >= 8 && day <= 14) {
        index = 1;
      } else if (day >= 15 && day <= 21) {
        index = 2;
      } else if (day >= 22) {
        index = 3;
      }

      const status = normalizeStatus(
        item.status
      );

      if (
        status === "present" ||
        status === "late" ||
        status === "excused"
      ) {
        buckets[index].present += 1;
      }

      if (status === "absent") {
        buckets[index].absent += 1;
      }
    });

    return buckets;
  }, [attendance]);

  const maxOverviewValue = Math.max(
    1,
    ...overview.map((item) =>
      Math.max(
        item.present,
        item.absent
      )
    )
  );

  function resetFilters() {
    setCourseFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function exportAttendance() {
    if (!filteredAttendance.length) {
      return;
    }

    const header = [
      "Date",
      "Course",
      "Section",
      "Status",
      "Marked At",
      "Source",
    ];

    const rows = filteredAttendance.map(
      (item) => [
        formatDate(
          getSessionDate(item)
        ),
        getCourseName(item),
        getSectionName(item),
        statusLabel(item.status),
        formatDateTime(
          getMarkedAt(item)
        ),
        getSource(item),
      ]
    );

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
        row.map(escapeCsv).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "my-attendance.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  return (
    <div className={`attendance-page ${sidebarOpen ? "attendance-sidebar-open" : ""}`}>
      <button
        type="button"
        className="attendance-mobile-menu"
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="attendance-sidebar-overlay"
          aria-label="Close navigation"
          onClick={closeSidebar}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className={`attendance-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div>
          <div className="attendance-brand">
            <div className="attendance-brand-logo">
              A
            </div>

            <div>
              <strong>Attendify</strong>
              <span>SMART ATTENDANCE</span>
            </div>
          </div>

          <div className="attendance-profile">
            <div className="attendance-profile-avatar">
              {initial}
            </div>

            <div>
              <strong>{fullName}</strong>
              <span>Student</span>
            </div>
          </div>

          <nav className="attendance-nav">
            <button
              type="button"
              onClick={() => {
                closeSidebar();
                navigate("/dashboard");
              }}
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              type="button"
              className="active"
            >
              <span>▥</span>
              My Attendance
            </button>

            <button
              type="button"
              onClick={() => {
                closeSidebar();
                navigate("/student/scan");
              }}
            >
              <span>▦</span>
              Scan Attendance
            </button>

            <button type="button">
              <span>▤</span>
              Correction Requests
            </button>

            <button type="button">
              <span>♧</span>
              Notifications
              <b>3</b>
            </button>
          </nav>
        </div>

        <div className="attendance-sidebar-bottom">
          <div className="attendance-sidebar-tip">
            <span>✦</span>
            <div>
              <strong>Keep going!</strong>
              <small>Every class counts.</small>
            </div>
          </div>

          <button
            type="button"
            className="attendance-logout"
            onClick={() => {
              closeSidebar();
              handleLogout();
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="attendance-main">
        <header className="attendance-topbar">
          <div className="attendance-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search courses, sessions, or anything..."
            />
            <small>Ctrl + K</small>
          </div>

          <div className="attendance-topbar-right">
            <button
              type="button"
              className="attendance-bell"
            >
              ♧
              <b>3</b>
            </button>

            <div className="attendance-header-user">
              <div>{initial}</div>

              <section>
                <strong>{fullName}</strong>
                <span>Student</span>
              </section>

              <span>⌄</span>
            </div>
          </div>
        </header>

        <section className="attendance-content">
          {/* =================================================
              PAGE HERO
          ================================================= */}

          <div className="attendance-page-hero">
            <div className="attendance-page-title">
              <div className="attendance-page-title-icon">
                ▥
              </div>

              <div>
                <span>Attendance</span>

                <h1>My Attendance</h1>

                <p>
                  Track your attendance records and
                  stay on top of your academic journey.
                </p>
              </div>
            </div>

            <div className="attendance-breadcrumb">
              <span
                onClick={() =>
                  navigate("/dashboard")
                }
              >
                Dashboard
              </span>
              <b>›</b>
              <strong>My Attendance</strong>
            </div>

            <div className="attendance-hero-art">
              <div className="attendance-art-calendar">
                ▣
              </div>

              <div className="attendance-art-mark">
                •
              </div>

              <p>
                Consistency
                <br />
                today, success
                <br />
                tomorrow.
              </p>
            </div>
          </div>

          {/* =================================================
              METRICS
          ================================================= */}

          <div className="attendance-metrics">
            <div className="attendance-metric-card present">
              <div className="attendance-metric-icon">
                P
              </div>

              <div>
                <span>Present</span>
                <strong>{stats.present}</strong>
                <small>
                  {stats.total
                    ? `${Math.round(
                        (stats.present /
                          stats.total) *
                          100
                      )}% attendance rate`
                    : "No records yet"}
                </small>
              </div>

              <i>↗</i>
            </div>

            <div className="attendance-metric-card absent">
              <div className="attendance-metric-icon">
                !
              </div>

              <div>
                <span>Absent</span>
                <strong>{stats.absent}</strong>
                <small>
                  {stats.total
                    ? `${Math.round(
                        (stats.absent /
                          stats.total) *
                          100
                      )}% absence rate`
                    : "No records yet"}
                </small>
              </div>

              <i>↗</i>
            </div>

            <div className="attendance-metric-card total">
              <div className="attendance-metric-icon">
                ▤
              </div>

              <div>
                <span>Total Sessions</span>
                <strong>{stats.total}</strong>
                <small>This semester</small>
              </div>

              <i>☷</i>
            </div>

            <div className="attendance-metric-card rate">
              <div className="attendance-metric-icon">
                %
              </div>

              <div>
                <span>Attendance Rate</span>
                <strong>{stats.rate}%</strong>
                <small>
                  {stats.rate >= 75
                    ? "On track"
                    : "Keep improving"}
                </small>
              </div>

              <i>↗</i>
            </div>
          </div>

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="attendance-filters">
            <div className="attendance-filter-field">
              <label>Semester</label>

              <select defaultValue="fall-2026">
                <option value="fall-2026">
                  Fall 2026
                </option>
                <option value="spring-2026">
                  Spring 2026
                </option>
              </select>
            </div>

            <div className="attendance-filter-field">
              <label>Course</label>

              <select
                value={courseFilter}
                onChange={(event) =>
                  setCourseFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  All Courses
                </option>

                {courseOptions.map(
                  (course) => (
                    <option
                      key={course}
                      value={course}
                    >
                      {course}
                    </option>
                  )
                )}
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
                <option value="all">All</option>
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
                value={fromDate}
                onChange={(event) =>
                  setFromDate(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="attendance-filter-field">
              <label>To</label>

              <input
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
              />
            </div>

            <button
              type="button"
              className="attendance-filter-button"
              onClick={() => setPage(1)}
            >
              ⌕
              Filter
            </button>

            <button
              type="button"
              className="attendance-reset-button"
              onClick={resetFilters}
            >
              ↻
              Reset
            </button>
          </div>

          {/* =================================================
              MAIN DATA GRID
          ================================================= */}

          <div className="attendance-data-grid">
            {/* Records */}
            <div className="attendance-records-card">
              <div className="attendance-card-header">
                <div>
                  <div className="attendance-card-title">
                    <span>▣</span>
                    <h2>Attendance Records</h2>
                  </div>

                  <p>
                    Your detailed attendance history
                  </p>
                </div>

                <button
                  type="button"
                  className="attendance-export-button"
                  onClick={exportAttendance}
                  disabled={
                    !filteredAttendance.length
                  }
                >
                  ↓
                  Export
                </button>
              </div>

              {error && (
                <div className="attendance-error">
                  <strong>Unable to load attendance</strong>
                  <span>{error}</span>

                  <button
                    type="button"
                    onClick={loadAttendance}
                  >
                    Try again
                  </button>
                </div>
              )}

              {loading ? (
                <div className="attendance-state">
                  <div className="attendance-spinner" />
                  <h3>Loading attendance...</h3>
                  <p>
                    We're getting your latest
                    attendance records.
                  </p>
                </div>
              ) : !filteredAttendance.length ? (
                <div className="attendance-state">
                  <div className="attendance-state-icon">
                    ▥
                  </div>

                  <h3>
                    No attendance records found
                  </h3>

                  <p>
                    Your attendance records will
                    appear here once you attend
                    classes.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/student/scan"
                      )
                    }
                  >
                    Scan Attendance QR
                  </button>
                </div>
              ) : (
                <>
                  <div className="attendance-table-wrap">
                    <table className="attendance-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Section</th>
                          <th>Status</th>
                          <th>Marked At</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedAttendance.map(
                          (item, index) => {
                            const status =
                              normalizeStatus(
                                item.status
                              );

                            return (
                              <tr
                                key={
                                  item.id ||
                                  item.attendance_id ||
                                  `${getSessionDate(
                                    item
                                  )}-${index}`
                                }
                              >
                                <td>
                                  {(page - 1) *
                                    rowsPerPage +
                                    index +
                                    1}
                                </td>

                                <td>
                                  <strong>
                                    {formatDate(
                                      getSessionDate(
                                        item
                                      )
                                    )}
                                  </strong>
                                </td>

                                <td>
                                  <div className="attendance-course">
                                    <strong>
                                      {getCourseName(
                                        item
                                      )}
                                    </strong>

                                    {item.course_code &&
                                      item.course_name && (
                                        <small>
                                          {
                                            item.course_code
                                          }
                                        </small>
                                      )}
                                  </div>
                                </td>

                                <td>
                                  {getSectionName(
                                    item
                                  )}
                                </td>

                                <td>
                                  <span
                                    className={`attendance-status ${statusClass(
                                      status
                                    )}`}
                                  >
                                    <i />
                                    {statusLabel(
                                      status
                                    )}
                                  </span>
                                </td>

                                <td>
                                  {formatDateTime(
                                    getMarkedAt(
                                      item
                                    )
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="attendance-table-footer">
                    <span>
                      Showing{" "}
                      {Math.min(
                        (page - 1) *
                          rowsPerPage +
                          1,
                        filteredAttendance.length
                      )}{" "}
                      to{" "}
                      {Math.min(
                        page *
                          rowsPerPage,
                        filteredAttendance.length
                      )}{" "}
                      of{" "}
                      {filteredAttendance.length}{" "}
                      records
                    </span>

                    <div className="attendance-pagination">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() =>
                          setPage(
                            (value) =>
                              Math.max(
                                1,
                                value - 1
                              )
                          )
                        }
                      >
                        ‹
                      </button>

                      {Array.from(
                        {
                          length: Math.min(
                            totalPages,
                            4
                          ),
                        },
                        (_, index) => {
                          const pageNumber =
                            index + 1;

                          return (
                            <button
                              type="button"
                              key={pageNumber}
                              className={
                                page ===
                                pageNumber
                                  ? "active"
                                  : ""
                              }
                              onClick={() =>
                                setPage(
                                  pageNumber
                                )
                              }
                            >
                              {pageNumber}
                            </button>
                          );
                        }
                      )}

                      <button
                        type="button"
                        disabled={
                          page === totalPages
                        }
                        onClick={() =>
                          setPage(
                            (value) =>
                              Math.min(
                                totalPages,
                                value + 1
                              )
                          )
                        }
                      >
                        ›
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right column */}
            <aside className="attendance-side-column">
              {/* Overview */}
              <div className="attendance-side-card">
                <div className="attendance-side-card-header">
                  <div>
                    <span>▥</span>
                    <strong>
                      Attendance Overview
                    </strong>
                  </div>

                  <select defaultValue="30">
                    <option value="30">
                      Last 30 Days
                    </option>
                    <option value="semester">
                      This Semester
                    </option>
                  </select>
                </div>

                <div className="attendance-chart">
                  <div className="attendance-chart-y">
                    <span>10</span>
                    <span>8</span>
                    <span>6</span>
                    <span>4</span>
                    <span>2</span>
                    <span>0</span>
                  </div>

                  <div className="attendance-chart-area">
                    <div className="attendance-chart-grid">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="attendance-chart-bars">
                      {overview.map(
                        (item) => (
                          <div
                            className="attendance-chart-group"
                            key={item.label}
                          >
                            <div className="attendance-bars">
                              <span
                                className="present-bar"
                                style={{
                                  height: `${
                                    Math.max(
                                      item.present
                                        ? 10
                                        : 0,
                                      (item.present /
                                        maxOverviewValue) *
                                        100
                                    ) || 2
                                  }%`,
                                }}
                              />

                              <span
                                className="absent-bar"
                                style={{
                                  height: `${
                                    Math.max(
                                      item.absent
                                        ? 10
                                        : 0,
                                      (item.absent /
                                        maxOverviewValue) *
                                        100
                                    ) || 2
                                  }%`,
                                }}
                              />
                            </div>

                            <small>
                              {item.label}
                            </small>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="attendance-chart-legend">
                  <span>
                    <i className="legend-present" />
                    Present
                  </span>

                  <span>
                    <i className="legend-absent" />
                    Absent
                  </span>
                </div>
              </div>

              {/* Course-wise */}
              <div className="attendance-side-card">
                <div className="attendance-side-card-title">
                  <div>
                    <span>◷</span>
                    <strong>
                      Course-wise Attendance
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCourseFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    View All
                  </button>
                </div>

                {courseSummary.length ? (
                  <div className="course-progress-list">
                    {courseSummary.map(
                      (course) => (
                        <div
                          className="course-progress-row"
                          key={course.course}
                        >
                          <span>
                            {course.course}
                          </span>

                          <div>
                            <i>
                              <b
                                style={{
                                  width: `${course.rate}%`,
                                }}
                              />
                            </i>

                            <strong>
                              {course.rate}%
                            </strong>

                            <small>
                              {course.attended}/
                              {course.total}
                            </small>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="side-empty">
                    No course data yet.
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="attendance-side-card attendance-tips-card">
                <div className="attendance-side-card-title">
                  <div>
                    <span>Tips</span>
                    <strong>
                      Tips for Better Attendance
                    </strong>
                  </div>
                </div>

                <ul>
                  <li>
                    <span>•</span>
                    Attend classes regularly
                  </li>

                  <li>
                    <span>•</span>
                    Check your timetable
                  </li>

                  <li>
                    <span>•</span>
                    Scan the QR code on time
                  </li>

                  <li>
                    <span>•</span>
                    Keep track of your progress
                  </li>
                </ul>

                <div className="attendance-quote">
                  “Discipline is the bridge
                  between goals and achievement.”
                </div>
              </div>
            </aside>
          </div>
        </section>

        <footer className="attendance-footer">
          <span>Attendify</span>
          <b>•</b>
          <span>Port Said University</span>
          <b>•</b>
          <span>
            A Smarter Campus for a Brighter Tomorrow
          </span>

          <small>v1.0.0</small>
        </footer>
      </main>
    </div>
  );
}

export default StudentAttendance;
