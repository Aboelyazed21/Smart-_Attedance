import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../utils/i18n";
import {
  getLecturerAttendanceReport,
  getLecturerSections,
} from "../../services/api";
import "./LecturerReports.css";

export default function LecturerReports() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      setError(error.message || t("lecReports.loadError"));
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

  return (
    <div className="lecturer-reports-page">
      <div className="lecturer-reports-main">
        <header className="lecturer-reports-header">
          <div>
            <div className="lecturer-reports-eyebrow">
              {t("lecReports.eyebrow")}
            </div>
            <h1>{t("lecReports.title")}</h1>
            <p>
              {t("lecReports.subtitle")}
            </p>
          </div>

          <div className="lecturer-reports-header-actions">
            <button
              type="button"
              className="reports-secondary-button"
              onClick={() => navigate("/lecturer/attendance")}
            >
              {t("nav.attendance")}
            </button>

            <button
              type="button"
              className="reports-primary-button"
              onClick={generateReport}
              disabled={generating}
            >
              {generating ? t("lecReports.loadingShort") : t("lecReports.refreshReport")}
            </button>
          </div>
        </header>

        <main className="lecturer-reports-content">
          {error && (
            <div className="reports-error" role="alert">
              <strong>{t("lecReports.errorTitle")}</strong>
              <span>{error}</span>
            </div>
          )}

          <section className="reports-stats-grid">
            <StatCard
              label={t("lecReports.statTotal")}
              value={statistics.total}
              type="blue"
              icon="#"
            />
            <StatCard
              label={t("lecReports.statPresent")}
              value={statistics.present}
              type="green"
              icon="+"
            />
            <StatCard
              label={t("lecReports.statLate")}
              value={statistics.late}
              type="orange"
              icon="T"
            />
            <StatCard
              label={t("lecReports.statAbsent")}
              value={statistics.absent}
              type="red"
              icon="-"
            />
            <StatCard
              label={t("lecReports.statRate")}
              value={`${statistics.attendanceRate}%`}
              type="purple"
              icon="%"
            />
          </section>

          <section className="reports-filter-card">
            <div className="reports-filter-heading">
              <div>
                <span className="reports-section-kicker">
                  {t("lecReports.builderEyebrow")}
                </span>
                <h2>{t("lecReports.overviewTitle")}</h2>
                <p>{t("lecReports.overviewDesc")}</p>
              </div>

              <button
                type="button"
                className="reports-clear-button"
                onClick={clearFilters}
                disabled={generating}
              >
                {t("lecReports.clearFilters")}
              </button>
            </div>

            <div className="reports-filter-grid">
              <div className="reports-field">
                <label htmlFor="report-section">{t("lecReports.fieldSection")}</label>
                <select
                  id="report-section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  <option value="">{t("lecReports.allSections")}</option>
                  {sections.map((section) => {
                    const id = section.section_id || section.id;

                    return (
                      <option key={id} value={id}>
                        {section.course_code
                          ? `${section.course_code} - `
                          : ""}
                        {section.section_name ||
                          section.name ||
                          t("lecReports.sectionFallback")}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="reports-field">
                <label htmlFor="report-from">{t("lecReports.fieldFrom")}</label>
                <input
                  id="report-from"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="reports-field">
                <label htmlFor="report-to">{t("lecReports.fieldTo")}</label>
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
                {generating ? t("lecReports.generating") : t("lecReports.generate")}
              </button>
            </div>
          </section>

          <section className="reports-table-card">
            {loading ? (
              <div className="reports-empty-state">
                <div className="reports-spinner" />
                <h3>{t("lecReports.loadingTitle")}</h3>
                <p>{t("lecReports.loadingDesc")}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="reports-empty-state">
                <div className="reports-empty-icon">R</div>
                <h3>{t("lecReports.emptyTitle")}</h3>
                <p>
                  {t("lecReports.emptyDesc")}
                </p>
              </div>
            ) : (
              <>
                <div className="reports-table-heading">
                  <div>
                    <span className="reports-section-kicker">
                      {t("lecReports.generatedEyebrow")}
                    </span>
                    <h2>{t("lecReports.reportTitle")}</h2>
                    <p>
                      {t("lecReports.recordCount").replace("{n}", rows.length)}
                    </p>
                  </div>
                </div>

                <div className="reports-desktop-table">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("lecReports.colStudent")}</th>
                        <th>{t("lecReports.colCourse")}</th>
                        <th>{t("lecReports.colSection")}</th>
                        <th>{t("lecReports.colDate")}</th>
                        <th>{t("lecReports.colStatus")}</th>
                        <th>{t("lecReports.colSource")}</th>
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
                              <StatusBadge status={status} t={t} />
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
                              {t("lecReports.colStudent")}
                            </span>
                            <strong>{getStudentName(row)}</strong>
                          </div>
                          <StatusBadge status={status} t={t} />
                        </div>

                        <div className="report-mobile-grid">
                          <InfoItem
                            label={t("lecReports.colCourse")}
                            value={getCourseCode(row)}
                          />
                          <InfoItem
                            label={t("lecReports.colSection")}
                            value={getSectionName(row)}
                          />
                          <InfoItem
                            label={t("lecReports.colDate")}
                            value={getDate(row)}
                          />
                          <InfoItem
                            label={t("lecReports.colSource")}
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

function StatusBadge({ status, t }) {
  const label =
    status && status !== "-" ? status : t ? t("lecReports.unknownStatus") : "Unknown";

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
