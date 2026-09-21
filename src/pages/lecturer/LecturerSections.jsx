import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLecturerSections } from "../../services/api";

export default function LecturerSections() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const data = await getLecturerSections();

      const sections = Array.isArray(data?.sections)
        ? data.sections
        : Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setRows(sections);
    } catch (e) {
      console.error("Lecturer sections error:", e);

      setError(
        e.message ||
          "Failed to load your sections."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCourse(section) {
    const courseId =
      section.course_id ??
      section.courseId;

    if (!courseId) {
      setError(
        "This section is missing its course ID."
      );
      return;
    }

    navigate(
      `/admin/courses/${courseId}`
    );
  }

  return (
    <div style={page}>

      {/* HEADER */}
      <header style={header}>

        <div>
          <div style={eyebrow}>
            LECTURER PORTAL
          </div>

          <h1 style={title}>
            My Sections
          </h1>

          <p style={subtitle}>
            Manage your assigned courses,
            sections and enrolled students.
          </p>
        </div>

        <div style={headerActions}>

          <button
            type="button"
            style={secondaryButton}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            type="button"
            style={refreshButton}
            onClick={load}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

      </header>


      {/* CONTENT */}
      <main style={main}>

        {/* ERROR */}
        {error && (
          <div style={errorBox}>
            <div style={errorTitle}>
              Unable to load sections
            </div>

            <div>
              {error}
            </div>

            <button
              type="button"
              style={errorButton}
              onClick={load}
            >
              Try Again
            </button>
          </div>
        )}


        {/* LOADING */}
        {loading ? (

          <div style={loadingContainer}>

            <div style={spinner}></div>

            <h3 style={loadingTitle}>
              Loading your sections
            </h3>

            <p style={loadingText}>
              Please wait while we retrieve
              your assigned sections.
            </p>

          </div>

        ) : rows.length === 0 ? (

          /* EMPTY */
          <div style={emptyContainer}>

            <div style={emptyIcon}>
              —
            </div>

            <h2 style={emptyTitle}>
              No sections assigned
            </h2>

            <p style={emptyText}>
              There are currently no sections
              assigned to your account.
            </p>

            <button
              type="button"
              style={secondaryButton}
              onClick={load}
            >
              Refresh
            </button>

          </div>

        ) : (

          /* SECTIONS */
          <div style={contentWrapper}>

            <div style={summaryBar}>

              <div>
                <span style={summaryLabel}>
                  ASSIGNED SECTIONS
                </span>

                <strong style={summaryValue}>
                  {rows.length}
                </strong>
              </div>

              <div style={summaryRight}>
                Select a section to manage
                its students.
              </div>

            </div>


            <div style={grid}>

              {rows.map((section) => {

                const sectionId =
                  section.section_id ??
                  section.id;

                const courseId =
                  section.course_id ??
                  section.courseId;

                const courseCode =
                  section.course_code ||
                  "COURSE";

                const courseName =
                  section.course_name ||
                  "Course";

                const sectionName =
                  section.section_name ||
                  "—";

                const academicYear =
                  section.academic_year ||
                  "—";

                const semester =
                  section.semester ||
                  "—";

                const enrolledStudents =
                  Number(
                    section.enrolled_students ??
                    section.enrolledStudents ??
                    0
                  );

                const capacity =
                  Number(
                    section.capacity ??
                    0
                  );

                return (

                  <article
                    key={sectionId}
                    style={card}
                  >

                    {/* CARD TOP */}
                    <div style={cardTop}>

                      <span style={courseCodeBadge}>
                        {courseCode}
                      </span>

                      <span style={sectionBadge}>
                        Section {sectionName}
                      </span>

                    </div>


                    {/* COURSE */}
                    <h2 style={courseNameStyle}>
                      {courseName}
                    </h2>


                    {/* INFO */}
                    <div style={infoList}>

                      <div style={infoRow}>

                        <span style={infoLabel}>
                          Academic Year
                        </span>

                        <strong style={infoValue}>
                          {academicYear}
                        </strong>

                      </div>


                      <div style={infoRow}>

                        <span style={infoLabel}>
                          Semester
                        </span>

                        <strong style={infoValue}>
                          {semester}
                        </strong>

                      </div>


                      <div style={infoRow}>

                        <span style={infoLabel}>
                          Students
                        </span>

                        <strong style={infoValue}>
                          {enrolledStudents}
                          {capacity > 0 &&
                            ` / ${capacity}`}
                        </strong>

                      </div>

                    </div>


                    {/* STUDENT PROGRESS */}
                    {capacity > 0 && (

                      <div style={progressWrapper}>

                        <div style={progressHeader}>

                          <span>
                            Enrollment
                          </span>

                          <span>
                            {Math.min(
                              100,
                              Math.round(
                                (enrolledStudents /
                                  capacity) *
                                  100
                              )
                            )}
                            %
                          </span>

                        </div>

                        <div style={progressTrack}>

                          <div
                            style={{
                              ...progressBar,
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (enrolledStudents /
                                    capacity) *
                                    100
                                )
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                    )}


                    {/* ACTIONS */}
                    <div style={cardActions}>

                      <button
                        type="button"
                        style={primaryButton}
                        onClick={() =>
                          openCourse(section)
                        }
                        disabled={!courseId}
                      >
                        Manage Students
                      </button>

                      <button
                        type="button"
                        style={outlineButton}
                        onClick={() =>
                          navigate(
                            "/lecturer/sessions"
                          )
                        }
                      >
                        Sessions
                      </button>

                    </div>

                  </article>

                );
              })}

            </div>

          </div>

        )}

      </main>

    </div>
  );
}


/* =========================================================
   PAGE
========================================================= */

const page = {
  minHeight: "100vh",
  background: "#f6f8fc",
  color: "#172033",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
};


/* =========================================================
   HEADER
========================================================= */

const header = {
  background: "#ffffff",
  borderBottom: "1px solid #e5eaf1",
  padding: "28px 36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
};

const eyebrow = {
  color: "#2563eb",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "1.2px",
  marginBottom: 7,
};

const title = {
  margin: 0,
  fontSize: 30,
  fontWeight: 700,
  letterSpacing: "-0.5px",
  color: "#172033",
};

const subtitle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: 14,
};

const headerActions = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};


