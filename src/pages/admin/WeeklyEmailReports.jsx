import {
  useEffect,
  useState,
} from "react";
import { useLanguage } from "../../utils/i18n";

import {
  getWeeklyEmailSettings,
  updateWeeklyEmailSettings,
  sendWeeklyEmails,
  sendWeeklyTestEmail,
  previewWeeklyEmail,
  getWeeklyEmailLogs,
  retryWeeklyEmail,
  getWeeklyEmailStatus,
} from "../../services/api";

import "./WeeklyEmailReports.css";

const DAY_OPTIONS = [
  { value: 0, en: "Sunday", ar: "الأحد" },
  { value: 1, en: "Monday", ar: "الاثنين" },
  { value: 2, en: "Tuesday", ar: "الثلاثاء" },
  { value: 3, en: "Wednesday", ar: "الأربعاء" },
  { value: 4, en: "Thursday", ar: "الخميس" },
  { value: 5, en: "Friday", ar: "الجمعة" },
  { value: 6, en: "Saturday", ar: "السبت" },
];

function WeeklyEmailReports() {
  const { t, lang } = useLanguage();

  const [status, setStatus] = useState(null);
  const [settings, setSettings] = useState({
    enabled: true,
    day: 5,
    time: "18:00",
    timezone: "Africa/Cairo",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [sendForm, setSendForm] = useState({
    periodStart: "",
    periodEnd: "",
    studentId: "",
    force: false,
  });
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  const [previewId, setPreviewId] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);

  const [logFilter, setLogFilter] = useState("");
  const [logs, setLogs] = useState({ total: 0, logs: [] });
  const [logsLoading, setLogsLoading] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  function dayLabel(value) {
    const found = DAY_OPTIONS.find(
      (day) => day.value === Number(value)
    );

    if (!found) return String(value);

    return lang === "ar" ? found.ar : found.en;
  }

  async function loadAll(filter = logFilter) {
    try {
      setLoading(true);
      setError("");

      const [statusData, settingsData, logsData] =
        await Promise.all([
          getWeeklyEmailStatus(),
          getWeeklyEmailSettings(),
          getWeeklyEmailLogs({
            status: filter || undefined,
            limit: 50,
          }),
        ]);

      setStatus(statusData);
      setSettings({
        enabled: Boolean(settingsData.enabled),
        day: Number(settingsData.day),
        time: settingsData.time,
        timezone: settingsData.timezone,
      });
      setLogs(logsData);
    } catch (err) {
      setError(
        err.message ||
          t("weeklyEmails.failed_to_load")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveSettings(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setNotice("");

      const updated = await updateWeeklyEmailSettings({
        enabled: settings.enabled,
        day: Number(settings.day),
        time: settings.time,
        timezone: settings.timezone,
      });

      setSettings({
        enabled: Boolean(updated.enabled),
        day: Number(updated.day),
        time: updated.time,
        timezone: updated.timezone,
      });
      setStatus((prev) =>
        prev ? { ...prev, settings: updated } : prev
      );
      setNotice(t("weeklyEmails.settings_saved"));
    } catch (err) {
      setError(
        err.message || t("weeklyEmails.failed_to_save")
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(dryRun) {
    try {
      setSending(true);
      setError("");
      setSendResult(null);

      const payload = {
        periodStart: sendForm.periodStart || undefined,
        periodEnd: sendForm.periodEnd || undefined,
        studentId: sendForm.studentId
          ? Number(sendForm.studentId)
          : undefined,
        force: sendForm.force,
        dryRun,
      };

      const data = await sendWeeklyEmails(payload);

      setSendResult(data.summary || data);
      setNotice(
        dryRun
          ? t("weeklyEmails.dry_run_done")
          : t("weeklyEmails.send_done")
      );

      const logsData = await getWeeklyEmailLogs({
        status: logFilter || undefined,
        limit: 50,
      });
      setLogs(logsData);

      const statusData = await getWeeklyEmailStatus();
      setStatus(statusData);
    } catch (err) {
      setError(
        err.message || t("weeklyEmails.failed_to_send")
      );
    } finally {
      setSending(false);
    }
  }

  async function handleTest(event) {
    event.preventDefault();

    try {
      setTesting(true);
      setError("");
      setNotice("");

      await sendWeeklyTestEmail(testTo);
      setNotice(t("weeklyEmails.test_sent"));
    } catch (err) {
      setError(
        err.message || t("weeklyEmails.failed_to_send")
      );
    } finally {
      setTesting(false);
    }
  }

  async function handlePreview(event) {
    event.preventDefault();

    try {
      setPreviewing(true);
      setError("");
      setPreview(null);

      const data = await previewWeeklyEmail({
        studentId: Number(previewId),
      });

      setPreview(data);
    } catch (err) {
      setError(
        err.message ||
          t("weeklyEmails.failed_to_preview")
      );
    } finally {
      setPreviewing(false);
    }
  }

  async function handleFilterChange(value) {
    setLogFilter(value);

    try {
      setLogsLoading(true);

      const logsData = await getWeeklyEmailLogs({
        status: value || undefined,
        limit: 50,
      });

      setLogs(logsData);
    } catch (err) {
      setError(
        err.message ||
          t("weeklyEmails.failed_to_load")
      );
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleRetry(id) {
    try {
      setRetryingId(id);
      setError("");

      await retryWeeklyEmail(id);
      setNotice(t("weeklyEmails.retry_done"));

      const logsData = await getWeeklyEmailLogs({
        status: logFilter || undefined,
        limit: 50,
      });
      setLogs(logsData);
    } catch (err) {
      setError(
        err.message || t("weeklyEmails.failed_to_retry")
      );
    } finally {
      setRetryingId(null);
    }
  }

  if (loading) {
    return (
      <div className="weekly-emails-page">
        <p className="weekly-emails-muted">
          {t("weeklyEmails.loading")}
        </p>
      </div>
    );
  }

  const last = status?.lastExecution;

  return (
    <div className="weekly-emails-page">
      <header className="weekly-emails-header">
        <div>
          <h1>{t("weeklyEmails.title")}</h1>
          <p className="weekly-emails-muted">
            {t("weeklyEmails.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="weekly-emails-btn weekly-emails-btn-secondary"
          onClick={() => loadAll()}
        >
          {t("action.refresh")}
        </button>
      </header>

      {error && (
        <div className="weekly-emails-alert weekly-emails-alert-error">
          {error}
        </div>
      )}

      {notice && (
        <div className="weekly-emails-alert weekly-emails-alert-success">
          {notice}
        </div>
      )}

      {/* ================= STATUS ================= */}
      <section className="weekly-emails-card">
        <h2>{t("weeklyEmails.last_execution")}</h2>

        {!status?.emailConfigured && (
          <p className="weekly-emails-warning">
            {t("weeklyEmails.resend_missing")}
          </p>
        )}

        {last ? (
          <div className="weekly-emails-stats">
            <div className="weekly-emails-stat">
              <span>{t("weeklyEmails.period")}</span>
              <strong>
                {String(last.period_start).slice(0, 10)}
                {" → "}
                {String(last.period_end).slice(0, 10)}
              </strong>
            </div>

            <div className="weekly-emails-stat">
              <span>{t("weeklyEmails.sent")}</span>
              <strong className="weekly-emails-green">
                {last.sent ?? 0}
              </strong>
            </div>

            <div className="weekly-emails-stat">
              <span>{t("weeklyEmails.failed")}</span>
              <strong className="weekly-emails-red">
                {last.failed ?? 0}
              </strong>
            </div>

            <div className="weekly-emails-stat">
              <span>{t("weeklyEmails.skipped")}</span>
              <strong>{last.skipped ?? 0}</strong>
            </div>

            <div className="weekly-emails-stat">
              <span>{t("weeklyEmails.total")}</span>
              <strong>{last.total ?? 0}</strong>
            </div>
          </div>
        ) : (
          <p className="weekly-emails-muted">
            {t("weeklyEmails.no_runs_yet")}
          </p>
        )}
      </section>

      {/* ================= SETTINGS ================= */}
      <section className="weekly-emails-card">
        <h2>{t("weeklyEmails.schedule")}</h2>

        <form
          className="weekly-emails-form"
          onSubmit={handleSaveSettings}
        >
          <label className="weekly-emails-check">
            <input
              type="checkbox"
              checked={Boolean(settings.enabled)}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  enabled: event.target.checked,
                }))
              }
            />
            {t("weeklyEmails.enabled")}
          </label>

          <label>
            {t("weeklyEmails.day")}
            <select
              value={settings.day}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  day: Number(event.target.value),
                }))
              }
            >
              {DAY_OPTIONS.map((day) => (
                <option
                  key={day.value}
                  value={day.value}
                >
                  {lang === "ar" ? day.ar : day.en}
                </option>
              ))}
            </select>
          </label>

          <label>
            {t("weeklyEmails.time")}
            <input
              type="time"
              value={settings.time || ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  time: event.target.value,
                }))
              }
            />
          </label>

          <label>
            {t("weeklyEmails.timezone")}
            <input
              type="text"
              value={settings.timezone || ""}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  timezone: event.target.value,
                }))
              }
            />
          </label>

          <button
            type="submit"
            className="weekly-emails-btn weekly-emails-btn-primary"
            disabled={saving}
          >
            {saving
              ? t("weeklyEmails.saving")
              : t("weeklyEmails.save")}
          </button>
        </form>
      </section>

      {/* ================= MANUAL SEND ================= */}
      <section className="weekly-emails-card">
        <h2>{t("weeklyEmails.manual_send")}</h2>

        <div className="weekly-emails-form">
          <label>
            {t("weeklyEmails.period_start")}
            <input
              type="date"
              value={sendForm.periodStart}
              onChange={(event) =>
                setSendForm((prev) => ({
                  ...prev,
                  periodStart: event.target.value,
                }))
              }
            />
          </label>

          <label>
            {t("weeklyEmails.period_end")}
            <input
              type="date"
              value={sendForm.periodEnd}
              onChange={(event) =>
                setSendForm((prev) => ({
                  ...prev,
                  periodEnd: event.target.value,
                }))
              }
            />
          </label>

          <label>
            {t("weeklyEmails.student_id")}
            <input
              type="number"
              min="1"
              placeholder={t(
                "weeklyEmails.student_id_hint"
              )}
              value={sendForm.studentId}
              onChange={(event) =>
                setSendForm((prev) => ({
                  ...prev,
                  studentId: event.target.value,
                }))
              }
            />
          </label>

          <label className="weekly-emails-check">
            <input
              type="checkbox"
              checked={sendForm.force}
              onChange={(event) =>
                setSendForm((prev) => ({
                  ...prev,
                  force: event.target.checked,
                }))
              }
            />
            {t("weeklyEmails.force")}
          </label>

          <div className="weekly-emails-actions">
            <button
              type="button"
              className="weekly-emails-btn weekly-emails-btn-secondary"
              disabled={sending}
              onClick={() => handleSend(true)}
            >
              {t("weeklyEmails.dry_run")}
            </button>

            <button
              type="button"
              className="weekly-emails-btn weekly-emails-btn-primary"
              disabled={sending}
              onClick={() => handleSend(false)}
            >
              {sending
                ? t("weeklyEmails.sending")
                : t("weeklyEmails.send_now")}
            </button>
          </div>
        </div>

        {sendResult && (
          <p className="weekly-emails-muted">
            {t("weeklyEmails.sent")}: {sendResult.sent}
            {" · "}
            {t("weeklyEmails.failed")}:{" "}
            {sendResult.failed}
            {" · "}
            {t("weeklyEmails.skipped")}:{" "}
            {sendResult.skipped}
          </p>
        )}
      </section>

      {/* ================= TEST + PREVIEW ================= */}
      <section className="weekly-emails-grid">
        <div className="weekly-emails-card">
          <h2>{t("weeklyEmails.test_email")}</h2>

          <form
            className="weekly-emails-form"
            onSubmit={handleTest}
          >
            <label>
              {t("weeklyEmails.recipient")}
              <input
                type="email"
                required
                value={testTo}
                onChange={(event) =>
                  setTestTo(event.target.value)
                }
              />
            </label>

            <button
              type="submit"
              className="weekly-emails-btn weekly-emails-btn-secondary"
              disabled={testing}
            >
              {testing
                ? t("weeklyEmails.sending")
                : t("weeklyEmails.send_test")}
            </button>
          </form>
        </div>

        <div className="weekly-emails-card">
          <h2>{t("weeklyEmails.preview")}</h2>

          <form
            className="weekly-emails-form"
            onSubmit={handlePreview}
          >
            <label>
              {t("weeklyEmails.student_id")}
              <input
                type="number"
                min="1"
                required
                value={previewId}
                onChange={(event) =>
                  setPreviewId(event.target.value)
                }
              />
            </label>

            <button
              type="submit"
              className="weekly-emails-btn weekly-emails-btn-secondary"
              disabled={previewing}
            >
              {previewing
                ? t("weeklyEmails.loading")
                : t("weeklyEmails.show_preview")}
            </button>
          </form>
        </div>
      </section>

      {preview && (
        <section className="weekly-emails-card">
          <h2>{preview.subject}</h2>

          <p className="weekly-emails-muted">
            {preview.data?.studentName}
            {" · "}
            {preview.data?.totalSessions}{" "}
            {t("weeklyEmails.total")}
            {" · "}
            {preview.data?.attendanceRate ?? "—"}%
          </p>

          <iframe
            title="weekly-email-preview"
            className="weekly-emails-preview"
            srcDoc={preview.html}
          />
        </section>
      )}

      {/* ================= LOGS ================= */}
      <section className="weekly-emails-card">
        <h2>{t("weeklyEmails.history")}</h2>

        <div className="weekly-emails-form weekly-emails-form-inline">
          <label>
            {t("weeklyEmails.status_filter")}
            <select
              value={logFilter}
              onChange={(event) =>
                handleFilterChange(event.target.value)
              }
            >
              <option value="">
                {t("weeklyEmails.all")}
              </option>
              <option value="sent">
                {t("weeklyEmails.sent")}
              </option>
              <option value="failed">
                {t("weeklyEmails.failed")}
              </option>
              <option value="skipped">
                {t("weeklyEmails.skipped")}
              </option>
              <option value="pending">
                {t("weeklyEmails.pending")}
              </option>
            </select>
          </label>

          <span className="weekly-emails-muted">
            {t("weeklyEmails.total")}: {logs.total ?? 0}
          </span>
        </div>

        {logsLoading ? (
          <p className="weekly-emails-muted">
            {t("weeklyEmails.loading")}
          </p>
        ) : (
          <div className="weekly-emails-table-wrap">
            <table className="weekly-emails-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>
                    {t("weeklyEmails.student_id")}
                  </th>
                  <th>{t("weeklyEmails.period")}</th>
                  <th>{t("weeklyEmails.email")}</th>
                  <th>
                    {t("weeklyEmails.status_filter")}
                  </th>
                  <th>{t("weeklyEmails.error")}</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {(logs.logs || []).map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      {row.student_name ||
                        row.student_id}
                    </td>
                    <td>
                      {String(row.period_start).slice(
                        0,
                        10
                      )}
                      {" → "}
                      {String(row.period_end).slice(
                        0,
                        10
                      )}
                    </td>
                    <td className="weekly-emails-email">
                      {row.email || "—"}
                    </td>
                    <td>
                      <span
                        className={`weekly-emails-pill weekly-emails-pill-${row.status}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="weekly-emails-email">
                      {row.status === "failed"
                        ? String(row.error || "").slice(
                            0,
                            80
                          )
                        : "—"}
                    </td>
                    <td>
                      {row.status === "failed" && (
                        <button
                          type="button"
                          className="weekly-emails-btn weekly-emails-btn-small"
                          disabled={
                            retryingId === row.id
                          }
                          onClick={() =>
                            handleRetry(row.id)
                          }
                        >
                          {t("weeklyEmails.retry")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {!(logs.logs || []).length && (
                  <tr>
                    <td
                      colSpan="7"
                      className="weekly-emails-muted"
                    >
                      {t("weeklyEmails.no_logs")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="weekly-emails-muted">
        {t("weeklyEmails.schedule_note")}{" "}
        {dayLabel(settings.day)} {settings.time}{" "}
        {settings.timezone}
      </p>
    </div>
  );
}

export default WeeklyEmailReports;
