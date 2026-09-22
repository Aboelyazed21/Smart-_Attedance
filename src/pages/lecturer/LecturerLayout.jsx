import { useEffect, useMemo, useState } from "react";
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

/*
|--------------------------------------------------------------------------
| Simple inline icons
|--------------------------------------------------------------------------
| No external icon package required.
|--------------------------------------------------------------------------
*/

function NavIcon({ type }) {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10.5V20h14v-9.5" />
          <path d="M9 20v-5h6v5" />
        </svg>
      );

    case "sessions":
      return (
        <svg {...commonProps}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <path d="M8 14h3M8 17h5" />
        </svg>
      );

    case "sections":
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );

    case "attendance":
      return (
        <svg {...commonProps}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 3.5h6" />
          <path d="m8.5 11 2 2 5-5" />
        </svg>
      );

    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M5 20V10M12 20V4M19 20v-7" />
          <path d="M3 20h18" />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function MenuIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="lecturer-layout-brand-mark">
      A
    </div>
  );
}

const navigationItems = [
  {
    label: "Dashboard",
    short: "DB",
    icon: "dashboard",
    path: "/dashboard",
  },
  {
    label: "Attendance Sessions",
    short: "AS",
    icon: "sessions",
    path: "/lecturer/sessions",
  },
  {
    label: "My Sections",
    short: "SC",
    icon: "sections",
    path: "/lecturer/sections",
  },
  {
    label: "Attendance",
    short: "AT",
    icon: "attendance",
    path: "/lecturer/attendance",
  },
  {
    label: "Reports",
    short: "RP",
    icon: "reports",
    path: "/lecturer/reports",
  },
];

export default function LecturerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const savedUser = useMemo(
    () => getSavedUser(),
    []
  );

  const firstName =
    savedUser?.first_name ||
    savedUser?.firstName ||
    "Lecturer";

  const lastName =
    savedUser?.last_name ||
    savedUser?.lastName ||
    "";

  const initials = getInitials(
    firstName,
    lastName
  );

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

  function handleNavigation(path) {
    navigate(path);
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((current) => !current);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  /*
  |--------------------------------------------------------------------------
  | Close mobile drawer when route changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /*
  |--------------------------------------------------------------------------
  | Close mobile drawer with Escape
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [mobileMenuOpen]);

  /*
  |--------------------------------------------------------------------------
  | Prevent background scrolling while mobile drawer is open
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="lecturer-layout">
      {/* ==========================================================
          MOBILE HEADER
      ========================================================== */}

      <header className="lecturer-layout-mobile-header">
        <button
          type="button"
          className="lecturer-layout-mobile-menu"
          onClick={toggleMobileMenu}
          aria-label={
            mobileMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={mobileMenuOpen}
        >
          <MenuIcon />
        </button>

        <button
          type="button"
          className="lecturer-layout-mobile-brand"
          onClick={() =>
            handleNavigation("/dashboard")
          }
          aria-label="Go to dashboard"
        >
          <LogoMark />

          <span className="lecturer-layout-mobile-brand-text">
            <strong>Attendify</strong>
            <small>Smart Attendance</small>
          </span>
        </button>

        <div className="lecturer-layout-mobile-user">
          <div className="lecturer-layout-mobile-avatar">
            {initials}
          </div>
        </div>
      </header>

      {/* ==========================================================
          MOBILE OVERLAY
      ========================================================== */}

      <button
        type="button"
        className={
          mobileMenuOpen
            ? "lecturer-layout-overlay visible"
            : "lecturer-layout-overlay"
        }
        onClick={closeMobileMenu}
        aria-label="Close navigation"
        tabIndex={mobileMenuOpen ? 0 : -1}
      />

      {/* ==========================================================
          SIDEBAR
      ========================================================== */}

      <aside
        className={
          mobileMenuOpen
            ? "lecturer-layout-sidebar mobile-open"
            : "lecturer-layout-sidebar"
        }
      >
        {/* BRAND */}

        <div className="lecturer-layout-brand">
          <button
            type="button"
            className="lecturer-layout-brand-button"
            onClick={() =>
              handleNavigation("/dashboard")
            }
            aria-label="Go to dashboard"
          >
            <LogoMark />

            <div className="lecturer-layout-brand-text">
              <strong>Attendify</strong>
              <span>SMART ATTENDANCE</span>
            </div>
          </button>

          <button
            type="button"
            className="lecturer-layout-mobile-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        {/* PROFILE */}

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

        {/* NAVIGATION */}

        <nav
          className="lecturer-layout-nav"
          aria-label="Lecturer navigation"
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
                onClick={() =>
                  handleNavigation(item.path)
                }
              >
                <span className="lecturer-layout-nav-icon">
                  <NavIcon type={item.icon} />
                </span>

                <span className="lecturer-layout-nav-label">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* BOTTOM AREA */}

        <div className="lecturer-layout-footer">
          <div className="lecturer-layout-workspace">
            <span className="lecturer-layout-live">
              <span />
              LIVE
            </span>

            <strong>
              Teaching workspace
            </strong>

            <p>
              View your assigned sections and
              manage attendance sessions.
            </p>
          </div>

          <button
            type="button"
            className="lecturer-layout-logout"
            onClick={handleLogout}
          >
            <span className="lecturer-layout-logout-icon">
              ↪
            </span>

            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* PAGE CONTENT */}

      <main className="lecturer-layout-content">
        {children}
      </main>
    </div>
  );
}