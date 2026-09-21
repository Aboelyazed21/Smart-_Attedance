import { useEffect, useMemo, useRef, useState } from "react";
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
import "./AttendanceSessions.css";

function formatDate(date) {
  if (!date) return "-";

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;

  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "-";
  return String(time).substring(0, 5);
}

function getStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "lecturer-status-active";
    case "scheduled":
      return "lecturer-status-scheduled";
    case "closed":
      return "lecturer-status-closed";
    case "cancelled":
      return "lecturer-status-cancelled";
    default:
      return "lecturer-status-default";
  }
}

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName).trim().charAt(0);
  const last = String(lastName).trim().charAt(0);
  return `${first}${last}`.toUpperCase() || "L";
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function getTodayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function getRosterStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "present":
      return "roster-status-present";
    case "late":
      return "roster-status-late";
    case "excused":
      return "roster-status-excused";
    case "absent":
    default:
      return "roster-status-absent";
  }
}

function normalizeRoster(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.roster)) return data.roster;
  if (Array.isArray(data?.students)) return data.students;
  return [];
}

function AttendanceSessions() {
  const navigate = useNavigate();
  const savedUser = useMemo(() => getSavedUser(), []);

  const [sessions, setSessions] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [roster, setRoster] = useState([]);

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState(null);
  const [qrVersion, setQrVersion] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const qrCountdownRef = useRef(null);

  const [form, setForm] = useState({
    sectionId: "",
    roomId: "",
    sessionDate: getTodayInputValue(),
    scheduledStart: "",
    scheduledEnd: "",
  });

  const firstName = savedUser?.first_name || "Lecturer";
  const lastName = savedUser?.last_name || "";
  const initials = getInitials(firstName, lastName);

  function showToast(type, message) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  }

  function clearQrCountdown() {
    if (qrCountdownRef.current) {
      window.clearInterval(qrCountdownRef.current);
      qrCountdownRef.current = null;
    }
  }

  useEffect(() => {
    loadData();

    return () => {
      clearQrCountdown();
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [sessionsResult, sectionsResult, roomsResult] =
        await Promise.all([
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
      console.error("Attendance sessions load error:", err);
      setError(err.message || "Failed to load attendance sessions.");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const normalized = sessions.map((session) =>
      String(session.status || "").toLowerCase()
    );

    return {
      total: sessions.length,
      active: normalized.filter((value) => value === "active").length,
      scheduled: normalized.filter((value) => value === "scheduled").length,
      closed: normalized.filter((value) => value === "closed").length,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const today = getTodayInputValue();

    return sessions.filter((session) => {
      const status = String(session.status || "").toLowerCase();

      if (statusFilter !== "all" && status !== statusFilter) {
        return false;
      }

      if (dateFilter === "today") {
        const sessionDate = String(session.session_date || "").slice(0, 10);
        if (sessionDate !== today) return false;
      }

      if (!query) return true;

      const haystack = [
        session.course_code,
        session.course_name,
        session.section_name,
        session.room_name,
        session.building,
        session.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [sessions, search, statusFilter, dateFilter]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleCreateSession(event) {
    event.preventDefault();

    if (
      !form.sectionId ||
      !form.sessionDate ||
      !form.scheduledStart ||
      !form.scheduledEnd
    ) {
      showToast("error", "Please complete all required fields.");
      return;
    }

    if (form.scheduledEnd <= form.scheduledStart) {
      showToast("error", "End time must be later than start time.");
      return;
    }

    try {
      setActionLoading(true);

      await createSession({
        sectionId: Number(form.sectionId),
        roomId: form.roomId ? Number(form.roomId) : null,
        sessionDate: form.sessionDate,
        scheduledStart: form.scheduledStart,
        scheduledEnd: form.scheduledEnd,
      });

      setForm({
        sectionId: "",
        roomId: "",
        sessionDate: getTodayInputValue(),
        scheduledStart: "",
        scheduledEnd: "",
      });

      setShowCreateModal(false);
      await loadData();
      showToast("success", "Attendance session created successfully.");
    } catch (err) {
      console.error("Create session error:", err);
      showToast("error", err.message || "Failed to create session.");
    } finally {
      setActionLoading(false);
    }
  }

  function startQrCountdown(expiresAt, sessionId) {
    clearQrCountdown();

    if (!expiresAt) {
      setCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );

      setCountdown(remaining);

      if (remaining <= 0) {
        clearQrCountdown();
        refreshQr(sessionId, true);
      }
    };

    tick();
    qrCountdownRef.current = window.setInterval(tick, 1000);
  }

  async function handleOpenSession(session) {
    try {
      setActionLoading(true);
      setError("");

      const data = await openSession(session.id);
      const qr = data?.qr || data || {};

      setSelectedSession({
        ...session,
        status: "active",
      });

      setQrDataUrl(qr.qrDataUrl || data?.qrDataUrl || "");
      setQrExpiresAt(qr.expiresAt || data?.expiresAt || null);
      setQrVersion(qr.version ?? data?.version ?? null);
      setShowQrModal(true);

      await loadData();
      startQrCountdown(qr.expiresAt || data?.expiresAt, session.id);

      showToast("success", "Attendance session is now active.");
    } catch (err) {
      console.error("Open session error:", err);
      showToast("error", err.message || "Failed to open session.");
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshQr(sessionId, silent = false) {
    try {
      const data = await refreshSessionQr(sessionId);

      setQrDataUrl(data?.qrDataUrl || data?.qr?.qrDataUrl || "");
      setQrExpiresAt(data?.expiresAt || data?.qr?.expiresAt || null);
      setQrVersion(data?.version ?? data?.qr?.version ?? null);

      startQrCountdown(
        data?.expiresAt || data?.qr?.expiresAt,
        sessionId
      );

      if (!silent) {
        showToast("success", "QR code refreshed.");
      }
    } catch (err) {
      console.error("Refresh QR error:", err);
      clearQrCountdown();
      showToast("error", err.message || "Failed to refresh QR.");
    }
  }

  async function handleCloseSession(session) {
    const confirmed = window.confirm(
      "Are you sure you want to close this attendance session?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await closeSession(session.id);

      clearQrCountdown();
      setShowQrModal(false);
      setQrDataUrl("");
      setQrExpiresAt(null);
      setQrVersion(null);
      setCountdown(0);
      setSelectedSession(null);

      await loadData();
      showToast("success", "Attendance session closed successfully.");
    } catch (err) {
      console.error("Close session error:", err);
      showToast("error", err.message || "Failed to close session.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleViewRoster(session) {
    try {
      setActionLoading(true);

      const data = await getSessionRoster(session.id);

      setSelectedSession(session);
      setRoster(normalizeRoster(data));
      setShowRosterModal(true);
    } catch (err) {
      console.error("Roster error:", err);
      showToast("error", err.message || "Failed to load session roster.");
    } finally {
      setActionLoading(false);
    }
  }

  function closeQrModal() {
    clearQrCountdown();
    setShowQrModal(false);
    setQrDataUrl("");
    setQrExpiresAt(null);
    setQrVersion(null);
    setCountdown(0);
    setSelectedSession(null);
  }

  function closeRosterModal() {
    setShowRosterModal(false);
    setRoster([]);
    setSelectedSession(null);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  const rosterStats = useMemo(() => {
    const values = roster.map((student) =>
      String(
        student.attendance_status ||
          student.status ||
          "absent"
      ).toLowerCase()
    );

    return {
      total: roster.length,
      present: values.filter((value) => value === "present").length,
      late: values.filter((value) => value === "late").length,
      absent: values.filter((value) => value === "absent").length,
      excused: values.filter((value) => value === "excused").length,
    };
  }, [roster]);

  const rosterAttendanceRate =
    rosterStats.total > 0
      ? Math.round(
          ((rosterStats.present + rosterStats.late) /
            rosterStats.total) *
            100
        )
      : 0;

  return (
    <div className="lecturer-sessions-page">
      <aside className="lecturer-sidebar">
        <div className="lecturer-brand">
          <div className="lecturer-brand-mark">A</div>
          <div>
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="lecturer-profile">
          <div className="lecturer-avatar">{initials}</div>
          <div>
            <strong>
              {firstName} {lastName}
            </strong>
            <span>Lecturer</span>
          </div>
        </div>

        <nav className="lecturer-nav">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <span className="nav-icon">D</span>
            Dashboard
          </button>

          <button
            type="button"
            className="active"
            onClick={() => navigate("/lecturer/sessions")}
          >
            <span className="nav-icon">S</span>
            Attendance Sessions
          </button>

          <button
            type="button"
            onClick={() => navigate("/lecturer/attendance")}
          >
            <span className="nav-icon">A</span>
            Attendance
          </button>

          <button
            type="button"
            onClick={() => navigate("/lecturer/reports")}
          >
            <span className="nav-icon">R</span>
            Reports
          </button>
        </nav>

        <div className="lecturer-sidebar-footer">
          <div className="lecturer-sidebar-note">
            <span className="note-badge">LIVE</span>
            <strong>Smart attendance</strong>
            <p>Manage sessions and track attendance in real time.</p>
          </div>

          <button
            type="button"
            className="lecturer-logout"
            onClick={handleLogout}
          >
            <span className="nav-icon">L</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="lecturer-main">
        <header className="lecturer-topbar">
          <div>
            <span className="topbar-kicker">LECTURER PORTAL</span>
            <h1>Attendance Sessions</h1>
            <p>Create, open and manage attendance sessions for your sections.</p>
          </div>

          <div className="topbar-user">
            <div className="topbar-user-text">
              <strong>
                {firstName} {lastName}
              </strong>
              <span>Lecturer</span>
            </div>
            <div className="topbar-avatar">{initials}</div>
          </div>
        </header>

        <section className="lecturer-content">
          <div className="lecturer-hero">
            <div>
              <span className="hero-eyebrow">ATTENDANCE MANAGEMENT</span>
              <h2>Your teaching sessions</h2>
              <p>
                Everything you need to open attendance, display the QR code
                and review the live roster from one place.
              </p>
            </div>

            <button
              type="button"
              className="hero-create-button"
              onClick={() => setShowCreateModal(true)}
            >
              <span>+</span>
              New Session
            </button>
          </div>

          {error && (
            <div className="lecturer-alert lecturer-alert-error">
              <div className="alert-badge">!</div>
              <div>
                <strong>Unable to load sessions</strong>
                <p>{error}</p>
              </div>
              <button type="button" onClick={loadData}>
                Retry
              </button>
            </div>
          )}

          <div className="lecturer-stats-grid">
            <div className="lecturer-stat-card">
              <div className="stat-icon stat-blue">TS</div>
              <div>
                <span>Total sessions</span>
                <strong>{stats.total}</strong>
                <small>All your attendance sessions</small>
              </div>
            </div>

            <div className="lecturer-stat-card">
              <div className="stat-icon stat-green">ON</div>
              <div>
                <span>Active now</span>
                <strong>{stats.active}</strong>
                <small>Sessions currently collecting attendance</small>
              </div>
            </div>

            <div className="lecturer-stat-card">
              <div className="stat-icon stat-purple">SC</div>
              <div>
                <span>Scheduled</span>
                <strong>{stats.scheduled}</strong>
                <small>Sessions waiting to be opened</small>
              </div>
            </div>

            <div className="lecturer-stat-card">
              <div className="stat-icon stat-slate">CL</div>
              <div>
                <span>Completed</span>
                <strong>{stats.closed}</strong>
                <small>Closed sessions in your history</small>
              </div>
            </div>
          </div>

          <section className="lecturer-workspace-card">
            <div className="workspace-heading">
              <div>
                <span className="section-kicker">SESSION CONTROL</span>
                <h3>Attendance sessions</h3>
                <p>
                  Live data from your attendance service and MySQL database.
                </p>
              </div>

              <div className="workspace-count">
                <strong>{filteredSessions.length}</strong>
                <span>shown</span>
              </div>
            </div>

            <div className="lecturer-filters">
              <div className="filter-search">
                <span>Q</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search course, section or room..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
              </select>

              {(search || statusFilter !== "all" || dateFilter !== "all") && (
                <button
                  type="button"
                  className="clear-filters-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="sessions-table-wrap">
              {loading ? (
                <div className="sessions-loading">
                  <div className="loading-ring" />
                  <strong>Loading your sessions</strong>
                  <span>Connecting to the attendance service...</span>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="sessions-empty">
                  <div className="empty-visual">S</div>
                  <h3>No sessions found</h3>
                  <p>
                    {sessions.length === 0
                      ? "Create your first attendance session to start taking attendance."
                      : "Try changing the search or filters."}
                  </p>
                  {sessions.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Session
                    </button>
                  )}
                </div>
              ) : (
                <table className="lecturer-sessions-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Section</th>
                      <th>Room</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <div className="course-cell">
                            <div className="course-code">
                              {session.course_code || "COURSE"}
                            </div>
                            <div>
                              <strong>
                                {session.course_name || "Course"}
                              </strong>
                              <span>Session #{session.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="section-chip">
                            {session.section_name || "-"}
                          </span>
                        </td>

                        <td>
                          <div className="room-cell">
                            <strong>{session.room_name || "No room"}</strong>
                            <span>{session.building || "Location not set"}</span>
                          </div>
                        </td>

                        <td>
                          <div className="schedule-cell">
                            <strong>{formatDate(session.session_date)}</strong>
                            <span>
                              {formatTime(session.scheduled_start)} -{" "}
                              {formatTime(session.scheduled_end)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`lecturer-status ${getStatusClass(
                              session.status
                            )}`}
                          >
                            <span className="status-dot" />
                            {session.status || "Unknown"}
                          </span>
                        </td>

                        <td>
                          <div className="session-actions">
                            {session.status === "scheduled" && (
                              <button
                                type="button"
                                className="action-primary"
                                onClick={() => handleOpenSession(session)}
                                disabled={actionLoading}
                              >
                                Open
                              </button>
                            )}

                            {session.status === "active" && (
                              <button
                                type="button"
                                className="action-primary"
                                onClick={() => handleOpenSession(session)}
                                disabled={actionLoading}
                              >
                                QR
                              </button>
                            )}

                            {session.status !== "cancelled" && (
                              <button
                                type="button"
                                className="action-secondary"
                                onClick={() => handleViewRoster(session)}
                                disabled={actionLoading}
                              >
                                Roster
                              </button>
                            )}

                            {session.status === "active" && (
                              <button
                                type="button"
                                className="action-danger"
                                onClick={() => handleCloseSession(session)}
                                disabled={actionLoading}
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </section>
      </main>

      {toast && (
        <div className={`lecturer-toast lecturer-toast-${toast.type}`}>
          <span className="toast-indicator" />
          <div>
            <strong>{toast.type === "success" ? "Done" : "Action failed"}</strong>
            <p>{toast.message}</p>
          </div>
          <button type="button" onClick={() => setToast(null)}>
            Close
          </button>
        </div>
      )}

      {showCreateModal && (
        <div
          className="lecturer-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="lecturer-create-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-top">
              <div className="modal-title-block">
                <div className="modal-brand-icon">NS</div>
                <div>
                  <span className="section-kicker">LECTURER PORTAL</span>
                  <h2>Create Attendance Session</h2>
                  <p>
                    Schedule a new session and open its secure attendance QR.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSession}>
              <div className="create-form-grid">
                <div className="create-field create-field-wide">
                  <label>Course section</label>
                  <select
                    name="sectionId"
                    value={form.sectionId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select a section</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.course_code || "Course"} —{" "}
                        {section.section_name || `Section ${section.id}`}
                      </option>
                    ))}
                  </select>
                  <small>
                    Only sections returned by your authenticated backend are
                    available here.
                  </small>
                </div>

                <div className="create-field create-field-wide">
                  <label>Room</label>
                  <select
                    name="roomId"
                    value={form.roomId}
                    onChange={handleFormChange}
                  >
                    <option value="">No room selected</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.building || "Building"} —{" "}
                        {room.room_name || room.name || `Room ${room.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="create-field">
                  <label>Session date</label>
                  <input
                    type="date"
                    name="sessionDate"
                    value={form.sessionDate}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="create-field">
                  <label>Start time</label>
                  <input
                    type="time"
                    name="scheduledStart"
                    value={form.scheduledStart}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="create-field">
                  <label>End time</label>
                  <input
                    type="time"
                    name="scheduledEnd"
                    value={form.scheduledEnd}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="create-info">
                <div className="create-info-badge">QR</div>
                <div>
                  <strong>Secure attendance flow</strong>
                  <p>
                    After creation, open the session to generate the QR code
                    used by enrolled students.
                  </p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-secondary-button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-primary-button"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQrModal && (
        <div
          className="lecturer-modal-overlay"
          onClick={closeQrModal}
        >
          <div
            className="lecturer-qr-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="qr-modal-header">
              <div>
                <span className="section-kicker">LIVE ATTENDANCE</span>
                <h2>Attendance QR</h2>
                <p>
                  {selectedSession?.course_code || "Course"}{" "}
                  {selectedSession?.course_name
                    ? `— ${selectedSession.course_name}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeQrModal}
              >
                Close
              </button>
            </div>

            <div className="qr-session-summary">
              <div>
                <span>Section</span>
                <strong>{selectedSession?.section_name || "-"}</strong>
              </div>
              <div>
                <span>Date</span>
                <strong>{formatDate(selectedSession?.session_date)}</strong>
              </div>
              <div>
                <span>Time</span>
                <strong>
                  {formatTime(selectedSession?.scheduled_start)} -{" "}
                  {formatTime(selectedSession?.scheduled_end)}
                </strong>
              </div>
            </div>

            <div className="qr-main">
              <div className="qr-frame">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Attendance QR Code" />
                ) : (
                  <div className="qr-placeholder">
                    <strong>QR unavailable</strong>
                    <span>The server did not return a QR image.</span>
                  </div>
                )}
              </div>

              <div className="qr-meta">
                <div className="qr-countdown">
                  <span>QR expires in</span>
                  <strong>{countdown}s</strong>
                </div>

                <div className="qr-version">
                  <span>QR version</span>
                  <strong>{qrVersion ?? "-"}</strong>
                </div>

                <p>
                  Students enrolled in this section can use this active QR to
                  register attendance.
                </p>

                <div className="qr-actions">
                  <button
                    type="button"
                    className="action-primary"
                    onClick={() => refreshQr(selectedSession.id)}
                  >
                    Refresh QR
                  </button>

                  <button
                    type="button"
                    className="action-danger"
                    onClick={() => handleCloseSession(selectedSession)}
                    disabled={actionLoading}
                  >
                    Close Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRosterModal && (
        <div
          className="lecturer-modal-overlay"
          onClick={closeRosterModal}
        >
          <div
            className="lecturer-roster-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="roster-modal-header">
              <div>
                <span className="section-kicker">SESSION ROSTER</span>
                <h2>Student attendance</h2>
                <p>
                  {selectedSession?.course_code || "Course"}{" "}
                  {selectedSession?.section_name
                    ? `— Section ${selectedSession.section_name}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeRosterModal}
              >
                Close
              </button>
            </div>

            <div className="roster-stat-grid">
              <div>
                <span>Total students</span>
                <strong>{rosterStats.total}</strong>
              </div>
              <div className="roster-stat-present">
                <span>Present</span>
                <strong>{rosterStats.present}</strong>
              </div>
              <div className="roster-stat-late">
                <span>Late</span>
                <strong>{rosterStats.late}</strong>
              </div>
              <div className="roster-stat-absent">
                <span>Absent</span>
                <strong>{rosterStats.absent}</strong>
              </div>
              <div className="roster-stat-rate">
                <span>Attendance rate</span>
                <strong>{rosterAttendanceRate}%</strong>
              </div>
            </div>

            <div className="roster-table-wrap">
              {roster.length === 0 ? (
                <div className="sessions-empty roster-empty">
                  <div className="empty-visual">ST</div>
                  <h3>No students found</h3>
                  <p>
                    There are no active enrollments returned for this session.
                  </p>
                </div>
              ) : (
                <table className="roster-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Student code</th>
                      <th>Attendance</th>
                      <th>Scanned at</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((student) => {
                      const status = String(
                        student.attendance_status ||
                          student.status ||
                          "absent"
                      ).toLowerCase();

                      return (
                        <tr key={student.student_id || student.id}>
                          <td>
                            <div className="roster-student">
                              <div className="roster-avatar">
                                {getInitials(
                                  student.first_name || student.student_name,
                                  student.last_name
                                )}
                              </div>
                              <div>
                                <strong>
                                  {student.student_name ||
                                    `${student.first_name || ""} ${
                                      student.last_name || ""
                                    }`.trim() ||
                                    "Student"}
                                </strong>
                                <span>
                                  {student.email || "Student account"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{student.student_code || "-"}</td>
                          <td>
                            <span
                              className={`roster-status ${getRosterStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>
                            {student.scanned_at
                              ? new Date(
                                  student.scanned_at
                                ).toLocaleString()
                              : "-"}
                          </td>
                          <td>{student.source || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceSessions;
