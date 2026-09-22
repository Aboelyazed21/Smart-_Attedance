import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./LecturerLayout.css";

function getSavedUser() {
  try {
    return JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    return null;
  }
}

function getInitials(firstName = "", lastName = "") {
  const first = String(firstName).trim().charAt(0);
  const last = String(lastName).trim().charAt(0);

  return `${first}${last}`.toUpperCase() || "L";
}

const navigationItems = [
  { label: "Dashboard", short: "DB", path: "/dashboard" },
  {
    label: "Attendance Sessions",
    short: "AS",
    path: "/lecturer/sessions",
  },
  {
    label: "My Sections",
    short: "SC",
    path: "/lecturer/sections",
  },
  {
    label: "Attendance",
    short: "AT",
    path: "/lecturer/attendance",
  },
  {
    label: "Reports",
    short: "RP",
    path: "/lecturer/reports",
  },
];

export default function LecturerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const savedUser = useMemo(() => getSavedUser(), []);

  const firstName =
    savedUser?.first_name ||
    savedUser?.firstName ||
    "Lecturer";

  const lastName =
    savedUser?.last_name ||
    savedUser?.lastName ||
    "";

  const initials = getInitials(firstName, lastName);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  }

  function isActive(path) {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  }

  return (
    <div className="lecturer-layout">
      <aside className="lecturer-layout-sidebar">
        <div className="lecturer-layout-brand">
          <div className="lecturer-layout-brand-mark">
            A
          </div>

          <div className="lecturer-layout-brand-text">
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <div className="lecturer-layout-profile">
          <div className="lecturer-layout-profile-avatar">
            {initials}
          </div>

          <div className="lecturer-layout-profile-info">
            <strong>
              {firstName} {lastName}
            </strong>
            <span>Lecturer</span>
          </div>
        </div>

        <nav className="lecturer-layout-nav">
          {navigationItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                className={
                  active
                    ? "lecturer-layout-nav-item active"
                    : "lecturer-layout-nav-item"
                }
                onClick={() => navigate(item.path)}
              >
                <span className="lecturer-layout-nav-icon">
                  {item.short}
                </span>

                <span className="lecturer-layout-nav-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="lecturer-layout-footer">
          <div className="lecturer-layout-workspace">
            <span className="lecturer-layout-live">
              <span />
              LIVE
            </span>

            <strong>Teaching workspace</strong>

            <p>
              View your assigned sections and manage
              attendance sessions.
            </p>
          </div>

          <button
            type="button"
            className="lecturer-layout-logout"
            onClick={handleLogout}
          >
            <span className="lecturer-layout-logout-icon">
              LO
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="lecturer-layout-content">
        {children}
      </main>
    </div>
  );
}
