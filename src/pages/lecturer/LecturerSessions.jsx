import {
    useEffect,
    useRef,
    useState,
  } from "react";
  
  import {
    getSessions,
    createSession,
    openSession,
    refreshSessionQr,
    closeSession,
    getSessionRoster,
    getRooms,
    getLecturerEnrollmentSections,
  } from "../../services/api";
  
  import { useNavigate } from "react-router-dom";
  
  
  /* =========================================================
     HELPERS
  ========================================================= */
  
  function formatDate(date) {
    if (!date) return "—";
  
    const value = new Date(date);
  
    if (Number.isNaN(value.getTime())) {
      return date;
    }
  
    return value.toLocaleDateString();
  }
  
  
  function formatTime(time) {
    if (!time) return "—";
  
    return String(time).substring(0, 5);
  }
  
  
  function normalizeArray(data, key) {
    if (Array.isArray(data)) {
      return data;
    }
  
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  
    if (Array.isArray(data?.data)) {
      return data.data;
    }
  
    if (Array.isArray(data?.data?.[key])) {
      return data.data[key];
    }
  
    return [];
  }
  
  
  /* =========================================================
     COMPONENT
  ========================================================= */
  
  export default function LecturerSessions() {
  
    const navigate = useNavigate();
  
    /* =======================================================
       DATA
    ======================================================= */
  
    const [sessions, setSessions] = useState([]);
  
    const [sections, setSections] = useState([]);
  
    const [rooms, setRooms] = useState([]);
  
    const [selectedSectionId, setSelectedSectionId] =
      useState("all");
  
  
    /* =======================================================
       UI
    ======================================================= */
  
    const [loading, setLoading] =
      useState(true);
  
    const [error, setError] =
      useState("");
  
    const [showCreateModal, setShowCreateModal] =
      useState(false);
  
    const [showQrModal, setShowQrModal] =
      useState(false);
  
    const [showRosterModal, setShowRosterModal] =
      useState(false);
  
    const [loadingAction, setLoadingAction] =
      useState(false);
  
  
    /* =======================================================
       SELECTED SESSION
    ======================================================= */
  
    const [selectedSession, setSelectedSession] =
      useState(null);
  
  
    /* =======================================================
       ROSTER
    ======================================================= */
  
    const [roster, setRoster] =
      useState([]);
  
    const [loadingRoster, setLoadingRoster] =
      useState(false);
  
  
    /* =======================================================
       QR
    ======================================================= */
  
    const [qrDataUrl, setQrDataUrl] =
      useState("");
  
    const [qrExpiresAt, setQrExpiresAt] =
      useState(null);
  
    const [qrVersion, setQrVersion] =
      useState(null);
  
    const [countdown, setCountdown] =
      useState(0);
  
    const qrTimerRef =
      useRef(null);
  
    const countdownTimerRef =
      useRef(null);
  
  
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
          getLecturerEnrollmentSections(),
          getRooms(),
        ]);
  
        const allSessions =
          normalizeArray(
            sessionsResult,
            "sessions"
          );
  
        const lecturerSections =
          normalizeArray(
            sectionsResult,
            "sections"
          );
  
        const allRooms =
          normalizeArray(
            roomsResult,
            "rooms"
          );
  
  
        /*
          Only sections owned by this lecturer.
        */
  
        const lecturerSectionIds =
          new Set(
            lecturerSections.map(
              (section) =>
                Number(
                  section.section_id ??
                  section.id
                )
            )
          );
  
  
        /*
          Only sessions belonging to
          lecturer sections.
        */
  
        const lecturerSessions =
          allSessions.filter(
            (session) =>
              lecturerSectionIds.has(
                Number(
                  session.section_id
                )
              )
          );
  
  
        setSessions(
          lecturerSessions
        );
  
        setSections(
          lecturerSections
        );
  
        setRooms(
          allRooms
        );
  
      } catch (err) {
  
        console.error(
          "Lecturer sessions load error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to load attendance sessions."
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
        clearTimeout(
          qrTimerRef.current
        );
  
        qrTimerRef.current = null;
      }
  
  
      if (countdownTimerRef.current) {
        clearInterval(
          countdownTimerRef.current
        );
  
        countdownTimerRef.current = null;
      }
    }
  
  
    /* =======================================================
       FORM
    ======================================================= */
  
    function handleFormChange(event) {
  
      const {
        name,
        value,
      } = event.target;
  
      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    }
  
  
    /* =======================================================
       CREATE SESSION
    ======================================================= */
  
    async function handleCreateSession(event) {
  
      event.preventDefault();
  
      setError("");
  
      if (
        !form.sectionId ||
        !form.sessionDate ||
        !form.scheduledStart ||
        !form.scheduledEnd
      ) {
  
        setError(
          "Please complete all required session fields."
        );
  
        return;
      }
  
  
      if (
        form.scheduledStart >=
        form.scheduledEnd
      ) {
  
        setError(
          "End time must be after start time."
        );
  
        return;
      }
  
  
      try {
  
        setLoadingAction(true);
  
        await createSession({
          sectionId:
            Number(
              form.sectionId
            ),
  
          roomId:
            form.roomId
              ? Number(form.roomId)
              : null,
  
          sessionDate:
            form.sessionDate,
  
          scheduledStart:
            form.scheduledStart,
  
          scheduledEnd:
            form.scheduledEnd,
        });
  
  
        setForm({
          sectionId: "",
          roomId: "",
          sessionDate: "",
          scheduledStart: "",
          scheduledEnd: "",
        });
  
  
        setShowCreateModal(
          false
        );
  
  
        await loadData();
  
      } catch (err) {
  
        console.error(
          "Create session error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to create session."
        );
  
      } finally {
  
        setLoadingAction(false);
  
      }
    }
  
  
    /* =======================================================
       OPEN SESSION / QR
    ======================================================= */
  
    async function handleOpenSession(
      session
    ) {
  
      try {
  
        setLoadingAction(true);
  
        setError("");
  
        const data =
          await openSession(
            session.id
          );
  
  
        const qr =
          data?.qr || {};
  
  
        setSelectedSession({
          ...session,
          status: "active",
        });
  
  
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
  
  
        setShowQrModal(
          true
        );
  
  
        await loadData();
  
  
        startQrCountdown(
          qr.expiresAt ||
          data?.expiresAt,
          session.id
        );
  
      } catch (err) {
  
        console.error(
          "Open session error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to open attendance session."
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
  
  
      function updateCountdown() {
  
        const remaining =
          Math.max(
            0,
            Math.ceil(
              (
                new Date(
                  expiresAt
                ).getTime() -
                Date.now()
              ) / 1000
            )
          );
  
  
        setCountdown(
          remaining
        );
  
  
        if (remaining <= 0) {
  
          refreshQr(
            sessionId
          );
  
          return;
        }
      }
  
  
      updateCountdown();
  
  
      countdownTimerRef.current =
        setInterval(
          updateCountdown,
          1000
        );
  
  
      qrTimerRef.current =
        setTimeout(
          () => {
            refreshQr(
              sessionId
            );
          },
          Math.max(
            1000,
            new Date(
              expiresAt
            ).getTime() -
            Date.now()
          )
        );
    }
  
  
    /* =======================================================
       REFRESH QR
    ======================================================= */
  
    async function refreshQr(
      sessionId
    ) {
  
      try {
  
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
  
  
        startQrCountdown(
          qr.expiresAt ||
          data?.expiresAt,
          sessionId
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
  
        setShowQrModal(
          false
        );
  
        setQrDataUrl("");
  
        setQrExpiresAt(null);
  
        setQrVersion(null);
  
        setCountdown(0);
  
  
        await loadData();
  
      } catch (err) {
  
        console.error(
          "Close session error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to close session."
        );
  
      } finally {
  
        setLoadingAction(false);
  
      }
    }
  
  
    /* =======================================================
       ROSTER
    ======================================================= */
  
    async function handleOpenRoster(
      session
    ) {
  
      try {
  
        setLoadingRoster(true);
  
        setError("");
  
        const data =
          await getSessionRoster(
            session.id
          );
  
  
        const rows =
          normalizeArray(
            data,
            "roster"
          );
  
  
        setSelectedSession(
          session
        );
  
        setRoster(
          rows
        );
  
        setShowRosterModal(
          true
        );
  
      } catch (err) {
  
        console.error(
          "Roster error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to load attendance roster."
        );
  
      } finally {
  
        setLoadingRoster(false);
  
      }
    }
  
  
    /* =======================================================
       FILTER
    ======================================================= */
  
    const filteredSessions =
      selectedSectionId === "all"
        ? sessions
        : sessions.filter(
            (session) =>
              Number(
                session.section_id
              ) ===
              Number(
                selectedSectionId
              )
          );
  
  
    /* =======================================================
       STATUS
    ======================================================= */
  
    function getStatusClass(
      status
    ) {
  
      const value =
        String(
          status || ""
        ).toLowerCase();
  
      if (
        value === "active"
      ) {
        return "active";
      }
  
      if (
        value === "closed"
      ) {
        return "closed";
      }
  
      if (
        value === "scheduled"
      ) {
        return "scheduled";
      }
  
      return "default";
    }
  
  
    /* =======================================================
       LOADING
    ======================================================= */
  
    if (loading) {
  
      return (
        <div style={page}>
  
          <header style={header}>
  
            <div>
              <div style={eyebrow}>
                LECTURER PORTAL
              </div>
  
              <h1 style={title}>
                Attendance Sessions
              </h1>
  
              <p style={subtitle}>
                Manage attendance sessions
                and QR attendance.
              </p>
            </div>
  
          </header>
  
  
          <main style={main}>
  
            <div style={loadingCard}>
  
              <div style={spinner}></div>
  
              <h3>
                Loading sessions
              </h3>
  
              <p>
                Preparing your attendance
                sessions.
              </p>
  
            </div>
  
          </main>
  
        </div>
      );
    }
  
  
    /* =======================================================
       RENDER
    ======================================================= */
  
    return (
  
      <div style={page}>
  
        {/* ===================================================
            HEADER
        =================================================== */}
  
        <header style={header}>
  
          <div>
  
            <div style={eyebrow}>
              LECTURER PORTAL
            </div>
  
            <h1 style={title}>
              Attendance Sessions
            </h1>
  
            <p style={subtitle}>
              Create sessions, open QR attendance,
              and monitor your students.
            </p>
  
          </div>
  
  
          <div style={headerActions}>
  
            <button
              type="button"
              style={secondaryButton}
              onClick={() =>
                navigate(
                  "/lecturer/sections"
                )
              }
            >
              My Sections
            </button>
  
  
            <button
              type="button"
              style={secondaryButton}
              onClick={loadData}
            >
              Refresh
            </button>
  
  
            <button
              type="button"
              style={primaryButton}
              onClick={() =>
                setShowCreateModal(
                  true
                )
              }
            >
              Create Session
            </button>
  
          </div>
  
        </header>
  
  
        {/* ===================================================
            MAIN
        =================================================== */}
  
        <main style={main}>
  
          {error && (
  
            <div style={errorBox}>
  
              <strong>
                Attention
              </strong>
  
              <span>
                {error}
              </span>
  
            </div>
  
          )}
  
  
          {/* SECTION FILTER */}
  
          <section style={filterCard}>
  
            <div>
  
              <span style={filterLabel}>
                SECTION
              </span>
  
              <h3 style={filterTitle}>
                Attendance sessions
              </h3>
  
            </div>
  
  
            <select
              value={
                selectedSectionId
              }
              onChange={(event) =>
                setSelectedSectionId(
                  event.target.value
                )
              }
              style={select}
            >
  
              <option value="all">
                All my sections
              </option>
  
              {sections.map(
                (section) => (
  
                  <option
                    key={
                      section.section_id ??
                      section.id
                    }
                    value={
                      section.section_id ??
                      section.id
                    }
                  >
                    {section.course_code ||
                      "COURSE"}{" "}
                    —{" "}
                    {section.section_name ||
                      "Section"}
                  </option>
  
                )
              )}
  
            </select>
  
          </section>
  
  
          {/* =================================================
              EMPTY
          ================================================= */}
  
          {filteredSessions.length === 0 ? (
  
            <div style={emptyCard}>
  
              <div style={emptyIcon}>
                —
              </div>
  
              <h2>
                No attendance sessions
              </h2>
  
              <p>
                Create your first attendance
                session to start taking attendance.
              </p>
  
              <button
                type="button"
                style={primaryButton}
                onClick={() =>
                  setShowCreateModal(
                    true
                  )
                }
              >
                Create Session
              </button>
  
            </div>
  
          ) : (
  
            /* =================================================
                SESSIONS
            ================================================= */
  
            <div style={grid}>
  
              {filteredSessions.map(
                (session) => {
  
                  const status =
                    String(
                      session.status ||
                      ""
                    ).toLowerCase();
  
  
                  const section =
                    sections.find(
                      (item) =>
                        Number(
                          item.section_id ??
                          item.id
                        ) ===
                        Number(
                          session.section_id
                        )
                    );
  
  
                  return (
  
                    <article
                      key={session.id}
                      style={sessionCard}
                    >
  
                      <div style={sessionTop}>
  
                        <span style={courseBadge}>
                          {section?.course_code ||
                            session.course_code ||
                            "COURSE"}
                        </span>
  
                        <span
                          style={{
                            ...statusBadge,
                            ...(status === "active"
                              ? activeStatus
                              : status === "closed"
                                ? closedStatus
                                : scheduledStatus),
                          }}
                        >
                          {status ||
                            "scheduled"}
                        </span>
  
                      </div>
  
  
                      <h2 style={sessionTitle}>
                        {section?.course_name ||
                          session.course_name ||
                          "Attendance Session"}
                      </h2>
  
  
                      <p style={sectionText}>
                        Section{" "}
                        {section?.section_name ||
                          session.section_name ||
                          "—"}
                      </p>
  
  
                      <div style={details}>
  
                        <div style={detailRow}>
  
                          <span>
                            Date
                          </span>
  
                          <strong>
                            {formatDate(
                              session.session_date
                            )}
                          </strong>
  
                        </div>
  
  
                        <div style={detailRow}>
  
                          <span>
                            Time
                          </span>
  
                          <strong>
                            {formatTime(
                              session.scheduled_start
                            )}
                            {" — "}
                            {formatTime(
                              session.scheduled_end
                            )}
                          </strong>
  
                        </div>
  
  
                        <div style={detailRow}>
  
                          <span>
                            Room
                          </span>
  
                          <strong>
                            {session.room_name ||
                              session.room ||
                              "Not assigned"}
                          </strong>
  
                        </div>
  
                      </div>
  
  
                      <div style={actions}>
  
                        {status !== "closed" && (
  
                          <button
                            type="button"
                            style={primaryButton}
                            onClick={() =>
                              handleOpenSession(
                                session
                              )
                            }
                            disabled={
                              loadingAction
                            }
                          >
                            {status === "active"
                              ? "Open QR"
                              : "Start Attendance"}
                          </button>
  
                        )}
  
  
                        <button
                          type="button"
                          style={outlineButton}
                          onClick={() =>
                            handleOpenRoster(
                              session
                            )
                          }
                        >
                          View Attendance
                        </button>
  
                      </div>
  
                    </article>
  
                  );
                }
              )}
  
            </div>
  
          )}
  
        </main>
  
  
        {/* ===================================================
            CREATE MODAL
        =================================================== */}
  
        {showCreateModal && (
  
          <div style={overlay}>
  
            <div style={modal}>
  
              <div style={modalHeader}>
  
                <div>
  
                  <span style={modalEyebrow}>
                    NEW SESSION
                  </span>
  
                  <h2>
                    Create Attendance Session
                  </h2>
  
                  <p>
                    Set the section, date,
                    time and room.
                  </p>
  
                </div>
  
  
                <button
                  type="button"
                  style={closeButton}
                  onClick={() =>
                    setShowCreateModal(
                      false
                    )
                  }
                >
                  ×
                </button>
  
              </div>
  
  
              <form
                onSubmit={
                  handleCreateSession
                }
              >
  
                <div style={formGrid}>
  
                  <div style={formGroup}>
  
                    <label>
                      Section
                    </label>
  
                    <select
                      name="sectionId"
                      value={
                        form.sectionId
                      }
                      onChange={
                        handleFormChange
                      }
                      style={input}
                      required
                    >
  
                      <option value="">
                        Select section
                      </option>
  
                      {sections.map(
                        (section) => (
  
                          <option
                            key={
                              section.section_id ??
                              section.id
                            }
                            value={
                              section.section_id ??
                              section.id
                            }
                          >
                            {section.course_code ||
                              "COURSE"}{" "}
                            —{" "}
                            {section.section_name ||
                              "Section"}
                          </option>
  
                        )
                      )}
  
                    </select>
  
                  </div>
  
  
                  <div style={formGroup}>
  
                    <label>
                      Room
                    </label>
  
                    <select
                      name="roomId"
                      value={
                        form.roomId
                      }
                      onChange={
                        handleFormChange
                      }
                      style={input}
                    >
  
                      <option value="">
                        No room selected
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
                              ? `${room.building} — `
                              : ""}
                            {room.room_name ||
                              room.roomName ||
                              room.name ||
                              `Room ${room.id}`}
                          </option>
  
                        )
                      )}
  
                    </select>
  
                  </div>
  
  
                  <div style={formGroup}>
  
                    <label>
                      Session Date
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
                      style={input}
                      required
                    />
  
                  </div>
  
  
                  <div style={formGroup}>
  
                    <label>
                      Start Time
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
                      style={input}
                      required
                    />
  
                  </div>
  
  
                  <div style={formGroup}>
  
                    <label>
                      End Time
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
                      style={input}
                      required
                    />
  
                  </div>
  
                </div>
  
  
                <div style={modalActions}>
  
                  <button
                    type="button"
                    style={outlineButton}
                    onClick={() =>
                      setShowCreateModal(
                        false
                      )
                    }
                    disabled={
                      loadingAction
                    }
                  >
                    Cancel
                  </button>
  
  
                  <button
                    type="submit"
                    style={primaryButton}
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
  
          <div style={overlay}>
  
            <div style={qrModal}>
  
              <div style={modalHeader}>
  
                <div>
  
                  <span style={modalEyebrow}>
                    LIVE ATTENDANCE
                  </span>
  
                  <h2>
                    {selectedSession?.course_name ||
                      "Attendance QR"}
                  </h2>
  
                  <p>
                    Students can scan this QR
                    code to record attendance.
                  </p>
  
                </div>
  
  
                <button
                  type="button"
                  style={closeButton}
                  onClick={() => {
                    clearQrTimers();
                    setShowQrModal(false);
                  }}
                >
                  ×
                </button>
  
              </div>
  
  
              <div style={qrContent}>
  
                {qrDataUrl ? (
  
                  <img
                    src={qrDataUrl}
                    alt="Attendance QR Code"
                    style={qrImage}
                  />
  
                ) : (
  
                  <div style={qrEmpty}>
                    QR code unavailable
                  </div>
  
                )}
  
  
                <div style={qrInfo}>
  
                  <div style={liveIndicator}>
                    <span style={liveDot}></span>
                    Session Active
                  </div>
  
  
                  <div style={countdownBox}>
  
                    <span>
                      QR refreshes in
                    </span>
  
                    <strong>
                      {countdown}s
                    </strong>
  
                  </div>
  
  
                  {qrVersion && (
                    <div style={versionText}>
                      QR Version {qrVersion}
                    </div>
                  )}
  
                </div>
  
  
                <div style={qrActions}>
  
                  <button
                    type="button"
                    style={outlineButton}
                    onClick={() =>
                      refreshQr(
                        selectedSession.id
                      )
                    }
                    disabled={
                      loadingAction
                    }
                  >
                    Refresh QR
                  </button>
  
  
                  <button
                    type="button"
                    style={dangerButton}
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
  
              </div>
  
            </div>
  
          </div>
  
        )}
  
  
        {/* ===================================================
            ROSTER MODAL
        =================================================== */}
  
        {showRosterModal && (
  
          <div style={overlay}>
  
            <div style={rosterModal}>
  
              <div style={modalHeader}>
  
                <div>
  
                  <span style={modalEyebrow}>
                    ATTENDANCE
                  </span>
  
                  <h2>
                    Session Roster
                  </h2>
  
                  <p>
                    {selectedSession?.course_name ||
                      "Attendance session"}
                  </p>
  
                </div>
  
  
                <button
                  type="button"
                  style={closeButton}
                  onClick={() =>
                    setShowRosterModal(
                      false
                    )
                  }
                >
                  ×
                </button>
  
              </div>
  
  
              {loadingRoster ? (
  
                <div style={rosterLoading}>
                  Loading attendance...
                </div>
  
              ) : roster.length === 0 ? (
  
                <div style={rosterEmpty}>
                  No attendance records yet.
                </div>
  
              ) : (
  
                <div style={tableWrapper}>
  
                  <table style={table}>
  
                    <thead>
  
                      <tr>
  
                        <th>
                          Student
                        </th>
  
                        <th>
                          Status
                        </th>
  
                        <th>
                          Time
                        </th>
  
                      </tr>
  
                    </thead>
  
  
                    <tbody>
  
                      {roster.map(
                        (student, index) => {
  
                          const attendanceStatus =
                            String(
                              student.status ||
                              student.attendance_status ||
                              "absent"
                            ).toLowerCase();
  
                          const present =
                            attendanceStatus ===
                              "present" ||
                            attendanceStatus ===
                              "late";
  
  
                          return (
  
                            <tr
                              key={
                                student.student_id ||
                                student.id ||
                                index
                              }
                            >
  
                              <td>
  
                                <div style={studentCell}>
  
                                  <div style={avatar}>
                                    {String(
                                      student.student_name ||
                                      student.name ||
                                      "S"
                                    )
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
  
                                  <div>
  
                                    <strong>
                                      {student.student_name ||
                                        student.name ||
                                        "Student"}
                                    </strong>
  
                                    <small>
                                      {student.email ||
                                        student.student_email ||
                                        ""}
                                    </small>
  
                                  </div>
  
                                </div>
  
                              </td>
  
  
                              <td>
  
                                <span
                                  style={{
                                    ...attendanceBadge,
                                    ...(present
                                      ? presentBadge
                                      : absentBadge),
                                  }}
                                >
                                  {present
                                    ? attendanceStatus ===
                                      "late"
                                      ? "Late"
                                      : "Present"
                                    : "Absent"}
                                </span>
  
                              </td>
  
  
                              <td>
  
                                {student.attendance_time ||
                                  student.checked_in_at ||
                                  student.marked_at ||
                                  "—"}
  
                              </td>
  
                            </tr>
  
                          );
  
                        }
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
  
  
  /* =========================================================
     STYLES
  ========================================================= */
  
  const page = {
    minHeight: "100vh",
    background: "#f6f8fc",
    color: "#172033",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  };
  
  const header = {
    background: "#ffffff",
    borderBottom: "1px solid #e5eaf1",
    padding: "28px 36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  };
  
  const eyebrow = {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "1.2px",
    marginBottom: 7,
  };
  
  const title = {
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    letterSpacing: "-0.5px",
  };
  
  const subtitle = {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: 14,
  };
  
  const headerActions = {
    display: "flex",
    alignItems: "center",
    gap: 9,
    flexWrap: "wrap",
  };
  
  const main = {
    maxWidth: 1400,
    margin: "0 auto",
    padding: "30px 36px 50px",
  };
  
  const filterCard = {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 14,
    padding: "18px 22px",
    marginBottom: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
  };
  
  const filterLabel = {
    display: "block",
    color: "#64748b",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1px",
    marginBottom: 5,
  };
  
  const filterTitle = {
    margin: 0,
    fontSize: 18,
  };
  
  const select = {
    minWidth: 260,
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    borderRadius: 9,
    padding: "10px 12px",
    color: "#334155",
    fontSize: 13,
    outline: "none",
  };
  
  const grid = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(310px, 1fr))",
    gap: 20,
  };
  
  const sessionCard = {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 16,
    padding: 22,
    boxShadow:
      "0 4px 14px rgba(15, 23, 42, 0.04)",
  };
  
  const sessionTop = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
  };
  
  const courseBadge = {
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #dbeafe",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
  };
  
  const statusBadge = {
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
  };
  
  const activeStatus = {
    background: "#ecfdf5",
    color: "#047857",
  };
  
  const closedStatus = {
    background: "#f1f5f9",
    color: "#64748b",
  };
  
  const scheduledStatus = {
    background: "#eff6ff",
    color: "#2563eb",
  };
  
  const sessionTitle = {
    margin: "0 0 5px",
    fontSize: 20,
    lineHeight: 1.35,
  };
  
  const sectionText = {
    margin: "0 0 20px",
    color: "#64748b",
    fontSize: 13,
  };
  
  const details = {
    borderTop: "1px solid #eef2f7",
    marginBottom: 20,
  };
  
  const detailRow = {
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    padding: "11px 0",
    borderBottom: "1px solid #eef2f7",
    fontSize: 13,
  };
  
  const actions = {
    display: "flex",
    gap: 9,
  };
  
  const primaryButton = {
    border: 0,
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: 9,
    padding: "10px 15px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
  
  const outlineButton = {
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    color: "#334155",
    borderRadius: 9,
    padding: "10px 15px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
  
  const secondaryButton = {
    border: "1px solid #dbe2ea",
    background: "#ffffff",
    color: "#334155",
    borderRadius: 9,
    padding: "10px 15px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
  
  const dangerButton = {
    border: 0,
    background: "#dc2626",
    color: "#ffffff",
    borderRadius: 9,
    padding: "10px 15px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
  
  const errorBox = {
    background: "#fff7f7",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 12,
    padding: "14px 16px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: 5,
    fontSize: 13,
  };
  
  const emptyCard = {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 16,
    minHeight: 320,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 30,
  };
  
  const emptyIcon = {
    width: 50,
    height: 50,
    borderRadius: 12,
    background: "#f1f5f9",
    color: "#64748b",
    display: "grid",
    placeItems: "center",
    fontSize: 24,
  };
  
  const loadingCard = {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 16,
    minHeight: 320,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };
  
  const spinner = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "3px solid #e2e8f0",
    borderTopColor: "#2563eb",
  };
  
  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  };
  
  const modal = {
    width: "100%",
    maxWidth: 650,
    background: "#ffffff",
    borderRadius: 18,
    boxShadow:
      "0 25px 60px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
  };
  
  const qrModal = {
    width: "100%",
    maxWidth: 650,
    background: "#ffffff",
    borderRadius: 18,
    boxShadow:
      "0 25px 60px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
  };
  
  const rosterModal = {
    width: "100%",
    maxWidth: 850,
    background: "#ffffff",
    borderRadius: 18,
    boxShadow:
      "0 25px 60px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
  };
  
  const modalHeader = {
    padding: "22px 24px",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
  };
  
  const modalEyebrow = {
    color: "#2563eb",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "1px",
  };
  
  const closeButton = {
    width: 34,
    height: 34,
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    borderRadius: 8,
    color: "#64748b",
    fontSize: 22,
    cursor: "pointer",
  };
  
  const formGrid = {
    padding: 24,
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: 18,
  };
  
  const formGroup = {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  };
  
  const input = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dbe2ea",
    borderRadius: 9,
    padding: "11px 12px",
    background: "#ffffff",
    color: "#172033",
    fontSize: 13,
    outline: "none",
  };
  
  const modalActions = {
    padding: "18px 24px",
    borderTop: "1px solid #eef2f7",
    display: "flex",
    justifyContent: "flex-end",
    gap: 9,
  };
  
  const qrContent = {
    padding: 28,
    textAlign: "center",
  };
  
  const qrImage = {
    width: 280,
    height: 280,
    objectFit: "contain",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10,
    background: "#ffffff",
  };
  
  const qrEmpty = {
    width: 280,
    height: 280,
    margin: "0 auto",
    display: "grid",
    placeItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    color: "#64748b",
  };
  
  const qrInfo = {
    marginTop: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  };
  
  const liveIndicator = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    color: "#047857",
    fontSize: 13,
    fontWeight: 700,
  };
  
  const liveDot = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#10b981",
  };
  
  const countdownBox = {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 18px",
    display: "flex",
    gap: 10,
    alignItems: "center",
    color: "#64748b",
    fontSize: 13,
  };
  
  const versionText = {
    color: "#94a3b8",
    fontSize: 11,
  };
  
  const qrActions = {
    marginTop: 22,
    display: "flex",
    justifyContent: "center",
    gap: 9,
  };
  
  const rosterLoading = {
    padding: 50,
    textAlign: "center",
    color: "#64748b",
  };
  
  const rosterEmpty = {
    padding: 50,
    textAlign: "center",
    color: "#64748b",
  };
  
  const tableWrapper = {
    padding: 20,
    overflowX: "auto",
  };
  
  const table = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  };
  
  const studentCell = {
    display: "flex",
    alignItems: "center",
    gap: 10,
  };
  
  const avatar = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#eff6ff",
    color: "#2563eb",
    display: "grid",
    placeItems: "center",
    fontWeight: 700,
  };
  
  const attendanceBadge = {
    display: "inline-block",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 700,
  };
  
  const presentBadge = {
    background: "#ecfdf5",
    color: "#047857",
  };
  
  const absentBadge = {
    background: "#fef2f2",
    color: "#dc2626",
  };