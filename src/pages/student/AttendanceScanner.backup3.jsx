import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

import "../../App.css";

function AttendanceScanner() {
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const processingRef = useRef(false);
  const startingRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const mountedRef = useRef(false);
  const startPromiseRef = useRef(null);

  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [scannerStarted, setScannerStarted] = useState(false);

  /* =========================================================
     START QR SCANNER
  ========================================================= */

  async function startScanner() {
    if (startingRef.current || isScanningRef.current) {
      return;
    }

    if (scannerRef.current?.isScanning) {
      isScanningRef.current = true;
      return;
    }

    startingRef.current = true;
    stopRequestedRef.current = false;

    const startPromise = (async () => {
      try {
        setError("");

        if (
          !navigator.mediaDevices ||
          !navigator.mediaDevices.getUserMedia
        ) {
          throw new Error(
            "Camera access is not supported by this browser."
          );
        }

        const reader = document.getElementById(
          "attendance-qr-reader"
        );

        if (!reader) {
          throw new Error(
            "Scanner element is not ready. Please try again."
          );
        }

        /*
         * IMPORTANT:
         * Do not call Html5Qrcode.getCameras() here.
         * On some Android/Chrome devices it can create a camera
         * permission/stream race when React mounts/unmounts quickly.
         *
         * facingMode: environment lets html5-qrcode request the
         * rear camera directly.
         */
        const scanner = new Html5Qrcode(
          "attendance-qr-reader"
        );

        scannerRef.current = scanner;

        if (stopRequestedRef.current || !mountedRef.current) {
          try {
            scanner.clear();
          } catch {}

          if (scannerRef.current === scanner) {
            scannerRef.current = null;
          }

          return;
        }

        await scanner.start(
          { facingMode: { ideal: "environment" } },
          {
            fps: 10,
            qrbox: {
              width: 280,
              height: 280,
            },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (processingRef.current) {
              return;
            }

            processingRef.current = true;

            await handleScan(decodedText);
          },
          () => {
            // Ignore normal scanner frame errors.
          }
        );

        /*
         * React can unmount the component while scanner.start()
         * is waiting for the camera. If that happened, immediately
         * release the stream instead of leaving the camera locked.
         */
        if (
          stopRequestedRef.current ||
          !mountedRef.current ||
          scannerRef.current !== scanner
        ) {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch {}

          try {
            scanner.clear();
          } catch {}

          if (scannerRef.current === scanner) {
            scannerRef.current = null;
          }

          isScanningRef.current = false;
          return;
        }

        isScanningRef.current = true;
        setScannerStarted(true);
      } catch (err) {
        console.error(
          "QR scanner start error:",
          err
        );

        isScanningRef.current = false;

        const scanner = scannerRef.current;

        if (scanner) {
          try {
            if (scanner.isScanning) {
              await scanner.stop();
            }
          } catch {}

          try {
            scanner.clear();
          } catch {}
        }

        scannerRef.current = null;

        let message =
          "Unable to access the camera.";

        if (err?.name === "NotAllowedError") {
          message =
            "Camera permission was denied. Please allow camera access for this website and try again.";
        } else if (err?.name === "NotFoundError") {
          message =
            "No camera was found on this device.";
        } else if (err?.name === "NotReadableError") {
          message =
            "The camera could not be opened. Close Camera/WhatsApp/Instagram and try again.";
        } else if (err?.name === "OverconstrainedError") {
          message =
            "The rear camera is not available. Please try again.";
        } else if (err?.message) {
          message = err.message;
        }

        if (mountedRef.current) {
          setScannerStarted(false);
          setError(message);
        }
      } finally {
        startingRef.current = false;
        startPromiseRef.current = null;
      }
    })();

    startPromiseRef.current = startPromise;
    return startPromise;
  }

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => {
      if (mountedRef.current) {
        startScanner();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      stopScanner();
    };
  }, []);

  /* =========================================================
     STOP SCANNER
  ========================================================= */

  async function stopScanner() {
    stopRequestedRef.current = true;

    /*
     * If scanner.start() is still waiting for the camera,
     * wait for it to finish before trying another start.
     */
    const pendingStart = startPromiseRef.current;

    if (pendingStart) {
      try {
        await pendingStart;
      } catch {}
    }

    const scanner = scannerRef.current;

    if (!scanner) {
      isScanningRef.current = false;
      if (mountedRef.current) {
        setScannerStarted(false);
      }
      return;
    }

    try {
      if (scanner.isScanning) {
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

    /*
     * Extra safety: release any MediaStream tracks that the
     * browser still has attached to the scanner video element.
     */
    try {
      const video = document.querySelector(
        "#attendance-qr-reader video"
      );

      const stream = video?.srcObject;

      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });

        video.srcObject = null;
      }
    } catch {}

    isScanningRef.current = false;

    if (scannerRef.current === scanner) {
      scannerRef.current = null;
    }

    if (mountedRef.current) {
      setScannerStarted(false);
    }
  }

  /* =========================================================
     HANDLE QR SCAN
  ========================================================= */

  async function handleScan(token) {
    try {
      setError("");
      setScanResult(null);

      const apiBase =
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api";

      const response = await fetch(
        `${apiBase}/attendance/scan`,
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
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Attendance scan failed."
        );
      }

      setScanResult({
        success: true,
        message:
          data.message ||
          "Attendance recorded successfully.",
        status:
          data.status ||
          data.attendance?.status ||
          null,
        duplicate:
          data.duplicate ||
          false,
      });

      await stopScanner();
    } catch (err) {
      console.error(
        "Attendance scan error:",
        err
      );

      setError(
        err.message ||
          "Unable to record attendance."
      );

      processingRef.current = false;
    }
  }

  /* =========================================================
     RETRY
  ========================================================= */

  async function handleRetry() {
    setError("");
    setScanResult(null);
    processingRef.current = false;

    /*
     * Fully release the previous scanner before requesting
     * another camera stream.
     */
    await stopScanner();

    /*
     * Re-enable starting after cleanup.
     */
    stopRequestedRef.current = false;

    /*
     * Wait for React to recreate the reader element.
     */
    window.setTimeout(() => {
      if (mountedRef.current) {
        startScanner();
      }
    }, 300);
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    stopScanner();

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

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
    user?.first_name || "Student";

  const lastName =
    user?.last_name || "";

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="dashboard-page">

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">
            🎓
          </div>

          <div>
            <h2>
              Attendify
            </h2>

            <span>
              SMART ATTENDANCE
            </span>
          </div>

        </div>

        <div className="sidebar-profile">

          <div className="profile-avatar">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-info">

            <strong>
              {firstName}{" "}
              {lastName}
            </strong>

            <span>
              Student
            </span>

          </div>

        </div>

        <nav className="dashboard-nav">

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item active"
          >
            <span>◫</span>
            Scan Attendance
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate(
                "/student/attendance"
              )
            }
          >
            <span>✓</span>
            My Attendance
          </button>

          <button
            className="nav-item"
          >
            <span>⚑</span>
            Correction Requests
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="nav-item logout-button"
            onClick={
              handleLogout
            }
          >
            <span>
              ↪
            </span>

            Logout
          </button>

        </div>

      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <h1>
              Scan Attendance
            </h1>

            <p>
              Scan the lecturer's QR code to record your attendance
            </p>

          </div>

          <div className="dashboard-user">

            <div className="header-avatar">
              {firstName
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        <section className="dashboard-content">

          {/* =================================================
              SCANNER PANEL
          ================================================= */}

          <div
            className="dashboard-panel"
            style={{
              maxWidth:
                "720px",
              margin:
                "0 auto",
            }}
          >

            <div
              className="panel-header"
              style={{
                textAlign:
                  "center",
              }}
            >

              <div
                style={{
                  width:
                    "100%",
                }}
              >

                <h2>
                  QR Attendance Scanner
                </h2>

                <p>
                  Point your camera at the active attendance QR code
                </p>

              </div>

            </div>

            {/* =================================================
                CAMERA
            ================================================= */}

            {!scanResult && (
              <div
                style={{
                  width:
                    "100%",
                  maxWidth:
                    "500px",
                  margin:
                    "20px auto",
                }}
              >

                <div
                  id="attendance-qr-reader"
                  style={{
                    width:
                      "100%",
                  }}
                ></div>

              </div>
            )}

            {/* =================================================
                CAMERA STATUS
            ================================================= */}

            {!scanResult &&
              !error && (
                <div
                  style={{
                    textAlign:
                      "center",
                    marginTop:
                      "15px",
                    opacity:
                      0.7,
                  }}
                >
                  {scannerStarted
                    ? "Camera is active. Scan the QR code."
                    : "Starting camera..."}
                </div>
              )}

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
              <div
                style={{
                  margin:
                    "20px auto",
                  maxWidth:
                    "520px",
                  padding:
                    "16px 18px",
                  borderRadius:
                    "12px",
                  background:
                    "#fee2e2",
                  color:
                    "#991b1b",
                  textAlign:
                    "center",
                }}
              >

                <strong>
                  Attendance Error
                </strong>

                <p
                  style={{
                    marginBottom:
                      "15px",
                  }}
                >
                  {error}
                </p>

                <button
                  type="button"
                  onClick={
                    handleRetry
                  }
                >
                  Try Again
                </button>

              </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {scanResult && (
              <div
                style={{
                  margin:
                    "30px auto",
                  maxWidth:
                    "500px",
                  textAlign:
                    "center",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "64px",
                    marginBottom:
                      "10px",
                  }}
                >
                  ✓
                </div>

                <h2>
                  {scanResult.duplicate
                    ? "Attendance Already Recorded"
                    : "Attendance Recorded"}
                </h2>

                <p>
                  {
                    scanResult.message
                  }
                </p>

                {scanResult.status && (
                  <div
                    style={{
                      marginTop:
                        "15px",
                      fontSize:
                        "18px",
                    }}
                  >
                    Status:{" "}
                    <strong>
                      {
                        scanResult.status
                      }
                    </strong>
                  </div>
                )}

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "center",
                    gap:
                      "10px",
                    marginTop:
                      "25px",
                    flexWrap:
                      "wrap",
                  }}
                >

                  <button
                    type="button"
                    onClick={
                      handleRetry
                    }
                  >
                    Scan Again
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/dashboard"
                      )
                    }
                  >
                    Back to Dashboard
                  </button>

                </div>

              </div>
            )}

            {/* =================================================
                INSTRUCTIONS
            ================================================= */}

            {!scanResult && (
              <div
                style={{
                  marginTop:
                    "25px",
                  padding:
                    "18px",
                  borderRadius:
                    "12px",
                  background:
                    "rgba(99, 102, 241, 0.08)",
                }}
              >

                <h3>
                  How to scan
                </h3>

                <ol
                  style={{
                    lineHeight:
                      "1.8",
                    marginBottom:
                      0,
                  }}
                >
                  <li>
                    Make sure the lecturer has opened the attendance session.
                  </li>

                  <li>
                    Allow camera access when requested.
                  </li>

                  <li>
                    Point your camera at the QR code displayed by the lecturer.
                  </li>

                  <li>
                    Keep the QR code inside the scanning box.
                  </li>

                  <li>
                    Wait for the attendance confirmation.
                  </li>
                </ol>

              </div>
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default AttendanceScanner;