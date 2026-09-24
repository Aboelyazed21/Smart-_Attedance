import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyAttendance } from "../../services/api";
import {
  answerAttendanceQuestion,
  deriveWarnings,
  getOverallStats,
  getWeeklySummary,
  toRecords,
  SUGGESTED_QUESTIONS,
} from "../../utils/attendanceInsights";
import Footer from "../../components/Footer";
import "../../components/Footer.css";
import "./StudentChatbot.css";

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function StudentChatbot() {
  const navigate = useNavigate();
  const user = getSavedUser();
  const firstName = user?.first_name || user?.firstName || "Student";
  const lastName = user?.last_name || user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Student";
  const avatarLetter = (firstName.charAt(0) || "S").toUpperCase();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello. I can help you understand your attendance. Ask about this week, absences, percentage, or warnings. Your answers are based on your recorded sessions.",
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
    navigate("/");
  }

  async function load() {
    try {
      setLoading(true);
      setLoadError("");
      const data = await getMyAttendance();
      setRecords(toRecords(data));
    } catch (err) {
      setLoadError(err?.message || "Failed to load attendance data.");
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
          aria-label="Close menu"
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
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="chatbot-profile">
          <div className="chatbot-avatar" aria-hidden="true">
            {avatarLetter}
          </div>
          <div className="chatbot-profile-info">
            <strong>{fullName}</strong>
            <span>Student</span>
          </div>
        </div>

        <nav className="chatbot-nav" aria-label="Student navigation">
          <button type="button" onClick={() => goTo("/dashboard")}>
            Dashboard
          </button>
          <button type="button" onClick={() => goTo("/student/attendance")}>
            My Attendance
          </button>
          <button type="button" onClick={() => goTo("/student/scan")}>
            Scan Attendance
          </button>
          <button
            type="button"
            onClick={() => goTo("/student/correction-requests")}
          >
            Correction Requests
          </button>
          <button
            type="button"
            className="active"
            aria-current="page"
            onClick={() => goTo("/student/chatbot")}
          >
            Attendance Assistant
          </button>
        </nav>

        <div className="chatbot-sidebar-bottom">
          <button
            type="button"
            className="chatbot-logout"
            onClick={handleLogout}
          >
            Logout
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
            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
          <div className="chatbot-topbar-title">
            <strong>Attendance Assistant</strong>
            <span>Answers use your recorded sessions</span>
          </div>
          <div className="chatbot-user-area">
            <div className="chatbot-top-avatar" aria-hidden="true">
              {avatarLetter}
            </div>
            <div className="chatbot-top-user">
              <strong>{fullName}</strong>
              <span>Student</span>
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
              <span className="chatbot-eyebrow">STUDENT ASSISTANT</span>
              <h1>Attendance Assistant</h1>
              <p>
                Weekly summary and warnings below are calculated from your
                attendance records{weekRange ? ` for ${weekRange}` : ""}.
              </p>
            </div>
          </div>

          {loadError && (
            <div className="chatbot-error" role="alert">
              <span>{loadError}</span>
              <button type="button" onClick={load}>
                Try again
              </button>
            </div>
          )}

          <div className="chatbot-summary-grid" aria-live="polite">
            <div className="chatbot-card">
              <span>Total sessions (week)</span>
              <strong>{loading ? "—" : weekly.total}</strong>
              <small>{weekRange || "Current week"}</small>
            </div>
            <div className="chatbot-card">
              <span>Attended</span>
              <strong>{loading ? "—" : weekly.attended}</strong>
              <small>
                {loading
                  ? "Loading"
                  : `${weekly.present} present · ${weekly.late} late`}
              </small>
            </div>
            <div className="chatbot-card">
              <span>Absent</span>
              <strong>{loading ? "—" : weekly.absent}</strong>
              <small>This week</small>
            </div>
            <div className="chatbot-card">
              <span>Late</span>
              <strong>{loading ? "—" : weekly.late}</strong>
              <small>This week</small>
            </div>
            <div className="chatbot-card">
              <span>Attendance rate</span>
              <strong>{loading ? "—" : `${weekly.rate}%`}</strong>
              <small>{`Overall ${overall.rate}% · ${overall.total} sessions`}</small>
            </div>
            <div className="chatbot-card">
              <span>Warnings</span>
              <strong>{loading ? "—" : warnings.length}</strong>
              <small>Derived from your records</small>
            </div>
          </div>

          <div className="chatbot-panels">
            <section className="chatbot-panel" aria-label="Conversation">
              <div className="chatbot-panel-head">
                <h2>Conversation</h2>
                <p>Ask about absences, percentage, weekly summary, warnings.</p>
              </div>

              <div
                className="chatbot-messages"
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-label="Attendance conversation"
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
                      {m.role === "user" ? "You" : "Assistant"}
                    </span>
                    <p>{m.text}</p>
                  </div>
                ))}
                {answering && (
                  <div className="chatbot-msg assistant" aria-live="polite">
                    <span className="chatbot-msg-role">Assistant</span>
                    <p className="chatbot-typing">
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span className="sr-only">Writing answer…</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="chatbot-suggest" aria-label="Suggested questions">
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
                  Ask about your attendance
                </label>
                <input
                  id="chatbot-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask: How many absences do I have?"
                  autoComplete="off"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={answering || loading || !input.trim()}
                >
                  {answering ? "Sending…" : "Send"}
                </button>
              </form>
            </section>

            <aside className="chatbot-side" aria-label="Warnings summary">
              <div className="chatbot-panel">
                <div className="chatbot-panel-head">
                  <h2>Warnings summary</h2>
                  <p>Calculated from your recorded attendance.</p>
                </div>
                {loading ? (
                  <p className="chatbot-muted">Loading warnings…</p>
                ) : warnings.length === 0 ? (
                  <div className="chatbot-no-warnings">
                    <strong>No warnings</strong>
                    <p>
                      {records.length === 0
                        ? "No attendance records yet. Your warnings will appear here once sessions are recorded."
                        : "Your attendance looks consistent. Keep attending on time."}
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
                  <span>Overall</span>
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
    </div>
  );
}

export default StudentChatbot;
