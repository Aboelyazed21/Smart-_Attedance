import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getSessions,
  openSession,
  refreshSessionQr,
  closeSession,
  getSessionRoster,
  updateAttendanceCorrection,
} from "../../services/api";

import "./LecturerQRSession.css";

function normalizeArray(data, key) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  return [];
}

function formatDate(date) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function formatTime(time) {
  if (!time) return "-";

  try {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return time;
  }
}

function getAttendanceStatus(row) {
  const status = row?.attendance?.status;

  if (!status) {
    return "absent";
  }

  return String(status).toLowerCase();
}

function getStatusLabel(status) {
  switch (status) {
    case "present":
      return "Present";

    case "late":
      return "Late";

    case "excused":
      return "Excused";

    case "absent":
    default:
      return "Absent";
  }
}

function getStatusClass(status) {
  switch (status) {
    case "present":
      return "status-present";

    case "late":
      return "status-late";

    case "excused":
      return "status-excused";

    case "absent":
    default:
      return "status-absent";
  }
}

export default function LecturerQRSession() {
  const navigate = useNavigate();

  const params = useParams();

  const sessionId =
    params.sessionId ||
    params.id;

  const [session, setSession] = useState(null);

  const [qrDataUrl, setQrDataUrl] = useState("");

  const [qrExpiresAt, setQrExpiresAt] = useState(null);

  const [qrVersion, setQrVersion] = useState(null);

  const [countdown, setCountdown] = useState(0);

  const [roster, setRoster] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadingRoster, setLoadingRoster] = useState(false);

  const [refreshingQr, setRefreshingQr] = useState(false);

  const [closingSession, setClosingSession] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [showCorrectionModal, setShowCorrectionModal] =
    useState(false);

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [correctionStatus, setCorrectionStatus] =
    useState("present");

  const [correctionReason, setCorrectionReason] =
    useState("");

  const [savingCorrection, setSavingCorrection] =
    useState(false);

  /*
   * ==========================================================
   * LOAD SESSION
   * ==========================================================
   */

  async function loadSession() {
    try {
      setLoading(true);
      setError("");

      const data = await getSessions();

      const sessions = normalizeArray(
        data,
        "sessions"
      );

      const found = sessions.find(
        (item) =>
          String(item.id) === String(sessionId)
      );

      if (!found) {
        throw new Error(
          "Attendance session was not found."
        );
      }

      setSession(found);

      /*
       * If the session is already active,
       * try to open it and retrieve the current QR.
       */
      if (
        found.status === "active" ||
        found.status === "open"
      ) {
        const opened = await openSession(
          found.id
        );

        const qr = opened?.qr || {};

        setQrDataUrl(
          qr.qrDataUrl ||
            opened?.qrDataUrl ||
            ""
        );

        setQrExpiresAt(
          qr.expiresAt ||
            opened?.expiresAt ||
            null
        );

        setQrVersion(
          qr.version ||
            opened?.version ||
            null
        );

        setSession((previous) => ({
          ...(previous || found),
          ...found,
          status: "active",
        }));
      }
    } catch (err) {
      console.error(
        "Load QR session error:",
        err
      );

      setError(
        err.message ||
          "Failed to load attendance session."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ==========================================================
   * LOAD ROSTER
   * ==========================================================
   */

  async function loadRoster(showLoader = true) {
    if (!sessionId) {
      return;
    }

    try {
      if (showLoader) {
        setLoadingRoster(true);
      }

      const data =
        await getSessionRoster(
          sessionId
        );

      const rows = normalizeArray(
        data,
        "roster"
      );

      setRoster(rows);
    } catch (err) {
      console.error(
        "Load roster error:",
        err
      );

      setError(
        err.message ||
          "Failed to load attendance roster."
      );
    } finally {
      if (showLoader) {
        setLoadingRoster(false);
      }
    }
  }

  /*
   * ==========================================================
   * INITIAL LOAD
   * ==========================================================
   */

  useEffect(() => {
    if (!sessionId) {
      setError(
        "No attendance session ID was provided."
      );

      setLoading(false);

      return;
    }

    loadSession();
    loadRoster();
  }, [sessionId]);

  /*
   * ==========================================================
   * LIVE ROSTER REFRESH
   * ==========================================================
   */

  useEffect(() => {
    if (!sessionId) {
      return undefined;
    }

    const timer = setInterval(() => {
      loadRoster(false);
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [sessionId]);

  /*
   * ==========================================================
   * QR COUNTDOWN
   * ==========================================================
   */

  useEffect(() => {
    if (!qrExpiresAt) {
      setCountdown(0);
      return undefined;
    }

    function updateCountdown() {
      const expiration =
        new Date(
          qrExpiresAt
        ).getTime();

      const remaining = Math.max(
        0,
        Math.ceil(
          (expiration -
            Date.now()) /
            1000
        )
      );

      setCountdown(
        remaining
      );
    }

    updateCountdown();

    const timer =
      setInterval(
        updateCountdown,
        1000
      );

    return () => {
      clearInterval(timer);
    };
  }, [qrExpiresAt]);

  /*
   * ==========================================================
   * REFRESH QR
   * ==========================================================
   */

  async function handleRefreshQr() {
    try {
      setRefreshingQr(true);
      setError("");
      setSuccess("");

      const data =
        await refreshSessionQr(
          sessionId
        );

      const qr =
        data?.qr || {};

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

      setQrVersion(
        qr.version ||
          data?.version ||
          null
      );

      setSuccess(
        "QR code refreshed successfully."
      );
    } catch (err) {
      console.error(
        "Refresh QR error:",
        err
      );

      setError(
        err.message ||
          "Failed to refresh QR code."
      );
    } finally {
      setRefreshingQr(false);
    }
  }

  /*
   * ==========================================================
   * CLOSE SESSION
   * ==========================================================
   */

  async function handleCloseSession() {
    const confirmed =
      window.confirm(
        "Are you sure you want to close this attendance session?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setClosingSession(true);
      setError("");
      setSuccess("");

      await closeSession(
        sessionId
      );

      setSession((previous) => ({
        ...(previous || {}),
        status: "closed",
      }));

      setQrDataUrl("");

      setCountdown(0);

      setSuccess(
        "Attendance session closed successfully."
      );
    } catch (err) {
      console.error(
        "Close session error:",
        err
      );

      setError(
        err.message ||
          "Failed to close attendance session."
      );
    } finally {
      setClosingSession(false);
    }
  }

  /*
   * ==========================================================
   * OPEN CORRECTION MODAL
   * ==========================================================
   */

  function handleEditAttendance(student) {
    const currentStatus =
      getAttendanceStatus(
        student
      );

    setSelectedStudent(
      student
    );

    setCorrectionStatus(
      currentStatus
    );

    setCorrectionReason("");

    setError("");

    setSuccess("");

    setShowCorrectionModal(
      true
    );
  }

  /*
   * ==========================================================
   * SAVE ATTENDANCE CORRECTION
   * ==========================================================
   */

  async function handleSaveCorrection(
    event
  ) {
    event.preventDefault();

    if (!selectedStudent) {
      return;
    }

    if (
      !correctionReason.trim()
    ) {
      setError(
        "Please enter a reason for the attendance correction."
      );

      return;
    }

    try {
      setSavingCorrection(true);

      setError("");
      setSuccess("");

      const eventId =
        selectedStudent?.attendance
          ?.id || 0;

      await updateAttendanceCorrection(
        eventId,
        {
          sessionId,
          studentId:
            selectedStudent.studentId,
          status:
            correctionStatus,
          reason:
            correctionReason.trim(),
        }
      );

      setShowCorrectionModal(
        false
      );

      setSelectedStudent(
        null
      );

      setCorrectionReason("");

      await loadRoster(false);

      setSuccess(
        "Attendance updated successfully."
      );
    } catch (err) {
      console.error(
        "Attendance correction error:",
        err
      );

      setError(
        err.message ||
          "Failed to update attendance."
      );
    } finally {
      setSavingCorrection(false);
    }
  }

  /*
   * ==========================================================
   * FILTER
   * ==========================================================
   */

  const filteredRoster =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return roster;
      }

      return roster.filter(
        (student) => {
          const values = [
            student.studentCode,
            student.universityId,
            student.firstName,
            student.lastName,
            student.email,
          ];

          return values.some(
            (value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [roster, search]);

  /*
   * ==========================================================
   * STATISTICS
   * ==========================================================
   */

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    roster.forEach(
      (student) => {
        const status =
          getAttendanceStatus(
            student
          );

        if (status === "present") {
          present++;
        } else if (
          status === "late"
        ) {
          late++;
        } else if (
          status === "excused"
        ) {
          excused++;
        } else {
          absent++;
        }
      }
    );

    return {
      total: roster.length,
      present,
      absent,
      late,
      excused,
    };
  }, [roster]);

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="qr-session-page">
        <div className="qr-loading">
          <div className="qr-spinner" />
          <h2>
            Loading attendance session...
          </h2>
          <p>
            Please wait while the session
            information is loaded.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="qr-session-page">
        <div className="qr-error-card">
          <div className="qr-error-icon">
            !
          </div>

          <h2>
            Attendance Session
          </h2>

          <p>
            {error ||
              "Session not found."}
          </p>

          <button
            type="button"
            className="qr-secondary-button"
            onClick={() =>
              navigate(
                "/lecturer/sessions"
              )
            }
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const sessionClosed =
    session.status ===
      "closed";

  return (
    <div className="qr-session-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="qr-session-header">

        <div className="qr-header-left">

          <button
            type="button"
            className="qr-back-button"
            onClick={() =>
              navigate(
                "/lecturer/sessions"
              )
            }
          >
            ←
          </button>

          <div>
            <div className="qr-eyebrow">
              ATTENDANCE SESSION
            </div>

            <h1>
              {session.sectionName ||
                session.courseName ||
                session.courseCode ||
                "Attendance Session"}
            </h1>

            <div className="qr-session-meta">

              <span>
                {formatDate(
                  session.sessionDate
                )}
              </span>

              <span>
                {formatTime(
                  session.scheduledStart
                )}
                {" - "}
                {formatTime(
                  session.scheduledEnd
                )}
              </span>

              {session.roomName && (
                <span>
                  {session.roomName}
                </span>
              )}

            </div>
          </div>

        </div>

        <div className="qr-header-actions">

          <span
            className={
              `session-status ${
                sessionClosed
                  ? "closed"
                  : "active"
              }`
            }
          >
            <span className="status-dot" />

            {sessionClosed
              ? "Closed"
              : "Live"}
          </span>

          <button
            type="button"
            className="qr-secondary-button"
            onClick={() =>
              navigate(
                "/lecturer/sessions"
              )
            }
          >
            Sessions
          </button>

        </div>

      </header>

      {/* =====================================================
          ALERTS
      ====================================================== */}

      {(error || success) && (
        <div
          className={
            error
              ? "qr-alert qr-alert-error"
              : "qr-alert qr-alert-success"
          }
        >
          <span>
            {error || success}
          </span>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="qr-session-content">

        <section className="qr-top-grid">

          {/* QR CARD */}

          <div className="qr-code-card">

            <div className="card-heading">

              <div>
                <span className="card-kicker">
                  STUDENT SCAN
                </span>

                <h2>
                  Session QR Code
                </h2>
              </div>

              {!sessionClosed && (
                <span className="live-pill">
                  ● LIVE
                </span>
              )}

            </div>

            <div className="qr-display">

              {sessionClosed ? (
                <div className="qr-closed-state">

                  <div className="qr-closed-icon">
                    ✓
                  </div>

                  <h3>
                    Session Closed
                  </h3>

                  <p>
                    This QR code is no
                    longer active.
                  </p>

                </div>
              ) : qrDataUrl ? (

                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  className="qr-image"
                />

              ) : (

                <div className="qr-empty-state">

                  <div className="qr-empty-icon">
                    QR
                  </div>

                  <p>
                    QR code is not
                    available.
                  </p>

                  <button
                    type="button"
                    className="qr-primary-button"
                    onClick={
                      handleRefreshQr
                    }
                    disabled={
                      refreshingQr
                    }
                  >
                    {refreshingQr
                      ? "Refreshing..."
                      : "Generate QR"}
                  </button>

                </div>

              )}

            </div>

            {!sessionClosed && (
              <>

                <div className="qr-countdown">

                  <span>
                    QR expires in
                  </span>

                  <strong>
                    {countdown > 0
                      ? `${countdown}s`
                      : "Expired"}
                  </strong>

                </div>

                <button
                  type="button"
                  className="qr-refresh-button"
                  onClick={
                    handleRefreshQr
                  }
                  disabled={
                    refreshingQr
                  }
                >
                  ↻{" "}
                  {refreshingQr
                    ? "Refreshing..."
                    : "Refresh QR"}
                </button>

                {qrVersion && (
                  <div className="qr-version">
                    QR Version:{" "}
                    {qrVersion}
                  </div>
                )}

              </>
            )}

          </div>

          {/* STATS */}

          <div className="attendance-overview">

            <div className="card-heading">

              <div>
                <span className="card-kicker">
                  LIVE OVERVIEW
                </span>

                <h2>
                  Attendance
                </h2>
              </div>

              <button
                type="button"
                className="icon-refresh-button"
                onClick={() =>
                  loadRoster()
                }
                disabled={
                  loadingRoster
                }
              >
                ↻
              </button>

            </div>

            <div className="stats-grid">

              <div className="stat-card stat-total">
                <span className="stat-number">
                  {stats.total}
                </span>

                <span className="stat-label">
                  Students
                </span>
              </div>

              <div className="stat-card stat-present">
                <span className="stat-number">
                  {stats.present}
                </span>

                <span className="stat-label">
                  Present
                </span>
              </div>

              <div className="stat-card stat-absent">
                <span className="stat-number">
                  {stats.absent}
                </span>

                <span className="stat-label">
                  Absent
                </span>
              </div>

              <div className="stat-card stat-late">
                <span className="stat-number">
                  {stats.late}
                </span>

                <span className="stat-label">
                  Late
                </span>
              </div>

            </div>

            <div className="attendance-progress">

              <div className="progress-header">
                <span>
                  Attendance rate
                </span>

                <strong>
                  {stats.total > 0
                    ? Math.round(
                        ((stats.present +
                          stats.late +
                          stats.excused) /
                          stats.total) *
                          100
                      )
                    : 0}
                  %
                </strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      `${
                        stats.total > 0
                          ? Math.round(
                              ((stats.present +
                                stats.late +
                                stats.excused) /
                                stats.total) *
                                100
                            )
                          : 0
                      }%`,
                  }}
                />
              </div>

            </div>

            <div className="overview-footer">

              <span>
                Excused
              </span>

              <strong>
                {stats.excused}
              </strong>

            </div>

          </div>

        </section>

        {/* ===================================================
            ROSTER
        ==================================================== */}

        <section className="roster-card">

          <div className="roster-header">

            <div>

              <span className="card-kicker">
                LIVE ROSTER
              </span>

              <h2>
                Student Attendance
              </h2>

              <p>
                Attendance updates automatically
                every 5 seconds.
              </p>

            </div>

            <div className="roster-tools">

              <div className="search-box">

                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search student..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

              </div>

              <button
                type="button"
                className="qr-secondary-button"
                onClick={() =>
                  loadRoster()
                }
                disabled={
                  loadingRoster
                }
              >
                {loadingRoster
                  ? "Loading..."
                  : "Refresh"}
              </button>

            </div>

          </div>

          <div className="roster-table-wrapper">

            {filteredRoster.length === 0 ? (

              <div className="empty-roster">

                <div className="empty-roster-icon">
                  👥
                </div>

                <h3>
                  No students found
                </h3>

                <p>
                  {search
                    ? "Try another search."
                    : "No students are enrolled in this section yet."}
                </p>

              </div>

            ) : (

              <table className="roster-table">

                <thead>
                  <tr>

                    <th>
                      Student
                    </th>

                    <th>
                      University ID
                    </th>

                    <th>
                      Attendance
                    </th>

                    <th>
                      Source
                    </th>

                    <th>
                      Scanned At
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredRoster.map(
                    (student) => {

                      const status =
                        getAttendanceStatus(
                          student
                        );

                      return (
                        <tr
                          key={
                            student.studentId
                          }
                        >

                          <td>

                            <div className="student-cell">

                              <div className="student-avatar">
                                {String(
                                  student.firstName ||
                                    "S"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <strong>
                                  {
                                    student.firstName
                                  }{" "}
                                  {
                                    student.lastName
                                  }
                                </strong>

                                <span>
                                  {
                                    student.studentCode ||
                                      "-"
                                  }
                                </span>

                              </div>

                            </div>

                          </td>

                          <td>
                            {
                              student.universityId ||
                                "-"
                            }
                          </td>

                          <td>

                            <span
                              className={
                                `attendance-status ${getStatusClass(
                                  status
                                )}`
                              }
                            >
                              <span className="attendance-status-dot" />

                              {
                                getStatusLabel(
                                  status
                                )
                              }
                            </span>

                          </td>

                          <td>
                            {
                              student
                                ?.attendance
                                ?.source ||
                                "-"
                            }
                          </td>

                          <td>

                            {student
                              ?.attendance
                              ?.scannedAt
                              ? new Date(
                                  student
                                    .attendance
                                    .scannedAt
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour:
                                      "2-digit",
                                    minute:
                                      "2-digit",
                                  }
                                )
                              : "-"}

                          </td>

                          <td>

                            <button
                              type="button"
                              className="edit-attendance-button"
                              onClick={() =>
                                handleEditAttendance(
                                  student
                                )
                              }
                            >
                              Edit
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

        {/* ===================================================
            SESSION ACTIONS
        ==================================================== */}

        <section className="session-actions-card">

          <div>

            <span className="card-kicker">
              SESSION CONTROL
            </span>

            <h3>
              Attendance Session
            </h3>

            <p>
              Close the session when the
              attendance window is finished.
            </p>

          </div>

          <div className="session-actions">

            <button
              type="button"
              className="qr-secondary-button"
              onClick={() =>
                navigate(
                  "/lecturer/sessions"
                )
              }
            >
              Back to Sessions
            </button>

            {!sessionClosed && (
              <button
                type="button"
                className="qr-danger-button"
                onClick={
                  handleCloseSession
                }
                disabled={
                  closingSession
                }
              >
                {closingSession
                  ? "Closing..."
                  : "Close Session"}
              </button>
            )}

          </div>

        </section>

      </main>

      {/* =====================================================
          CORRECTION MODAL
      ====================================================== */}

      {showCorrectionModal &&
        selectedStudent && (
          <div
            className="correction-overlay"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowCorrectionModal(
                  false
                );
              }
            }}
          >

            <div className="correction-modal">

              <div className="correction-modal-header">

                <div>

                  <span className="card-kicker">
                    ATTENDANCE CORRECTION
                  </span>

                  <h2>
                    Edit Attendance
                  </h2>

                  <p>
                    {
                      selectedStudent.firstName
                    }{" "}
                    {
                      selectedStudent.lastName
                    }
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close-button"
                  onClick={() =>
                    setShowCorrectionModal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  handleSaveCorrection
                }
              >

                <label>
                  Attendance Status

                  <select
                    value={
                      correctionStatus
                    }
                    onChange={(event) =>
                      setCorrectionStatus(
                        event.target.value
                      )
                    }
                  >
                    <option value="present">
                      Present
                    </option>

                    <option value="absent">
                      Absent
                    </option>

                    <option value="late">
                      Late
                    </option>

                    <option value="excused">
                      Excused
                    </option>
                  </select>

                </label>

                <label>
                  Reason

                  <textarea
                    value={
                      correctionReason
                    }
                    onChange={(event) =>
                      setCorrectionReason(
                        event.target.value
                      )
                    }
                    placeholder="Enter the reason for this attendance correction..."
                    maxLength={500}
                    rows={5}
                    required
                  />

                  <span className="textarea-counter">
                    {
                      correctionReason.length
                    }
                    /500
                  </span>

                </label>

                <div className="correction-modal-actions">

                  <button
                    type="button"
                    className="qr-secondary-button"
                    onClick={() =>
                      setShowCorrectionModal(
                        false
                      )
                    }
                    disabled={
                      savingCorrection
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="qr-primary-button"
                    disabled={
                      savingCorrection ||
                      !correctionReason.trim()
                    }
                  >
                    {savingCorrection
                      ? "Saving..."
                      : "Save Attendance"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}