/* =========================================================
   MAIN
========================================================= */

const main = {
  padding: "30px 36px 50px",
  maxWidth: 1400,
  margin: "0 auto",
};


/* =========================================================
   SUMMARY
========================================================= */

const contentWrapper = {
  width: "100%",
};

const summaryBar = {
  background: "#ffffff",
  border: "1px solid #e5eaf1",
  borderRadius: 14,
  padding: "18px 22px",
  marginBottom: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  flexWrap: "wrap",
};

const summaryLabel = {
  display: "block",
  color: "#64748b",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "1px",
  marginBottom: 5,
};

const summaryValue = {
  fontSize: 22,
  color: "#172033",
};

const summaryRight = {
  color: "#64748b",
  fontSize: 13,
};


/* =========================================================
   GRID
========================================================= */

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fill, minmax(300px, 1fr))",
  gap: 20,
};


/* =========================================================
   CARD
========================================================= */

const card = {
  background: "#ffffff",
  border: "1px solid #e5eaf1",
  borderRadius: 16,
  padding: 22,
  boxShadow:
    "0 4px 14px rgba(15, 23, 42, 0.04)",
  transition:
    "transform 0.2s ease, box-shadow 0.2s ease",
};

const cardTop = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 18,
  flexWrap: "wrap",
};

const courseCodeBadge = {
  display: "inline-flex",
  alignItems: "center",
  background: "#eff6ff",
  color: "#2563eb",
  border: "1px solid #dbeafe",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 700,
};

const sectionBadge = {
  color: "#64748b",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 600,
};

const courseNameStyle = {
  margin: "0 0 20px",
  fontSize: 20,
  fontWeight: 700,
  color: "#172033",
  lineHeight: 1.35,
};


/* =========================================================
   INFO
========================================================= */

const infoList = {
  borderTop: "1px solid #eef2f7",
};

const infoRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "12px 0",
  borderBottom: "1px solid #eef2f7",
};

const infoLabel = {
  color: "#64748b",
  fontSize: 13,
};

const infoValue = {
  color: "#172033",
  fontSize: 13,
  fontWeight: 600,
};


/* =========================================================
   PROGRESS
========================================================= */

const progressWrapper = {
  marginTop: 18,
};

const progressHeader = {
  display: "flex",
  justifyContent: "space-between",
  color: "#64748b",
  fontSize: 11,
  marginBottom: 7,
};

const progressTrack = {
  width: "100%",
  height: 6,
  background: "#e8edf4",
  borderRadius: 999,
  overflow: "hidden",
};

const progressBar = {
  height: "100%",
  background: "#2563eb",
  borderRadius: 999,
  transition: "width 0.25s ease",
};


/* =========================================================
   BUTTONS
========================================================= */

const primaryButton = {
  flex: 1,
  minHeight: 42,
  border: 0,
  background: "#2563eb",
  color: "#ffffff",
  borderRadius: 9,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const outlineButton = {
  minHeight: 42,
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  color: "#334155",
  borderRadius: 9,
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  color: "#334155",
  borderRadius: 9,
  padding: "10px 15px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const refreshButton = {
  border: 0,
  background: "#2563eb",
  color: "#ffffff",
  borderRadius: 9,
  padding: "10px 15px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const cardActions = {
  display: "flex",
  gap: 9,
  marginTop: 20,
};


/* =========================================================
   LOADING
========================================================= */

const loadingContainer = {
  background: "#ffffff",
  border: "1px solid #e5eaf1",
  borderRadius: 16,
  minHeight: 300,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};

const spinner = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "3px solid #e2e8f0",
  borderTopColor: "#2563eb",
  animation: "spin 0.8s linear infinite",
};

const loadingTitle = {
  margin: "18px 0 5px",
  color: "#172033",
  fontSize: 17,
};

const loadingText = {
  margin: 0,
  color: "#64748b",
  fontSize: 13,
};


/* =========================================================
   EMPTY
========================================================= */

const emptyContainer = {
  background: "#ffffff",
  border: "1px solid #e5eaf1",
  borderRadius: 16,
  minHeight: 320,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: 30,
};

const emptyIcon = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: "#f1f5f9",
  color: "#64748b",
  display: "grid",
  placeItems: "center",
  fontSize: 24,
  fontWeight: 600,
};

const emptyTitle = {
  margin: "18px 0 6px",
  fontSize: 19,
  color: "#172033",
};

const emptyText = {
  margin: "0 0 18px",
  maxWidth: 430,
  color: "#64748b",
  fontSize: 13,
  lineHeight: 1.6,
};


/* =========================================================
   ERROR
========================================================= */

const errorBox = {
  background: "#fff7f7",
  border: "1px solid #fecaca",
  color: "#991b1b",
  borderRadius: 12,
  padding: "14px 16px",
  marginBottom: 20,
  fontSize: 13,
};

const errorTitle = {
  fontWeight: 700,
  marginBottom: 4,
};

const errorButton = {
  marginTop: 10,
  border: "1px solid #fecaca",
  background: "#ffffff",
  color: "#991b1b",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};