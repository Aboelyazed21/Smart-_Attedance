import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getSessions,
  getSessionById,
  openSession,
  refreshSessionQr,
  closeSession,
  getSessionRoster,
  updateAttendanceCorrection,
} from "../../services/api";

import { useLanguage } from "../../utils/i18n";

import "./LecturerQRSession.css";

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

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

function formatScanTime(value) {
  if (!value) return "-";

  const raw = String(value).trim();

  if (!raw) return "-";

  const normalized = raw.includes("T")
    ? raw
    : raw.replace(" ", "T");

  const date = new Date(normalized);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const match = raw.match(/(\d{1,2}):(\d{2})/);

  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  return raw;
}

function normalizeRoster(data) {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.rows)
      ? data.rows
      : Array.isArray(data?.roster)
        ? data.roster
        : Array.isArray(data?.students)
          ? data.students
          : [];

  return rows.map((student) => ({
    ...student,
    student_id:
      student.student_id ??
      student.studentId ??
      student.id ??
      null,
    student_code:
      student.student_code ??
      student.studentCode ??
      "-",
    first_name:
      student.first_name ??
      student.firstName ??
      "",
    last_name:
      student.last_name ??
      student.lastName ??
      "",
    email: student.email ?? "",
    attendance_id:
      student.attendance_id ??
      student.attendance?.id ??
      null,
    attendance_status: String(
      student.attendance_status ??
        student.attendance?.status ??
        student.status ??
        "absent"
    ).toLowerCase(),
    scanned_at:
      student.scanned_at ??
      student.attendance?.scannedAt ??
      null,
    source:
      student.source ??
      student.attendance?.source ??
      null,
  }));
}

function getStatusLabel(status, t) {
  const value = String(status || "absent").toLowerCase();

  if (value === "present") return t ? t("lecQR.statusPresent") : "Present";
  if (value === "late") return t ? t("lecQR.statusLate") : "Late";
  if (value === "excused") return t ? t("lecQR.statusExcused") : "Excused";

  return t ? t("lecQR.statusAbsent") : "Absent";
}

function getStatusClass(status) {
  const value = String(status || "absent").toLowerCase();

  if (value === "present") return "status-present";
  if (value === "late") return "status-late";
  if (value === "excused") return "status-excused";

  return "status-absent";
}

export default function LecturerQRSession() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { pathname } = useLocation();

  const sessionId =
    pathname.match(/^\/lecturer\/sessions\/(\d+)\/?$/)?.[1] || "";

  const savedUser = useMemo(() => getSavedUser(), []);
  const [session, setSession] = useState(null);
  const [roster, setRoster] = useState([]);

  const [loading, setLoading] = useState(true);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [correctionStudent, setCorrectionStudent] =
    useState(null);
  const [correctionStatus, setCorrectionStatus] =
    useState("present");
  const [correctionReason, setCorrectionReason] =
    useState("");
  const [correctionLoading, setCorrectionLoading] =
    useState(false);

  const timerRef = useRef(null);
  const rosterTimerRef = useRef(null);

  const firstName =
    savedUser?.first_name ||
    savedUser?.firstName ||
    t("role.lecturer");

  const lastName =
    savedUser?.last_name ||
    savedUser?.lastName ||
    "";

  const initials = getInitials(firstName, lastName);

  const pageSize = 8;

  function showToast(message) {
    setToast(message);

    window.setTimeout(() => {
      setToast("");
    }, 3000);
  }

  function clearTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startCountdown(expiresAt, currentSessionId) {
    clearTimer();

    if (!expiresAt) {
      setCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(expiresAt).getTime() - Date.now()) /
            1000
        )
      );

      setCountdown(remaining);

      if (remaining === 0) {
        clearTimer();
        refreshQr(currentSessionId, true);
      }
    };

    tick();
    timerRef.current = window.setInterval(tick, 1000);
  }

  async function loadSession() {
    try {
      setLoading(true);
      setError("");

      let found = null;

      // Try the dedicated endpoint first.
      try {
        const data = await getSessionById(sessionId);

        found =
          data?.session ||
          data?.data?.session ||
          data?.data ||
          data;
      } catch (directError) {
        console.warn(
          "Direct session lookup failed, falling back to sessions list:",
          directError
        );
      }

      // Fallback to the sessions list, which is already working.
      if (!found || Number(found.id) !== Number(sessionId)) {
        const data = await getSessions();

        const sessions = Array.isArray(data)
          ? data
          : Array.isArray(data?.sessions)
            ? data.sessions
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.data?.sessions)
                ? data.data.sessions
                : [];

        found = sessions.find(
          (item) => Number(item.id) === Number(sessionId)
        );
      }

      if (!found) {
        throw new Error(
          t("lecQR.notFound").replace("{n}", sessionId)
        );
      }

      setSession(found);

      if (
        String(found.status || "").toLowerCase() ===
          "active" &&
        found.qrDataUrl
      ) {
        setQrDataUrl(found.qrDataUrl);
        setQrExpiresAt(found.expiresAt || null);

        startCountdown(
          found.expiresAt,
          found.id
        );
      }

      await loadRoster(found.id);
    } catch (err) {
      console.error("Load lecturer session error:", err);
      setError(
        err.message ||
          t("lecQR.loadError")
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadRoster(id = sessionId) {
    try {
      setRosterLoading(true);

      const data = await getSessionRoster(id);
      setRoster(normalizeRoster(data));
    } catch (err) {
      console.error("Load session roster error:", err);
      showToast(
        err.message || t("lecQR.rosterError")
      );
    } finally {
      setRosterLoading(false);
    }
  }

  useEffect(() => {
    loadSession();

    return () => {
      clearTimer();

      if (rosterTimerRef.current) {
        window.clearInterval(rosterTimerRef.current);
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (!session?.id) return undefined;

    rosterTimerRef.current = window.setInterval(() => {
      loadRoster(session.id);
    }, 5000);

    return () => {
      if (rosterTimerRef.current) {
        window.clearInterval(rosterTimerRef.current);
        rosterTimerRef.current = null;
      }
    };
  }, [session?.id]);

  async function handleGenerateQr() {
    if (!session?.id) return;

    try {
      setActionLoading(true);

      const data = await openSession(session.id);

      const qr = data?.qr || data || {};

      setQrDataUrl(
        qr.qrDataUrl ||
          data?.qrDataUrl ||
          ""
      );

      setQrExpiresAt(
        qr.expiresAt ||
          data?.expiresAt ||
          null
      );

      setSession((current) => ({
        ...current,
        status: "active",
      }));

      startCountdown(
        qr.expiresAt ||
          data?.expiresAt ||
          null,
        session.id
      );

      showToast(t("lecQR.qrGenerated"));
    } catch (err) {
      console.error("Generate QR error:", err);
      showToast(
        err.message || t("lecQR.qrGenerateError")
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshQr(id = session?.id, silent = false) {
    if (!id) return;

    try {
      const data = await refreshSessionQr(id);

      const qr = data?.qr || data || {};

      setQrDataUrl(
        qr.qrDataUrl ||
          data?.qrDataUrl ||
          ""
      );

      setQrExpiresAt(
        qr.expiresAt ||
          data?.expiresAt ||
          null
      );

      startCountdown(
        qr.expiresAt ||
          data?.expiresAt ||
          null,
        id
      );

      if (!silent) {
        showToast(t("lecQR.qrRefreshed"));
      }
    } catch (err) {
      console.error("Refresh QR error:", err);
      clearTimer();

      if (!silent) {
        showToast(
          err.message || t("lecQR.qrRefreshError")
        );
      }
    }
  }

  async function handleEndSession() {
    if (!session?.id) return;

    const confirmed = window.confirm(
      t("lecQR.endConfirm")
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await closeSession(session.id);

      clearTimer();

      setSession((current) => ({
        ...current,
        status: "closed",
      }));

      setQrDataUrl("");
      setQrExpiresAt(null);
      setCountdown(0);

      showToast(t("lecQR.sessionEnded"));
    } catch (err) {
      console.error("Close session error:", err);
      showToast(
        err.message || t("lecQR.endError")
      );
    } finally {
      setActionLoading(false);
    }
  }

  function openCorrection(student) {
    setCorrectionStudent(student);

    setCorrectionStatus(
      ["present", "absent", "late", "excused"].includes(
        student.attendance_status
      )
        ? student.attendance_status
        : "present"
    );

    setCorrectionReason("");
  }

  function closeCorrection() {
    setCorrectionStudent(null);
    setCorrectionStatus("present");
    setCorrectionReason("");
  }

  async function saveCorrection(event) {
    event.preventDefault();

    if (!session?.id || !correctionStudent?.student_id) {
      showToast(t("lecQR.missingInfo"));
      return;
    }

    const reason = correctionReason.trim();

    if (!reason) {
      showToast(t("lecQR.enterReason"));
      return;
    }

    try {
      setCorrectionLoading(true);

      await updateAttendanceCorrection(
        correctionStudent.attendance_id || 0,
        {
          sessionId: session.id,
          studentId: correctionStudent.student_id,
          status: correctionStatus,
          reason,
        }
      );

      await loadRoster(session.id);

      closeCorrection();
      showToast(t("lecQR.updated"));
    } catch (err) {
      console.error("Attendance correction error:", err);
      showToast(
        err.message || t("lecQR.updateError")
      );
    } finally {
      setCorrectionLoading(false);
    }
  }

  const filteredRoster = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return roster;

    return roster.filter((student) => {
      const name =
        `${student.first_name} ${student.last_name}`
          .trim()
          .toLowerCase();

      return [
        name,
        student.student_code,
        student.email,
        student.attendance_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [roster, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRoster.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedRoster = filteredRoster.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = useMemo(() => {
    const values = roster.map((student) =>
      String(
        student.attendance_status || "absent"
      ).toLowerCase()
    );

    return {
      total: roster.length,
      present: values.filter(
        (value) => value === "present"
      ).length,
      absent: values.filter(
        (value) => value === "absent"
      ).length,
      late: values.filter(
        (value) => value === "late"
      ).length,
    };
  }, [roster]);

  function handleSearch(value) {
    setSearch(value);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="lecturer-session-page">
        <div className="lecturer-session-loading">
          <div className="loading-spinner" />
          <strong>{t("lecQR.loadingTitle")}</strong>
          <span>{t("lecQR.loadingDesc")}</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="lecturer-session-page">
        <div className="lecturer-session-error">
          <div className="error-icon">!</div>
          <h2>{t("lecQR.unavailableTitle")}</h2>
          <p>
            {error ||
              t("lecQR.unavailableDesc")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/lecturer/sessions")}
          >
            {t("lecQR.backToSessions")}
          </button>
        </div>
      </div>
    );
  }

  const sessionStatus = String(
    session.status || "scheduled"
  ).toLowerCase();

  const minutes = Math.floor(countdown / 60);
  const seconds = String(countdown % 60).padStart(2, "0");

  return (
    <div className="lecturer-session-page">
          <header className="session-page-header">
          <div>
            <button
              type="button"
              className="back-button"
              onClick={() =>
                navigate("/lecturer/sessions")
              }
            >
              ← {t("lecQR.backSessions")}
            </button>

            <h1>{t("lecQR.title")}</h1>
          </div>

          <div className="session-user">
            <div className="session-user-avatar">
              {initials}
            </div>

            <div>
              <strong>
                {firstName} {lastName}
              </strong>
              <span>{t("role.lecturer")}</span>
            </div>
          </div>
        </header>

        <section className="session-summary-card">
          <div className="session-summary-icon">
            CAL
          </div>

          <div className="session-summary-info">
            <div className="session-title-row">
              <h2>
                {session.course_name ||
                  session.course_code ||
                  t("lecQR.courseFallback")}{" "}
                -{" "}
                {session.section_name ||
                  t("lecQR.sectionFallback")}
              </h2>

              <span
                className={`session-status ${sessionStatus}`}
              >
                {sessionStatus}
              </span>
            </div>

            <div className="session-meta">
              <span>
                CAL {formatDate(session.session_date)}
              </span>

              <span>
                TIME {formatTime(session.scheduled_start)} -{" "}
                {formatTime(session.scheduled_end)}
              </span>

              <span>
                ROOM{" "}
                {session.room_name ||
                  session.room ||
                  t("lecQR.noRoom")}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="generate-qr-button"
            onClick={handleGenerateQr}
            disabled={
              actionLoading ||
              sessionStatus === "closed"
            }
          >
            QR
            <span>{t("lecQR.generateQr")}</span>
          </button>
        </section>

        <section className="session-main-grid">
          <div className="qr-card">
            <div className="card-heading">
              <div>
                <span className="card-icon">QR</span>
                <div>
                  <h3>{t("lecQR.qrTitle")}</h3>
                  <p>
                    {t("lecQR.qrDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="qr-display">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={t("lecQR.qrAlt")}
                />
              ) : (
                <div className="qr-placeholder">
                  <strong>QR</strong>
                  <span>
                    {t("lecQR.qrPlaceholder")}
                  </span>
                </div>
              )}
            </div>

            {qrDataUrl && (
              <>
                <div className="qr-session-code">
                  {t("lecQR.sessionCode").replace("{n}", session.id)}
                </div>

                <div className="qr-validity">
                  <span className="live-dot" />
                  {countdown > 0
                    ? t("lecQR.validFor").replace("{n}", `${minutes}:${seconds}`)
                    : t("lecQR.qrExpired")}
                </div>

                <button
                  type="button"
                  className="refresh-qr-button"
                  onClick={() =>
                    refreshQr(session.id)
                  }
                  disabled={actionLoading}
                >
                  {t("lecQR.refreshQr")}
                </button>
              </>
            )}

            <button
              type="button"
              className="end-session-button"
              onClick={handleEndSession}
              disabled={
                actionLoading ||
                sessionStatus === "closed"
              }
            >
              {t("lecQR.endSession")}
            </button>
          </div>

          <div className="students-card">
            <div className="students-card-header">
              <div>
                <h3>
                  {t("lecQR.registeredStudents").replace("{n}", stats.total)}
                </h3>
                <p>
                  {t("lecQR.liveDesc")}
                </p>
              </div>

              <button
                type="button"
                className="refresh-students-button"
                onClick={() => loadRoster(session.id)}
                disabled={rosterLoading}
              >
                {rosterLoading
                  ? t("lecQR.refreshing")
                  : t("action.refresh")}
              </button>
            </div>

            <div className="student-stats">
              <div>
                <strong>{stats.present}</strong>
                <span>{t("lecQR.statPresent")}</span>
              </div>

              <div>
                <strong>{stats.absent}</strong>
                <span>{t("lecQR.statAbsent")}</span>
              </div>

              <div>
                <strong>{stats.late}</strong>
                <span>{t("lecQR.statLate")}</span>
              </div>
            </div>

            <div className="student-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) =>
                  handleSearch(event.target.value)
                }
                placeholder={t("lecQR.searchPh")}
              />
            </div>

            <div className="students-table-wrap">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t("lecQR.colStudentId")}</th>
                    <th>{t("lecQR.colName")}</th>
                    <th>{t("lecQR.colStatus")}</th>
                    <th>{t("lecQR.colTime")}</th>
                    <th>{t("lecQR.colAction")}</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRoster.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="empty-table"
                      >
                        {t("lecQR.emptyStudents")}
                      </td>
                    </tr>
                  ) : (
                    paginatedRoster.map(
                      (student, index) => {
                        const name =
                          `${student.first_name} ${student.last_name}`
                            .trim() ||
                          t("lecQR.studentFallback");

                        return (
                          <tr
                            key={
                              student.student_id ||
                              student.id ||
                              index
                            }
                          >
                            <td>
                              {(currentPage - 1) *
                                pageSize +
                                index +
                                1}
                            </td>

                            <td>
                              <strong className="student-code">
                                {student.student_code}
                              </strong>
                            </td>

                            <td>
                              <div className="student-name-cell">
                                <div className="student-mini-avatar">
                                  {getInitials(
                                    student.first_name,
                                    student.last_name
                                  )}
                                </div>

                                <div>
                                  <strong>{name}</strong>
                                  <span>
                                    {student.email ||
                                      t("lecQR.studentAccountFallback")}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`attendance-status ${getStatusClass(
                                  student.attendance_status
                                )}`}
                              >
                                {getStatusLabel(
                                  student.attendance_status,
                                  t
                                )}
                              </span>
                            </td>

                            <td>
                              {formatScanTime(
                                student.scanned_at
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="edit-attendance-button"
                                onClick={() =>
                                  openCorrection(student)
                                }
                              >
                                {t("lecQR.edit")}
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  onClick={() =>
                    setPage((value) =>
                      Math.max(1, value - 1)
                    )
                  }
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((number) => (
                  <button
                    type="button"
                    key={number}
                    className={
                      number === currentPage
                        ? "active"
                        : ""
                    }
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setPage((value) =>
                      Math.min(totalPages, value + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </section>

        {toast && (
          <div className="session-toast">
            {toast}
          </div>
        )}

        {correctionStudent && (
          <div
            className="correction-overlay"
            onClick={closeCorrection}
          >
            <div
              className="correction-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="correction-header">
                <div>
                  <span>{t("lecQR.correctionEyebrow")}</span>
                  <h3>{t("lecQR.correctionTitle")}</h3>
                </div>

                <button
                  type="button"
                  onClick={closeCorrection}
                  disabled={correctionLoading}
                >
                  ×
                </button>
              </div>

              <div className="correction-student">
                <div className="student-mini-avatar">
                  {getInitials(
                    correctionStudent.first_name,
                    correctionStudent.last_name
                  )}
                </div>

                <div>
                  <strong>
                    {correctionStudent.first_name}{" "}
                    {correctionStudent.last_name}
                  </strong>

                  <span>
                    {correctionStudent.student_code}
                  </span>
                </div>
              </div>

              <form onSubmit={saveCorrection}>
                <label>
                  {t("lecQR.correctionStatusLabel")}
                  <select
                    value={correctionStatus}
                    onChange={(event) =>
                      setCorrectionStatus(
                        event.target.value
                      )
                    }
                    disabled={correctionLoading}
                  >
                    <option value="present">
                      {t("lecQR.statusPresent")}
                    </option>
                    <option value="absent">
                      {t("lecQR.statusAbsent")}
                    </option>
                    <option value="late">
                      {t("lecQR.statusLate")}
                    </option>
                    <option value="excused">
                      {t("lecQR.statusExcused")}
                    </option>
                  </select>
                </label>

                <label>
                  {t("lecQR.correctionReasonLabel")}
                  <textarea
                    value={correctionReason}
                    onChange={(event) =>
                      setCorrectionReason(
                        event.target.value
                      )
                    }
                    placeholder={t("lecQR.correctionReasonPh")}
                    rows="4"
                    disabled={correctionLoading}
                  />
                </label>

                <div className="correction-actions">
                  <button
                    type="button"
                    onClick={closeCorrection}
                    disabled={correctionLoading}
                  >
                    {t("lecQR.cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={correctionLoading}
                  >
                    {correctionLoading
                      ? t("lecQR.saving")
                      : t("lecQR.saveChanges")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
