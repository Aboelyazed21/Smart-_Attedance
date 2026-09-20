import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLecturerAttendanceReport } from "../../services/api";

export default function LecturerAttendance() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await getLecturerAttendanceReport({
        lecturerId: user?.id,
      });

      setData(result || {});
    } catch (e) {
      console.error("Lecturer attendance error:", e);
      setError(e.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = Array.isArray(data?.rows)
    ? data.rows
    : Array.isArray(data?.attendance)
      ? data.attendance
      : Array.isArray(data)
        ? data
        : [];

  const summary = data?.summary || {};

  const filteredRows = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return rows.filter((row) => {
      const student = String(
        row.student_name ||
          row.studentName ||
          row.student_code ||
          row.studentCode ||
          ""
      ).toLowerCase();

      const course = String(
        row.course_code ||
          row.course_name ||
          ""
      ).toLowerCase();

      const section = String(
        row.section_name ||
          row.section ||
          ""
      ).toLowerCase();

      const status = String(
        row.attendance_status ||
          row.status ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        student.includes(searchValue) ||
        course.includes(searchValue) ||
        section.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [rows, search, statusFilter]);

  const presentCount =
    summary.present ??
    rows.filter((row) =>
      ["present", "late"].includes(
        String(
          row.attendance_status || row.status || ""
        ).toLowerCase()
      )
    ).length;

  const lateCount =
    summary.late ??
    rows.filter(
      (row) =>
        String(
          row.attendance_status || row.status || ""
        ).toLowerCase() === "late"
    ).length;

  const absentCount =
    summary.absent ??
    rows.filter(
      (row) =>
        String(
          row.attendance_status || row.status || ""
        ).toLowerCase() === "absent"
    ).length;

  const attendanceRate =
    summary.attendancePercentage ??
    (rows.length
      ? Math.round(
          ((presentCount / rows.length) * 100) * 100
        ) / 100
      : 0);

  return (
    <div style={page}>
      {/* HEADER */}
      <header style={header}>
        <div>
          <h1 style={title}>Attendance</h1>

          <p style={subtitle}>
            Attendance records for your teaching sections
          </p>
        </div>

        <div style={headerActions}>
          <button
            style={secondaryButton}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            style={secondaryButton}
            onClick={() => navigate("/lecturer/sessions")}
          >
            Sessions
          </button>

          <button
            style={primaryButton}
            onClick={load}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <main style={main}>
        {/* ERROR */}
        {error && (
          <div style={errorBox}>
            <strong>Unable to load attendance</strong>
            <span>{error}</span>
          </div>
        )}

        {/* STATISTICS */}
        <section style={statsGrid}>
          <StatCard
            title="Total Records"
            value={summary.totalRecords ?? rows.length}
            description="Attendance records"
          />

          <StatCard
            title="Present"
            value={presentCount}
            description="Students present"
          />

          <StatCard
            title="Late"
            value={lateCount}
            description="Late attendance"
          />

          <StatCard
            title="Absent"
            value={absentCount}
            description="Absent students"
          />

          <StatCard
            title="Attendance Rate"
            value={`${attendanceRate}%`}
            description="Overall attendance"
          />
        </section>

        {/* MAIN CARD */}
        <section style={mainCard}>
          {/* CARD HEADER */}
          <div style={cardHeader}>
            <div>
              <h2 style={sectionTitle}>Attendance Records</h2>

              <p style={sectionSubtitle}>
                View attendance activity for your assigned sections.
              </p>
            </div>

            <div style={recordCount}>
              {filteredRows.length} record
              {filteredRows.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* FILTERS */}
          <div style={filters}>
            <div style={searchWrapper}>
              <span style={searchIcon}>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student, course or section..."
                style={searchInput}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={select}
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="excused">Excused</option>
            </select>
          </div>

          {/* CONTENT */}
          {loading ? (
            <LoadingState />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              hasFilters={
                search.trim() !== "" ||
                statusFilter !== "all"
              }
            />
          ) : (
            <div style={tableWrapper}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>Student</th>
                    <th style={th}>Course</th>
                    <th style={th}>Section</th>
                    <th style={th}>Date</th>
                    <th style={th}>Status</th>
                    <th style={th}>Source</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row, index) => {
                    const status = String(
                      row.attendance_status ||
                        row.status ||
                        ""
                    ).toLowerCase();

                    return (
                      <tr
                        key={
                          row.attendance_id ||
                          row.attendanceId ||
                          row.id ||
                          index
                        }
                        style={tableRow}
                      >
                        {/* STUDENT */}
                        <td style={td}>
                          <div style={studentCell}>
                            <div style={avatar}>
                              {getInitials(
                                row.student_name ||
                                  row.studentName ||
                                  row.student_code ||
                                  "S"
                              )}
                            </div>

                            <div>
                              <div style={studentName}>
                                {row.student_name ||
                                  row.studentName ||
                                  "-"}
                              </div>

                              <div style={studentCode}>
                                {row.student_code ||
                                  row.studentCode ||
                                  "Student"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* COURSE */}
                        <td style={td}>
                          <div style={courseCell}>
                            <strong>
                              {row.course_code || "-"}
                            </strong>

                            <span>
                              {row.course_name || ""}
                            </span>
                          </div>
                        </td>

                        {/* SECTION */}
                        <td style={td}>
                          <span style={sectionBadge}>
                            {row.section_name ||
                              row.section ||
                              "-"}
                          </span>
                        </td>

                        {/* DATE */}
                        <td style={td}>
                          <div style={dateCell}>
                            {formatDate(
                              row.session_date ||
                                row.sessionDate ||
                                row.scanned_at ||
                                row.scannedAt
                            )}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td style={td}>
                          <StatusBadge status={status} />
                        </td>

                        {/* SOURCE */}
                        <td style={td}>
                          <span style={sourceText}>
                            {formatSource(
                              row.source
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
}) {
  return (
    <div style={statCard}>
      <div style={statTop}>
        <span style={statTitle}>{title}</span>

        <span style={statDot} />
      </div>

      <strong style={statValue}>{value}</strong>

      <span style={statDescription}>
        {description}
      </span>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const config = {
    present: {
      label: "Present",
      background: "#ecfdf3",
      color: "#15803d",
      border: "#bbf7d0",
    },

    late: {
      label: "Late",
      background: "#fff7ed",
      color: "#c2410c",
      border: "#fed7aa",
    },

    absent: {
      label: "Absent",
      background: "#fef2f2",
      color: "#b91c1c",
      border: "#fecaca",
    },

    excused: {
      label: "Excused",
      background: "#eff6ff",
      color: "#1d4ed8",
      border: "#bfdbfe",
    },
  };

  const current =
    config[status] || {
      label: status
        ? capitalize(status)
        : "Unknown",
      background: "#f8fafc",
      color: "#475569",
      border: "#e2e8f0",
    };

  return (
    <span
      style={{
        ...statusBadge,
        background: current.background,
        color: current.color,
        borderColor: current.border,
      }}
    >
      <span
        style={{
          ...statusDot,
          background: current.color,
        }}
      />

      {current.label}
    </span>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingState() {
  return (
    <div style={loadingState}>
      <div style={spinner} />

      <p style={{ margin: 0 }}>
        Loading attendance records...
      </p>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ hasFilters }) {
  return (
    <div style={emptyState}>
      <div style={emptyIcon}>—</div>

      <h3 style={emptyTitle}>
        {hasFilters
          ? "No matching records"
          : "No attendance records"}
      </h3>

      <p style={emptyText}>
        {hasFilters
          ? "Try changing your search or status filter."
          : "Attendance records will appear here after students check in."}
      </p>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getInitials(name) {
  if (!name) return "S";

  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function capitalize(value) {
  if (!value) return "";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSource(source) {
  if (!source) return "-";

  const value = String(source);

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

/* =========================================================
   PAGE
========================================================= */

const page = {
  minHeight: "100vh",
  background: "#f6f8fc",
  color: "#17233c",
};

/* =========================================================
   HEADER
========================================================= */

const header = {
  background: "#ffffff",
  borderBottom: "1px solid #e7ebf2",
  padding: "30px 36px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 24,
  flexWrap: "wrap",
};

const title = {
  margin: 0,
  fontSize: 32,
  fontWeight: 750,
  letterSpacing: "-0.7px",
  color: "#13213a",
};

const subtitle = {
  margin: "7px 0 0",
  color: "#718096",
  fontSize: 14,
};

const headerActions = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap",
};

const secondaryButton = {
  border: "1px solid #dce3ec",
  background: "#ffffff",
  color: "#17233c",
  borderRadius: 9,
  padding: "10px 15px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const primaryButton = {
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#ffffff",
  borderRadius: 9,
  padding: "10px 17px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};

/* =========================================================
   MAIN
========================================================= */

const main = {
  padding: "32px 36px 50px",
  maxWidth: 1500,
  margin: "0 auto",
  boxSizing: "border-box",
};

/* =========================================================
   ERROR
========================================================= */

const errorBox = {
  background: "#fff7f7",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: 12,
  padding: "13px 16px",
  marginBottom: 20,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
};

/* =========================================================
   STATISTICS
========================================================= */

const statsGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 16,
  marginBottom: 22,
};

const statCard = {
  background: "#ffffff",
  border: "1px solid #e5eaf1",
  borderRadius: 14,
  padding: "19px 20px",
  minHeight: 116,
  boxSizing: "border-box",
  boxShadow:
    "0 2px 7px rgba(15, 23, 42, 0.025)",
};

const statTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const statTitle = {
  color: "#6b7a90",
  fontSize: 13,
  fontWeight: 500,
};

const statDot = {
  width: 7,
  height: 7,
  borderRadius: "50%",
  background: "#3b82f6",
};

const statValue = {
  display: "block",
  marginTop: 11,
  color: "#15223b",
  fontSize: 27,
  lineHeight: 1,
  fontWeight: 750,
};

const statDescription = {
  display: "block",
  marginTop: 9,
  color: "#94a3b8",
  fontSize: 11.5,
};

/* =========================================================
   MAIN CARD
========================================================= */

const mainCard = {
  background: "#ffffff",
  border: "1px solid #e5eaf1",
  borderRadius: 15,
  overflow: "hidden",
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.025)",
};

const cardHeader = {
  padding: "22px 23px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 15,
  borderBottom: "1px solid #edf0f4",
  flexWrap: "wrap",
};

const sectionTitle = {
  margin: 0,
  color: "#17233c",
  fontSize: 20,
  fontWeight: 700,
};

const sectionSubtitle = {
  margin: "5px 0 0",
  color: "#8190a5",
  fontSize: 13,
};

const recordCount = {
  background: "#f1f5f9",
  color: "#475569",
  borderRadius: 20,
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 600,
};

/* =========================================================
   FILTERS
========================================================= */

const filters = {
  padding: "16px 23px",
  display: "flex",
  gap: 12,
  borderBottom: "1px solid #edf0f4",
  flexWrap: "wrap",
};

const searchWrapper = {
  position: "relative",
  flex: "1 1 300px",
  minWidth: 240,
};

const searchIcon = {
  position: "absolute",
  left: 13,
  top: "50%",
  transform: "translateY(-52%)",
  color: "#8b98aa",
  fontSize: 20,
  pointerEvents: "none",
};

const searchInput = {
  width: "100%",
  height: 42,
  boxSizing: "border-box",
  border: "1px solid #dfe5ed",
  borderRadius: 9,
  padding: "0 14px 0 38px",
  outline: "none",
  fontSize: 13,
  color: "#17233c",
  background: "#ffffff",
};

const select = {
  height: 42,
  minWidth: 150,
  border: "1px solid #dfe5ed",
  borderRadius: 9,
  padding: "0 12px",
  outline: "none",
  color: "#334155",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
};

/* =========================================================
   TABLE
========================================================= */

const tableWrapper = {
  width: "100%",
  overflowX: "auto",
};

const table = {
  width: "100%",
  minWidth: 850,
  borderCollapse: "collapse",
  fontSize: 13,
};

const th = {
  textAlign: "left",
  padding: "14px 20px",
  background: "#fafbfc",
  borderBottom: "1px solid #e8edf3",
  color: "#68778d",
  fontSize: 11.5,
  fontWeight: 650,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  whiteSpace: "nowrap",
};

const tableRow = {
  borderBottom: "1px solid #eef1f5",
};

const td = {
  padding: "15px 20px",
  color: "#334155",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

const studentCell = {
  display: "flex",
  alignItems: "center",
  gap: 11,
};

const avatar = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "#eef4ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
};

const studentName = {
  color: "#1e293b",
  fontWeight: 600,
  fontSize: 13,
};

const studentCode = {
  marginTop: 3,
  color: "#94a3b8",
  fontSize: 11,
};

const courseCell = {
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

const sectionBadge = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 30,
  padding: "5px 9px",
  borderRadius: 7,
  background: "#f1f5f9",
  color: "#475569",
  fontSize: 12,
  fontWeight: 600,
};

const dateCell = {
  color: "#64748b",
  fontSize: 12.5,
};

const sourceText = {
  color: "#64748b",
  fontSize: 12,
};

const statusBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "1px solid",
  borderRadius: 20,
  padding: "5px 9px",
  fontSize: 11.5,
  fontWeight: 650,
};

const statusDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
};

/* =========================================================
   EMPTY / LOADING
========================================================= */

const loadingState = {
  minHeight: 230,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 12,
  color: "#718096",
  fontSize: 13,
};

const spinner = {
  width: 26,
  height: 26,
  border: "3px solid #e5e7eb",
  borderTop: "3px solid #2563eb",
  borderRadius: "50%",
};

const emptyState = {
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  padding: 30,
  textAlign: "center",
};

const emptyIcon = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "#f1f5f9",
  color: "#94a3b8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 22,
  marginBottom: 12,
};

const emptyTitle = {
  margin: 0,
  color: "#334155",
  fontSize: 16,
};

const emptyText = {
  margin: "7px 0 0",
  color: "#94a3b8",
  fontSize: 13,
};