import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

import "./AttendanceScanner.css";

function AttendanceScanner() {
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const processingRef = useRef(false);
  const startingRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [scannerStarted, setScannerStarted] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  /* =========================================================
     USER
  ========================================================= */

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    user = null;
  }

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Student";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const fullName =
    `${firstName} ${lastName}`.trim();

  const avatarLetter =
    firstName.charAt(0).toUpperCase();

  /* =========================================================
     START SCANNER
  ========================================================= */

  async function startScanner() {
    if (startingRef.current) {
      return;
    }

    if (
      isScanningRef.current ||
      scannerRef.current?.isScanning
    ) {
      return;
    }

    startingRef.current = true;
    stopRequestedRef.current = false;

    try {
      setError("");
      setCameraReady(false);

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const cameras =
        await Html5Qrcode.getCameras();

      if (
        !cameras ||
        cameras.length === 0
      ) {
        throw new Error(
          "No camera was found on this device."
        );
      }

      const rearCamera =
        cameras.find((camera) => {
          const label =
            String(
              camera.label || ""
            ).toLowerCase();

          return (
            label.includes("back") ||
            label.includes("rear") ||
            label.includes("environment")
          );
        }) || cameras[0];

      const scanner =
        new Html5Qrcode(
          "attendance-qr-reader"
        );

      scannerRef.current = scanner;

      if (stopRequestedRef.current) {
        try {
          scanner.clear();
        } catch {}

        scannerRef.current = null;
        return;
      }

      await scanner.start(
        rearCamera.id,
        {
          fps: 10,

          qrbox: {
            width: 280,
            height: 280,
          },

          aspectRatio: 1,
        },

        async (decodedText) => {
          if (
            processingRef.current
          ) {
            return;
          }

          processingRef.current =
            true;

          await handleScan(
            decodedText
          );
        },

        () => {
          // Normal QR frame errors are ignored.
        }
      );

      isScanningRef.current =
        true;

      setScannerStarted(true);
      setCameraReady(true);

    } catch (err) {
      console.error(
        "QR scanner start error:",
        err
      );

      isScanningRef.current =
        false;

      scannerRef.current =
        null;

      let message =
        "Unable to access the camera.";

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        message =
          "Camera permission was denied. Please allow camera access and try again.";
      } else if (
        err?.name ===
        "NotFoundError"
      ) {
        message =
          "No camera was found on this device.";
      } else if (
        err?.name ===
        "NotReadableError"
      ) {
        message =
          "The camera is already being used by another application.";
      } else if (
        err?.name ===
        "OverconstrainedError"
      ) {
        message =
          "The selected camera is not available. Please try again.";
      } else if (
        err?.message
      ) {
        message =
          err.message;
      }

      setScannerStarted(false);
      setCameraReady(false);
      setError(message);

    } finally {
      startingRef.current =
        false;
    }
  }

  /* =========================================================
     INITIALIZE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) {
        return;
      }

      await startScanner();
    };

    run();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  /* =========================================================
     STOP SCANNER
  ========================================================= */

  async function stopScanner() {
    stopRequestedRef.current =
      true;

    const scanner =
      scannerRef.current;

    if (!scanner) {
      isScanningRef.current =
        false;

      setScannerStarted(false);
      setCameraReady(false);

      return;
    }

    try {
      if (
        isScanningRef.current
      ) {
        await scanner.stop();
      }
    } catch (err) {
      console.error(
        "Scanner stop error:",
        err
      );
    }

    try {
      scanner.clear();
    } catch (err) {
      console.error(
        "Scanner clear error:",
        err
      );
    }

    isScanningRef.current =
      false;

    scannerRef.current =
      null;

    setScannerStarted(false);
    setCameraReady(false);
  }

  /* =========================================================
     HANDLE QR SCAN
  ========================================================= */

  async function handleScan(token) {
    try {
      setError("");
      setScanResult(null);

      const API_URL =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

      const response =
        await fetch(
          `${API_URL}/attendance/scan`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${localStorage.getItem(
                  "token"
                )}`,
            },

            body: JSON.stringify({
              token,
            }),
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Attendance scan failed."
        );
      }

      const attendanceResult = {
        success: true,

        message:
          data.message ||
          "Attendance recorded successfully.",

        status:
          data.status ||
          data.attendance?.status ||
          "present",

        duplicate:
          data.duplicate ||
          false,

        course:
          data.course ||
          data.attendance?.course ||
          "",

        section:
          data.section ||
          data.attendance?.section ||
          "",

        scannedAt:
          new Date(),
      };

      setScanResult(attendanceResult);

      await stopScanner();

      /*
       * After the attendance API confirms the scan, move the student
       * to the dedicated Attendance Confirmation page.
       *
       * We pass the real API response data through router state so the
       * confirmation page can display the course, section, status,
       * time, and whether this was already recorded.
       */
      navigate("/student/attendance-confirmed", {
        state: {
          ...attendanceResult,
          method: "QR Code",
        },
      });

    } catch (err) {
      console.error(
        "Attendance scan error:",
        err
      );

      setError(
        err.message ||
        "Unable to record attendance."
      );

      processingRef.current =
        false;
    }
  }

  /* =========================================================
     MANUAL CODE
  ========================================================= */

  async function handleManualSubmit(e) {
    e.preventDefault();

    const code =
      manualCode.trim();

    if (!code) {
      setError(
        "Please enter the attendance code."
      );

      return;
    }

    processingRef.current =
      true;

    await handleScan(code);
  }

  /* =========================================================
     RETRY
  ========================================================= */

  async function handleRetry() {
    setError("");
    setScanResult(null);

    setManualCode("");

    processingRef.current =
      false;

    await stopScanner();

    setTimeout(() => {
      startScanner();
    }, 200);
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="scan-page">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="scan-sidebar">

        {/* BRAND */}

        <div className="scan-brand">

          <div className="scan-brand-logo">
            ✓
          </div>

          <div>
            <strong>
              Attendify
            </strong>

            <span>
              SMART ATTENDANCE
            </span>
          </div>

        </div>

        {/* PROFILE */}

        <div className="scan-profile">

          <div className="scan-profile-avatar">
            {avatarLetter}
          </div>

          <div className="scan-profile-info">

            <strong>
              {fullName}
            </strong>

            <span>
              Student
            </span>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="scan-nav">

          <button
            className="scan-nav-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="scan-nav-item"
            onClick={() =>
              navigate(
                "/student/attendance"
              )
            }
          >
            <span>▤</span>
            My Attendance
          </button>

          <button
            className="scan-nav-item active"
          >
            <span>▦</span>
            Scan Attendance
          </button>

          <button
            className="scan-nav-item"
          >
            <span>▣</span>
            Correction Requests
          </button>

          <button
            className="scan-nav-item"
          >
            <span>♧</span>

            Notifications

            <span className="notification-badge">
              3
            </span>
          </button>

        </nav>

        {/* BOTTOM */}

        <div className="scan-sidebar-bottom">

          <div className="keep-going-card">

            <div className="keep-going-icon">
              ★
            </div>

            <div>
              <strong>
                Keep going!
              </strong>

              <span>
                Every class counts.
              </span>
            </div>

          </div>

          <button
            className="scan-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="scan-main">

        {/* TOP BAR */}

        <header className="scan-topbar">

          <div className="scan-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search courses, sessions, or anything..."
            />

            <kbd>
              Ctrl + K
            </kbd>
          </div>

          <div className="scan-user-area">

            <button className="bell-button">
              ♧

              <span>
                3
              </span>
            </button>

            <div className="top-avatar">
              {avatarLetter}
            </div>

            <div className="top-user-info">

              <strong>
                {fullName}
              </strong>

              <span>
                Student
              </span>

            </div>

            <span className="top-arrow">
             ⌄
            </span>

          </div>

        </header>

        {/* CONTENT */}

        <section className="scan-content">

          {/* PAGE HERO */}

          <div className="scan-page-hero">

            <div className="hero-left">

              <div className="hero-icon">
                ▦
              </div>

              <div>

                <span className="hero-label">
                  ATTENDANCE
                </span>

                <h1>
                  Scan Attendance
                </h1>

                <p>
                  Scan the lecturer's QR code to mark your attendance
                </p>

              </div>

            </div>

            <div className="hero-decoration">

              <div className="hero-qr">
                ▦
              </div>

              <div className="hero-message">
                <strong>
                  Be present
                </strong>

                <span>
                  today, build a
                  better tomorrow.
                </span>
              </div>

            </div>

          </div>

          {/* GRID */}

          <div className="scan-grid">

            {/* =================================================
                LEFT COLUMN
            ================================================= */}

            <div className="scan-left-column">

              {/* READY CARD */}

              <div className="ready-card">

                <div className="ready-info">

                  <div className="ready-icon">
                    ⓘ
                  </div>

                  <div>

                    <strong>
                      Ready to Scan
                    </strong>

                    <p>
                      Position the QR code within the frame.
                      Your attendance will be recorded securely.
                    </p>

                  </div>

                </div>

                <div className="camera-status">

                  <span
                    className={
                      cameraReady
                        ? "status-dot active"
                        : "status-dot"
                    }
                  />

                  <div>

                    <strong>
                      {cameraReady
                        ? "Camera Active"
                        : "Starting Camera"}
                    </strong>

                    <span>
                      {cameraReady
                        ? "Scanning for QR code..."
                        : "Please wait..."}
                    </span>

                  </div>

                </div>

              </div>

              {/* SCANNER */}

              <div className="scanner-card">

                {!scanResult &&
                !error && (
                  <div className="camera-wrapper">

                    <div
                      id="attendance-qr-reader"
                      className="qr-reader"
                    />

                    <div className="scan-overlay">

                      <div className="corner top-left" />
                      <div className="corner top-right" />
                      <div className="corner bottom-left" />
                      <div className="corner bottom-right" />

                      <div className="scan-line" />

                      <div className="scan-hint">
                        Position the QR code within the frame
                      </div>

                    </div>

                  </div>
                )}

                {/* ERROR */}

                {error && (
                  <div className="scanner-message error-state">

                    <div className="message-icon">
                      !
                    </div>

                    <h2>
                      Attendance Error
                    </h2>

                    <p>
                      {error}
                    </p>

                    <button
                      className="primary-button"
                      onClick={handleRetry}
                    >
                      Try Again
                    </button>

                  </div>
                )}

                {/* SUCCESS */}

                {scanResult && (
                  <div className="scanner-message success-state">

                    <div className="success-circle">
                      ✓
                    </div>

                    <span className="success-label">
                      ATTENDANCE CONFIRMED
                    </span>

                    <h2>
                      {scanResult.duplicate
                        ? "Already Recorded"
                        : "Attendance Recorded"}
                    </h2>

                    <p>
                      {scanResult.message}
                    </p>

                    <div className="success-details">

                      <div>
                        <span>Status</span>
                        <strong>
                          {scanResult.status ||
                            "Present"}
                        </strong>
                      </div>

                      <div>
                        <span>Student</span>
                        <strong>
                          {fullName}
                        </strong>
                      </div>

                      <div>
                        <span>Time</span>
                        <strong>
                          {scanResult.scannedAt
                            ? scanResult.scannedAt.toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "--"}
                        </strong>
                      </div>

                    </div>

                    <div className="success-actions">

                      <button
                        className="primary-button"
                        onClick={handleRetry}
                      >
                        Scan Again
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          navigate(
                            "/student/attendance"
                          )
                        }
                      >
                        My Attendance
                      </button>

                    </div>

                  </div>
                )}

                {/* CAMERA CONTROLS */}

                {!scanResult &&
                  !error && (
                    <div className="scanner-controls">

                      <button className="scanner-control">
                        <span>◉</span>
                        <small>
                          Switch Camera
                        </small>
                      </button>

                      <button className="scanner-control selected">
                        <span>▦</span>
                        <small>
                          Scan QR Code
                        </small>
                      </button>

                      <button className="scanner-control">
                        <span>☼</span>
                        <small>
                          Toggle Flash
                        </small>
                      </button>

                    </div>
                  )}

              </div>

              {/* MANUAL CODE */}

              {!scanResult && (
                <form
                  className="manual-code-card"
                  onSubmit={
                    handleManualSubmit
                  }
                >

                  <div className="manual-icon">
                    ▤
                  </div>

                  <div className="manual-content">

                    <div className="manual-title">
                      Or enter attendance code manually
                    </div>

                    <p>
                      If you're unable to scan,
                      you can enter the code provided
                      by your lecturer.
                    </p>

                    <div className="manual-form">

                      <div className="manual-input-wrapper">

                        <span>
                          ⌕
                        </span>

                        <input
                          type="text"
                          value={manualCode}
                          onChange={(e) =>
                            setManualCode(
                              e.target.value
                            )
                          }
                          placeholder="Enter attendance code (e.g. ABC123)"
                        />

                      </div>

                      <button
                        type="submit"
                        className="verify-button"
                      >
                        ✓ Verify Code
                      </button>

                    </div>

                  </div>

                </form>
              )}

              {/* RECENT SCANS */}

              <div className="recent-card">

                <div className="section-heading">

                  <div className="section-heading-left">

                    <div className="heading-icon">
                      ◷
                    </div>

                    <div>
                      <h3>
                        Recent Scans
                      </h3>

                      <p>
                        Your latest attendance attempts
                      </p>
                    </div>

                  </div>

                  <button>
                    View All →
                  </button>

                </div>

                <div className="recent-table">

                  <div className="recent-row table-head">
                    <span>
                      Date & Time
                    </span>

                    <span>
                      Course
                    </span>

                    <span>
                      Section
                    </span>

                    <span>
                      Status
                    </span>
                  </div>

                  <div className="recent-row">
                    <span>
                      Sep 21, 2026 10:15 AM
                    </span>

                    <span>
                      Data Structures
                    </span>

                    <span>
                      Sec 1
                    </span>

                    <span>
                      <b className="status-pill present">
                        Present
                      </b>
                    </span>
                  </div>

                  <div className="recent-row">
                    <span>
                      Sep 19, 2026 09:05 AM
                    </span>

                    <span>
                      Web Development
                    </span>

                    <span>
                      Sec 2
                    </span>

                    <span>
                      <b className="status-pill present">
                        Present
                      </b>
                    </span>
                  </div>

                  <div className="recent-row">
                    <span>
                      Sep 17, 2026 11:30 AM
                    </span>

                    <span>
                      Database Systems
                    </span>

                    <span>
                      Sec 1
                    </span>

                    <span>
                      <b className="status-pill failed">
                        Failed
                      </b>
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* =================================================
                RIGHT COLUMN
            ================================================= */}

            <div className="scan-right-column">

              {/* HOW IT WORKS */}

              <div className="info-card">

                <div className="info-card-title">

                  <div className="info-title-icon blue">
                    ⚙
                  </div>

                  <h3>
                    How It Works
                  </h3>

                </div>

                <div className="steps">

                  <div className="step">

                    <div className="step-number">
                      1
                    </div>

                    <div>
                      <strong>
                        Open the QR Code
                      </strong>

                      <span>
                        Ask your lecturer for the attendance QR code
                      </span>
                    </div>

                  </div>

                  <div className="step">

                    <div className="step-number green">
                      2
                    </div>

                    <div>
                      <strong>
                        Scan the Code
                      </strong>

                      <span>
                        Position the QR code within the frame
                      </span>
                    </div>

                  </div>

                  <div className="step">

                    <div className="step-number purple">
                      3
                    </div>

                    <div>
                      <strong>
                        Wait for Verification
                      </strong>

                      <span>
                        Your attendance will be verified automatically
                      </span>
                    </div>

                  </div>

                  <div className="step">

                    <div className="step-number pink">
                      4
                    </div>

                    <div>
                      <strong>
                        All Set!
                      </strong>

                      <span>
                        You'll see a success message once recorded
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* SECURITY */}

              <div className="info-card security-card">

                <div className="info-card-title">

                  <div className="info-title-icon green">
                    ♢
                  </div>

                  <h3>
                    Security Status
                  </h3>

                </div>

                <div className="security-list">

                  <div className="security-item">

                    <span className="security-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        Authenticated
                      </strong>

                      <span>
                        You are logged in as a student
                      </span>
                    </div>

                  </div>

                  <div className="security-item">

                    <span className="security-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        Session Valid
                      </strong>

                      <span>
                        The QR code is from an active session
                      </span>
                    </div>

                  </div>

                  <div className="security-item">

                    <span className="security-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        Enrollment Verified
                      </strong>

                      <span>
                        You are enrolled in this course
                      </span>
                    </div>

                  </div>

                  <div className="security-item">

                    <span className="security-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        Connection Secure
                      </strong>

                      <span>
                        Your data is protected
                      </span>
                    </div>

                  </div>

                </div>

                <div className="security-ready">
                  <div>
                    ✓
                  </div>

                  <strong>
                    All Systems
                    <br />
                    Ready
                  </strong>
                </div>

              </div>

              {/* TIPS */}

              <div className="info-card tips-card">

                <div className="info-card-title">

                  <div className="info-title-icon yellow">
                    !
                  </div>

                  <h3>
                    Tips for Successful Scanning
                  </h3>

                </div>

                <ul className="tips-list">

                  <li>
                    <span>✓</span>
                    Make sure there is good lighting
                  </li>

                  <li>
                    <span>✓</span>
                    Hold your device steady
                  </li>

                  <li>
                    <span>✓</span>
                    Keep the QR code within the frame
                  </li>

                  <li>
                    <span>✓</span>
                    Maintain a reasonable distance
                    (10-30 cm)
                  </li>

                  <li>
                    <span>✓</span>
                    Ensure the QR code is not blurred or rotated
                  </li>

                  <li>
                    <span>✓</span>
                    Contact your lecturer if you face any issues
                  </li>

                </ul>

                <div className="tip-footer">

                  <span>
                    !
                  </span>

                  <p>
                    Tip: Scan your attendance as soon as
                    the class starts to avoid any issues.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AttendanceScanner;