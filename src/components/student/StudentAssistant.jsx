import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyAttendance,
  getStudentAttendanceSummary,
} from "../../services/api";
import {
  answerAttendanceQuestion,
  deriveWarnings,
  getOverallStats,
  getWeeklySummary,
  toRecords,
} from "../../utils/attendanceInsights";
import "./StudentAssistant.css";

const SUGGESTIONS = [
  "How is my attendance?",
  "Weekly summary",
  "Missed classes",
  "Attendance by course",
];

function getRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return String(user?.role_name || user?.role || "")
      .toLowerCase()
      .trim();
  } catch {
    return "";
  }
}

function normalizeSummary(payload, fallbackRecords) {
  if (
    payload &&
    typeof payload === "object" &&
    payload.overall &&
    payload.weekly
  ) {
    const warnings = Array.isArray(payload.warnings)
      ? payload.warnings
      : deriveWarnings(
          toRecords(payload.records || fallbackRecords),
          payload.weekly
        );
    return {
      overall: payload.overall,
      weekly: payload.weekly,
      warnings,
      byCourse: Array.isArray(payload.byCourse)
        ? payload.byCourse
        : Array.isArray(payload.weekly?.byCourse)
          ? payload.weekly.byCourse
          : [],
      source: "summary",
    };
  }

  const records = toRecords(payload ?? fallbackRecords);
  const overall = getOverallStats(records);
  const weekly = getWeeklySummary(records);
  return {
    overall,
    weekly,
    warnings: deriveWarnings(records, weekly),
    byCourse: [],
    source: "local",
  };
}

export default function StudentAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [role] = useState(getRole);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Hello. I can help you understand your attendance using your recorded sessions. Try a suggested question below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [answering, setAnswering] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const loadedRef = useRef(false);

  const isStudent = role === "student";

  async function loadSummary() {
    if (loadedRef.current || loading) return;
    setLoading(true);
    setLoadError("");
    try {
      let data;
      try {
        data = await getStudentAttendanceSummary();
        setSummary(normalizeSummary(data, []));
      } catch {
        const raw = await getMyAttendance();
        setSummary(normalizeSummary(null, raw));
      }
      loadedRef.current = true;
    } catch (err) {
      setLoadError(
        err?.message || "Could not load your attendance overview."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadSummary();
      const t = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(t);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open ]);

  useEffect(() => {
    const el = listRef.current;
    if (el && open) el.scrollTop = el.scrollHeight;
  }, [messages, answering, open ]);

  const context = useMemo(() => {
    if (!summary) return null;
    return {
      overall: summary.overall,
      weekly: summary.weekly,
      warnings: summary.warnings,
      byCourse: summary.byCourse,
    };
  }, [summary]);

  function send(text) {
    const question = String(text ?? input).trim();
    if (!question || answering) return;
    if (!context) {
      loadSummary();
      return;
    }
    setMessages((items) => [
      ...items,
      { id: `user-${Date.now()}`, role: "user", text: question },
    ]);
    setInput("");
    setAnswering(true);
    setTimeout(() => {
      const answer = answerAttendanceQuestion(question, context);
      setMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: answer,
        },
      ]);
      setAnswering(false);
    }, 300);
  }

  function onSubmit(event) {
    event.preventDefault();
    send(input);
  }

  if (!isStudent) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="student-assistant-fab"
          aria-label="Open Attendance Assistant"
          title="Attendance Assistant"
          onClick={() => setOpen(true)}
        >
          <span
            className="student-assistant-fab-pulse"
            aria-hidden="true"
          />
          <img
            src="/chatbot-launcher.jpg"
            alt=""
            width="46"
            height="46"
            className="student-assistant-fab-img"
            aria-hidden="true"
          />
        </button>
      )}

      {open && (
        <section
          className="student-assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Attendance Assistant"
        >
          <header className="student-assistant-header">
            <img
              src="/chatbot-launcher.jpg"
              alt=""
              width="34"
              height="34"
              className="student-assistant-header-img"
              aria-hidden="true"
            />
            <div className="student-assistant-header-text">
              <strong>Attendance Assistant</strong>
              <span>Your attendance overview</span>
            </div>
            <div className="student-assistant-header-actions">
              <button
                type="button"
                className="student-assistant-full"
                onClick={() => {
                  setOpen(false);
                  navigate("/student/chatbot");
                }}
              >
                Full view
              </button>
              <button
                type="button"
                className="student-assistant-close"
                aria-label="Close Attendance Assistant"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </header>

          {loading && !summary ? (
            <div
              className="student-assistant-state"
              role="status"
            >
              Loading your attendance overview…
            </div>
          ) : loadError && !summary ? (
            <div
              className="student-assistant-state student-assistant-error"
              role="alert"
            >
              <span>{loadError}</span>
              <button type="button" onClick={loadSummary}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {summary && (
                <div className="student-assistant-week">
                  <span>
                    This week: {summary.weekly.attended} of{" "}
                    {summary.weekly.total} · {summary.weekly.rate}%
                    overall {summary.overall.rate}%
                  </span>
                </div>
              )}

              <div
                className="student-assistant-messages"
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-label="Attendance conversation"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "student-assistant-msg user"
                        : "student-assistant-msg assistant"
                    }
                  >
                    <span className="student-assistant-msg-role">
                      {message.role === "user"
                        ? "You"
                        : "Assistant"}
                    </span>
                    <p>{message.text}</p>
                  </div>
                ))}
                {answering && (
                  <div className="student-assistant-msg assistant">
                    <span className="student-assistant-msg-role">
                      Assistant
                    </span>
                    <p className="student-assistant-typing">
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span className="sr-only">
                        Writing answer…
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div
                className="student-assistant-suggest"
                aria-label="Suggested questions"
              >
                {SUGGESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => send(question)}
                    disabled={answering || !context}
                  >
                    {question}
                  </button>
                ))}
              </div>

              <form
                className="student-assistant-form"
                onSubmit={onSubmit}
              >
                <label
                  htmlFor="student-assistant-input"
                  className="sr-only"
                >
                  Ask about your attendance
                </label>
                <input
                  id="student-assistant-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  placeholder="Ask about your attendance…"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={
                    answering || !input.trim() || !context
                  }
                >
                  {answering ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
