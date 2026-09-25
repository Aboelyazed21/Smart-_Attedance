import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyAttendance } from "../../services/api";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";
import "../../components/NotificationBell.css";
import {
  answerAttendanceQuestion,
  assessRisk,
  deriveWarnings,
  getCourseStats,
  getOverallStats,
  getWeeklySummary,
  toRecords,
  SUGGESTED_QUESTIONS,
} from "../../utils/attendanceInsights";
import Footer from "../../components/Footer";
import "../../components/Footer.css";
import StudentMobileNav from "./StudentMobileNav";
import { useLanguage } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";
import "./StudentChatbot.css";

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function StudentChatbot() {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();
  const navigate = useNavigate();
  const user = getSavedUser();
  const firstName = user?.first_name || user?.firstName || t("role.student");
  const lastName = user?.last_name || user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || t("role.student");
  const avatarLetter = (firstName.charAt(0) || "S").toUpperCase();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: t("stuChat.welcome"),
    },
  ]);
  const [input, setInput] = useState("");
  const [answering, setAnswering] = useState(false);
  const listRef = useRef(null);

  function goTo(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setSidebarOpen(false);
    navigate("/logout");
  }

  async function load() {
    try {
      setLoading(true);
      setLoadError("");
      const data = await getMyAttendance();
      setRecords(toRecords(data));
    } catch (err) {
      setLoadError(err?.message || t("stuChat.loadError"));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, answering]);

  const overall = useMemo(() => getOverallStats(records), [records]);
  const weekly = useMemo(() => getWeeklySummary(records), [records]);
  const warnings = useMemo(
    () => deriveWarnings(records, weekly),
    [records, weekly]
  );
  const byCourse = useMemo(() => getCourseStats(records), [records]);
  const risk = useMemo(
    () => assessRisk(records, overall, weekly, warnings, byCourse),
    [records, overall, weekly, warnings, byCourse]
  );
  const atRiskCourses = useMemo(
    () =>
      (risk.courseRisks || []).filter(
        (c) => (c.flag === "danger" || c.flag === "critical") && c.total >= 2
      ),
    [risk]
  );

  function send(text) {
    const question = String(text ?? input).trim();
    if (!question || answering) return;
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text: question },
    ]);
    setInput("");
    setAnswering(true);
    // Small delay so loading state is visible; answer is local + instant.
    setTimeout(() => {
      const answer = answerAttendanceQuestion(question, {
        overall,
        weekly,
        warnings,
        byCourse,
        records,
        risk,
      });
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", text: answer },
      ]);
      setAnswering(false);
    }, 350);
  }

  function onSubmit(e) {
    e.preventDefault();
    send(input);
  }

  const weekRange = useMemo(() => {
    try {
      const s = weekly.start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const en = weekly.end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${s} – ${en}`;
    } catch {
      return "";
    }
  }, [weekly]);

  return (
    <div className="chatbot-page">
      {sidebarOpen && (
        <button
          type="button"
          className="chatbot-overlay"
          aria-label={t("a11y.closeNav")}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="chatbot-sidebar"
        className={sidebarOpen ? "chatbot-sidebar open" : "chatbot-sidebar"}
      >
        <div className="chatbot-brand">
          <div className="chatbot-brand-logo" aria-hidden="true">
            A
          </div>
          <div>
            <strong>{platformName}</strong>
            <span>{t("brand.tagline")}</span>
          </div>
        </div>

        <div className="chatbot-profile">
          <div className="chatbot-avatar" aria-hidden="true">
            {avatarLetter}
          </div>
          <div className="chatbot-profile-info">
            <strong>{fullName}</strong>
            <span>{t("role.student")}</span>
          </div>
        </div>

        <nav className="chatbot-nav" aria-label={t("stuChat.navLabel")}>
          <button type="button" onClick={() => goTo("/dashboard")}>{t("nav.dashboard")}</button>
          <button type="button" onClick={() => goTo("/student/attendance")}>{t("nav.myAttendance")}</button>
          <button type="button" onClick={() => goTo("/student/scan")}>{t("nav.scan")}</button>
          <button
            type="button"
            onClick={() => goTo("/student/correction-requests")}
          >{t("nav.corrections")}</button>
          <button type="button" onClick={() => goTo("/student/profile")}>{t("nav.profile")}</button>
          <button
            type="button"
            className="active"
            aria-current="page"
            onClick={() => goTo("/student/chatbot")}
          >
            {t("stuChat.assistantNav")}
          </button>
        </nav>

        <div className="chatbot-sidebar-bottom">
          <button
            type="button"
            className="chatbot-logout"
            onClick={handleLogout}
          >
            {t("action.logout")}
          </button>
        </div>
      </aside>

      <main className="chatbot-main">
        <header className="chatbot-topbar">
          <button
            type="button"
            className="hamburger"
            aria-expanded={sidebarOpen}
            aria-controls="chatbot-sidebar"
            aria-label={sidebarOpen ? t("a11y.closeNav") : t("a11y.openNav")}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <div className="chatbot-topbar-title">
            <strong>{t("stuChat.title")}</strong>
            <span>{t("stuChat.topbarSub")}</span>
          </div>
          <ThemeToggle />
          <NotificationBell />
          <div className="chatbot-user-area">
            <div className="chatbot-top-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="chatbot-top-user">
              <strong>{fullName}</strong>
              <span>{t("role.student")}</span>
            </div>
          </div>
        </header>

        <section className="chatbot-content">
          <div className="chatbot-hero">
            <img
              src="/chatbot-launcher.jpg"
              alt=""
              width="52"
              height="52"
              className="chatbot-hero-img"
              aria-hidden="true"
            />
            <div>
              <span className="chatbot-eyebrow">{t("stuChat.eyebrow")}</span>
              <h1>{t("stuChat.title")}</h1>
              <p>
                {t("stuChat.heroText").replace("{n}", weekRange ? ` for ${weekRange}` : "")}
              </p>
            </div>
          </div>

          {loadError && (
            <div className="chatbot-error" role="alert">
              <span>{loadError}</span>
              <button type="button" onClick={load}>
                {t("stuChat.tryAgain")}
              </button>
            </div>
          )}

          {!loading && (risk.level === "danger" || risk.level === "critical") && (
            <div
              className={`chatbot-risk risk-${risk.level}`}
              role="alert"
            >
              <span className="chatbot-risk-icon" aria-hidden="true">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v9" />
                  <path d="M12 17h.01" />
                  <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
                </svg>
              </span>
              <div className="chatbot-risk-text">
                <strong>
                  {risk.level === "critical"
                    ? t("stuChat.riskCritical")
                    : t("stuChat.riskHigh")}
                </strong>
                <span>
                  {risk.reasons[0]?.message || ""}
                  {risk.anomalies[0] ? ` ${risk.anomalies[0].message}` : ""}
                </span>
                {atRiskCourses.length > 0 && (
                  <span className="chatbot-risk-courses">
                    {t("stuChat.riskCourses").replace(
                      "{list}",
                      atRiskCourses
                        .map((c) => `${c.course} (${c.rate}%)`)
                        .join(", ")
                    )}
                  </span>
                )}
              </div>
              <span className="chatbot-risk-score">
                {risk.score}/100
              </span>
            </div>
          )}

          <div className="chatbot-summary-grid" aria-live="polite">
            <div className="chatbot-card">
              <span>{t("stuChat.totalWeek")}</span>
              <strong>{loading ? "—" : weekly.total}</strong>
              <small>{weekRange || t("stuChat.currentWeek")}</small>
            </div>
            <div className="chatbot-card">
              <span>{t("stuChat.attended")}</span>
              <strong>{loading ? "—" : weekly.attended}</strong>
              <small>
                {loading
                  ? t("stuChat.loadingShort")
                  : t("stuChat.presentLate").replace("{p}", weekly.present).replace("{l}", weekly.late)}
              </small>
            </div>
            <div className="chatbot-card">
              <span>{t("stuChat.absent")}</span>
              <strong>{loading ? "—" : weekly.absent}</strong>
              <small>{t("stuChat.thisWeek")}</small>
            </div>
            <div className="chatbot-card">
              <span>{t("stuChat.late")}</span>
              <strong>{loading ? "—" : weekly.late}</strong>
              <small>{t("stuChat.thisWeek")}</small>
            </div>
            <div className="chatbot-card">
              <span>{t("stuChat.rate")}</span>
              <strong>{loading ? "—" : `${weekly.rate}%`}</strong>
              <small>{t("stuChat.overallLine").replace("{r}", overall.rate).replace("{s}", overall.total)}</small>
            </div>
            <div className="chatbot-card">
              <span>{t("stuChat.warnings")}</span>
              <strong>{loading ? "—" : warnings.length}</strong>
              <small>{t("stuChat.warningsSub")}</small>
            </div>
          </div>

          {!loading && atRiskCourses.length > 0 && (
            <div className="chatbot-course-flags" aria-label={t("stuChat.courseRiskLabel")}>
              {atRiskCourses.map((c) => (
                <div
                  key={c.course}
                  className={`chatbot-course-flag flag-${c.flag}`}
                >
                  <span className="chatbot-course-flag-dot" aria-hidden="true" />
                  <div>
                    <strong>{c.course}</strong>
                    <small>
                      {c.rate}% · {c.absent}/{c.total} {t("stuChat.absent").toLowerCase()}
                    </small>
                  </div>
                  <span className="chatbot-course-flag-tag">
                    {c.flag === "critical"
                      ? t("stuChat.flagCritical")
                      : t("stuChat.flagDanger")}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="chatbot-panels">
            <section className="chatbot-panel" aria-label={t("stuChat.conversationLabel")}>
              <div className="chatbot-panel-head">
                <h2>{t("stuChat.conversation")}</h2>
                <p>{t("stuChat.conversationSub")}</p>
              </div>

              <div
                className="chatbot-messages"
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-label={t("stuChat.conversationAria")}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === "user"
                        ? "chatbot-msg user"
                        : "chatbot-msg assistant"
                    }
                  >
                    <span className="chatbot-msg-role">
                      {m.role === "user" ? t("stuChat.you") : t("stuChat.assistant")}
                    </span>
                    <p>{m.text}</p>
                  </div>
                ))}
                {answering && (
                  <div className="chatbot-msg assistant" aria-live="polite">
                    <span className="chatbot-msg-role">{t("stuChat.assistant")}</span>
                    <p className="chatbot-typing">
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span className="sr-only">{t("stuChat.writing")}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="chatbot-suggest" aria-label={t("stuChat.suggestLabel")}>
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    disabled={answering || loading}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form className="chatbot-form" onSubmit={onSubmit}>
                <label htmlFor="chatbot-input" className="sr-only">
                  {t("stuChat.inputLabel")}
                </label>
                <input
                  id="chatbot-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t("stuChat.inputPlaceholder")}
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={answering || loading || !input.trim()}
                >
                  {answering ? t("stuChat.sending") : t("stuChat.send")}
                </button>
              </form>
            </section>

            <aside className="chatbot-side" aria-label={t("stuChat.warningsLabel")}>
              <div className="chatbot-panel">
                <div className="chatbot-panel-head">
                  <h2>{t("stuChat.warningsTitle")}</h2>
                  <p>{t("stuChat.warningsText")}</p>
                </div>
                {loading ? (
                  <p className="chatbot-muted">{t("stuChat.loadingWarnings")}</p>
                ) : warnings.length === 0 ? (
                  <div className="chatbot-no-warnings">
                    <strong>{t("stuChat.noWarnings")}</strong>
                    <p>
                      {records.length === 0
                        ? t("stuChat.noWarningsEmpty")
                        : t("stuChat.noWarningsGood")}
                    </p>
                  </div>
                ) : (
                  <ul className="chatbot-warnings">
                    {warnings.map((w) => (
                      <li key={w.id}>
                        <div className="chatbot-warning-head">
                          <strong>{w.type}</strong>
                          <span>{w.date}</span>
                        </div>
                        {w.course && w.course !== "—" && (
                          <small>Course: {w.course}</small>
                        )}
                        <p>{w.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="chatbot-overall">
                  <span>{t("stuChat.overall")}</span>
                  <strong>
                    {overall.total} sessions · {overall.present} present ·{" "}
                    {overall.absent} absent · {overall.late} late ·{" "}
                    {overall.rate}%
                  </strong>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <Footer />
      </main>

      <StudentMobileNav />
    </div>
  );
}

export default StudentChatbot;
