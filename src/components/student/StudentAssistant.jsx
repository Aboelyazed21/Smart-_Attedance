import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyAttendance,
  getStudentAttendanceSummary,
} from "../../services/api";
import {
  answerAttendanceQuestion,
  assessRisk,
  deriveWarnings,
  getCourseStats,
  getOverallStats,
  getWeeklySummary,
  toRecords,
} from "../../utils/attendanceInsights";
import "./StudentAssistant.css";
import { useLanguage } from "../../utils/i18n";

const SUGGESTIONS = [
  { text: "How is my attendance?", key: "stuAssistant.suggest1" },
  { text: "Weekly summary", key: "stuAssistant.suggest2" },
  { text: "Missed classes", key: "stuAssistant.suggest3" },
  { text: "Attendance by course", key: "stuAssistant.suggest4" },
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
    const records = toRecords(payload.records || fallbackRecords);
    const warnings = Array.isArray(payload.warnings)
      ? payload.warnings
      : deriveWarnings(
          records,
          payload.weekly
        );
    const byCourse = Array.isArray(payload.byCourse)
      ? payload.byCourse
      : Array.isArray(payload.weekly?.byCourse)
        ? payload.weekly.byCourse
        : getCourseStats(records);
    return {
      overall: payload.overall,
      weekly: payload.weekly,
      warnings,
      byCourse,
      records,
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
    byCourse: getCourseStats(records),
    records,
    source: "local",
  };
}

export default function StudentAssistant() {
  const { t } = useLanguage();
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
      text: t("stuAssistant.welcome"),
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
        err?.message || t("stuAssistant.loadError")
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

  // Background risk check: load once for students so the
  // launcher icon can turn red before the panel is opened.
  useEffect(() => {
    if (isStudent && !loadedRef.current) {
      loadSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

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
    const risk = assessRisk(
      summary.records || [],
      summary.overall,
      summary.weekly,
      summary.warnings,
      summary.byCourse || []
    );
    return {
      overall: summary.overall,
      weekly: summary.weekly,
      warnings: summary.warnings,
      byCourse: summary.byCourse,
      records: summary.records || [],
      risk,
    };
  }, [summary]);

  const riskLevel = context?.risk?.level || "safe";
  const isDanger =
    riskLevel === "danger" || riskLevel === "critical";
  const isWatch = riskLevel === "watch";
  const alertCount = useMemo(() => {
    if (!context) return 0;
    const atRisk = (context.risk?.courseRisks || []).filter(
      (c) => (c.flag === "danger" || c.flag === "critical") && c.total >= 2
    ).length;
    return atRisk > 0 ? atRisk : context.warnings.length;
  }, [context]);

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
          className={`student-assistant-fab${isDanger ? " is-danger" : isWatch ? " is-watch" : ""}`}
          aria-label={
            isDanger
              ? t("stuAssistant.openLabelDanger").replace("{n}", alertCount)
              : t("stuAssistant.openLabel")
          }
          title={
            isDanger
              ? t("stuAssistant.riskHigh").replace(
                  "{c}",
                  context?.risk?.worstCourse?.course || ""
                )
              : t("stuAssistant.title")
          }
          onClick={() => setOpen(true)}
        >
          <img
            src="/chatbot-launcher.jpg"
            alt=""
            width="46"
            height="46"
            className="student-assistant-fab-img"
            aria-hidden="true"
          />
          {isDanger && (
            <span
              className="student-assistant-fab-badge"
              aria-hidden="true"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 4v9" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
              </svg>
              {alertCount > 0 ? alertCount : ""}
            </span>
          )}
        </button>
      )}

      {open && (
        <section
          className="student-assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label={t("stuAssistant.title")}
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
              <strong>{t("stuAssistant.title")}</strong>
              <span>{t("stuAssistant.headerSub")}</span>
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
                {t("stuAssistant.fullView")}
              </button>
              <button
                type="button"
                className="student-assistant-close"
                aria-label={t("stuAssistant.closeLabel")}
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
              {t("stuAssistant.loading")}
            </div>
          ) : loadError && !summary ? (
            <div
              className="student-assistant-state student-assistant-error"
              role="alert"
            >
              <span>{loadError}</span>
              <button type="button" onClick={loadSummary}>
                {t("stuAssistant.tryAgain")}
              </button>
            </div>
          ) : (
            <>
              {isDanger && context?.risk && (
                <div
                  className={`student-assistant-risk risk-${context.risk.level}`}
                  role="alert"
                >
                  <span
                    className="student-assistant-risk-icon"
                    aria-hidden="true"
                  >
                    <svg
                      width="15"
                      height="15"
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
                  <div className="student-assistant-risk-text">
                    <strong>
                      {context.risk.level === "critical"
                        ? t("stuAssistant.riskCritical")
                        : t("stuAssistant.riskHigh").replace(
                            "{c}",
                            context.risk.worstCourse?.course || ""
                          )}
                    </strong>
                    <span>
                      {(context.risk.reasons[0]?.message || "") +
                        (context.risk.anomalies[0]
                          ? ` ${context.risk.anomalies[0].message}`
                          : "")}
                    </span>
                  </div>
                </div>
              )}
              {summary && (
                <div className="student-assistant-week">
                  <span>
                    {t("stuAssistant.weekSummary").replace("{a}", summary.weekly.attended).replace("{b}", summary.weekly.total).replace("{c}", summary.weekly.rate).replace("{d}", summary.overall.rate)}
                  </span>
                </div>
              )}

              <div
                className="student-assistant-messages"
                ref={listRef}
                role="log"
                aria-live="polite"
                aria-label={t("stuAssistant.conversationLabel")}
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
                        ? t("stuAssistant.you")
                        : t("stuAssistant.assistant")}
                    </span>
                    <p>{message.text}</p>
                  </div>
                ))}
                {answering && (
                  <div className="student-assistant-msg assistant">
                    <span className="student-assistant-msg-role">
                      {t("stuAssistant.assistant")}
                    </span>
                    <p className="student-assistant-typing">
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span aria-hidden="true" />
                      <span className="sr-only">
                        {t("stuAssistant.writing")}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div
                className="student-assistant-suggest"
                aria-label={t("stuAssistant.suggestLabel")}
              >
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => send(suggestion.text)}
                    disabled={answering || !context}
                  >
                    {t(suggestion.key)}
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
                  {t("stuAssistant.inputLabel")}
                </label>
                <input
                  id="student-assistant-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  placeholder={t("stuAssistant.inputPlaceholder")}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={
                    answering || !input.trim() || !context
                  }
                >
                  {answering ? t("stuAssistant.sending") : t("stuAssistant.send")}
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </>
  );
}
