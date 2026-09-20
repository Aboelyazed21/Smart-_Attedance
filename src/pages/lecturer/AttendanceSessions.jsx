import { useEffect, useRef, useState } from "react";

import {
  getSessions,
  createSession,
  openSession,
  refreshSessionQr,
  closeSession,
  getSessionRoster,
  getSections,
  getRooms,
} from "../../services/api";

import { useNavigate } from "react-router-dom";

import "../../App.css";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return date;
  }

  return value.toLocaleDateString();
}

function formatTime(time) {
  if (!time) return "-";

  return String(time).substring(0, 5);
}

function getStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "status-active";

    case "closed":
      return "status-closed";

    case "scheduled":
      return "status-scheduled";

    case "cancelled":
      return "status-cancelled";

    default:
      return "";
  }
}

/* =========================================================
   COMPONENT
========================================================= */

function AttendanceSessions() {
  const navigate = useNavigate();

  /* =======================================================
     DATA
  ======================================================= */

  const [sessions, setSessions] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showQrModal, setShowQrModal] =
    useState(false);

  const [showRosterModal, setShowRosterModal] =
    useState(false);

  const [selectedSession, setSelectedSession] =
    useState(null);

  const [roster, setRoster] = useState([]);

  const [loadingAction, setLoadingAction] =
    useState(false);

  const [error, setError] = useState("");

  /* =======================================================
     QR STATE
  ======================================================= */

  const [qrDataUrl, setQrDataUrl] =
    useState("");

  const [qrExpiresAt, setQrExpiresAt] =
    useState(null);

  const [qrVersion, setQrVersion] =
    useState(null);

  const [countdown, setCountdown] =
    useState(0);

  const qrTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  /* =======================================================
     CREATE FORM
  ======================================================= */

  const [form, setForm] = useState({
    sectionId: "",
    roomId: "",
    sessionDate: "",
    scheduledStart: "",
    scheduledEnd: "",
  });

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        sessionsResult,
        sectionsResult,
        roomsResult,
      ] = await Promise.all([
        getSessions(),
        getSections(),
        getRooms(),
      ]);

      setSessions(
        Array.isArray(sessionsResult)
          ? sessionsResult
          : sessionsResult?.sessions || []
      );

      setSections(
        Array.isArray(sectionsResult)
          ? sectionsResult
          : sectionsResult?.sections || []
      );

      setRooms(
        Array.isArray(roomsResult)
          ? roomsResult
          : roomsResult?.rooms || []
      );
    } catch (err) {
      console.error(
        "Attendance sessions load error:",
        err
      );

      setError(
        err.message ||
          "Failed to load attendance sessions"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    return () => {
      clearQrTimers();
    };
  }, []);

  /* =======================================================
     QR TIMER CLEANUP
  ======================================================= */

  function clearQrTimers() {
    if (qrTimerRef.current) {
      clearTimeout(qrTimerRef.current);
      qrTimerRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  /* =======================================================
     FORM
  ======================================================= */

  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* =======================================================
     CREATE SESSION
  ======================================================= */

  async function handleCreateSession(e) {
    e.preventDefault();

    if (
      !form.sectionId ||
      !form.sessionDate ||
      !form.scheduledStart ||
      !form.scheduledEnd
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (
      form.scheduledStart >=
      form.scheduledEnd
    ) {
      alert(
        "End time must be after start time."
      );
      return;
    }

    try {
      setLoadingAction(true);

      await createSession({
        sectionId: Number(form.sectionId),

        roomId: form.roomId
          ? Number(form.roomId)
          : null,

        sessionDate: form.sessionDate,

        scheduledStart:
          form.scheduledStart,

        scheduledEnd:
          form.scheduledEnd,
      });

      alert(
        "Attendance session created successfully."
      );

      setForm({
        sectionId: "",
        roomId: "",
        sessionDate: "",
        scheduledStart: "",
        scheduledEnd: "",
      });

      setShowCreateModal(false);

      await loadData();
    } catch (err) {
      console.error(
        "Create session error:",
        err
      );

      alert(
        err.message ||
          "Failed to create session."
      );
    } finally {
      setLoadingAction(false);
    }
  }

  /* =======================================================
     OPEN SESSION
  ======================================================= */

  async function handleOpenSession(session) {
    try {
      setLoadingAction(true);
      setError("");

      const data =
        await openSession(session.id);

      setSelectedSession({
        ...session,
        status: "active",
      });

      setQrDataUrl(
        data?.qr?.qrDataUrl ||
          data?.qrDataUrl ||
          ""
      );

      setQrExpiresAt(
        data?.qr?.expiresAt ||
          null
      );

      setQrVersion(
        data?.qr?.version ||
          data?.version ||
          null
      );

      setShowQrModal(true);

      await loadData();

      startQrCountdown(
        data?.qr?.expiresAt ||
          data?.expiresAt,
        session.id
      );
    } catch (err) {
      console.error(
        "Open session error:",
        err
      );

      alert(
        err.message ||
          "Failed to open session."
      );
    } finally {
      setLoadingAction(false);
    }
  }

  /* =======================================================
     QR COUNTDOWN
  ======================================================= */

  function startQrCountdown(
    expiresAt,
    sessionId
  ) {
    clearQrTimers();

    if (!expiresAt) {
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (
            new Date(expiresAt).getTime() -
            Date.now()
          ) / 1000
        )
      );

      setCountdown(remaining);

      if (remaining <= 0) {
        refreshQr(sessionId);
      }
    };

    updateCountdown();

    countdownTimerRef.current =
      setInterval(
        updateCountdown,
        1000
      );
  }

  /* =======================================================
     REFRESH QR
  ======================================================= */

  async function refreshQr(sessionId) {
    try {
      const data =
        await refreshSessionQr(
          sessionId
        );

      setQrDataUrl(
        data?.qrDataUrl || ""
      );

      setQrExpiresAt(
        data?.expiresAt || null
      );

      setQrVersion(
        data?.version || null
      );

      startQrCountdown(
        data?.expiresAt,
        sessionId
      );
    } catch (err) {
      console.error(
        "Refresh QR error:",
        err
      );
    }
  }

  /* =======================================================
     CLOSE SESSION
  ======================================================= */

  async function handleCloseSession(
    session
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to close this attendance session?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoadingAction(true);

      await closeSession(
        session.id
      );

      clearQrTimers();

      setShowQrModal(false);

      setQrDataUrl("");

      setSelectedSession(null);

      alert(
        "Attendance session closed successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Close session error:",
        err
      );

      alert(
        err.message ||
          "Failed to close session."
      );
    } finally {
      setLoadingAction(false);
    }
  }

  /* =======================================================
     VIEW ROSTER
  ======================================================= */

  async function handleViewRoster(
    session
  ) {
    try {
      setLoadingAction(true);

      const data =
        await getSessionRoster(
          session.id
        );

      setSelectedSession(
        session
      );

      setRoster(
        Array.isArray(data)
          ? data
          : data?.rows || []
      );

      setShowRosterModal(true);
    } catch (err) {
      console.error(
        "Roster error:",
        err
      );

      alert(
        err.message ||
          "Failed to load session roster."
      );
    } finally {
      setLoadingAction(false);
    }
  }

  /* =======================================================
     CLOSE QR MODAL
  ======================================================= */

  function handleCloseQrModal() {
    clearQrTimers();

    setShowQrModal(false);

    setQrDataUrl("");

    setQrExpiresAt(null);

    setQrVersion(null);

    setCountdown(0);

    setSelectedSession(null);
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  /* =======================================================
     USER
  ======================================================= */

  const savedUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
          "null"
      );
    } catch {
      return null;
    }
  })();

  const firstName =
    savedUser?.first_name ||
    "Lecturer";

  const lastName =
    savedUser?.last_name ||
    "";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="dashboard-page">

      {/* ===================================================
          GLASS MODAL STYLES
      =================================================== */}

      <style>{`

        .attendance-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .attendance-create-modal {
          width: min(580px, 94vw);
          max-height: 88vh;
          overflow-y: auto;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 25px 70px rgba(15, 23, 42, 0.28),
            0 8px 30px rgba(37, 99, 235, 0.10);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          animation: attendanceModalIn 0.2s ease-out;
        }

        @keyframes attendanceModalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .attendance-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .attendance-modal-title {
          margin: 0;
          font-size: 23px;
          font-weight: 750;
          color: #172033;
          letter-spacing: -0.4px;
        }

        .attendance-modal-subtitle {
          margin: 5px 0 0;
          font-size: 13px;
          color: #64748b;
        }

        .attendance-modal-close {
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 10px;
          background: rgba(241, 245, 249, 0.9);
          color: #334155;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .attendance-modal-close:hover {
          background: #e2e8f0;
          transform: rotate(3deg);
        }

        .attendance-modal-body {
          padding: 22px 24px 24px;
        }

        .attendance-form-section {
          padding: 18px;
          margin-bottom: 14px;
          border: 1px solid rgba(148, 163, 184, 0.20);
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.78);
        }

        .attendance-form-section-title {
          margin: 0 0 14px;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
        }

        .attendance-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .attendance-form-full {
          grid-column: 1 / -1;
        }

        .attendance-form-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .attendance-form-field label {
          font-size: 12px;
          font-weight: 650;
          color: #334155;
        }

        .attendance-form-field label span {
          color: #ef4444;
        }

        .attendance-form-field select,
        .attendance-form-field input {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid #dbe3ef;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.88);
          color: #172033;
          font-size: 13px;
          outline: none;
          transition: 0.2s ease;
        }

        .attendance-form-field select:focus,
        .attendance-form-field input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.10);
          background: #fff;
        }

        .attendance-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .attendance-cancel-btn {
          min-width: 100px;
          height: 42px;
          padding: 0 18px;
          border: 1px solid #dbe3ef;
          border-radius: 10px;
          background: rgba(248, 250, 252, 0.9);
          color: #334155;
          font-weight: 650;
          cursor: pointer;
        }

        .attendance-create-btn {
          min-width: 145px;
          height: 42px;
          padding: 0 20px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            #2563eb,
            #1d4ed8
          );
          color: white;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            0 8px 20px rgba(37, 99, 235, 0.20);
        }

        .attendance-create-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .attendance-create-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 10px 24px rgba(37, 99, 235, 0.25);
        }

        @media (max-width: 600px) {
          .attendance-modal-overlay {
            padding: 12px;
          }

          .attendance-create-modal {
            width: 100%;
            max-height: 92vh;
            border-radius: 18px;
          }

          .attendance-modal-header {
            padding: 18px;
          }

          .attendance-modal-body {
            padding: 16px;
          }

          .attendance-form-section {
            padding: 14px;
          }

          .attendance-form-grid {
            grid-template-columns: 1fr;
          }

          .attendance-form-full {
            grid-column: auto;
          }

          .attendance-modal-actions {
            flex-direction: column-reverse;
          }

          .attendance-cancel-btn,
          .attendance-create-btn {
            width: 100%;
          }
        }

      `}</style>

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            🎓
          </div>

          <div>
            <h2>Attendify</h2>
            <span>SMART ATTENDANCE</span>
          </div>

        </div>

        <div className="sidebar-profile">

          <div className="profile-avatar">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-info">
            <strong>
              {firstName} {lastName}
            </strong>

            <span>Lecturer</span>
          </div>

        </div>

        <nav className="dashboard-nav">

          <button
            className="nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item active"
            onClick={() =>
              navigate(
                "/lecturer/sessions"
              )
            }
          >
            <span>◫</span>
            Attendance Sessions
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/lecturer/attendance"
              )
            }
          >
            <span>✓</span>
            Attendance
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/lecturer/reports"
              )
            }
          >
            <span>▥</span>
            Reports
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="nav-item logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>
            <h1>
              Attendance Sessions
            </h1>

            <p>
              Create and manage attendance sessions
            </p>
          </div>

          <div className="dashboard-user">

            <div className="header-avatar">
              {firstName
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        <section className="dashboard-content">

          <div className="panel-header">

            <div>
              <h2>Sessions</h2>

              <p>
                Manage your attendance sessions
              </p>
            </div>

            <button
              className="sign-in-button"
              type="button"
              onClick={() =>
                setShowCreateModal(true)
              }
            >
              + New Session
            </button>

          </div>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "#fee2e2",
                color: "#991b1b",
              }}
            >
              {error}
            </div>
          )}

          <div className="dashboard-panel">

            {loading ? (
              <div className="empty-state">

                <div className="empty-icon">
                  ◌
                </div>

                <h3>
                  Loading sessions...
                </h3>

              </div>
            ) : sessions.length === 0 ? (
              <div className="empty-state">

                <div className="empty-icon">
                  ◫
                </div>

                <h3>
                  No attendance sessions
                </h3>

                <p>
                  Create your first attendance session.
                </p>

              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >

                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>

                    {sessions.map(
                      (session) => (
                        <tr
                          key={
                            session.id
                          }
                        >

                          <td>
                            <strong>
                              {
                                session.course_code
                              }
                            </strong>

                            <div>
                              {
                                session.course_name
                              }
                            </div>
                          </td>

                          <td>
                            {
                              session.section_name ||
                              "-"
                            }
                          </td>

                          <td>
                            {session.room_name
                              ? `${session.building || ""} ${session.room_name}`
                              : "-"}
                          </td>

                          <td>
                            {formatDate(
                              session.session_date
                            )}
                          </td>

                          <td>
                            {formatTime(
                              session.scheduled_start
                            )}
                            {" - "}
                            {formatTime(
                              session.scheduled_end
                            )}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatusClass(
                                session.status
                              )}`}
                            >
                              {
                                session.status
                              }
                            </span>
                          </td>

                          <td>

                            <div
                              style={{
                                display:
                                  "flex",
                                gap: "8px",
                                flexWrap:
                                  "wrap",
                              }}
                            >

                              {session.status ===
                                "scheduled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenSession(
                                      session
                                    )
                                  }
                                >
                                  Open
                                </button>
                              )}

                              {session.status ===
                                "active" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenSession(
                                      session
                                    )
                                  }
                                >
                                  QR
                                </button>
                              )}

                              {session.status !==
                                "cancelled" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleViewRoster(
                                      session
                                    )
                                  }
                                >
                                  Roster
                                </button>
                              )}

                              {session.status ===
                                "active" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCloseSession(
                                      session
                                    )
                                  }
                                >
                                  Close
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

      </main>

      {/* ===================================================
          CREATE SESSION GLASS MODAL
      =================================================== */}

      {showCreateModal && (
        <div
          className="attendance-modal-overlay"
          onClick={() =>
            setShowCreateModal(false)
          }
        >

          <div
            className="attendance-create-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="attendance-modal-header">

              <div>
                <h2 className="attendance-modal-title">
                  Create Attendance Session
                </h2>

                <p className="attendance-modal-subtitle">
                  Schedule a new attendance session for your students
                </p>
              </div>

              <button
                type="button"
                className="attendance-modal-close"
                onClick={() =>
                  setShowCreateModal(false)
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <form
              className="attendance-modal-body"
              onSubmit={
                handleCreateSession
              }
            >

              {/* SESSION DETAILS */}

              <div className="attendance-form-section">

                <h3 className="attendance-form-section-title">
                  Session Details
                </h3>

                <div className="attendance-form-grid">

                  <div className="attendance-form-field attendance-form-full">

                    <label>
                      Section{" "}
                      <span>*</span>
                    </label>

                    <select
                      name="sectionId"
                      value={
                        form.sectionId
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    >

                      <option value="">
                        Select Section
                      </option>

                      {sections.map(
                        (section) => (
                          <option
                            key={
                              section.id
                            }
                            value={
                              section.id
                            }
                          >
                            {section.course_code
                              ? `${section.course_code} - `
                              : ""}
                            {section.section_name ||
                              section.name ||
                              `Section ${section.id}`}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="attendance-form-field attendance-form-full">

                    <label>
                      Room{" "}
                      <small
                        style={{
                          color:
                            "#94a3b8",
                          fontWeight:
                            500,
                        }}
                      >
                        Optional
                      </small>
                    </label>

                    <select
                      name="roomId"
                      value={
                        form.roomId
                      }
                      onChange={
                        handleFormChange
                      }
                    >

                      <option value="">
                        Select Room
                      </option>

                      {rooms.map(
                        (room) => (
                          <option
                            key={
                              room.id
                            }
                            value={
                              room.id
                            }
                          >
                            {room.building
                              ? `${room.building} - `
                              : ""}
                            {room.room_name ||
                              room.name ||
                              `Room ${room.id}`}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </div>

              {/* SCHEDULE */}

              <div className="attendance-form-section">

                <h3 className="attendance-form-section-title">
                  Schedule
                </h3>

                <div className="attendance-form-grid">

                  <div className="attendance-form-field attendance-form-full">

                    <label>
                      Session Date{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="date"
                      name="sessionDate"
                      value={
                        form.sessionDate
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                  <div className="attendance-form-field">

                    <label>
                      Start Time{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="time"
                      name="scheduledStart"
                      value={
                        form.scheduledStart
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                  <div className="attendance-form-field">

                    <label>
                      End Time{" "}
                      <span>*</span>
                    </label>

                    <input
                      type="time"
                      name="scheduledEnd"
                      value={
                        form.scheduledEnd
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                    />

                  </div>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="attendance-modal-actions">

                <button
                  type="button"
                  className="attendance-cancel-btn"
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="attendance-create-btn"
                  disabled={
                    loadingAction
                  }
                >
                  {loadingAction
                    ? "Creating..."
                    : "Create Session"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ===================================================
          QR MODAL
      =================================================== */}

      {showQrModal && (
        <div
          className="modal-overlay"
          onClick={
            handleCloseQrModal
          }
        >

          <div
            className="modal-card"
            style={{
              maxWidth: "520px",
              textAlign: "center",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div
                style={{
                  textAlign: "left",
                }}
              >
                <h2>
                  Attendance QR
                </h2>

                <p>
                  {
                    selectedSession?.course_code
                  }
                  {" - "}
                  {
                    selectedSession?.section_name
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseQrModal
                }
              >
                ×
              </button>

            </div>

            {qrDataUrl ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    margin: "20px 0",
                  }}
                >
                  <img
                    src={qrDataUrl}
                    alt="Attendance QR Code"
                    style={{
                      width: "320px",
                      height: "320px",
                      objectFit:
                        "contain",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginBottom:
                      "12px",
                    fontWeight: "600",
                  }}
                >
                  Expires in:{" "}
                  <strong>
                    {countdown}s
                  </strong>
                </div>

                <div
                  style={{
                    marginBottom:
                      "20px",
                    fontSize: "14px",
                    opacity: 0.7,
                  }}
                >
                  QR Version:{" "}
                  {qrVersion ?? "-"}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >

                  <button
                    type="button"
                    onClick={() =>
                      refreshQr(
                        selectedSession.id
                      )
                    }
                  >
                    Refresh QR
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCloseSession(
                        selectedSession
                      )
                    }
                    disabled={
                      loadingAction
                    }
                  >
                    Close Session
                  </button>

                </div>

              </>
            ) : (
              <div className="empty-state">

                <h3>
                  QR is not available
                </h3>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ===================================================
          ROSTER MODAL
      =================================================== */}

      {showRosterModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowRosterModal(
              false
            )
          }
        >

          <div
            className="modal-card"
            style={{
              maxWidth: "900px",
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>
                  Session Roster
                </h2>

                <p>
                  {
                    selectedSession?.course_code
                  }
                  {" - "}
                  {
                    selectedSession?.section_name
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowRosterModal(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            {roster.length === 0 ? (
              <div className="empty-state">

                <h3>
                  No students found
                </h3>

                <p>
                  No students are enrolled in this section.
                </p>

              </div>
            ) : (
              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >

                  <thead>

                    <tr>

                      <th>
                        Student
                      </th>

                      <th>
                        Student Code
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Scanned At
                      </th>

                      <th>
                        Source
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {roster.map(
                      (student) => (
                        <tr
                          key={
                            student.student_id
                          }
                        >

                          <td>
                            {
                              student.student_name
                            }
                          </td>

                          <td>
                            {
                              student.student_code
                            }
                          </td>

                          <td>
                            <strong>
                              {
                                student.attendance_status
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              student.scanned_at
                                ? new Date(
                                    student.scanned_at
                                  ).toLocaleString()
                                : "-"
                            }
                          </td>

                          <td>
                            {
                              student.source ||
                              "-"
                            }
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default AttendanceSessions;