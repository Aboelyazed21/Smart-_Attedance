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

      const data =
        await getLecturerSections();

      setRows(
        Array.isArray(data?.sections)
          ? data.sections
          : Array.isArray(data)
            ? data
            : []
      );
    } catch (e) {
      setError(
        e.message ||
          "Failed to load sections."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <h1 style={{ margin: 0 }}>
            My Sections
          </h1>

          <p style={muted}>
            Sections assigned to you
          </p>
        </div>

        <div>
          <button
            style={btn}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          {" "}

          <button
            style={btn}
            onClick={load}
          >
            Refresh
          </button>
        </div>
      </header>

      <main style={main}>
        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={card}>
            Loading...
          </div>
        ) : rows.length === 0 ? (
          <div style={card}>
            No assigned sections
            found.
          </div>
        ) : (
          <div style={grid}>
            {rows.map((section) => (
              <div
                style={card}
                key={
                  section.section_id ||
                  section.id
                }
              >
                <b style={code}>
                  {section.course_code ||
                    "COURSE"}
                </b>

                <h2>
                  {section.course_name ||
                    "Course"}
                </h2>

                <p style={muted}>
                  Section{" "}
                  {section.section_name ||
                    "-"}{" "}
                  ·{" "}
                  {section.academic_year ||
                    "-"}
                </p>

                <p style={muted}>
                  Semester:{" "}
                  {section.semester ||
                    "-"}
                </p>

                <b>
                  {section.enrolled_students ||
                    0}{" "}
                  enrolled students
                </b>

                <button
                  style={primary}
                  onClick={() =>
                    navigate(
                      "/lecturer/sessions"
                    )
                  }
                >
                  Manage Sessions
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#f6f8fc",
};

const header = {
  background: "#fff",
  borderBottom:
    "1px solid #e5e7eb",
  padding: "24px 32px",
  display: "flex",
  justifyContent:
    "space-between",
  gap: 20,
};

const main = {
  padding: 32,
};

const grid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 18,
};

const card = {
  background: "#fff",
  border:
    "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 20,
};

const code = {
  display: "inline-block",
  background: "#eff6ff",
  color: "#2563eb",
  padding: "6px 9px",
  borderRadius: 8,
};

const muted = {
  color: "#64748b",
  fontSize: 13,
};

const btn = {
  border:
    "1px solid #dbe2ea",
  background: "#fff",
  borderRadius: 9,
  padding: "9px 13px",
  cursor: "pointer",
};

const primary = {
  width: "100%",
  marginTop: 16,
  border: 0,
  background: "#2563eb",
  color: "#fff",
  borderRadius: 9,
  padding: 10,
  cursor: "pointer",
};

const errorBox = {
  background: "#fff1f2",
  border:
    "1px solid #fecdd3",
  color: "#be123c",
  padding: 13,
  borderRadius: 10,
  marginBottom: 18,
};