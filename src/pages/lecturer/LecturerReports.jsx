import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLecturerAttendanceReport,
  getLecturerSections,
} from "../../services/api";

export default function LecturerReports() {
  const navigate = useNavigate();

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

  // ============================================================
  // LOAD SECTIONS
  // ============================================================

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

  // ============================================================
  // LOAD REPORT
  // ============================================================

  async function loadReport(customFilters = {}) {
    try {
      setGenerating(true);
      setError("");

      const lecturerId = user?.id;

      const params = {
        lecturerId,
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

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadSections();
    loadReport();
  }, []);

  // ============================================================
  // FILTER
  // ============================================================

  async function generateReport() {
    await loadReport({
      sectionId,
      fromDate,
      toDate,
    });
  }

  function clearFilters() {
    setSectionId("");
    setFromDate("");
    setToDate("");

    loadReport({
      sectionId: "",
      fromDate: "",
      toDate: "",
    });
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  // ============================================================
  // STATISTICS
  // ============================================================

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

  // ============================================================
  // NAME
  // ============================================================

  const lecturerName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "Lecturer";

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`
      .toUpperCase() || "L";

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div style={styles.page}>
      {/* ========================================================
          SIDEBAR
      ======================================================== */}

      <aside style={styles.sidebar}>
        <div style={styles.brandArea}>
          <div style={styles.brandLogo}>A</div>

          <div>
            <div style={styles.brandName}>Attendify</div>
            <div style={styles.brandSubtitle}>
              SMART ATTENDANCE
            </div>
          </div>
        </div>

        <div style={styles.profileCard}>
          <div style={styles.profileAvatar}>
            {initials}
          </div>

          <div style={styles.profileInfo}>
            <div style={styles.profileName}>
              {lecturerName}
            </div>

            <div style={styles.profileRole}>
              Lecturer
            </div>
          </div>
        </div>

        <nav style={styles.navigation}>
          <button
            style={styles.navItem}
            onClick={() => navigate("/dashboard")}
          >
            <span>Dashboard</span>
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/lecturer/sessions")}
          >
            <span>Attendance Sessions</span>
          </button>

          <button
            style={styles.navItem}
            onClick={() => navigate("/lecturer/attendance")}
          >
            <span>Attendance</span>
          </button>

          <button
            style={{
              ...styles.navItem,
              ...styles.activeNavItem,
            }}
          >
            <span>Reports</span>
          </button>
        </nav>

        <button
          style={styles.logoutButton}
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main style={styles.main}>
        {/* HEADER */}

        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>
              Lecturer Reports
            </h1>

            <p style={styles.subtitle}>
              Attendance summaries and statistics
            </p>
          </div>

          <div style={styles.headerActions}>
            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/lecturer/attendance")}
            >
              Attendance
            </button>

            <button
              style={styles.primaryButton}
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        <div style={styles.content}>
          {/* ====================================================
              STATISTICS
          ==================================================== */}

          <section style={styles.statsGrid}>
            <StatCard
              label="Total Records"
              value={statistics.total}
              type="blue"
            />

            <StatCard
              label="Present"
              value={statistics.present}
              type="green"
            />

            <StatCard
              label="Late"
              value={statistics.late}
              type="orange"
            />

            <StatCard
              label="Absent"
              value={statistics.absent}
              type="red"
            />

            <StatCard
              label="Attendance Rate"
              value={`${statistics.attendanceRate}%`}
              type="purple"
            />
          </section>

          {/* ====================================================
              ERROR
          ==================================================== */}

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          {/* ====================================================
              REPORT FILTER
          ==================================================== */}

          <section style={styles.filterCard}>
            <div style={styles.filterHeader}>
              <div>
                <h2 style={styles.filterTitle}>
                  Report Overview
                </h2>

                <p style={styles.filterSubtitle}>
                  Filter and view attendance statistics
                </p>
              </div>

              <button
                style={styles.clearButton}
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>

            <div style={styles.filterGrid}>
              {/* SECTION */}

              <div style={styles.field}>
                <label style={styles.label}>
                  Section
                </label>

                <select
                  value={sectionId}
                  onChange={(e) =>
                    setSectionId(e.target.value)
                  }
                  style={styles.input}
                >
                  <option value="">
                    All Sections
                  </option>

                  {sections.map((section) => (
                    <option
                      key={
                        section.section_id ||
                        section.id
                      }
                      value={
                        section.section_id ||
                        section.id
                      }
                    >
                      {section.course_code
                        ? `${section.course_code} - `
                        : ""}
                      {section.section_name ||
                        section.name ||
                        "Section"}
                    </option>
                  ))}
                </select>
              </div>

              {/* FROM */}

              <div style={styles.field}>
                <label style={styles.label}>
                  From Date
                </label>

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              {/* TO */}

              <div style={styles.field}>
                <label style={styles.label}>
                  To Date
                </label>

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(e.target.value)
                  }
                  style={styles.input}
                />
              </div>

              {/* GENERATE */}

              <div style={styles.generateWrapper}>
                <button
                  style={styles.generateButton}
                  onClick={generateReport}
                  disabled={generating}
                >
                  {generating
                    ? "Generating..."
                    : "Generate Report"}
                </button>
              </div>
            </div>
          </section>

          {/* ====================================================
              REPORT TABLE
          ==================================================== */}

          <section style={styles.reportCard}>
            {loading ? (
              <div style={styles.emptyState}>
                <div style={styles.loadingCircle} />

                <h3 style={styles.emptyTitle}>
                  Loading Report
                </h3>

                <p style={styles.emptyText}>
                  Please wait while attendance data is loaded.
                </p>
              </div>
            ) : rows.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>
                  R
                </div>

                <h3 style={styles.emptyTitle}>
                  No Report Data
                </h3>

                <p style={styles.emptyText}>
                  Select a section and date range to
                  generate the report.
                </p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <div style={styles.tableHeader}>
                  <div>
                    <h2 style={styles.tableTitle}>
                      Attendance Report
                    </h2>

                    <p style={styles.tableSubtitle}>
                      {rows.length} attendance record
                      {rows.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        Student
                      </th>

                      <th style={styles.th}>
                        Course
                      </th>

                      <th style={styles.th}>
                        Section
                      </th>

                      <th style={styles.th}>
                        Date
                      </th>

                      <th style={styles.th}>
                        Status
                      </th>

                      <th style={styles.th}>
                        Source
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row, index) => {
                      const status = String(
                        row.status ||
                          row.attendance_status ||
                          row.attendanceStatus ||
                          "-"
                      ).toLowerCase();

                      return (
                        <tr
                          key={
                            row.id ||
                            row.attendance_id ||
                            index
                          }
                        >
                          <td style={styles.td}>
                            {row.student_name ||
                              row.studentName ||
                              row.name ||
                              "-"}
                          </td>

                          <td style={styles.td}>
                            {row.course_code ||
                              row.courseCode ||
                              "-"}
                          </td>

                          <td style={styles.td}>
                            {row.section_name ||
                              row.sectionName ||
                              "-"}
                          </td>

                          <td style={styles.td}>
                            {formatDate(
                              row.session_date ||
                                row.attendance_date ||
                                row.date ||
                                row.scanned_at
                            )}
                          </td>

                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.status,
                                ...(status === "present"
                                  ? styles.presentStatus
                                  : status === "late"
                                    ? styles.lateStatus
                                    : status === "absent"
                                      ? styles.absentStatus
                                      : styles.otherStatus),
                              }}
                            >
                              {status}
                            </span>
                          </td>

                          <td style={styles.td}>
                            {row.source || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  type,
}) {
  const colorMap = {
    blue: {
      bg: "#eef6ff",
      icon: "#2384f2",
      border: "#d6e9ff",
    },

    green: {
      bg: "#edfbf4",
      icon: "#20b66a",
      border: "#d7f4e5",
    },

    orange: {
      bg: "#fff8e9",
      icon: "#f3a515",
      border: "#faebc8",
    },

    red: {
      bg: "#fff0f2",
      icon: "#ef5262",
      border: "#f7d7dc",
    },

    purple: {
      bg: "#f5f0ff",
      icon: "#8666df",
      border: "#e5ddfa",
    },
  };

  const colors = colorMap[type] || colorMap.blue;

  return (
    <div
      style={{
        ...styles.statCard,
        borderColor: colors.border,
      }}
    >
      <div
        style={{
          ...styles.statIcon,
          background: colors.bg,
          color: colors.icon,
        }}
      >
        <span>
          {type === "green"
            ? "+"
            : type === "orange"
              ? "T"
              : type === "red"
                ? "-"
                : type === "purple"
                  ? "%"
                  : "#"}
        </span>
      </div>

      <div>
        <div style={styles.statLabel}>
          {label}
        </div>

        <div style={styles.statValue}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background:
      "linear-gradient(135deg, #f7faff 0%, #eef4fb 100%)",
    color: "#12213f",
    fontFamily:
      "Inter, Segoe UI, Arial, sans-serif",
  },

  sidebar: {
    width: "286px",
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #082e63 0%, #0d438c 100%)",
    padding: "34px 20px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    position: "sticky",
    top: 0,
  },

  brandArea: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "0 5px 28px",
  },

  brandLogo: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, #1677f4, #3569e8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 800,
    boxShadow:
      "0 10px 28px rgba(16, 92, 220, .28)",
  },

  brandName: {
    fontSize: "25px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },

  brandSubtitle: {
    marginTop: "3px",
    fontSize: "10px",
    letterSpacing: "2px",
    opacity: 0.75,
  },

  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "17px 13px",
    marginBottom: "25px",
    borderRadius: "16px",
    background: "rgba(255,255,255,.09)",
    border:
      "1px solid rgba(255,255,255,.08)",
  },

  profileAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#fff",
    color: "#1464cf",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "18px",
    flexShrink: 0,
  },

  profileInfo: {
    minWidth: 0,
  },

  profileName: {
    fontWeight: 700,
    fontSize: "15px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  profileRole: {
    marginTop: "3px",
    fontSize: "13px",
    opacity: 0.72,
  },

  navigation: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  navItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,.82)",
    padding: "14px 16px",
    borderRadius: "13px",
    textAlign: "left",
    fontSize: "15px",
    cursor: "pointer",
    transition: "all .2s ease",
  },

  activeNavItem: {
    background:
      "linear-gradient(90deg, #1d7cf3, #2476df)",
    color: "#fff",
    boxShadow:
      "0 10px 24px rgba(0, 87, 190, .24)",
    fontWeight: 700,
  },

  logoutButton: {
    marginTop: "auto",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,.82)",
    padding: "15px 16px",
    textAlign: "left",
    fontSize: "15px",
    cursor: "pointer",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    minHeight: "105px",
    padding: "26px 34px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    background: "rgba(255,255,255,.76)",
    backdropFilter: "blur(16px)",
    borderBottom:
      "1px solid rgba(36, 90, 150, .08)",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    letterSpacing: "-1px",
    color: "#102b52",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#6f84a2",
    fontSize: "14px",
  },

  headerActions: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
  },

  secondaryButton: {
    border: "1px solid #dbe5f0",
    background: "rgba(255,255,255,.9)",
    color: "#182b46",
    borderRadius: "11px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
  },

  primaryButton: {
    border: "none",
    background:
      "linear-gradient(135deg,#1879ef,#256be0)",
    color: "#fff",
    borderRadius: "11px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(28,112,235,.22)",
  },

  content: {
    padding: "28px 34px 45px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(5, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  statCard: {
    minHeight: "105px",
    background:
      "linear-gradient(145deg, rgba(255,255,255,.94), rgba(248,251,255,.88))",
    border: "1px solid",
    borderRadius: "16px",
    padding: "18px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow:
      "0 12px 28px rgba(48,88,135,.07)",
    position: "relative",
    overflow: "hidden",
  },

  statIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "17px",
    flexShrink: 0,
  },

  statLabel: {
    color: "#7085a4",
    fontSize: "13px",
    marginBottom: "5px",
  },

  statValue: {
    color: "#112d55",
    fontSize: "25px",
    fontWeight: 800,
  },

  filterCard: {
    background:
      "rgba(255,255,255,.78)",
    border: "1px solid rgba(41,105,175,.11)",
    borderRadius: "17px",
    padding: "22px",
    marginBottom: "22px",
    boxShadow:
      "0 15px 35px rgba(47,90,140,.07)",
    backdropFilter: "blur(14px)",
  },

  filterHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "20px",
  },

  filterTitle: {
    margin: 0,
    color: "#142f55",
    fontSize: "21px",
  },

  filterSubtitle: {
    margin: "5px 0 0",
    color: "#7890ae",
    fontSize: "13px",
  },

  clearButton: {
    border: "1px solid #dbe5ef",
    background: "#fff",
    color: "#526983",
    padding: "9px 14px",
    borderRadius: "10px",
    cursor: "pointer",
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "1.4fr 1fr 1fr auto",
    gap: "14px",
    alignItems: "end",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#38516f",
  },

  input: {
    width: "100%",
    height: "46px",
    boxSizing: "border-box",
    borderRadius: "11px",
    border: "1px solid #dce6f1",
    background: "rgba(255,255,255,.88)",
    padding: "0 13px",
    outline: "none",
    color: "#1b3554",
    fontSize: "14px",
  },

  generateWrapper: {
    display: "flex",
  },

  generateButton: {
    height: "46px",
    border: "none",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg,#1679ef,#246fe4)",
    color: "#fff",
    padding: "0 22px",
    whiteSpace: "nowrap",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(29,112,232,.22)",
  },

  errorBox: {
    background: "#fff0f1",
    border: "1px solid #f4cdd1",
    color: "#bd3745",
    borderRadius: "11px",
    padding: "12px 15px",
    marginBottom: "18px",
    fontSize: "14px",
  },

  reportCard: {
    background:
      "rgba(255,255,255,.84)",
    border:
      "1px solid rgba(40,103,171,.1)",
    borderRadius: "17px",
    minHeight: "300px",
    boxShadow:
      "0 15px 35px rgba(47,90,140,.06)",
    overflow: "hidden",
  },

  emptyState: {
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    padding: "40px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "#eef5ff",
    color: "#4f94ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "25px",
    marginBottom: "17px",
  },

  emptyTitle: {
    margin: 0,
    color: "#17365f",
    fontSize: "19px",
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#7890ae",
    fontSize: "14px",
  },

  loadingCircle: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    border:
      "4px solid #dceaff",
    borderTopColor: "#2077ec",
    marginBottom: "18px",
    animation: "spin 1s linear infinite",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  tableHeader: {
    padding: "21px 22px",
    borderBottom:
      "1px solid #edf2f7",
  },

  tableTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#15365e",
  },

  tableSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#7b91ad",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },

  th: {
    textAlign: "left",
    padding: "14px 20px",
    background: "#f8fbff",
    color: "#607894",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".4px",
  },

  td: {
    padding: "15px 20px",
    borderTop:
      "1px solid #edf2f7",
    color: "#304966",
    fontSize: "14px",
  },

  status: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "capitalize",
  },

  presentStatus: {
    background: "#e9f9f0",
    color: "#15985a",
  },

  lateStatus: {
    background: "#fff6df",
    color: "#c58100",
  },

  absentStatus: {
    background: "#ffedef",
    color: "#d13f4d",
  },

  otherStatus: {
    background: "#eef3f8",
    color: "#60748c",
  },
};