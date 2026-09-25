import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useLocation, useNavigate } from "react-router-dom";
import { getMyAttendance } from "../../services/api";
import ThemeToggle from "../../components/ThemeToggle";
import StudentAssistant from "../../components/student/StudentAssistant";
import "../../components/student/StudentAssistant.css";
import StudentMobileNav from "./StudentMobileNav";
import { useLanguage } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";
import "./AttendanceScanner.css";

function Icon({ name, size = 18 }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    scan: (
      <>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <path d="M4 12h16" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),

    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),

    keyboard: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h.01M10 9h.01M13 9h.01M16 9h.01M7 13h.01M10 13h.01M13 13h.01M16 13h.01M9 16h6" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
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
      {icons[name]}
    </svg>
  );
}

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const raw = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T00:00:00`
    : raw.replace(" ", "T");

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(value) {
  const status = String(value || "recorded").trim().toLowerCase();

  if (!status) return "Recorded";

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getCameraErrorMessage(error) {
  if (error?.name === "NotAllowedError") {
    return "Camera permission was denied. Allow camera access and try again.";
  }

  if (error?.name === "NotFoundError") {
    return "No camera was found on this device.";
  }

  if (error?.name === "NotReadableError") {
    return "The camera is already being used by another application.";
  }

  if (error?.name === "OverconstrainedError") {
    return "The selected camera is not available. Try again.";
  }

  return error?.message || "Unable to access the camera.";
}

function AttendanceScanner() {
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSavedUser();

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isStartingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const restartQueuedRef = useRef(false);
  const mountedRef = useRef(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");

  const [recentAttendance, setRecentAttendance] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const firstName =
    user?.first_name ||
    user?.firstName ||
    t("role.student");

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();
  const avatarLetter = firstName.charAt(0).toUpperCase() || "S";

  const closeSidebar = () => setSidebarOpen(false);

  const navigateAndClose = (path) => {
    closeSidebar();
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  const loadRecentAttendance = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await getMyAttendance();
      const records = Array.isArray(data) ? data : [];

      setRecentAttendance(records.slice(0, 5));
    } catch (requestError) {
      setHistoryError(
        requestError.message ||
          t("stuScan.recentLoadError")
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    stopRequestedRef.current = true;

    const scanner = scannerRef.current;

    if (!scanner) {
      isScanningRef.current = false;

      if (mountedRef.current) {
        setScannerStarted(false);
        setCameraReady(false);
      }

      return;
    }

    try {
      if (isScanningRef.current) {
        await scanner.stop();
      }
    } catch {
      // The stream may already be stopped by the browser.
    }

    try {
      await scanner.clear();
    } catch {
      // Clearing an already removed scanner is safe to ignore.
    }

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    isScanningRef.current = false;

    if (mountedRef.current) {
      setScannerStarted(false);
      setCameraReady(false);
    }
  }, []);

  const handleScan = useCallback(
    async (token, method) => {
      if (!token || isProcessingRef.current) return;

      isProcessingRef.current = true;
      setIsProcessing(true);
      setError("");
      setManualError("");

      try {
        const authToken = localStorage.getItem("token");

        if (!authToken) {
          throw new Error(t("stuScan.sessionEnded"));
        }

        const apiUrl =
          import.meta.env.VITE_API_URL ||
          "http://localhost:5000/api";

        const response = await fetch(`${apiUrl}/attendance/scan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ token }),
        });

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              "Attendance could not be recorded."
          );
        }

        const attendanceResult = {
          success: true,
          message:
            data.message ||
            "Attendance was recorded successfully.",
          status:
            data.status ||
            data.attendance?.status ||
            "present",
          duplicate: Boolean(data.duplicate),
          course:
            data.course ||
            data.attendance?.course ||
            data.attendance?.course_name ||
            "",
          section:
            data.section ||
            data.attendance?.section ||
            data.attendance?.section_name ||
            "",
          scannedAt: new Date(),
        };

        await stopScanner();

        if (!mountedRef.current) return;

        navigate("/student/attendance-confirmed", {
          state: {
            ...attendanceResult,
            method,
          },
        });
      } catch (scanError) {
        await stopScanner();

        if (mountedRef.current) {
          setError(
            scanError.message ||
              "Unable to record attendance."
          );
        }
      } finally {
        isProcessingRef.current = false;

        if (mountedRef.current) {
          setIsProcessing(false);
        }
      }
    },
    [navigate, stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (isStartingRef.current) {
      restartQueuedRef.current = true;
      return;
    }

    if (isScanningRef.current) return;

    const reader = document.getElementById(
      "attendance-qr-reader"
    );

    if (!reader) {
      setError(t("stuScan.viewNotReady"));
      return;
    }

    isStartingRef.current = true;
    stopRequestedRef.current = false;
    setError("");
    setCameraReady(false);
    setScannerStarted(true);

    let scanner;

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          t("stuScan.noCameraSupport")
        );
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras?.length) {
        throw new Error(t("stuScan.noCamera"));
      }

      if (stopRequestedRef.current) return;

      const rearCamera =
        cameras.find((camera) => {
          const label = String(
            camera.label || ""
          ).toLowerCase();

          return (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment")
          );
        }) || cameras[0];

      const viewportWidth =
        typeof window === "undefined"
          ? 360
          : window.innerWidth;

      const qrSize = Math.max(
        210,
        Math.min(300, viewportWidth - 104)
      );

      scanner = new Html5Qrcode("attendance-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        rearCamera.id,
        {
          fps: 12,
          qrbox: {
            width: qrSize,
            height: qrSize,
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          void handleScan(decodedText, "QR code");
        },
        () => {
          // Frame-level decode failures are expected.
        }
      );

      if (stopRequestedRef.current) {
        try {
          await scanner.stop();
        } catch {
          // The scanner may not have acquired the stream.
        }

        try {
          await scanner.clear();
        } catch {
          // The reader can already be cleared.
        }

        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }

        return;
      }

      isScanningRef.current = true;

      if (mountedRef.current) {
        setScannerStarted(true);
        setCameraReady(true);
      }
    } catch (cameraError) {
      isScanningRef.current = false;

      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }

      try {
        await scanner?.clear();
      } catch {
        // There is nothing else to clean up.
      }

      if (
        mountedRef.current &&
        !stopRequestedRef.current
      ) {
        setScannerStarted(false);
        setCameraReady(false);
        setError(getCameraErrorMessage(cameraError));
      }
    } finally {
      isStartingRef.current = false;

      if (
        restartQueuedRef.current &&
        mountedRef.current &&
        !isScanningRef.current
      ) {
        restartQueuedRef.current = false;
        void startScanner();
      }
    }
  }, [handleScan]);

  useEffect(() => {
    mountedRef.current = true;
    void startScanner();

    return () => {
      mountedRef.current = false;
      void stopScanner();
    };
  }, [startScanner, stopScanner]);

  useEffect(() => {
    void loadRecentAttendance();
  }, [loadRecentAttendance]);

  useEffect(() => {
    const locked = sidebarOpen;

    document.body.classList.toggle(
      "scan-sidebar-open",
      locked
    );

    return () =>
      document.body.classList.remove("scan-sidebar-open");
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleRetry() {
    setError("");
    setManualError("");
    setManualCode("");
    isProcessingRef.current = false;
    setIsProcessing(false);

    await stopScanner();
    await startScanner();
  }

  async function handleManualSubmit(event) {
    event.preventDefault();

    const code = manualCode.trim();

    if (!code) {
      setManualError(t("stuScan.manualRequired"));
      return;
    }

    await handleScan(code, "Manual code");
  }

  function handleLogout() {
    closeSidebar();
    void stopScanner();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/logout");
  }

  const cameraState = useMemo(() => {
    if (error) return "error";
    if (cameraReady) return "active";
    return "waiting";
  }, [cameraReady, error]);

  const cameraLabel = useMemo(() => {
    if (error) return t("stuScan.camError");
    if (isProcessing) return t("stuScan.camVerifying");
    if (cameraReady) return t("stuScan.camActive");
    return t("stuScan.camPreparing");
  }, [cameraReady, error, isProcessing]);

  const cameraMessage = useMemo(() => {
    if (error) {
      return t("stuScan.camErrorHint");
    }

    if (isProcessing) {
      return t("stuScan.camVerifyingHint");
    }

    if (cameraReady) {
      return t("stuScan.camActiveHint");
    }

    if (scannerStarted) {
      return t("stuScan.camRequestingHint");
    }

    return t("stuScan.camIdleHint");
  }, [cameraReady, error, isProcessing, scannerStarted]);

  return (
    <div className="scan-page">
      <button
        type="button"
        className="scan-mobile-menu-button"
        aria-label={t("a11y.openNav")}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="scan-sidebar-overlay"
          aria-label={t("a11y.closeNav")}
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`scan-sidebar ${sidebarOpen ? "is-open" : ""}`}
      >
        <div className="scan-brand">
          <div className="scan-brand-logo" aria-hidden="true">
            <span className="brand-mark" />
          </div>

          <div>
            <strong>{platformName}</strong>
            <span>{t("brand.tagline")}</span>
          </div>
        </div>

        <div className="scan-profile">
          <div className="scan-profile-avatar">
            {avatarLetter}
          </div>

          <div className="scan-profile-info">
            <strong>{fullName}</strong>
            <span>{t("role.student")}</span>
          </div>
        </div>

        <nav className="scan-nav">
          <button
            type="button"
            className={
              isActive("/dashboard") ? "scan-nav-item active" : "scan-nav-item"
            }
            onClick={() => navigateAndClose("/dashboard")}
          >
            <span className="scan-nav-icon">
              <Icon name="dashboard" size={16} />
            </span>{t("nav.dashboard")}</button>

          <button
            type="button"
            className={
              isActive("/student/attendance")
                ? "scan-nav-item active"
                : "scan-nav-item"
            }
            onClick={() =>
              navigateAndClose("/student/attendance")
            }
          >
            <span className="scan-nav-icon">
              <Icon name="calendar" size={16} />
            </span>{t("nav.myAttendance")}</button>

          <button
            type="button"
            className={
              isActive("/student/scan")
                ? "scan-nav-item active"
                : "scan-nav-item"
            }
            onClick={() => navigateAndClose("/student/scan")}
          >
            <span className="scan-nav-icon">
              <Icon name="scan" size={16} />
            </span>
            {t("nav.scan")}
          </button>

          <button
            type="button"
            className={
              isActive("/student/correction-requests")
                ? "scan-nav-item active"
                : "scan-nav-item"
            }
            onClick={() =>
              navigateAndClose("/student/correction-requests")
            }
          >
            <span className="scan-nav-icon">
              <Icon name="edit" size={16} />
            </span>{t("nav.corrections")}</button>

          <button
            type="button"
            className={
              isActive("/student/profile")
                ? "scan-nav-item active"
                : "scan-nav-item"
            }
            onClick={() => navigateAndClose("/student/profile")}
          >
            <span className="scan-nav-icon">
              <Icon name="user" size={16} />
            </span>{t("nav.profile")}</button>
        </nav>

        <div className="scan-sidebar-bottom">
          <div className="keep-going-card">
            <strong>{t("stuScan.keepGoing")}</strong>
            <span>{t("stuScan.keepGoingSub")}</span>
          </div>

          <button
            type="button"
            className="scan-logout"
            onClick={handleLogout}
          >
            <span>
              <Icon name="logout" size={16} />
            </span>
            {t("action.logout")}
          </button>
        </div>
      </aside>

      <main className="scan-main">
        <header className="scan-topbar">
          <ThemeToggle />
          <div className="scan-user-area">
            <div className="top-avatar">{avatarLetter}</div>

            <div className="top-user-info">
              <strong>{fullName}</strong>
              <span>{t("role.student")}</span>
            </div>
          </div>
        </header>

        <section className="scan-content">
          <div className="scan-page-hero">
            <div>
              <span className="hero-label">{t("stuScan.eyebrow")}</span>
              <h1>{t("stuScan.title")}</h1>
              <p>
                {t("stuScan.heroDesc")}
              </p>
            </div>

            <p className="hero-note">
              {t("stuScan.heroNote")}
            </p>
          </div>

          <div className="scan-grid">
            <div className="scan-left-column">
              <div className="ready-card">
                <div className="ready-info">
                  <strong>{t("stuScan.readyTitle")}</strong>
                  <p>
                    {t("stuScan.readyDesc")}
                  </p>
                </div>

                <div className="camera-status" aria-live="polite">
                  <span className={`camera-state ${cameraState}`}>
                    {cameraLabel}
                  </span>
                  <p>{cameraMessage}</p>
                </div>
              </div>

              <div className="scanner-card">
                <div className="camera-wrapper">
                  <div
                    id="attendance-qr-reader"
                    className="qr-reader"
                  />

                  {!cameraReady && !error && !isProcessing && (
                    <div className="camera-loading">
                      {t("stuScan.preparingCamera")}</div>
                  )}

                  {!error && !isProcessing && (
                    <div
                      className="scan-overlay"
                      aria-hidden="true"
                    >
                      <span className="corner top-left" />
                      <span className="corner top-right" />
                      <span className="corner bottom-left" />
                      <span className="corner bottom-right" />
                      <span className="scan-line" />
                      <p>{t("stuScan.overlayHint")}</p>
                    </div>
                  )}

                  {isProcessing && (
                    <div
                      className="scanner-message processing-state"
                      aria-live="polite"
                    >
                      <h2>{t("stuScan.verifyingTitle")}</h2>
                      <p>
                        {t("stuScan.verifyingText")}
                      </p>
                    </div>
                  )}

                  {error && (
                    <div
                      className="scanner-message error-state"
                      role="alert"
                    >
                      <h2>{t("stuScan.scannerErrorTitle")}</h2>
                      <p>{error}</p>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleRetry}
                      >
                        {t("stuScan.tryAgain")}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <form
                className="manual-code-card"
                onSubmit={handleManualSubmit}
              >
                <div className="manual-icon">
                  <Icon name="keyboard" size={20} />
                </div>

                <div className="manual-content">
                  <h2>{t("stuScan.manualTitle")}</h2>
                  <p>
                    {t("stuScan.manualDesc")}
                  </p>

                  <div className="manual-form">
                    <div className="manual-input-wrapper">
                      <Icon name="search" size={16} />

                      <input
                        type="text"
                        value={manualCode}
                        disabled={isProcessing}
                        onChange={(event) => {
                          setManualCode(event.target.value);
                          setManualError("");
                        }}
                        placeholder={t("stuScan.manualPlaceholder")}
                        aria-label={t("stuScan.manualAriaLabel")}
                        autoComplete="off"
                      />
                    </div>

                    <button
                      type="submit"
                      className="verify-button"
                      disabled={isProcessing}
                    >
                      {isProcessing ? t("stuScan.verifying") : t("stuScan.verifyCode")}
                    </button>
                  </div>

                  {manualError && (
                    <p className="manual-error" role="alert">
                      {manualError}
                    </p>
                  )}
                </div>
              </form>

              <div className="recent-card">
                <div className="section-heading">
                  <div className="section-heading-left">
                    <span className="heading-icon">
                      <Icon name="clock" size={18} />
                    </span>

                    <div>
                      <h2>{t("stuScan.recentTitle")}</h2>
                      <p>{t("stuScan.recentSub")}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="recent-link"
                    onClick={() =>
                      navigate("/student/attendance")
                    }
                  >{t("stuScan.viewAll")}</button>
                </div>

                {historyLoading ? (
                  <div
                    className="recent-skeleton"
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                ) : historyError ? (
                  <div className="recent-error" role="alert">
                    <p>{historyError}</p>
                    <button
                      type="button"
                      className="retry-history-button"
                      onClick={loadRecentAttendance}
                    >
                      {t("stuScan.tryAgain")}
                    </button>
                  </div>
                ) : recentAttendance.length === 0 ? (
                  <div className="recent-empty">
                    {t("stuScan.recentEmpty")}</div>
                ) : (
                  <div className="recent-table">
                    <div className="recent-row table-head">
                      <span>{t("stuScan.colDate")}</span>
                      <span>{t("stuScan.colCourse")}</span>
                      <span>{t("stuScan.colSection")}</span>
                      <span>{t("stuScan.colStatus")}</span>
                    </div>

                    {recentAttendance.map((record) => (
                      <div
                        className="recent-row"
                        key={`${record.id}-${record.scanned_at}`}
                      >
                        <span data-label={t("stuScan.colDate")}>
                          {formatDateTime(
                            record.scanned_at ||
                              record.session_date
                          )}
                        </span>

                        <span data-label={t("stuScan.colCourse")}>
                          <strong>
                            {record.course_name ||
                              t("stuScan.courseUnavailable")}
                          </strong>

                          {record.course_code && (
                            <small>{record.course_code}</small>
                          )}
                        </span>

                        <span data-label={t("stuScan.colSection")}>
                          {record.section_name || t("stuScan.notAvailable")}
                        </span>

                        <span data-label={t("stuScan.colStatus")}>
                          <b
                            className={`status-pill ${
                              record.status || "recorded"
                            }`}
                          >
                            {formatStatus(record.status)}
                          </b>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="scan-right-column">
              <div className="info-card">
                <div className="info-card-title">
                  <h2>{t("stuScan.howTitle")}</h2>
                </div>

                <div className="steps">
                  <div className="step">
                    <span className="step-number">1</span>
                    <div>
                      <strong>{t("stuScan.step1Title")}</strong>
                      <p>
                        {t("stuScan.step1Text")}
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <span className="step-number">2</span>
                    <div>
                      <strong>{t("stuScan.step2Title")}</strong>
                      <p>
                        {t("stuScan.step2Text")}
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <span className="step-number">3</span>
                    <div>
                      <strong>{t("stuScan.step3Title")}</strong>
                      <p>
                        {t("stuScan.step3Text")}
                      </p>
                    </div>
                  </div>

                  <div className="step">
                    <span className="step-number">4</span>
                    <div>
                      <strong>{t("stuScan.step4Title")}</strong>
                      <p>
                        {t("stuScan.step4Text")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-title">
                  <h2>{t("stuScan.beforeTitle")}</h2>
                </div>

                <ul className="guidance-list">
                  <li>{t("stuScan.before1")}</li>
                  <li>{t("stuScan.before2")}</li>
                  <li>{t("stuScan.before3")}</li>
                  <li>{t("stuScan.before4")}</li>
                </ul>
              </div>

              <div className="info-card tips-card">
                <div className="info-card-title">
                  <h2>{t("stuScan.tipsTitle")}</h2>
                </div>

                <ul className="tips-list">
                  <li>{t("stuScan.tip1")}</li>
                  <li>{t("stuScan.tip2")}</li>
                  <li>{t("stuScan.tip3")}</li>
                  <li>{t("stuScan.tip4")}</li>
                  <li>{t("stuScan.tip5")}</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <StudentAssistant />
      <StudentMobileNav />
    </div>
  );
}

export default AttendanceScanner;