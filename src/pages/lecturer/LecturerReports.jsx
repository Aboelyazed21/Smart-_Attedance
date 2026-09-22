import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLecturerAttendanceReport,
  getLecturerSections,
} from "../../services/api";
import "./LecturerReports.css";

export default function LecturerReports() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [sections, setSections] = useState([]);
  const [rows, setRows] = useState([]);

  const [sectionId, setSectionId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadSections() {
    try {
      const result = await getLecturerSections();

      const list = Array.isArray(result?.sections)
        ? result.sections
        : Array.isArray(result)
          ? result
          : [];

      setSections(list);
    } catch (error) {
      console.error("Lecturer sections error:", error);
    }
  }

  async function loadReport(customFilters = {}) {
    try {
      setGenerating(true);
      setError("");

      const params = {
        lecturerId: user?.id,
        sectionId:
          customFilters.sectionId !== undefined
            ? customFilters.sectionId
            : sectionId,
        fromDate:
          customFilters.fromDate !== undefined
            ? customFilters.fromDate
            : fromDate,
        toDate:
          customFilters.toDate !== undefined
            ? customFilters.toDate
            : toDate,
      };

      const result = await getLecturerAttendanceReport(params);

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result?.rows)
          ? result.rows
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.report)
              ? result.report
              : [];

      setRows(data);
    } catch (error) {
      console.error("Lecturer report error:", error);
      setError(error.message || "Failed to load report.");
      setRows([]);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
    loadReport();
  }, []);

  async function generateReport() {
    await loadReport({
      sectionId,
      fromDate,
      toDate,
    });
  }

  async function clearFilters() {
    setSectionId("");
    setFromDate("");
    setToDate("");

    await loadReport({
      sectionId: "",
      fromDate: "",
      toDate: "",
    });
  }

  const statistics = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;

    rows.forEach((row) => {
      const status = String(
        row.status ||
          row.attendance_status ||
          row.attendanceStatus ||
          ""
      ).toLowerCase();

      if (status === "present") {
        present++;
      } else if (status === "late") {
        late++;
      } else if (status === "absent") {
        absent++;
      }
    });

    const total = rows.length;
    const attended = present + late;
    const attendanceRate =
      total > 0
        ? Number(((attended / total) * 100).toFixed(1))
        : 0;

    return {
      total,
      present,
      late,
      absent,
      attendanceRate,
    };
  }, [rows]);

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  }

  function getStatus(row) {
    return String(
      row.status ||
        row.attendance_status ||
        row.attendanceStatus ||
        "-"
    ).toLowerCase();
  }

  function getStudentName(row) {
    return (
      row.student_name ||
      row.studentName ||
      row.name ||
      "-"
    );
  }

  function getCourseCode(row) {
    return row.course_code || row.courseCode || "-";
  }

  function getSectionName(row) {
    return row.section_name || row.sectionName || "-";
  }

  function getDate(row) {
    return formatDate(
      row.session_date ||
        row.attendance_date ||
        row.date ||
        row.scanned_at
    );
  }

  function handleMobileNavigation(path) {
    navigate(path);
    setMobileMenuOpen(false);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
    setMobileMenuOpen(false);
  }

  const lecturerName =
    user?.name ||
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    user?.email ||
    "Lecturer";

  const lecturerInitials =
    `${String(user?.first_name || user?.name?.split(" ")?.[0] || "").charAt(0)}${String(user?.last_name || user?.name?.split(" ")?.slice(1)?.join(" ") || "").charAt(0)}`.toUpperCase() ||
    "LE";

  return (
    <div className={`lecturer-reports-page${mobileMenuOpen ? " mobile-menu-open" : ""}`}>
      <header className="reports-mobile-header">
        <button
          type="button"
          className="reports-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <button
          type="button"
          className="reports-mobile-brand"
          onClick={() => handleMobileNavigation("/lecturer/dashboard")}
        >
          Attendify
        </button>

        <div className="reports-mobile-avatar">{lecturerInitials}</div>
      </header>

      <div className="reports-mobile-overlay" onClick={closeMobileMenu} aria-hidden="true" />

      <aside className={`lecturer-reports-sidebar${mobileMenuOpen ? " mobile-open" : ""}`}>
        <div className="reports-sidebar-brand">
          <button type="button" className="reports-brand-button" onClick={() => handleMobileNavigation("/lecturer/dashboard")}>
            <span className="reports-brand-mark">A</span>
            <span><strong>Attendify</strong><small>LECTURER PORTAL</small></span>
          </button>
          <button type="button" className="reports-mobile-close" onClick={closeMobileMenu} aria-label="Close navigation">×</button>
        </div>

        <div className="reports-sidebar-profile">
          <div className="reports-profile-avatar">{lecturerInitials}</div>
          <div><strong>{lecturerName}</strong><span>Lecturer account</span></div>
        </div>

        <nav className="reports-sidebar-nav" aria-label="Lecturer navigation">
          <button type="button" onClick={() => handleMobileNavigation("/lecturer/dashboard")}><span>DB</span>Dashboard</button>
          <button type="button" onClick={() => handleMobileNavigation("/lecturer/sessions")}><span>AS</span>Attendance Sessions</button>
          <button type="button" onClick={() => handleMobileNavigation("/lecturer/sections")}><span>MS</span>My Sections</button>
          <button type="button" onClick={() => handleMobileNavigation("/lecturer/attendance")}><span>AT</span>Attendance</button>
          <button type="button" className="active" onClick={() => handleMobileNavigation("/lecturer/reports")}><span>RP</span>Reports</button>
        </nav>

        <div className="reports-sidebar-footer">
          <button type="button" onClick={handleLogout}><span>LO</span>Logout</button>
        </div>
      </aside>

      <div className="lecturer-reports-main">
        <header className="lecturer-reports-header">
          <div>
            <div className="lecturer-reports-eyebrow">
              ATTENDANCE ANALYTICS
            </div>
            <h1>Lecturer Reports</h1>
            <p>
              Attendance summaries and statistics for your assigned
              sections.
            </p>
          </div>

          <div className="lecturer-reports-header-actions">
            <button
              type="button"
              className="reports-secondary-button"
              onClick={() => handleMobileNavigation("/lecturer/attendance")}
            >
              Attendance
            </button>

            <button
              type="button"
              className="reports-primary-button"
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? "Loading..." : "Refresh Report"}
            </button>
          </div>
        </header>

        <main className="lecturer-reports-content">
          {error && (
            <div className="reports-error" role="alert">
              <strong>Unable to load report.</strong>
              <span>{error}</span>
            </div>
          )}

          <section className="reports-stats-grid">
            <StatCard
              label="Total Records"
              value={statistics.total}
              type="blue"
              icon="#"
            />
            <StatCard
              label="Present"
              value={statistics.present}
              type="green"
              icon="+"
            />
            <StatCard
              label="Late"
              value={statistics.late}
              type="orange"
              icon="T"
            />
            <StatCard
              label="Absent"
              value={statistics.absent}
              type="red"
              icon="-"
            />
            <StatCard
              label="Attendance Rate"
              value={`${statistics.attendanceRate}%`}
              type="purple"
              icon="%"
            />
          </section>

          <section className="reports-filter-card">
            <div className="reports-filter-heading">
              <div>
                <span className="reports-section-kicker">
                  REPORT BUILDER
                </span>
                <h2>Report Overview</h2>
                <p>Filter attendance data by section and date range.</p>
              </div>

              <button
                type="button"
                className="reports-clear-button"
                onClick={clearFilters}
                disabled={generating}
              >
                Clear Filters
              </button>
            </div>

            <div className="reports-filter-grid">
              <div className="reports-field">
                <label htmlFor="report-section">Section</label>
                <select
                  id="report-section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  <option value="">All Sections</option>
                  {sections.map((section) => {
                    const id = section.section_id || section.id;

                    return (
                      <option key={id} value={id}>
                        {section.course_code
                          ? `${section.course_code} - `
                          : ""}
                        {section.section_name ||
                          section.name ||
                          "Section"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="reports-field">
                <label htmlFor="report-from">From Date</label>
                <input
                  id="report-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="reports-field">
                <label htmlFor="report-to">To Date</label>
                <input
                  id="report-to"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="reports-generate-button"
                onClick={generateReport}
                disabled={generating}
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </section>

          <section className="reports-table-card">
            {loading ? (
              <div className="reports-empty-state">
                <div className="reports-spinner" />
                <h3>Loading Report</h3>
                <p>Please wait while attendance data is loaded.</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="reports-empty-state">
                <div className="reports-empty-icon">R</div>
                <h3>No Report Data</h3>
                <p>
                  Select a section and date range, then generate the
                  report.
                </p>
              </div>
            ) : (
              <>
                <div className="reports-table-heading">
                  <div>
                    <span className="reports-section-kicker">
                      GENERATED REPORT
                    </span>
                    <h2>Attendance Report</h2>
                    <p>
                      {rows.length} attendance record
                      {rows.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="reports-desktop-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => {
                        const status = getStatus(row);

                        return (
                          <tr
                            key={
                              row.id ||
                              row.attendance_id ||
                              `${getStudentName(row)}-${index}`
                            }
                          >
                            <td>
                              <strong>{getStudentName(row)}</strong>
                            </td>
                            <td>{getCourseCode(row)}</td>
                            <td>{getSectionName(row)}</td>
                            <td>{getDate(row)}</td>
                            <td>
                              <StatusBadge status={status} />
                            </td>
                            <td>{row.source || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="reports-mobile-list">
                  {rows.map((row, index) => {
                    const status = getStatus(row);

                    return (
                      <article
                        className="report-mobile-card"
                        key={
                          row.id ||
                          row.attendance_id ||
                          `${getStudentName(row)}-${index}`
                        }
                      >
                        <div className="report-mobile-card-top">
                          <div>
                            <span className="report-mobile-label">
                              Student
                            </span>
                            <strong>{getStudentName(row)}</strong>
                          </div>
                          <StatusBadge status={status} />
                        </div>

                        <div className="report-mobile-grid">
                          <InfoItem
                            label="Course"
                            value={getCourseCode(row)}
                          />
                          <InfoItem
                            label="Section"
                            value={getSectionName(row)}
                          />
                          <InfoItem
                            label="Date"
                            value={getDate(row)}
                          />
                          <InfoItem
                            label="Source"
                            value={row.source || "-"}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const label =
    status && status !== "-" ? status : "Unknown";

  return (
    <span className={`report-status report-status-${label}`}>
      {label}
    </span>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="report-info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatCard({ label, value, type, icon }) {
  return (
    <div className={`report-stat-card report-stat-${type}`}>
      <div className="report-stat-icon">{icon}</div>
      <div className="report-stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
