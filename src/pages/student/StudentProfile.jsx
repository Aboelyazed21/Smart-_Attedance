import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000/api";

export default function StudentProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      /* =========================
         USER
      ========================= */

      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(
          userData.message || "Failed to load account information"
        );
      }

      setUser(userData.user);

      /* =========================
         STUDENT
      ========================= */

      const studentResponse = await fetch(
        `${API_BASE_URL}/students/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const studentData = await studentResponse.json();

      if (studentResponse.ok) {
        setStudent(studentData.student || studentData);
      }

      /* =========================
         ATTENDANCE
      ========================= */

      try {
        const attendanceResponse = await fetch(
          `${API_BASE_URL}/attendance/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const attendanceData = await attendanceResponse.json();

        if (attendanceResponse.ok) {
          setAttendance(
            Array.isArray(attendanceData)
              ? attendanceData
              : Array.isArray(attendanceData.data)
              ? attendanceData.data
              : []
          );
        }
      } catch {
        setAttendance([]);
      }
    } catch (err) {
      console.error("Profile loading error:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function getInitials() {
    if (!user) return "S";

    const first = user.first_name?.charAt(0) || "";
    const last = user.last_name?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "S";
  }

  function getFullName() {
    if (!user) return "Student";

    return `${user.first_name || ""} ${
      user.last_name || ""
    }`.trim();
  }

  const presentCount = attendance.filter(
    (item) =>
      String(
        item.status ||
          item.attendance_status ||
          ""
      ).toLowerCase() === "present"
  ).length;

  const lateCount = attendance.filter(
    (item) =>
      String(
        item.status ||
          item.attendance_status ||
          ""
      ).toLowerCase() === "late"
  ).length;

  const recordsCount = attendance.length;

  const attendanceRate =
    recordsCount > 0
      ? Math.round(
          ((presentCount + lateCount) / recordsCount) * 100
        )
      : 0;

  return (
    <div className="student-profile-page">

      {/* =====================================================
          TOP NAVBAR
      ====================================================== */}

      <header className="student-topbar">

        <div
          className="student-brand"
          onClick={() => navigate("/dashboard")}
        >
          <div className="brand-icon">
            🎓
          </div>

          <div className="brand-text">
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <nav className="student-main-nav">

          <button
            onClick={() => navigate("/dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            onClick={() =>
              navigate("/student/attendance")
            }
          >
            <span>▣</span>
            My Attendance
          </button>

          <button
            onClick={() =>
              navigate("/student/scan")
            }
          >
            <span>⌗</span>
            Scan QR
          </button>

          <button
            onClick={() =>
              navigate("/student/sessions")
            }
          >
            <span>▤</span>
            My Sessions
          </button>

          <button
            onClick={() =>
              navigate("/student/corrections")
            }
          >
            <span>⚑</span>
            Correction Requests
          </button>

          <button
            onClick={() =>
              navigate("/student/notifications")
            }
          >
            <span>●</span>
            Notifications
          </button>

        </nav>

        <div className="top-profile">

          <div className="top-avatar">
            {getInitials()}
          </div>

          <div className="top-profile-info">
            <strong>
              {user?.first_name || "Student"}
            </strong>

            <span>Student</span>
          </div>

          <button
            className="profile-menu-btn"
            onClick={handleLogout}
            title="Logout"
          >
            ↓
          </button>

        </div>

      </header>

      {/* =====================================================
          PAGE
      ====================================================== */}

      <main className="student-profile-main">

        <div className="profile-page-heading">

          <div>
            <div className="breadcrumb">
              Home <span>›</span> My Profile
            </div>

            <h1>My Profile</h1>

            <p>
              View and manage your personal account information.
            </p>
          </div>

          <button
            className="refresh-btn"
            onClick={loadProfile}
          >
            ↻ Refresh
          </button>

        </div>

        {loading && (
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        )}

        {!loading && error && (
          <div className="profile-error">
            <strong>Profile Error</strong>
            <span>{error}</span>

            <button onClick={loadProfile}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>

            {/* =================================================
                HERO PROFILE CARD
            ================================================== */}

            <section className="profile-hero">

              <div className="hero-left">

                <div className="hero-avatar">
                  {getInitials()}

                  <span className="avatar-status"></span>
                </div>

                <div className="hero-user-info">

                  <span className="hero-label">
                    STUDENT ACCOUNT
                  </span>

                  <h2>
                    {getFullName()}
                  </h2>

                  <div className="hero-contact">

                    <span>
                      ✉ {user?.email || "No email"}
                    </span>

                    <span>
                      ☎ {user?.phone || "No phone"}
                    </span>

                  </div>

                  <div className="hero-badges">

                    <span className="badge">
                      🎓 Student
                    </span>

                    <span className="badge">
                      ● Active
                    </span>

                    <span className="badge">
                      ID:{" "}
                      {student?.student_code ||
                        student?.studentCode ||
                        "—"}
                    </span>

                  </div>

                </div>

              </div>

              <div className="hero-decoration">
                <div className="hero-circle circle-one"></div>
                <div className="hero-circle circle-two"></div>

                <div className="hero-graduation">
                  🎓
                </div>

                <p>
                  "Consistency today
                  <br />
                  builds a brighter tomorrow."
                </p>
              </div>

              <button
                className="edit-profile-btn"
                onClick={() =>
                  document
                    .getElementById("personal-information")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                ✎ Edit Profile
              </button>

            </section>

            {/* =================================================
                STATISTICS
            ================================================== */}

            <section className="profile-stats">

              <StatCard
                icon="◉"
                title="Total Attendance"
                value={`${attendanceRate}%`}
                description="Keep going!"
                type="blue"
              />

              <StatCard
                icon="✓"
                title="Present"
                value={presentCount}
                description="Classes attended"
                type="green"
              />

              <StatCard
                icon="◷"
                title="Late"
                value={lateCount}
                description="Arrived late"
                type="orange"
              />

              <StatCard
                icon="▤"
                title="Records"
                value={recordsCount}
                description="Total records"
                type="purple"
              />

            </section>

            {/* =================================================
                CONTENT GRID
            ================================================== */}

            <section className="profile-content-grid">

              {/* PERSONAL */}

              <div
                className="profile-card personal-card"
                id="personal-information"
              >

                <div className="card-header">

                  <div className="card-title-icon">
                    ●
                  </div>

                  <div>
                    <h3>
                      Personal Information
                    </h3>

                    <p>
                      Your basic account details
                    </p>
                  </div>

                  <button
                    className="small-edit-btn"
                    onClick={() =>
                      window.alert(
                        "Profile editing is connected to your account settings."
                      )
                    }
                  >
                    ✎ Edit
                  </button>

                </div>

                <div className="information-grid">

                  <InfoItem
                    label="First Name"
                    value={
                      user?.first_name || "Not provided"
                    }
                    icon="●"
                  />

                  <InfoItem
                    label="Last Name"
                    value={
                      user?.last_name || "Not provided"
                    }
                    icon="●"
                  />

                  <InfoItem
                    label="Email Address"
                    value={
                      user?.email || "Not provided"
                    }
                    icon="✉"
                    full
                  />

                  <InfoItem
                    label="Phone Number"
                    value={
                      user?.phone || "Not provided"
                    }
                    icon="☎"
                  />

                  <InfoItem
                    label="Account Status"
                    value={
                      user?.status || "active"
                    }
                    icon="●"
                  />

                </div>

              </div>

              {/* ACADEMIC */}

              <div className="profile-card academic-card">

                <div className="card-header">

                  <div className="card-title-icon academic-icon">
                    🎓
                  </div>

                  <div>
                    <h3>
                      Academic Information
                    </h3>

                    <p>
                      Information linked to your student record
                    </p>
                  </div>

                </div>

                <div className="information-grid">

                  <InfoItem
                    label="Student ID"
                    value={
                      student?.student_code ||
                      student?.studentCode ||
                      "Not provided"
                    }
                    icon="#"
                  />

                  <InfoItem
                    label="Profile ID"
                    value={
                      student?.id || "Not provided"
                    }
                    icon="ID"
                  />

                  <InfoItem
                    label="Department"
                    value={
                      student?.department_name ||
                      student?.department ||
                      "Not provided"
                    }
                    icon="▦"
                  />

                  <InfoItem
                    label="Level / Year"
                    value={
                      student?.level ||
                      student?.academic_level ||
                      "Not provided"
                    }
                    icon="▥"
                  />

                </div>

              </div>

              {/* SECURITY */}

              <div className="side-card security-card">

                <div className="side-card-icon">
                  🔒
                </div>

                <h3>
                  Account Security
                </h3>

                <p>
                  Keep your account secure by using
                  a strong private password.
                </p>

                <button
                  onClick={() =>
                    window.alert(
                      "Password change will be available from account settings."
                    )
                  }
                >
                  🔑 Change Password
                </button>

              </div>

              {/* QUICK ACTIONS */}

              <div className="side-card actions-card">

                <div className="side-card-icon orange">
                  ⚡
                </div>

                <h3>
                  Quick Actions
                </h3>

                <p>
                  Common account actions
                </p>

                <ActionButton
                  text="View My Attendance"
                  onClick={() =>
                    navigate("/student/attendance")
                  }
                />

                <ActionButton
                  text="View My Sessions"
                  onClick={() =>
                    navigate("/student/sessions")
                  }
                />

                <ActionButton
                  text="Scan Attendance QR"
                  onClick={() =>
                    navigate("/student/scan")
                  }
                />

              </div>

            </section>

            {/* =================================================
                RECENT ACTIVITY
            ================================================== */}

            <section className="recent-card">

              <div className="recent-header">

                <div>
                  <h3>
                    Recent Activity
                  </h3>

                  <p>
                    Your latest attendance activity
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate("/student/attendance")
                  }
                >
                  View All →
                </button>

              </div>

              {attendance.length === 0 ? (
                <div className="empty-activity">

                  <div className="empty-icon">
                    ▤
                  </div>

                  <strong>
                    No recent activity
                  </strong>

                  <span>
                    Your latest attendance actions
                    will appear here.
                  </span>

                </div>
              ) : (
                <div className="activity-list">

                  {attendance
                    .slice(0, 5)
                    .map((item, index) => (
                      <div
                        className="activity-row"
                        key={
                          item.id || index
                        }
                      >

                        <div className="activity-icon">
                          ✓
                        </div>

                        <div>
                          <strong>
                            Attendance Recorded
                          </strong>

                          <span>
                            {item.course_name ||
                              item.course_code ||
                              "Attendance session"}
                          </span>
                        </div>

                        <span className="activity-status">
                          {item.status ||
                            item.attendance_status ||
                            "Recorded"}
                        </span>

                      </div>
                    ))}

                </div>
              )}

            </section>

          </>
        )}

      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="profile-footer">

        <span>
          © 2026 Attendify. All rights reserved.
        </span>

        <div>
          <button>Privacy</button>
          <button>Terms</button>
          <button>Help</button>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>

      </footer>

      {/* =====================================================
          PAGE STYLES
      ====================================================== */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .student-profile-page {
          min-height: 100vh;
          background: #f5f8fd;
          color: #102b5c;
          font-family:
            Inter,
            "Segoe UI",
            Arial,
            sans-serif;
        }

        /* ================================
           TOP NAV
        ================================= */

        .student-topbar {
          height: 72px;
          background: rgba(255,255,255,0.97);
          border-bottom: 1px solid #e8edf5;
          display: flex;
          align-items: center;
          padding: 0 5%;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow:
            0 2px 12px rgba(15,45,90,0.04);
        }

        .student-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          min-width: 190px;
        }

        .brand-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background:
            linear-gradient(
              135deg,
              #1769e0,
              #4388ed
            );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          box-shadow:
            0 5px 15px rgba(23,105,224,0.18);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-text strong {
          font-size: 21px;
          line-height: 20px;
          color: #0c2c66;
        }

        .brand-text span {
          font-size: 7px;
          letter-spacing: 1.7px;
          font-weight: 800;
          color: #72809b;
          margin-top: 4px;
        }

        .student-main-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex: 1;
        }

        .student-main-nav button {
          border: none;
          background: transparent;
          color: #203b69;
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: 0.2s;
        }

        .student-main-nav button:hover {
          background: #eef4ff;
          color: #1769e0;
        }

        .student-main-nav button span {
          color: #1557bb;
          font-size: 15px;
        }

        .top-profile {
          min-width: 190px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
        }

        .top-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background:
            linear-gradient(
              135deg,
              #1769e0,
              #397de1
            );
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }

        .top-profile-info {
          display: flex;
          flex-direction: column;
          min-width: 70px;
        }

        .top-profile-info strong {
          font-size: 11px;
          color: #122d5b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 95px;
        }

        .top-profile-info span {
          font-size: 10px;
          color: #75839c;
          margin-top: 2px;
        }

        .profile-menu-btn {
          border: 1px solid #dce5f2;
          background: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          color: #1769e0;
        }

        /* ================================
           MAIN
        ================================= */

        .student-profile-main {
          width: min(1380px, 92%);
          margin: auto;
          padding: 28px 0 50px;
        }

        .profile-page-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .breadcrumb {
          color: #72819c;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .breadcrumb span {
          margin: 0 7px;
          color: #a9b4c7;
        }

        .profile-page-heading h1 {
          margin: 0;
          font-size: 31px;
          color: #102b5c;
          letter-spacing: -0.7px;
        }

        .profile-page-heading p {
          margin: 6px 0 0;
          color: #72809a;
          font-size: 14px;
        }

        .refresh-btn {
          border: 1px solid #dce5f2;
          background: white;
          color: #1769e0;
          padding: 10px 17px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        /* ================================
           HERO
        ================================= */

        .profile-hero {
          min-height: 180px;
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          padding: 30px 32px;
          color: #102b5c;
          background:
            linear-gradient(
              120deg,
              #dceaff 0%,
              #eef5ff 50%,
              #d8e9ff 100%
            );
          border: 1px solid #c9ddfa;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow:
            0 8px 28px rgba(20,65,130,0.07);
          margin-bottom: 18px;
        }

        .hero-left {
          display: flex;
          align-items: center;
          gap: 22px;
          position: relative;
          z-index: 2;
        }

        .hero-avatar {
          width: 104px;
          height: 104px;
          border-radius: 50%;
          background: white;
          border: 4px solid rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1769e0;
          font-size: 31px;
          font-weight: 800;
          position: relative;
          box-shadow:
            0 8px 25px rgba(27,76,145,0.13);
        }

        .avatar-status {
          position: absolute;
          right: 2px;
          bottom: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #16a566;
          border: 3px solid white;
        }

        .hero-user-info h2 {
          margin: 4px 0 5px;
          font-size: 29px;
          color: #0c2b61;
          letter-spacing: -0.5px;
        }

        .hero-label {
          font-size: 10px;
          letter-spacing: 1.8px;
          font-weight: 800;
          color: #3972c7;
        }

        .hero-contact {
          display: flex;
          gap: 20px;
          color: #405b83;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .hero-badges {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .badge {
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.85);
          border-radius: 20px;
          padding: 6px 11px;
          font-size: 11px;
          font-weight: 700;
          color: #234676;
        }

        .hero-decoration {
          position: absolute;
          right: 40px;
          top: 0;
          height: 100%;
          width: 390px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
        }

        .hero-circle {
          position: absolute;
          border-radius: 50%;
          border: 35px solid rgba(73,139,227,0.08);
        }

        .circle-one {
          width: 250px;
          height: 250px;
          right: -80px;
          top: -80px;
        }

        .circle-two {
          width: 150px;
          height: 150px;
          left: 30px;
          bottom: -80px;
        }

        .hero-graduation {
          font-size: 64px;
          position: relative;
          z-index: 2;
          opacity: 0.5;
        }

        .hero-decoration p {
          position: relative;
          z-index: 2;
          font-size: 12px;
          line-height: 1.5;
          color: #4b6388;
          font-style: italic;
        }

        .edit-profile-btn {
          position: absolute;
          top: 22px;
          right: 22px;
          z-index: 5;
          border: none;
          background: #1769e0;
          color: white;
          padding: 10px 17px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            0 5px 15px rgba(23,105,224,0.2);
        }

        /* ================================
           STATS
        ================================= */

        .profile-stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e4ebf5;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow:
            0 4px 16px rgba(25,60,110,0.04);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 18px;
        }

        .stat-card.blue .stat-icon {
          background: #e9f2ff;
          color: #1769e0;
        }

        .stat-card.green .stat-icon {
          background: #e5f8ef;
          color: #16a566;
        }

        .stat-card.orange .stat-icon {
          background: #fff3df;
          color: #e99812;
        }

        .stat-card.purple .stat-icon {
          background: #f0ebff;
          color: #6d55d9;
        }

        .stat-title {
          font-size: 11px;
          color: #72809a;
          margin-bottom: 3px;
        }

        .stat-value {
          font-size: 25px;
          font-weight: 800;
          color: #102b5c;
          line-height: 1;
        }

        .stat-description {
          font-size: 10px;
          color: #8491a8;
          margin-top: 4px;
        }

        /* ================================
           CONTENT
        ================================= */

        .profile-content-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.3fr)
            minmax(0, 1fr)
            minmax(250px, 0.75fr);
          gap: 16px;
          align-items: start;
        }

        .profile-card,
        .side-card,
        .recent-card {
          background: white;
          border: 1px solid #e4ebf5;
          border-radius: 17px;
          box-shadow:
            0 4px 18px rgba(25,60,110,0.04);
        }

        .profile-card {
          padding: 20px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 11px;
          padding-bottom: 15px;
          border-bottom: 1px solid #edf1f7;
          margin-bottom: 15px;
        }

        .card-title-icon,
        .side-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #eaf2ff;
          color: #1769e0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .academic-icon {
          background: #edf2ff;
          color: #5369d9;
        }

        .card-header h3,
        .side-card h3,
        .recent-header h3 {
          margin: 0;
          font-size: 17px;
          color: #112e60;
        }

        .card-header p,
        .side-card p,
        .recent-header p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #7b89a1;
        }

        .small-edit-btn {
          margin-left: auto;
          border: 1px solid #dbe5f3;
          background: white;
          color: #1769e0;
          border-radius: 8px;
          padding: 7px 11px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .information-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .info-item {
          background: #f7f9fd;
          border: 1px solid #e9eef6;
          border-radius: 11px;
          padding: 12px;
        }

        .info-item.full {
          grid-column: 1 / -1;
        }

        .info-label {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #71809b;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-icon {
          color: #1769e0;
          font-size: 9px;
        }

        .info-value {
          margin-top: 6px;
          color: #173663;
          font-size: 12px;
          font-weight: 700;
          word-break: break-word;
        }

        /* ================================
           SIDE CARDS
        ================================= */

        .side-card {
          padding: 19px;
        }

        .side-card-icon {
          margin-bottom: 10px;
        }

        .side-card-icon.orange {
          background: #fff1dc;
          color: #ed9711;
        }

        .side-card h3 {
          font-size: 16px;
        }

        .side-card p {
          line-height: 1.6;
          margin-bottom: 15px;
        }

        .security-card button {
          width: 100%;
          border: 1px solid #cbdcf6;
          background: #f9fbff;
          color: #1769e0;
          border-radius: 9px;
          padding: 10px;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
        }

        .actions-card {
          margin-top: 16px;
        }

        .action-button {
          width: 100%;
          border: 1px solid #e0e8f4;
          background: #f9fbff;
          color: #193968;
          border-radius: 9px;
          padding: 11px 12px;
          margin-top: 8px;
          text-align: left;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          transition: 0.2s;
        }

        .action-button:hover {
          border-color: #bcd3f6;
          background: #f0f6ff;
          color: #1769e0;
        }

        /* ================================
           RECENT
        ================================= */

        .recent-card {
          margin-top: 16px;
          padding: 20px;
        }

        .recent-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #edf1f7;
        }

        .recent-header button {
          border: 1px solid #dbe5f2;
          background: white;
          color: #1769e0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-activity {
          min-height: 150px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          color: #7c8ba4;
        }

        .empty-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #f0f4fa;
          color: #9aa9bd;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 5px;
        }

        .empty-activity strong {
          font-size: 12px;
          color: #53637e;
        }

        .empty-activity span {
          font-size: 10px;
        }

        .activity-list {
          padding-top: 7px;
        }

        .activity-row {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 4px;
          border-bottom: 1px solid #f0f3f7;
        }

        .activity-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #e9f8f0;
          color: #159d60;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .activity-row > div:nth-child(2) {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .activity-row strong {
          font-size: 11px;
        }

        .activity-row span {
          color: #8090a8;
          font-size: 10px;
          margin-top: 3px;
        }

        .activity-status {
          color: #159d60 !important;
          font-weight: 700;
        }

        /* ================================
           LOADING / ERROR
        ================================= */

        .profile-loading {
          min-height: 350px;
          background: white;
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #71809a;
        }

        .loading-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e5edfa;
          border-top-color: #1769e0;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .profile-error {
          background: #fff4f4;
          border: 1px solid #ffd4d4;
          color: #b52c2c;
          padding: 20px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .profile-error button {
          width: fit-content;
          border: none;
          background: #d93636;
          color: white;
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          margin-top: 5px;
        }

        /* ================================
           FOOTER
        ================================= */

        .profile-footer {
          width: min(1380px, 92%);
          margin: auto;
          border-top: 1px solid #e2e8f1;
          padding: 20px 0 28px;
          display: flex;
          justify-content: space-between;
          color: #7c899f;
          font-size: 11px;
        }

        .profile-footer div {
          display: flex;
          gap: 17px;
        }

        .profile-footer button {
          border: none;
          background: transparent;
          color: #60718e;
          cursor: pointer;
          font-size: 11px;
        }

        /* ================================
           RESPONSIVE
        ================================= */

        @media (max-width: 1200px) {

          .student-main-nav {
            gap: 0;
          }

          .student-main-nav button {
            padding: 9px 7px;
            font-size: 10px;
          }

          .student-brand {
            min-width: 155px;
          }

          .top-profile {
            min-width: 150px;
          }

          .profile-content-grid {
            grid-template-columns:
              minmax(0, 1fr)
              minmax(0, 1fr);
          }

          .security-card,
          .actions-card {
            grid-column: span 1;
          }

        }

        @media (max-width: 900px) {

          .student-topbar {
            height: auto;
            min-height: 70px;
            flex-wrap: wrap;
            padding: 10px 4%;
          }

          .student-main-nav {
            order: 3;
            width: 100%;
            overflow-x: auto;
            justify-content: flex-start;
            padding-top: 8px;
          }

          .top-profile {
            margin-left: auto;
          }

          .profile-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .profile-content-grid {
            grid-template-columns: 1fr;
          }

          .hero-decoration {
            opacity: 0.3;
            right: -40px;
          }

        }

        @media (max-width: 650px) {

          .student-profile-main {
            width: 94%;
            padding-top: 18px;
          }

          .student-brand {
            min-width: auto;
          }

          .brand-text {
            display: none;
          }

          .top-profile-info {
            display: none;
          }

          .profile-page-heading {
            align-items: flex-start;
            gap: 12px;
          }

          .profile-page-heading h1 {
            font-size: 25px;
          }

          .profile-hero {
            padding: 22px;
          }

          .hero-left {
            gap: 14px;
          }

          .hero-avatar {
            width: 76px;
            height: 76px;
            font-size: 23px;
          }

          .hero-user-info h2 {
            font-size: 21px;
          }

          .hero-contact {
            flex-direction: column;
            gap: 4px;
          }

          .hero-decoration {
            display: none;
          }

          .edit-profile-btn {
            position: static;
            margin-left: auto;
            align-self: flex-start;
            padding: 8px 10px;
          }

          .profile-stats {
            grid-template-columns: 1fr;
          }

          .information-grid {
            grid-template-columns: 1fr;
          }

          .info-item.full {
            grid-column: auto;
          }

          .profile-footer {
            flex-direction: column;
            gap: 12px;
          }

        }

      `}</style>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  description,
  type,
}) {
  return (
    <div className={`stat-card ${type}`}>

      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <div className="stat-title">
          {title}
        </div>

        <div className="stat-value">
          {value}
        </div>

        <div className="stat-description">
          {description}
        </div>
      </div>

    </div>
  );
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({
  label,
  value,
  icon,
  full = false,
}) {
  return (
    <div
      className={`info-item ${
        full ? "full" : ""
      }`}
    >

      <div className="info-label">
        <span className="info-icon">
          {icon}
        </span>

        {label}
      </div>

      <div className="info-value">
        {value}
      </div>

    </div>
  );
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  text,
  onClick,
}) {
  return (
    <button
      className="action-button"
      onClick={onClick}
    >
      {text}
      <span style={{ float: "right" }}>
        →
      </span>
    </button>
  );
}