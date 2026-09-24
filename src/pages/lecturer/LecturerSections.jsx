import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../utils/i18n";
import { getLecturerSections } from "../../services/api";
import "./LecturerSections.css";

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
  const { t } = useLanguage();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
          t("lecSections.loadError")
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

  function handleManageSessions() {
    navigate("/lecturer/sessions");
  }

  const totalStudents = useMemo(() => {
    return sections.reduce(
      (total, section) =>
        total + Number(getStudentCount(section) || 0),
      0
    );
  }, [sections]);

  return (
    <div className="lecturer-sections-page">
      <main className="lecturer-sections-main">
          <header className="lecturer-sections-topbar">
            <div>
              <span className="topbar-label">
                {t("lecSections.eyebrow")}
              </span>

              <h1>{t("nav.mySections")}</h1>

              <p>
                {t("lecSections.subtitle")}
              </p>
            </div>

            <div className="topbar-user">
              <span className="topbar-user-context">
                {t("workspace.title")}
              </span>
            </div>
          </header>

          <section className="lecturer-sections-content">
            <div className="sections-hero">
              <div>
                <span className="hero-label">
                  {t("lecSections.heroEyebrow")}
                </span>

                <h2>{t("lecSections.heroTitle")}</h2>

                <p>
                  {t("lecSections.heroDesc")}
                </p>
              </div>

              <button
                type="button"
                className="manage-sessions-button"
                onClick={handleManageSessions}
              >
                {t("lecSections.manageSessions")}
              </button>
            </div>

            {error && (
              <div className="sections-alert">
                <div className="alert-icon">!</div>

                <div className="alert-content">
                  <strong>
                    {t("lecSections.errorTitle")}
                  </strong>

                  <p>{error}</p>
                </div>

                <button
                  type="button"
                  onClick={() => loadSections(true)}
                  disabled={refreshing}
                >
                  {refreshing ? t("lecSections.retrying") : t("lecSections.retry")}
                </button>
              </div>
            )}

            <div className="sections-stats">
              <div className="section-stat-card">
                <div className="stat-icon">SC</div>

                <div>
                  <span>{t("lecSections.statAssigned")}</span>
                  <strong>{sections.length}</strong>
                  <small>
                    {t("lecSections.statAssignedDesc")}
                  </small>
                </div>
              </div>

              <div className="section-stat-card">
                <div className="stat-icon">ST</div>

                <div>
                  <span>{t("lecSections.statEnrolled")}</span>
                  <strong>{totalStudents}</strong>
                  <small>
                    {t("lecSections.statEnrolledDesc")}
                  </small>
                </div>
              </div>

              <div className="section-stat-card">
                <div className="stat-icon">AT</div>

                <div>
                  <span>{t("nav.attendance")}</span>
                  <strong>{t("lecSections.activeValue")}</strong>
                  <small>
                    {t("lecSections.statAttendanceDesc")}
                  </small>
                </div>
              </div>
            </div>

            <section className="sections-panel">
              <div className="sections-panel-header">
                <div>
                  <span className="panel-label">
                    {t("lecSections.panelEyebrow")}
                  </span>

                  <h3>{t("lecSections.panelTitle")}</h3>

                  <p>
                    {t("lecSections.panelDesc")}
                  </p>
                </div>

                <button
                  type="button"
                  className="refresh-button"
                  onClick={() => loadSections(true)}
                  disabled={refreshing}
                >
                  {refreshing
                    ? t("lecSections.refreshing")
                    : t("action.refresh")}
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
                    placeholder={t("lecSections.searchPh")}
                    aria-label={t("lecSections.searchAria")}
                  />
                </div>

                <div className="sections-count">
                  <strong>
                    {filteredSections.length}
                  </strong>

                  <span>{t("lecSections.shown")}</span>
                </div>
              </div>

              {loading ? (
                <div className="sections-loading">
                  <div className="loading-spinner" />

                  <strong>
                    {t("lecSections.loadingTitle")}
                  </strong>

                  <span>
                    {t("lecSections.loadingDesc")}
                  </span>
                </div>
              ) : filteredSections.length === 0 ? (
                <div className="sections-empty">
                  <div className="empty-icon">SC</div>

                  <h3>
                    {sections.length === 0
                      ? t("lecSections.emptyNoAssigned")
                      : t("lecSections.emptyNoMatch")}
                  </h3>

                  <p>
                    {sections.length === 0
                      ? t("lecSections.emptyNoAssignedDesc")
                      : t("lecSections.emptyNoMatchDesc")}
                  </p>

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                    >
                      {t("lecSections.clearSearch")}
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
                      t("lecSections.courseFallback");

                    const courseName =
                      section?.course_name ||
                      section?.courseName ||
                      t("lecSections.courseNameFallback");

                    const sectionName =
                      section?.section_name ||
                      section?.sectionName ||
                      "-";

                    const academicYear =
                      section?.academic_year ||
                      section?.academicYear ||
                      "-";

                    const semester =
                      section?.semester || "-";

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
                            {t("lecSections.assignedBadge")}
                          </span>
                        </div>

                        <div className="section-card-content">
                          <h3>{courseName}</h3>

                          <div className="section-name">
                            {t("lecSections.sectionWord")} {sectionName}
                          </div>

                          <div className="section-meta">
                            <div>
                              <span>
                                {t("lecSections.academicYear")}
                              </span>

                              <strong>
                                {academicYear}
                              </strong>
                            </div>

                            <div>
                              <span>{t("lecSections.semester")}</span>

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
                                {t("lecSections.statEnrolled")}
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
                            onClick={handleManageSessions}
                          >
                            {t("lecSections.manageSessions")}
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
