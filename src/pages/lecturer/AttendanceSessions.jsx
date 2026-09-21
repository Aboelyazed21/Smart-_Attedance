import { useEffect, useMemo, useRef, useState } from "react";
import {
  getSessions,
  createSession,
  openSession,
  refreshSessionQr,
  closeSession,
  getSessionRoster,
  getLecturerSections,
  getRooms,
  getLecturerSectionStudents,
  addStudentToLecturerSection,
  removeLecturerEnrollment,
  updateAttendanceCorrection,
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
      student.student_id ?? student.studentId ?? student.id ?? null,
    student_code:
      student.student_code ?? student.studentCode ?? "-",
    first_name:
      student.first_name ?? student.firstName ?? "",
    last_name:
      student.last_name ?? student.lastName ?? "",
    email: student.email ?? "",
    enrollment_status:
      student.enrollment_status ?? student.enrollmentStatus ?? "active",
    attendance_id:
      student.attendance_id ?? student.attendance?.id ?? null,
    attendance_status:
      String(
        student.attendance_status ??
          student.attendance?.status ??
          student.status ??
          "absent"
      ).toLowerCase(),
    source: student.source ?? student.attendance?.source ?? null,
    scanned_at:
      student.scanned_at ?? student.attendance?.scannedAt ?? null,
    qr_version:
      student.qr_version ?? student.attendance?.qrVersion ?? null,
    notes: student.notes ?? student.attendance?.notes ?? null,
  }));
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
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [roster, setRoster] = useState([]);
  const [correctionStudent, setCorrectionStudent] = useState(null);
  const [correctionStatus, setCorrectionStatus] = useState("present");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);

  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [studentsSection, setStudentsSection] = useState(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentActionLoading, setStudentActionLoading] = useState(false);

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
          getLecturerSections(),
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

  function handleOpenCorrection(student) {
    const currentStatus = String(
      student?.attendance_status || "absent"
    ).toLowerCase();

    setCorrectionStudent(student);
    setCorrectionStatus(
      ["present", "absent", "late", "excused"].includes(currentStatus)
        ? currentStatus
        : "present"
    );
    setCorrectionReason("");
    setShowCorrectionModal(true);
  }

  function closeCorrectionModal() {
    setShowCorrectionModal(false);
    setCorrectionStudent(null);
    setCorrectionStatus("present");
    setCorrectionReason("");
  }

  async function handleSaveCorrection(event) {
    event.preventDefault();

    if (!selectedSession?.id || !correctionStudent?.student_id) {
      showToast("error", "Session or student information is missing.");
      return;
    }

    const reason = correctionReason.trim();

    if (!reason) {
      showToast("error", "Please enter a reason for the correction.");
      return;
    }

    try {
      setCorrectionLoading(true);

      await updateAttendanceCorrection(
        correctionStudent.attendance_id || "new",
        {
          sessionId: selectedSession.id,
          studentId: correctionStudent.student_id,
          status: correctionStatus,
          reason,
        }
      );

      const refreshed = await getSessionRoster(selectedSession.id);
      setRoster(normalizeRoster(refreshed));

      closeCorrectionModal();
      showToast("success", "Attendance updated successfully.");
    } catch (err) {
      console.error("Attendance correction error:", err);
      showToast(
        "error",
        err.message || "Failed to update attendance."
      );
    } finally {
      setCorrectionLoading(false);
    }
  }

  async function handleManageStudents(session) {
    const sectionId = Number(
      session?.section_id ||
        session?.sectionId ||
        session?.section?.id
    );

    if (!sectionId) {
      showToast("error", "This session is not linked to a valid section.");
      return;
    }

    try {
      setStudentsLoading(true);
      setStudentSearch("");
      setStudentEmail("");

      const data = await getLecturerSectionStudents(sectionId);

      setStudentsSection(
        data?.section || {
          id: sectionId,
          course_code: session?.course_code,
          course_name: session?.course_name,
          section_name: session?.section_name,
          capacity: session?.capacity,
        }
      );

      setSectionStudents(
        Array.isArray(data)
          ? data
          : data?.students || data?.rows || []
      );

      setShowStudentsModal(true);
    } catch (err) {
      console.error("Load section students error:", err);
      showToast(
        "error",
        err.message || "Failed to load section students."
      );
    } finally {
      setStudentsLoading(false);
    }
  }

  async function handleAddSectionStudent(event) {
    event.preventDefault();

    const email = studentEmail.trim().toLowerCase();
    const sectionId = Number(studentsSection?.id);

    if (!sectionId) {
      showToast("error", "No section selected.");
      return;
    }

    if (!email) {
      showToast("error", "Enter the student's email.");
      return;
    }

    try {
      setStudentActionLoading(true);

      const data = await addStudentToLecturerSection(
        sectionId,
        email
      );

      const refreshed = await getLecturerSectionStudents(sectionId);

      setSectionStudents(
        Array.isArray(refreshed)
          ? refreshed
          : refreshed?.students || refreshed?.rows || []
      );

      setStudentEmail("");

      showToast(
        "success",
        data?.message || "Student added to the section successfully."
      );
    } catch (err) {
      console.error("Add section student error:", err);
      showToast(
        "error",
        err.message || "Failed to add student to the section."
      );
    } finally {
      setStudentActionLoading(false);
    }
  }

  async function handleRemoveSectionStudent(student) {
    const enrollmentId = Number(
      student?.enrollment_id || student?.enrollmentId
    );

    if (!enrollmentId) {
      showToast("error", "Enrollment ID was not returned for this student.");
      return;
    }

    const studentName =
      student?.student_name ||
      `${student?.first_name || ""} ${student?.last_name || ""}`.trim() ||
      "this student";

    const confirmed = window.confirm(
      `Remove ${studentName} from this section?`
    );

    if (!confirmed) return;

    try {
      setStudentActionLoading(true);

      const data = await removeLecturerEnrollment(enrollmentId);

      setSectionStudents((current) =>
        current.map((item) =>
          Number(item.enrollment_id || item.enrollmentId) ===
          enrollmentId
            ? { ...item, enrollment_status: "dropped" }
            : item
        )
      );

      showToast(
        "success",
        data?.message || "Student removed from the section."
      );
    } catch (err) {
      console.error("Remove section student error:", err);
      showToast(
        "error",
        err.message || "Failed to remove student from the section."
      );
    } finally {
      setStudentActionLoading(false);
    }
  }

  function closeStudentsModal() {
    setShowStudentsModal(false);
    setSectionStudents([]);
    setStudentsSection(null);
    setStudentSearch("");
    setStudentEmail("");
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
    closeCorrectionModal();
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
                              <>
                                <button
                                  type="button"
                                  className="action-secondary"
                                  onClick={() => handleManageStudents(session)}
                                  disabled={actionLoading}
                                >
                                  Students
                                </button>

                                <button
                                  type="button"
                                  className="action-secondary"
                                  onClick={() => handleViewRoster(session)}
                                  disabled={actionLoading}
                                >
                                  Roster
                                </button>
                              </>
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
                        {section.course_code || "Course"} â€”{" "}
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
                        {room.building || "Building"} â€”{" "}
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

      {showStudentsModal && (
        <div
          className="lecturer-modal-overlay"
          onClick={closeStudentsModal}
        >
          <div
            className="lecturer-students-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="students-modal-header">
              <div>
                <span className="section-kicker">SECTION MANAGEMENT</span>
                <h2>Students in this section</h2>
                <p>
                  {studentsSection?.course_code || "Course"}{" "}
                  {studentsSection?.section_name
                    ? `â€” Section ${studentsSection.section_name}`
                    : ""}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeStudentsModal}
              >
                Close
              </button>
            </div>

            <div className="students-summary-grid">
              <div>
                <span>Active students</span>
                <strong>
                  {
                    sectionStudents.filter(
                      (student) =>
                        String(
                          student.enrollment_status ||
                            student.status ||
                            ""
                        ).toLowerCase() === "active"
                    ).length
                  }
                </strong>
              </div>

              <div>
                <span>Section capacity</span>
                <strong>
                  {studentsSection?.capacity ?? "Open"}
                </strong>
              </div>

              <div>
                <span>Course</span>
                <strong>{studentsSection?.course_code || "-"}</strong>
              </div>
            </div>

            <form
              className="student-add-form"
              onSubmit={handleAddSectionStudent}
            >
              <div className="student-add-copy">
                <span className="student-add-badge">ADD</span>
                <div>
                  <strong>Add student by email</strong>
                  <p>
                    The student must already have an active student account.
                  </p>
                </div>
              </div>

              <div className="student-add-controls">
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(event) =>
                    setStudentEmail(event.target.value)
                  }
                  placeholder="student@example.com"
                  autoComplete="off"
                />

                <button
                  type="submit"
                  className="action-primary"
                  disabled={studentActionLoading}
                >
                  {studentActionLoading ? "Saving..." : "Add Student"}
                </button>
              </div>
            </form>

            <div className="students-list-toolbar">
              <div>
                <strong>Section roster</strong>
                <span>
                  {sectionStudents.length} enrollment record
                  {sectionStudents.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="student-search">
                <span>Q</span>
                <input
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                  placeholder="Search student or email..."
                />
              </div>
            </div>

            <div className="section-students-table-wrap">
              {studentsLoading ? (
                <div className="students-modal-loading">
                  <div className="loading-ring" />
                  <strong>Loading section students</strong>
                  <span>Reading the current enrollment roster...</span>
                </div>
              ) : (
                (() => {
                  const query = studentSearch.trim().toLowerCase();

                  const visibleStudents = sectionStudents.filter(
                    (student) => {
                      const name =
                        student.student_name ||
                        `${student.first_name || ""} ${
                          student.last_name || ""
                        }`.trim();

                      const haystack = [
                        name,
                        student.email,
                        student.student_code,
                        student.university_id,
                        student.enrollment_status,
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                      return !query || haystack.includes(query);
                    }
                  );

                  if (visibleStudents.length === 0) {
                    return (
                      <div className="students-modal-empty">
                        <div className="empty-visual">ST</div>
                        <h3>No matching students</h3>
                        <p>
                          Add a student by email or change the search text.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <table className="section-students-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student code</th>
                          <th>Enrollment</th>
                          <th>Added</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleStudents.map((student) => {
                          const status = String(
                            student.enrollment_status ||
                              student.status ||
                              "active"
                          ).toLowerCase();

                          const name =
                            student.student_name ||
                            `${student.first_name || ""} ${
                              student.last_name || ""
                            }`.trim() ||
                            "Student";

                          return (
                            <tr
                              key={
                                student.enrollment_id ||
                                student.student_id ||
                                student.id
                              }
                            >
                              <td>
                                <div className="roster-student">
                                  <div className="roster-avatar">
                                    {getInitials(
                                      student.first_name,
                                      student.last_name
                                    )}
                                  </div>

                                  <div>
                                    <strong>{name}</strong>
                                    <span>
                                      {student.email || "Student account"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                {student.student_code || "-"}
                              </td>

                              <td>
                                <span
                                  className={`student-enrollment-status ${
                                    status === "active"
                                      ? "student-enrollment-active"
                                      : "student-enrollment-inactive"
                                  }`}
                                >
                                  <span className="status-dot" />
                                  {status}
                                </span>
                              </td>

                              <td>
                                {student.enrolled_at
                                  ? formatDate(student.enrolled_at)
                                  : "-"}
                              </td>

                              <td>
                                {status === "active" ? (
                                  <button
                                    type="button"
                                    className="student-remove-button"
                                    onClick={() =>
                                      handleRemoveSectionStudent(student)
                                    }
                                    disabled={studentActionLoading}
                                  >
                                    Remove
                                  </button>
                                ) : (
                                  <span className="student-removed-label">
                                    Removed
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
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
                    ? `â€” ${selectedSession.course_name}`
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
                    ? `â€” Section ${selectedSession.section_name}`
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
                      <th>Actions</th>
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
                          <td>
                            <button
                              type="button"
                              className="roster-edit-button"
                              onClick={() => handleOpenCorrection(student)}
                            >
                              Edit attendance
                            </button>
                          </td>
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

      {showCorrectionModal && (
        <div
          className="lecturer-modal-overlay lecturer-correction-overlay"
          onClick={closeCorrectionModal}
        >
          <div
            className="lecturer-correction-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="correction-modal-header">
              <div>
                <span className="section-kicker">MANUAL CORRECTION</span>
                <h2>Update attendance</h2>
                <p>
                  Change the attendance status and record why the correction
                  was made.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeCorrectionModal}
                disabled={correctionLoading}
              >
                Close
              </button>
            </div>

            <form
              className="correction-form"
              onSubmit={handleSaveCorrection}
            >
              <div className="correction-student-card">
                <div className="roster-avatar">
                  {getInitials(
                    correctionStudent?.first_name,
                    correctionStudent?.last_name
                  )}
                </div>
                <div>
                  <strong>
                    {correctionStudent?.first_name || ""}{" "}
                    {correctionStudent?.last_name || ""}
                  </strong>
                  <span>
                    {correctionStudent?.student_code || "-"}
                    {correctionStudent?.email
                      ? ` · ${correctionStudent.email}`
                      : ""}
                  </span>
                </div>
              </div>

              <div className="correction-field">
                <label htmlFor="correction-status">Attendance status</label>
                <select
                  id="correction-status"
                  value={correctionStatus}
                  onChange={(event) => setCorrectionStatus(event.target.value)}
                  disabled={correctionLoading}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="excused">Excused</option>
                </select>
              </div>

              <div className="correction-field">
                <label htmlFor="correction-reason">Reason</label>
                <textarea
                  id="correction-reason"
                  value={correctionReason}
                  onChange={(event) => setCorrectionReason(event.target.value)}
                  placeholder="Example: Student attended but the QR scan failed."
                  rows={4}
                  maxLength={500}
                  disabled={correctionLoading}
                  required
                />
                <span className="correction-hint">
                  A reason is required and will be stored with the attendance
                  record.
                </span>
              </div>

              <div className="correction-actions">
                <button
                  type="button"
                  className="modal-secondary-button"
                  onClick={closeCorrectionModal}
                  disabled={correctionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-primary-button"
                  disabled={correctionLoading}
                >
                  {correctionLoading ? "Saving..." : "Save correction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceSessions;