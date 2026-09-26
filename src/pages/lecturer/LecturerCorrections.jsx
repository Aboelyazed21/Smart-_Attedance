import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../utils/i18n";
import {
  getLecturerCorrections,
  getLecturerSections,
  reviewCorrection,
  updateAttendanceCorrection,
} from "../../services/api";
import "./LecturerCorrections.css";

function normalizeArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.corrections)) return data.corrections;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.requests)) return data.requests;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.corrections)) return data.data.corrections;
  return [];
}

function normalizeCorrection(row = {}) {
  const firstName = row.first_name ?? row.firstName ?? "";
  const lastName = row.last_name ?? row.lastName ?? "";
  const joinedName = `${firstName} ${lastName}`.trim();

  const studentName =
    row.student_name ||
    row.studentName ||
    (joinedName ? joinedName : "") ||
    row.student_full_name ||
    row.full_name ||
    "Student";

  return {
    raw: row,
    id: row.id ?? row.correction_id ?? row.request_id ?? row.requestId,
    studentId:
      row.student_id ?? row.studentId ?? row.student?.id ?? null,
    studentName,
    studentCode:
      row.student_code ??
      row.studentCode ??
      row.university_id ??
      row.universityId ??
      row.student?.student_code ??
      "",
    studentEmail: row.student_email ?? row.email ?? row.student?.email ?? "",
    course:
      row.course_name ??
      row.courseName ??
      row.course ??
      row.course_code ??
      row.courseCode ??
      "",
    courseCode: row.course_code ?? row.courseCode ?? "",
    section: row.section_name ?? row.sectionName ?? row.section ?? "",
    sectionId:
      row.section_id ?? row.sectionId ?? row.section?.id ?? null,
    sessionDate:
      row.session_date ??
      row.sessionDate ??
      row.attendance_date ??
      row.attendanceDate ??
      row.date ??
      "",
    currentStatus: String(
      row.current_status ??
        row.currentStatus ??
        row.attendance_status ??
        row.attendanceStatus ??
        row.original_status ??
        row.originalStatus ??
        ""
    ).toLowerCase(),
    requested: String(
      row.requested_status ??
        row.requestedStatus ??
        row.requested ??
        ""
    ).toLowerCase(),
    status: String(row.status ?? row.state ?? "pending").toLowerCase(),
    reason: row.reason ?? row.message ?? "",
    evidenceUrl:
      row.evidence_url ?? row.evidenceUrl ?? row.evidence ?? "",
    reviewerComment:
      row.reviewer_comment ??
      row.reviewerComment ??
      row.comment ??
      row.review_comment ??
      "",
    reviewedAt: row.reviewed_at ?? row.reviewedAt ?? "",
    submittedAt:
      row.created_at ?? row.createdAt ?? row.submitted_at ?? "",
    attendanceId:
      row.attendance_event_id ??
      row.attendanceEventId ??
      row.attendance_id ??
      row.attendanceId ??
      row.event_id ??
      null,
    sessionId:
      row.session_id ?? row.sessionId ?? row.session?.id ?? null,
  };
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";
  const normalized = String(value).includes("T")
    ? String(value)
    : String(value).replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getSectionId(section) {
  return section?.section_id ?? section?.sectionId ?? section?.id;
}

function getSectionLabel(section) {
  const code =
    section?.course_code || section?.courseCode || "Course";
  const name =
    section?.section_name ||
    section?.sectionName ||
    `Section ${getSectionId(section) ?? "-"}`;
  return `${code} - ${name}`;
}

const FINAL_STATUSES = ["present", "late", "absent", "excused"];

export default function LecturerCorrections() {
  const { t } = useLanguage();

  const [corrections, setCorrections] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [sectionsError, setSectionsError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const [selected, setSelected] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [finalStatus, setFinalStatus] = useState("present");
  const [reviewerComment, setReviewerComment] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [manualTarget, setManualTarget] = useState(null);
  const [manualStatus, setManualStatus] = useState("present");
  const [manualReason, setManualReason] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");

  async function loadSections() {
    try {
      setSectionsError("");
      const data = await getLecturerSections();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.sections)
          ? data.sections
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setSections(list);
    } catch (err) {
      setSectionsError(err?.message || t("lecCorrections.sectionsError"));
    }
  }

  async function loadCorrections(showRefresh = false) {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (sectionFilter !== "all") params.sectionId = sectionFilter;

      const data = await getLecturerCorrections(params);
      const list = normalizeArray(data).map(normalizeCorrection);
      setCorrections(list);
    } catch (err) {
      console.error("Lecturer corrections error:", err);
      setError(err?.message || t("lecCorrections.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    loadCorrections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sectionFilter]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (manualTarget) setManualTarget(null);
      else if (reviewTarget) setReviewTarget(null);
      else if (selected) setSelected(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [manualTarget, reviewTarget, selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return corrections.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      if (!matchesStatus) return false;

      if (sectionFilter !== "all") {
        const sid = String(item.sectionId ?? "");
        if (sid && sid !== String(sectionFilter)) return false;
        // If backend didn't return sectionId, fall back to label match
        if (!sid && item.section !== sectionFilter) {
          // keep it — server already filtered; don't hide unknown rows
        }
      }

      if (!q) return true;
      const hay = [
        item.id,
        item.studentName,
        item.studentCode,
        item.studentEmail,
        item.course,
        item.courseCode,
        item.section,
        item.reason,
        item.requested,
        item.currentStatus,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [corrections, search, statusFilter, sectionFilter]);

  const stats = useMemo(() => {
    const pending = corrections.filter((c) => c.status === "pending").length;
    const approved = corrections.filter((c) => c.status === "approved").length;
    const rejected = corrections.filter((c) => c.status === "rejected").length;
    return { pending, approved, rejected, total: corrections.length };
  }, [corrections]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setSectionFilter("all");
  }

  function openReview(item) {
    setReviewTarget(item);
    setFinalStatus(
      FINAL_STATUSES.includes(item.requested)
        ? item.requested
        : "present"
    );
    setReviewerComment("");
    setReviewError("");
  }

  async function submitReview(decision) {
    if (!reviewTarget?.id) return;
    const normalized = String(decision).toLowerCase();
    if (!["approved", "rejected"].includes(normalized)) return;

    if (normalized === "rejected" && !reviewerComment.trim()) {
      setReviewError(t("lecCorrections.commentRequired"));
      return;
    }

    try {
      setReviewing(true);
      setReviewError("");
      await reviewCorrection(reviewTarget.id, {
        decision: normalized,
        status: normalized,
        finalStatus: normalized === "approved" ? finalStatus : undefined,
        reviewerComment: reviewerComment.trim(),
      });
      setReviewTarget(null);
      setSelected(null);
      setNotice(
        normalized === "approved"
          ? t("lecCorrections.approveNotice")
          : t("lecCorrections.rejectNotice")
      );
      await loadCorrections(true);
    } catch (err) {
      setReviewError(err?.message || t("lecCorrections.reviewError"));
    } finally {
      setReviewing(false);
    }
  }

  function openManual(item) {
    setManualTarget(item);
    setManualStatus(
      FINAL_STATUSES.includes(item.requested)
        ? item.requested
        : FINAL_STATUSES.includes(item.currentStatus)
          ? item.currentStatus
          : "present"
    );
    setManualReason("");
    setManualError("");
  }

  async function submitManual(e) {
    e.preventDefault();
    if (!manualTarget) return;
    if (!manualReason.trim()) {
      setManualError(t("lecCorrections.reasonRequired"));
      return;
    }
    if (!manualTarget.attendanceId) {
      setManualError(t("lecCorrections.noAttendanceLinked"));
      return;
    }
    try {
      setManualSaving(true);
      setManualError("");
      await updateAttendanceCorrection(Number(manualTarget.attendanceId), {
        sessionId: manualTarget.sessionId ?? undefined,
        studentId: manualTarget.studentId ?? undefined,
        status: manualStatus,
        reason: manualReason.trim(),
      });
      setManualTarget(null);
      setSelected(null);
      setNotice(t("lecCorrections.manualNotice"));
      await loadCorrections(true);
    } catch (err) {
      setManualError(err?.message || t("lecCorrections.manualError"));
    } finally {
      setManualSaving(false);
    }
  }

  return (
    <div className="lecturer-corrections-page">
      <main className="lecturer-corrections-main">
        <header className="lecturer-corrections-topbar">
          <div>
            <span className="topbar-label">{t("lecCorrections.eyebrow")}</span>
            <h1>{t("lecCorrections.title")}</h1>
            <p>{t("lecCorrections.subtitle")}</p>
          </div>
          <button
            type="button"
            className="corrections-refresh-button"
            onClick={() => loadCorrections(true)}
            disabled={refreshing}
          >
            {refreshing ? t("lecCorrections.refreshing") : t("action.refresh")}
          </button>
        </header>

        <section className="corrections-hero">
          <div>
            <span className="hero-label">{t("lecCorrections.heroEyebrow")}</span>
            <h2>{t("lecCorrections.heroTitle")}</h2>
            <p>{t("lecCorrections.heroDesc")}</p>
          </div>
          <div className="hero-pending">
            <strong>{stats.pending}</strong>
            <span>{t("lecCorrections.pendingBadge")}</span>
          </div>
        </section>

        {notice && (
          <div className="corrections-notice" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="corrections-alert" role="alert">
            <div>
              <strong>{t("lecCorrections.errorTitle")}</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={() => loadCorrections(true)}
              disabled={refreshing}
            >
              {t("lecCorrections.retry")}
            </button>
          </div>
        )}

        <div className="corrections-stat-grid">
          <div className="corrections-stat-card pending">
            <span>{t("lecCorrections.statPending")}</span>
            <strong>{loading ? "..." : stats.pending}</strong>
            <small>{t("lecCorrections.statPendingDesc")}</small>
          </div>
          <div className="corrections-stat-card approved">
            <span>{t("lecCorrections.statApproved")}</span>
            <strong>{loading ? "..." : stats.approved}</strong>
            <small>{t("lecCorrections.statApprovedDesc")}</small>
          </div>
          <div className="corrections-stat-card rejected">
            <span>{t("lecCorrections.statRejected")}</span>
            <strong>{loading ? "..." : stats.rejected}</strong>
            <small>{t("lecCorrections.statRejectedDesc")}</small>
          </div>
          <div className="corrections-stat-card total">
            <span>{t("lecCorrections.statTotal")}</span>
            <strong>{loading ? "..." : stats.total}</strong>
            <small>{t("lecCorrections.statTotalDesc")}</small>
          </div>
        </div>

        <section className="corrections-panel">
          <div className="corrections-filters">
            <div className="corrections-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("lecCorrections.searchPh")}
                aria-label={t("lecCorrections.searchAria")}
              />
            </div>

            <div className="corrections-filter-field">
              <label htmlFor="lec-corr-status">
                {t("lecCorrections.fieldStatus")}
              </label>
              <select
                id="lec-corr-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t("lecCorrections.allStatuses")}</option>
                <option value="pending">{t("lecCorrections.statusPending")}</option>
                <option value="approved">{t("lecCorrections.statusApproved")}</option>
                <option value="rejected">{t("lecCorrections.statusRejected")}</option>
              </select>
            </div>

            <div className="corrections-filter-field">
              <label htmlFor="lec-corr-section">
                {t("lecCorrections.fieldSection")}
              </label>
              <select
                id="lec-corr-section"
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="all">{t("lecCorrections.allSections")}</option>
                {sections.map((s) => {
                  const id = getSectionId(s);
                  return (
                    <option key={id} value={String(id)}>
                      {getSectionLabel(s)}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              type="button"
              className="clear-corrections-filters"
              onClick={clearFilters}
            >
              {t("lecCorrections.clear")}
            </button>
          </div>

          {sectionsError && (
            <div className="sections-inline-warning">{sectionsError}</div>
          )}

          <div className="corrections-table-wrap">
            {loading ? (
              <div className="corrections-loading">
                <div className="loading-spinner" />
                <strong>{t("lecCorrections.loadingTitle")}</strong>
                <span>{t("lecCorrections.loadingDesc")}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="corrections-empty">
                <div className="empty-icon">CR</div>
                <h3>{t("lecCorrections.emptyTitle")}</h3>
                <p>{t("lecCorrections.emptyDesc")}</p>
                {(search || statusFilter !== "all" || sectionFilter !== "all") && (
                  <button type="button" onClick={clearFilters}>
                    {t("lecCorrections.clearFilters")}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="corrections-count">
                  {t("lecCorrections.resultCount")
                    .replace("{shown}", String(filtered.length))
                    .replace("{total}", String(corrections.length))}
                </div>

                <div className="corrections-mobile-list">
                  {filtered.map((item) => (
                    <article key={item.id} className="correction-mobile-card">
                      <div className="correction-mobile-head">
                        <div className="correction-student">
                          <div className="student-avatar">
                            {getInitials(item.studentName)}
                          </div>
                          <div>
                            <strong>{item.studentName}</strong>
                            <span>{item.studentCode || item.studentEmail || `#${item.id}`}</span>
                          </div>
                        </div>
                        <span className={`correction-status correction-status-${item.status}`}>
                          {capitalize(item.status)}
                        </span>
                      </div>
                      <div className="correction-mobile-grid">
                        <div>
                          <span>{t("lecCorrections.colCourse")}</span>
                          <strong>{item.course || item.courseCode || "-"}</strong>
                        </div>
                        <div>
                          <span>{t("lecCorrections.colSection")}</span>
                          <strong>{item.section || "-"}</strong>
                        </div>
                        <div>
                          <span>{t("lecCorrections.colDate")}</span>
                          <strong>{formatDate(item.sessionDate)}</strong>
                        </div>
                        <div>
                          <span>{t("lecCorrections.colChange")}</span>
                          <strong className="change-cell">
                            <span className="from">{item.currentStatus || "-"}</span>
                            <span className="arrow">→</span>
                            <span className="to">{item.requested || "-"}</span>
                          </strong>
                        </div>
                      </div>
                      <p className="correction-reason-preview">{item.reason}</p>
                      <div className="correction-mobile-actions">
                        <button type="button" className="view-btn" onClick={() => setSelected(item)}>
                          {t("lecCorrections.viewBtn")}
                        </button>
                        {item.status === "pending" && (
                          <button type="button" className="review-btn" onClick={() => openReview(item)}>
                            {t("lecCorrections.reviewBtn")}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="corrections-desktop-table">
                  <table className="lecturer-corrections-table">
                    <thead>
                      <tr>
                        <th>{t("lecCorrections.colStudent")}</th>
                        <th>{t("lecCorrections.colCourse")}</th>
                        <th>{t("lecCorrections.colDate")}</th>
                        <th>{t("lecCorrections.colChange")}</th>
                        <th>{t("lecCorrections.colReason")}</th>
                        <th>{t("lecCorrections.colSubmitted")}</th>
                        <th>{t("lecCorrections.colStatus")}</th>
                        <th>{t("lecCorrections.colActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="correction-student">
                              <div className="student-avatar">
                                {getInitials(item.studentName)}
                              </div>
                              <div>
                                <strong>{item.studentName}</strong>
                                <span>{item.studentCode || item.studentEmail || `#${item.id}`}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="course-info">
                              <strong>{item.courseCode || item.course || "-"}</strong>
                              <span>{item.course || "-"}{item.section ? ` · ${item.section}` : ""}</span>
                            </div>
                          </td>
                          <td>{formatDate(item.sessionDate)}</td>
                          <td>
                            <span className="change-cell">
                              <span className="from">{item.currentStatus || "-"}</span>
                              <span className="arrow">→</span>
                              <span className="to">{item.requested || "-"}</span>
                            </span>
                          </td>
                          <td className="reason-cell" title={item.reason}>
                            {item.reason?.length > 60
                              ? `${item.reason.slice(0, 60)}…`
                              : item.reason || "-"}
                          </td>
                          <td>{formatDateTime(item.submittedAt)}</td>
                          <td>
                            <span className={`correction-status correction-status-${item.status}`}>
                              {capitalize(item.status)}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button type="button" className="view-btn" onClick={() => setSelected(item)}>
                                {t("lecCorrections.viewBtn")}
                              </button>
                              {item.status === "pending" && (
                                <button type="button" className="review-btn" onClick={() => openReview(item)}>
                                  {t("lecCorrections.reviewBtn")}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      {selected && (
        <div
          className="correction-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="correction-modal" role="dialog" aria-modal="true">
            <div className="correction-modal-header">
              <div>
                <span>{t("lecCorrections.detailsEyebrow")} #{selected.id}</span>
                <h3>{selected.studentName}</h3>
                <p>{selected.studentCode || selected.studentEmail}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="correction-details-grid">
              <div>
                <span>{t("lecCorrections.dCourse")}</span>
                <strong>{selected.course || selected.courseCode || "-"}</strong>
              </div>
              <div>
                <span>{t("lecCorrections.dSection")}</span>
                <strong>{selected.section || "-"}</strong>
              </div>
              <div>
                <span>{t("lecCorrections.dDate")}</span>
                <strong>{formatDate(selected.sessionDate)}</strong>
              </div>
              <div>
                <span>{t("lecCorrections.dSubmitted")}</span>
                <strong>{formatDateTime(selected.submittedAt)}</strong>
              </div>
              <div>
                <span>{t("lecCorrections.dCurrent")}</span>
                <strong className="status-pill current">{selected.currentStatus || "-"}</strong>
              </div>
              <div>
                <span>{t("lecCorrections.dRequested")}</span>
                <strong className="status-pill requested">{selected.requested || "-"}</strong>
              </div>
              <div>
                <span>{t("lecCorrections.dStatus")}</span>
                <strong>
                  <span className={`correction-status correction-status-${selected.status}`}>
                    {capitalize(selected.status)}
                  </span>
                </strong>
              </div>
              <div>
                <span>{t("lecCorrections.dReviewed")}</span>
                <strong>{selected.reviewedAt ? formatDateTime(selected.reviewedAt) : t("lecCorrections.notReviewed")}</strong>
              </div>
              <div className="full">
                <span>{t("lecCorrections.dReason")}</span>
                <p>{selected.reason || "-"}</p>
              </div>
              {selected.evidenceUrl && (
                <div className="full">
                  <span>{t("lecCorrections.dEvidence")}</span>
                  <a href={selected.evidenceUrl} target="_blank" rel="noreferrer">
                    {selected.evidenceUrl}
                  </a>
                </div>
              )}
              {selected.reviewerComment && (
                <div className="full">
                  <span>{t("lecCorrections.dComment")}</span>
                  <p>{selected.reviewerComment}</p>
                </div>
              )}
            </div>

            <div className="correction-modal-footer">
              <button type="button" className="ghost-btn" onClick={() => setSelected(null)}>
                {t("lecCorrections.closeBtn")}
              </button>
              <button type="button" className="secondary-btn" onClick={() => openManual(selected)}>
                {t("lecCorrections.editAttendanceBtn")}
              </button>
              {selected.status === "pending" && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    openReview(selected);
                  }}
                >
                  {t("lecCorrections.reviewBtn")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div
          className="correction-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !reviewing) setReviewTarget(null);
          }}
        >
          <div className="correction-modal" role="dialog" aria-modal="true">
            <div className="correction-modal-header">
              <div>
                <span>{t("lecCorrections.reviewEyebrow")} #{reviewTarget.id}</span>
                <h3>{t("lecCorrections.reviewTitle")}</h3>
                <p>
                  {reviewTarget.studentName} · {reviewTarget.currentStatus || "-"} →{" "}
                  {reviewTarget.requested || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !reviewing && setReviewTarget(null)}
                disabled={reviewing}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="review-form">
              <label>
                {t("lecCorrections.finalStatusLabel")}
                <select
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value)}
                  disabled={reviewing}
                >
                  {FINAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`lecCorrections.status${capitalize(s)}`) || capitalize(s)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="form-hint">{t("lecCorrections.finalStatusHint")}</p>

              <label>
                {t("lecCorrections.commentLabel")}
                <textarea
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder={t("lecCorrections.commentPh")}
                  rows={4}
                  disabled={reviewing}
                />
              </label>

              {reviewError && (
                <div className="form-error" role="alert">
                  {reviewError}
                </div>
              )}
            </div>

            <div className="correction-modal-footer">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setReviewTarget(null)}
                disabled={reviewing}
              >
                {t("lecCorrections.cancelBtn")}
              </button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => submitReview("rejected")}
                disabled={reviewing}
              >
                {reviewing ? t("lecCorrections.saving") : t("lecCorrections.rejectBtn")}
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => submitReview("approved")}
                disabled={reviewing}
              >
                {reviewing ? t("lecCorrections.saving") : t("lecCorrections.approveBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {manualTarget && (
        <div
          className="correction-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !manualSaving) setManualTarget(null);
          }}
        >
          <div className="correction-modal" role="dialog" aria-modal="true">
            <div className="correction-modal-header">
              <div>
                <span>{t("lecCorrections.manualEyebrow")}</span>
                <h3>{t("lecCorrections.manualTitle")}</h3>
                <p>
                  {manualTarget.studentName} · #{manualTarget.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !manualSaving && setManualTarget(null)}
                disabled={manualSaving}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitManual} className="review-form">
              <label>
                {t("lecCorrections.manualStatusLabel")}
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  disabled={manualSaving}
                >
                  {FINAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {t(`lecCorrections.status${capitalize(s)}`) || capitalize(s)}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t("lecCorrections.manualReasonLabel")}
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder={t("lecCorrections.manualReasonPh")}
                  rows={4}
                  disabled={manualSaving}
                />
              </label>

              {manualError && (
                <div className="form-error" role="alert">
                  {manualError}
                </div>
              )}

              <div className="correction-modal-footer inline">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setManualTarget(null)}
                  disabled={manualSaving}
                >
                  {t("lecCorrections.cancelBtn")}
                </button>
                <button type="submit" className="primary-btn" disabled={manualSaving}>
                  {manualSaving ? t("lecCorrections.saving") : t("lecCorrections.saveBtn")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
