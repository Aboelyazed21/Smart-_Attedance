import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLecturerSections } from "../../services/api";

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

function normalizeSections(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.sections)) {
    return data.sections;
  }

  if (Array.isArray(data?.rows)) {
    return data.rows;
  }

  return [];
}

function getSectionId(section) {
  return (
    section?.section_id ??
    section?.sectionId ??
    section?.id
  );
}

function getStudentCount(section) {
  return (
    section?.enrolled_students ??
    section?.enrolledStudents ??
    section?.student_count ??
    section?.studentCount ??
    0
  );
}

export default function LecturerSections() {
  const navigate = useNavigate();

  const savedUser = useMemo(() => getSavedUser(), []);

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const firstName =
    savedUser?.first_name ||
    savedUser?.firstName ||
    "Lecturer";

  const lastName =
    savedUser?.last_name ||
    savedUser?.lastName ||
    "";

  const initials = getInitials(firstName, lastName);

  async function loadSections(showRefreshState = false) {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await getLecturerSections();

      setSections(normalizeSections(data));
    } catch (err) {
      console.error("Lecturer sections error:", err);

      setError(
        err?.message ||
          "Failed to load your assigned sections."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sections;
    }

    return sections.filter((section) => {
      const searchableText = [
        section?.course_code,
        section?.courseCode,
        section?.course_name,
        section?.courseName,
        section?.section_name,
        section?.sectionName,
        section?.academic_year,
        section?.academicYear,
        section?.semester,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [sections, search]);

  const totalStudents = useMemo(() => {
    return sections.reduce(
      (total, section) =>
        total + Number(getStudentCount(section) || 0),
      0
    );
  }, [sections]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  function handleManageSessions() {
    navigate("/lecturer/sessions");
  }

  return (
    <div className="lecturer-sections-page">
      <aside className="lecturer-sections-sidebar">
        <div className="lecturer-sections-brand">
          <div className="brand-mark">A</div>

          <div>
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="lecturer-sections-profile">
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

        <nav className="lecturer-sections-nav">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <span>DB</span>
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => navigate("/lecturer/sessions")}
          >
            <span>AS</span>
            Attendance Sessions
          </button>

          <button
            type="button"
            className="active"
            onClick={() => navigate("/lecturer/sections")}
          >
            <span>SC</span>
            My Sections
          </button>

          <button
            type="button"
            onClick={() => navigate("/lecturer/attendance")}
          >
            <span>AT</span>
            Attendance
          </button>

          <button
            type="button"
            onClick={() => navigate("/lecturer/reports")}
          >
            <span>RP</span>
            Reports
          </button>
        </nav>

        <div className="lecturer-sections-sidebar-footer">
          <div className="sidebar-info">
            <span className="live-badge">LIVE</span>

            <strong>Teaching workspace</strong>

            <p>
              View your assigned sections and manage
              attendance sessions.
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

      <main className="lecturer-sections-main">
        <header className="lecturer-sections-topbar">
          <div>
            <span className="topbar-label">
              LECTURER PORTAL
            </span>

            <h1>My Sections</h1>

            <p>
              Sections currently assigned to your lecturer
              account.
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

        <section className="lecturer-sections-content">
          <div className="sections-hero">
            <div>
              <span className="hero-label">
                TEACHING SECTIONS
              </span>

              <h2>
                Your assigned sections
              </h2>

              <p>
                These sections are returned by the
                authenticated lecturer endpoint.
              </p>
            </div>

            <button
              type="button"
              className="manage-sessions-button"
              onClick={handleManageSessions}
            >
              Manage Sessions
            </button>
          </div>

          {error && (
            <div className="sections-alert">
              <div className="alert-icon">
                !
              </div>

              <div className="alert-content">
                <strong>
                  Unable to load sections
                </strong>

                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={() => loadSections(true)}
                disabled={refreshing}
              >
                {refreshing ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}

          <div className="sections-stats">
            <div className="section-stat-card">
              <div className="stat-icon">
                SC
              </div>

              <div>
                <span>Assigned sections</span>
                <strong>{sections.length}</strong>
                <small>
                  Sections assigned to your account
                </small>
              </div>
            </div>

            <div className="section-stat-card">
              <div className="stat-icon">
                ST
              </div>

              <div>
                <span>Enrolled students</span>
                <strong>{totalStudents}</strong>
                <small>
                  Students across your sections
                </small>
              </div>
            </div>

            <div className="section-stat-card">
              <div className="stat-icon">
                AT
              </div>

              <div>
                <span>Attendance</span>
                <strong>Live</strong>
                <small>
                  Connected to attendance management
                </small>
              </div>
            </div>
          </div>

          <section className="sections-panel">
            <div className="sections-panel-header">
              <div>
                <span className="panel-label">
                  SECTION MANAGEMENT
                </span>

                <h3>
                  Your sections
                </h3>

                <p>
                  Select a section to continue managing
                  attendance sessions.
                </p>
              </div>

              <button
                type="button"
                className="refresh-button"
                onClick={() => loadSections(true)}
                disabled={refreshing}
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>

            <div className="sections-toolbar">
              <div className="sections-search">
                <span>Q</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search course or section..."
                />
              </div>

              <div className="sections-count">
                <strong>
                  {filteredSections.length}
                </strong>

                <span>shown</span>
              </div>
            </div>

            {loading ? (
              <div className="sections-loading">
                <div className="loading-spinner" />

                <strong>
                  Loading your sections
                </strong>

                <span>
                  Fetching sections assigned to your
                  lecturer account...
                </span>
              </div>
            ) : filteredSections.length === 0 ? (
              <div className="sections-empty">
                <div className="empty-icon">
                  SC
                </div>

                <h3>
                  {sections.length === 0
                    ? "No assigned sections"
                    : "No matching sections"}
                </h3>

                <p>
                  {sections.length === 0
                    ? "There are currently no sections assigned to your lecturer account."
                    : "Try another course code or section name."}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div className="sections-grid">
                {filteredSections.map((section) => {
                  const sectionId =
                    getSectionId(section);

                  const studentCount =
                    getStudentCount(section);

                  const courseCode =
                    section?.course_code ||
                    section?.courseCode ||
                    "COURSE";

                  const courseName =
                    section?.course_name ||
                    section?.courseName ||
                    "Course";

                  const sectionName =
                    section?.section_name ||
                    section?.sectionName ||
                    "-";

                  const academicYear =
                    section?.academic_year ||
                    section?.academicYear ||
                    "-";

                  const semester =
                    section?.semester ||
                    "-";

                  return (
                    <article
                      className="section-card"
                      key={sectionId}
                    >
                      <div className="section-card-top">
                        <span className="course-code-badge">
                          {courseCode}
                        </span>

                        <span className="assigned-badge">
                          Assigned
                        </span>
                      </div>

                      <div className="section-card-content">
                        <h3>
                          {courseName}
                        </h3>

                        <div className="section-name">
                          Section {sectionName}
                        </div>

                        <div className="section-meta">
                          <div>
                            <span>
                              Academic year
                            </span>

                            <strong>
                              {academicYear}
                            </strong>
                          </div>

                          <div>
                            <span>
                              Semester
                            </span>

                            <strong>
                              {semester}
                            </strong>
                          </div>
                        </div>

                        <div className="student-count">
                          <div className="student-count-icon">
                            ST
                          </div>

                          <div>
                            <span>
                              Enrolled students
                            </span>

                            <strong>
                              {studentCount}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="section-card-footer">
                        <button
                          type="button"
                          onClick={
                            handleManageSessions
                          }
                        >
                          Manage Sessions
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}