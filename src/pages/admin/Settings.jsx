import React, { useState } from "react";
import "./Settings.css";
import { useLanguage } from "../../utils/i18n";

function SettingsIcon({ name, size = 16 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),

    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </>
    ),

    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Settings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    systemName: "Attendify",
    universityName: "Badr University in Assiut",
    academicYear: "2025/2026",
    semester: "Fall",

    allowLateAttendance: true,
    lateThreshold: 15,
    qrExpiry: 10,

    emailNotifications: true,
    absenceAlerts: true,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    console.log("Settings saved:", settings);

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="settings-page admin-settings-page">
      {/* ================= MAIN ================= */}
      <main className="settings-main">
        {/* ================= TOP BAR ================= */}
        <header className="settings-topbar">
          <div className="settings-search">
            <span>
              <SettingsIcon name="search" />
            </span>

            <input
              type="text"
              placeholder={t("settings.search_students_courses_sections")}
            />
          </div>

          <div className="settings-user-area">
            <div className="settings-avatar">
              S
            </div>

            <div className="settings-user-info">
              <strong>{t("settings.system_admin")}</strong>
              <span>{t("settings.administrator")}</span>
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <section className="settings-content">
          {/* Page Header */}
          <div className="settings-page-header">
            <div className="settings-title-wrapper">
              <div className="settings-title-icon">
                <SettingsIcon name="gear" size={18} />
              </div>

              <div>
                <h1>{t("settings.settings")}</h1>
                <p>
                  {t("settings.configure_your_system_preferences")}
                </p>
              </div>
            </div>

            <div className="settings-breadcrumb">
              {t("settings.settings_2")}
            </div>
          </div>

          {/* ================= GENERAL SETTINGS ================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <SettingsIcon name="grid" size={18} />
              </div>

              <div>
                <h2>{t("settings.general_settings")}</h2>
                <p>
                  {t("settings.basic_information_about_your_system")}
                </p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label>{t("settings.system_name")}</label>

                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) =>
                    handleChange(
                      "systemName",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="settings-field">
                <label>{t("settings.university_name")}</label>

                <input
                  type="text"
                  value={settings.universityName}
                  onChange={(e) =>
                    handleChange(
                      "universityName",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="settings-field">
                <label>{t("settings.academic_year")}</label>

                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={(e) =>
                    handleChange(
                      "academicYear",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="settings-field">
                <label>{t("settings.semester")}</label>

                <select
                  value={settings.semester}
                  onChange={(e) =>
                    handleChange(
                      "semester",
                      e.target.value
                    )
                  }
                >
                  <option value="Fall">{t("settings.fall")}</option>
                  <option value="Spring">{t("settings.spring")}</option>
                  <option value="Summer">{t("settings.summer")}</option>
                </select>
              </div>
            </div>
          </section>

          {/* ================= ATTENDANCE SETTINGS ================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <SettingsIcon name="clock" size={18} />
              </div>

              <div>
                <h2>{t("settings.attendance_settings")}</h2>
                <p>
                  {t("settings.configure_attendance_session_rules")}
                </p>
              </div>
            </div>

            <div className="attendance-settings-grid">
              {/* Late Attendance */}
              <div className="attendance-setting-item">
                <div>
                  <h3>{t("settings.allow_late_attendance")}</h3>

                  <p>
                    {t("settings.allow_students_to_be_marked_as_late")}
                  </p>
                </div>

                <button
                  type="button"
                  className={`settings-toggle ${
                    settings.allowLateAttendance
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "allowLateAttendance",
                      !settings.allowLateAttendance
                    )
                  }
                  aria-label={t("settings.toggle_late_attendance")}
                >
                  <span></span>
                </button>
              </div>

              {/* Threshold */}
              <div className="attendance-setting-item">
                <div>
                  <h3>{t("settings.late_threshold")}</h3>

                  <p>
                    {t("settings.minutes_after_session_start_to_mark_as_l")}
                  </p>
                </div>

                <div className="settings-number-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={settings.lateThreshold}
                    onChange={(e) =>
                      handleChange(
                        "lateThreshold",
                        Number(e.target.value)
                      )
                    }
                  />

                  <span>{t("settings.min")}</span>
                </div>
              </div>

              {/* QR Expiry */}
              <div className="attendance-setting-item">
                <div>
                  <h3>{t("settings.qr_code_expiry")}</h3>

                  <p>
                    {t("settings.how_long_qr_codes_remain_valid")}
                  </p>
                </div>

                <div className="settings-number-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.qrExpiry}
                    onChange={(e) =>
                      handleChange(
                        "qrExpiry",
                        Number(e.target.value)
                      )
                    }
                  />

                  <span>{t("settings.min")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= NOTIFICATION SETTINGS ================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <SettingsIcon name="bell" size={18} />
              </div>

              <div>
                <h2>{t("settings.notification_settings")}</h2>
                <p>
                  {t("settings.manage_system_notifications")}
                </p>
              </div>
            </div>

            <div className="notification-settings-grid">
              {/* Email */}
              <div className="notification-setting-item">
                <div>
                  <h3>{t("settings.email_notifications")}</h3>

                  <p>
                    {t("settings.send_email_notifications_to_users")}
                  </p>
                </div>

                <button
                  type="button"
                  className={`settings-toggle ${
                    settings.emailNotifications
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "emailNotifications",
                      !settings.emailNotifications
                    )
                  }
                  aria-label={t("settings.toggle_email_notifications")}
                >
                  <span></span>
                </button>
              </div>

              {/* Absence */}
              <div className="notification-setting-item">
                <div>
                  <h3>{t("settings.absence_alerts")}</h3>

                  <p>
                    {t("settings.notify_students_about_repeated_absences")}
                  </p>
                </div>

                <button
                  type="button"
                  className={`settings-toggle ${
                    settings.absenceAlerts
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleChange(
                      "absenceAlerts",
                      !settings.absenceAlerts
                    )
                  }
                  aria-label={t("settings.toggle_absence_alerts")}
                >
                  <span></span>
                </button>
              </div>
            </div>
          </section>

          {/* ================= SAVE ================= */}
          <div className="settings-actions">
            {saved && (
              <div className="settings-saved-message" role="status">
                {t("settings.settings_saved_successfully")}
              </div>
            )}

            <button
              type="button"
              className="settings-save-button"
              onClick={handleSave}
            >
              {t("settings.save_changes")}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;