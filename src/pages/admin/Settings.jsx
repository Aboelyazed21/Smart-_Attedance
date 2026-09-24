import React, { useState } from "react";
import "./Settings.css";

function Settings() {
  const [settings, setSettings] = useState({
    systemName: "Attendify",
    universityName: "Port Said University",
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
    <div className="settings-page">
      {/* ================= SIDEBAR ================= */}
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <div className="settings-brand-icon">A</div>

          <div>
            <h2>Attendify</h2>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <nav className="settings-navigation">
          <a href="/dashboard">
            Dashboard
          </a>

          <a href="/admin/users">
            Users
          </a>

          <a href="/admin/courses">
            Courses
          </a>

          <a href="/admin/sections">
            Sections
          </a>

          <a href="/admin/rooms">
            Rooms
          </a>

          <a href="/admin/timetable">
            Timetable
          </a>

          <a href="/admin/attendance">
            Attendance
          </a>

          <a href="/admin/reports">
            Reports
          </a>

          <a
            href="/admin/settings"
            className="settings-nav-active"
            aria-current="page"
          >
            Settings
          </a>
        </nav>

        <div className="settings-sidebar-bottom">
          <div className="settings-greeting">
            <strong>Good Morning</strong>

            <p>
              Manage your system settings
              efficiently.
            </p>
          </div>

          <a href="/" className="settings-logout">
            Logout
          </a>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="settings-main">
        {/* ================= TOP BAR ================= */}
        <header className="settings-topbar">
          <div className="settings-user-area">
            <div className="settings-avatar">
              S
            </div>

            <div className="settings-user-info">
              <strong>System Admin</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {/* ================= CONTENT ================= */}
        <section className="settings-content">
          {/* Page Header */}
          <div className="settings-page-header">
            <div className="settings-title-wrapper">
              <div>
                <h1>Settings</h1>
                <p>
                  Configure your system preferences
                </p>
              </div>
            </div>

            <div className="settings-breadcrumb">
              / Settings
            </div>
          </div>

          {/* ================= GENERAL SETTINGS ================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>General Settings</h2>
                <p>
                  Basic information about your system
                </p>
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="settings-field">
                <label htmlFor="settings-system-name">
                  System Name
                </label>

                <input
                  id="settings-system-name"
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
                <label htmlFor="settings-university-name">
                  University Name
                </label>

                <input
                  id="settings-university-name"
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
                <label htmlFor="settings-academic-year">
                  Academic Year
                </label>

                <input
                  id="settings-academic-year"
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
                <label htmlFor="settings-semester">
                  Semester
                </label>

                <select
                  id="settings-semester"
                  value={settings.semester}
                  onChange={(e) =>
                    handleChange(
                      "semester",
                      e.target.value
                    )
                  }
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>
          </section>

          {/* ================= ATTENDANCE SETTINGS ================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Attendance Settings</h2>
                <p>
                  Configure attendance session rules
                </p>
              </div>
            </div>

            <div className="attendance-settings-grid">
              {/* Late Attendance */}
              <div className="attendance-setting-item">
                <div>
                  <h3>Allow Late Attendance</h3>

                  <p>
                    Allow students to be marked as late
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
                  aria-label="Toggle late attendance"
                  aria-pressed={settings.allowLateAttendance}
                >
                  <span></span>
                </button>
              </div>

              {/* Threshold */}
              <div className="attendance-setting-item">
                <div>
                  <h3>Late Threshold</h3>

                  <p>
                    Minutes after session start to
                    mark as late
                  </p>
                </div>

                <div className="settings-number-wrapper">
                  <input
                    type="number"
                    aria-label="Late threshold in minutes"
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

                  <span>min</span>
                </div>
              </div>

              {/* QR Expiry */}
              <div className="attendance-setting-item">
                <div>
                  <h3>QR Code Expiry</h3>

                  <p>
                    How long QR codes remain valid
                  </p>
                </div>

                <div className="settings-number-wrapper">
                  <input
                    type="number"
                    aria-label="QR code expiry in minutes"
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

                  <span>min</span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= NOTIFICATION SETTINGS ================= */}
          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Notification Settings</h2>
                <p>
                  Manage system notifications
                </p>
              </div>
            </div>

            <div className="notification-settings-grid">
              {/* Email */}
              <div className="notification-setting-item">
                <div>
                  <h3>Email Notifications</h3>

                  <p>
                    Send email notifications to users
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
                  aria-label="Toggle email notifications"
                  aria-pressed={settings.emailNotifications}
                >
                  <span></span>
                </button>
              </div>

              {/* Absence */}
              <div className="notification-setting-item">
                <div>
                  <h3>Absence Alerts</h3>

                  <p>
                    Notify students about repeated
                    absences
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
                  aria-label="Toggle absence alerts"
                  aria-pressed={settings.absenceAlerts}
                >
                  <span></span>
                </button>
              </div>
            </div>
          </section>

          {/* ================= SAVE ================= */}
          <div className="settings-actions">
            {saved && (
              <div
                className="settings-saved-message"
                role="status"
              >
                Settings saved successfully
              </div>
            )}

            <button
              type="button"
              className="settings-save-button"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;