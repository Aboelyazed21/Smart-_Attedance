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
import { useLanguage } from "../../utils/i18n";
import "./LecturerSession.css";
  
  
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
    const { t } = useLanguage();
  
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
            t("lecSessions.loadError")
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
          t("lecSessions.completeFields")
        );
  
        return;
      }
  
  
      if (
        form.scheduledStart >=
        form.scheduledEnd
      ) {
  
        setError(
          t("lecSessions.endAfterStart")
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
            t("lecSessions.createError")
        );
  
      } finally {
  
        setLoadingAction(false);
  
      }
    }
  
  
    /* =======================================================
       OPEN SESSION / QR PAGE
    ======================================================= */

    async function handleOpenSession(
      session
    ) {

      try {

        setLoadingAction(true);

        setError("");

        /*
         * Open the attendance session first.
         * The backend generates/activates the QR token.
         */
        await openSession(
          session.id
        );


        /*
         * Refresh the sessions list so the
         * session status becomes active locally.
         */
        await loadData();


        /*
         * Navigate to the professional
         * QR attendance page.
         */
        navigate(
          `/lecturer/sessions/${session.id}`
        );

      } catch (err) {

        console.error(
          "Open session error:",
          err
        );

        setError(
          err.message ||
            t("lecSessions.openError")
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
            t("lecSessions.refreshQrError")
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
          t("lecSessions.closeConfirm")
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
            t("lecSessions.closeError")
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
            t("lecSessions.rosterError")
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
          <div className="lecturer-session-page" style={page}>
  
          <header className="lecturer-session-header" style={header}>
  
            <div>
              <div style={eyebrow}>
                {t("lecSessions.eyebrow")}
              </div>
  
              <h1 style={title}>
                {t("nav.sessions")}
              </h1>
  
              <p style={subtitle}>
                {t("lecSessions.loadingSubtitle")}
              </p>
            </div>
  
          </header>
  
  
          <main className="lecturer-session-main" style={main}>
  
            <div className="lecturer-session-loading-card" style={loadingCard}>
  
              <div style={spinner}></div>
  
              <h3>
                {t("lecSessions.loadingTitle")}
              </h3>
  
              <p>
                {t("lecSessions.loadingDesc")}
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
  
        <div className="lecturer-session-page" style={page}>
  
        {/* ===================================================
            HEADER
        =================================================== */}
  
        <header className="lecturer-session-header" style={header}>
  
          <div>
  
            <div style={eyebrow}>
              {t("lecSessions.eyebrow")}
            </div>
  
            <h1 style={title}>
              {t("nav.sessions")}
            </h1>
  
            <p style={subtitle}>
              {t("lecSessions.subtitle")}
            </p>
  
          </div>
  
  
          <div className="lecturer-session-header-actions" style={headerActions}>
  
            <button
              type="button"
              style={secondaryButton}
              onClick={() =>
                navigate(
                  "/lecturer/sections"
                )
              }
            >
              {t("nav.mySections")}
            </button>
  
  
            <button
              type="button"
              style={secondaryButton}
              onClick={loadData}
            >
              {t("action.refresh")}
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
              {t("lecSessions.createSession")}
            </button>
  
          </div>
  
        </header>
  
  
        {/* ===================================================
            MAIN
        =================================================== */}
  
        <main className="lecturer-session-main" style={main}>
  
          {error && (
  
            <div style={errorBox}>
  
              <strong>
                {t("lecSessions.attention")}
              </strong>
  
              <span>
                {error}
              </span>
  
            </div>
  
          )}
  
  
          {/* SECTION FILTER */}
  
          <section className="lecturer-session-filter" style={filterCard}>
  
            <div>
  
              <span style={filterLabel}>
                {t("lecSessions.sectionEyebrow")}
              </span>
  
              <h3 style={filterTitle}>
                {t("lecSessions.filterTitle")}
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
                {t("lecSessions.allSections")}
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
                      t("lecSessions.courseFallback")}{" "}
                    —{" "}
                    {section.section_name ||
                      t("lecSessions.sectionFallback")}
                  </option>
  
                )
              )}
  
            </select>
  
          </section>
  
  
          {/* =================================================
              EMPTY
          ================================================= */}
  
          {filteredSessions.length === 0 ? (
  
            <div className="lecturer-session-empty-card" style={emptyCard}>
  
              <div style={emptyIcon}>
                —
              </div>
  
              <h2>
                {t("lecSessions.emptyTitle")}
              </h2>
  
              <p>
                {t("lecSessions.emptyDesc")}
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
                {t("lecSessions.createSession")}
              </button>
  
            </div>
  
          ) : (
  
            /* =================================================
                SESSIONS
            ================================================= */
  
            <div className="lecturer-session-grid" style={grid}>
  
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
                      className="lecturer-session-card"
                      style={sessionCard}
                    >
  
                      <div style={sessionTop}>
  
                        <span style={courseBadge}>
                          {section?.course_code ||
                            session.course_code ||
                            t("lecSessions.courseFallback")}
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
                            t("lecSessions.statusScheduled")}
                        </span>
  
                      </div>
  
  
                      <h2 style={sessionTitle}>
                        {section?.course_name ||
                          session.course_name ||
                          t("lecSessions.sessionFallback")}
                      </h2>
  
  
                      <p style={sectionText}>
                        {t("lecSessions.sectionWord")}{" "}
                        {section?.section_name ||
                          session.section_name ||
                          "—"}
                      </p>
  
  
                      <div style={details}>
  
                        <div style={detailRow}>
  
                          <span>
                            {t("lecSessions.dateLabel")}
                          </span>
  
                          <strong>
                            {formatDate(
                              session.session_date
                            )}
                          </strong>
  
                        </div>
  
  
                        <div style={detailRow}>
  
                          <span>
                            {t("lecSessions.timeLabel")}
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
                            {t("lecSessions.roomLabel")}
                          </span>
  
                          <strong>
                            {session.room_name ||
                              session.room ||
                              t("lecSessions.noRoom")}
                          </strong>
  
                        </div>
  
                      </div>
  
  
                      <div className="lecturer-session-card-actions" style={actions}>
  
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
                              ? t("lecSessions.openQr")
                              : t("lecSessions.startAttendance")}
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
                          {t("lecSessions.viewAttendance")}
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
  
          <div className="lecturer-session-overlay" style={overlay}>
  
            <div className="lecturer-session-modal" style={modal}>
  
              <div style={modalHeader}>
  
                <div>
  
                  <span style={modalEyebrow}>
                    {t("lecSessions.newSessionEyebrow")}
                  </span>
  
                  <h2>
                    {t("lecSessions.createTitle")}
                  </h2>
  
                  <p>
                    {t("lecSessions.createDesc")}
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
  
                <div className="lecturer-session-form-grid" style={formGrid}>
  
                  <div style={formGroup}>
  
                    <label>
                      {t("lecSessions.fieldSection")}
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
                        {t("lecSessions.selectSection")}
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
                              t("lecSessions.courseFallback")}{" "}
                            —{" "}
                            {section.section_name ||
                              t("lecSessions.sectionFallback")}
                          </option>
  
                        )
                      )}
  
                    </select>
  
                  </div>
  
  
                  <div style={formGroup}>
  
                    <label>
                      {t("lecSessions.fieldRoom")}
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
                        {t("lecSessions.noRoomSelected")}
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
                              t("lecSessions.roomFallback").replace("{n}", room.id)}
                          </option>
  
                        )
                      )}
  
                    </select>
  
                  </div>
  
  
                  <div style={formGroup}>
  
                    <label>
                      {t("lecSessions.fieldDate")}
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
                      {t("lecSessions.fieldStart")}
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
                      {t("lecSessions.fieldEnd")}
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
  
  
                <div className="lecturer-session-modal-actions" style={modalActions}>
  
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
                    {t("lecSessions.cancel")}
                  </button>
  
  
                  <button
                    type="submit"
                    style={primaryButton}
                    disabled={
                      loadingAction
                    }
                  >
                    {loadingAction
                      ? t("lecSessions.creating")
                      : t("lecSessions.createSession")}
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
  
          <div className="lecturer-session-overlay" style={overlay}>
  
            <div className="lecturer-session-modal lecturer-session-qr-modal" style={qrModal}>
  
              <div style={modalHeader}>
  
                <div>
  
                  <span style={modalEyebrow}>
                    {t("lecSessions.qrEyebrow")}
                  </span>
  
                  <h2>
                    {selectedSession?.course_name ||
                      t("lecSessions.qrFallback")}
                  </h2>
  
                  <p>
                    {t("lecSessions.qrDesc")}
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
  
  
              <div className="lecturer-session-qr-content" style={qrContent}>
  
                {qrDataUrl ? (
  
                  <img
                    src={qrDataUrl}
                    alt={t("lecSessions.qrAlt")}
                    style={qrImage}
                  />
  
                ) : (
  
                  <div style={qrEmpty}>
                    {t("lecSessions.qrUnavailable")}
                  </div>
  
                )}
  
  
                <div style={qrInfo}>
  
                  <div style={liveIndicator}>
                    <span style={liveDot}></span>
                    {t("lecSessions.sessionActive")}
                  </div>
  
  
                  <div style={countdownBox}>
  
                    <span>
                      {t("lecSessions.qrRefreshIn")}
                    </span>
  
                    <strong>
                      {countdown}s
                    </strong>
  
                  </div>
  
  
                  {qrVersion && (
                    <div style={versionText}>
                      {t("lecSessions.qrVersion").replace("{n}", qrVersion)}
                    </div>
                  )}
  
                </div>
  
  
                <div className="lecturer-session-qr-actions" style={qrActions}>
  
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
                    {t("lecSessions.refreshQr")}
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
                    {t("lecSessions.closeSession")}
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
  
          <div className="lecturer-session-overlay" style={overlay}>
  
            <div className="lecturer-session-modal lecturer-session-roster-modal" style={rosterModal}>
  
              <div style={modalHeader}>
  
                <div>
  
                  <span style={modalEyebrow}>
                    {t("lecSessions.rosterEyebrow")}
                  </span>
  
                  <h2>
                    {t("lecSessions.rosterTitle")}
                  </h2>
  
                  <p>
                    {selectedSession?.course_name ||
                      t("lecSessions.rosterFallback")}
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
                  {t("lecSessions.rosterLoading")}
                </div>
  
              ) : roster.length === 0 ? (
  
                <div style={rosterEmpty}>
                  {t("lecSessions.rosterEmpty")}
                </div>
  
              ) : (
  
                <div className="lecturer-session-table-wrapper" style={tableWrapper}>
  
                  <table style={table}>
  
                    <thead>
  
                      <tr>
  
                        <th>
                          {t("lecSessions.colStudent")}
                        </th>
  
                        <th>
                          {t("lecSessions.colStatus")}
                        </th>
  
                        <th>
                          {t("lecSessions.colTime")}
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
                                        t("lecSessions.studentFallback")}
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
                                      ? t("lecSessions.statusLate")
                                      : t("lecSessions.statusPresent")
                                    : t("lecSessions.statusAbsent")}
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
    width: "100%",
    minHeight: "100%",
    background: "#f6f8fc",
    color: "#172033",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  };
  
  const header = {
    background: "#ffffff",
    borderBottom: "1px solid #e5eaf1",
    padding: "clamp(18px, 4vw, 28px) clamp(16px, 4vw, 36px)",
    boxSizing: "border-box",
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
    fontSize: "clamp(1.4rem, 1.2rem + 2vw, 1.875rem)",
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
    padding: "clamp(18px, 4vw, 30px) clamp(16px, 4vw, 36px) clamp(32px, 6vw, 50px)",
    boxSizing: "border-box",
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
    minWidth: 0,
    width: "100%",
    maxWidth: 260,
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
      "repeat(auto-fill, minmax(min(310px, 100%), 1fr))",
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
      "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
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
    width: "min(280px, 100%)",
    height: "auto",
    objectFit: "contain",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 10,
    background: "#ffffff",
  };
  
  const qrEmpty = {
    width: "min(280px, 100%)",
    aspectRatio: "1",
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