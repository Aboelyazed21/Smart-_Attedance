import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../Footer";
import "../Footer.css";

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

  const [navOpen, setNavOpen] = useState(false);

  const savedUser = useMemo(() => getSavedUser(), []);

  /* Close the mobile drawer whenever the route changes
     (state adjusted during render — no extra effect needed). */
  const [lastPath, setLastPath] = useState(location.pathname);

  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setNavOpen(false);
  }

  /* Escape closes the drawer and the page behind it stays still. */
  useEffect(() => {
    if (!navOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    }

    document.body.classList.add("lecturer-sidebar-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("lecturer-sidebar-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [navOpen]);

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
    <div
      className={
        navOpen
          ? "lecturer-layout sidebar-is-open"
          : "lecturer-layout"
      }
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <button
        type="button"
        className="lecturer-menu-button"
        aria-label={
          navOpen ? "Close navigation" : "Open navigation"
        }
        aria-expanded={navOpen}
        aria-controls="lecturer-sidebar"
        onClick={() => setNavOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {navOpen && (
        <button
          type="button"
          className="lecturer-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside
        id="lecturer-sidebar"
        className="lecturer-layout-sidebar"
      >
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

        <nav
          className="lecturer-layout-nav"
          aria-label="Lecturer"
        >
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
                aria-current={active ? "page" : undefined}
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

      <main
        id="main-content"
        className="lecturer-layout-content"
        tabIndex={-1}
      >
        {children}
        <Footer />
      </main>
    </div>
  );
}
