import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

/* =========================================================
   ADMIN ICON
========================================================= */

function AdminIcon({ type, size = 19 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  switch (type) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );

    case "users":
      return (
        <svg {...commonProps}>
          <path
            d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle
            cx="9"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "courses":
      return (
        <svg {...commonProps}>
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 7h8M8 10h6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "sections":
      return (
        <svg {...commonProps}>
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M3 9h18M8 4v16"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );

    case "rooms":
      return (
        <svg {...commonProps}>
          <path
            d="M4 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M2 21h20M8 7h6M8 11h6M8 15h2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M14 21v-4h2v4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );

    case "calendar":
      return (
        <svg {...commonProps}>
          <rect
            x="3"
            y="4.5"
            width="18"
            height="17"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M16 2.5v4M8 2.5v4M3 9h18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "attendance":
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m8 12 2.5 2.5L16.5 9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "reports":
      return (
        <svg {...commonProps}>
          <path
            d="M4 20V10M10 20V4M16 20v-7M22 20H2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "settings":
      return (
        <svg {...commonProps}>
          <path
            d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.55 2.55l-.1-.1a1.8 1.8 0 0 0-3.07 1.27v.18a1.8 1.8 0 0 1-3.6 0v-.18a1.8 1.8 0 0 0-3.07-1.27l-.1.1a1.8 1.8 0 0 1-2.55-2.55l.1-.1a1.8 1.8 0 0 0-1.27-3.07h-.18a1.8 1.8 0 0 1 0-3.6h.18a1.8 1.8 0 0 0 1.27-3.07l-.1-.1A1.8 1.8 0 0 1 7 4.62l.1.1a1.8 1.8 0 0 0 3.07-1.27v-.18a1.8 1.8 0 0 1 3.6 0v.18a1.8 1.8 0 0 0 3.07 1.27l.1-.1a1.8 1.8 0 0 1 2.55 2.55l-.1.1a1.8 1.8 0 0 0 1.27 3.07h.18a1.8 1.8 0 0 1 0 3.6h-.18A1.8 1.8 0 0 0 19.4 15Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "enrollments":
      return (
        <svg {...commonProps}>
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 8h8M8 12h8M8 16h5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="8"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
  }
}

/* =========================================================
   LOGOUT ICON
========================================================= */

function LogoutIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 17l5-5-5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 12H3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* =========================================================
   MENU ICON
========================================================= */

function MenuIcon({ open }) {
  return (
    <span className={`admin-menu-icon ${open ? "is-open" : ""}`}>
      <span />
      <span />
      <span />
    </span>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    {
      label: "Dashboard",
      short: "DB",
      path: "/dashboard",
      icon: "dashboard",
    },
    {
      label: "Users",
      short: "US",
      path: "/admin/users",
      icon: "users",
    },
    {
      label: "Courses",
      short: "CO",
      path: "/admin/courses",
      icon: "courses",
    },
    {
      label: "Sections",
      short: "SC",
      path: "/admin/sections",
      icon: "sections",
    },
    {
      label: "Rooms",
      short: "RM",
      path: "/admin/rooms",
      icon: "rooms",
    },
    {
      label: "Timetable",
      short: "TM",
      path: "/admin/timetable",
      icon: "calendar",
    },
    {
      label: "Attendance",
      short: "AT",
      path: "/admin/attendance",
      icon: "attendance",
    },
    {
      label: "Reports",
      short: "RP",
      path: "/admin/reports",
      icon: "reports",
    },
    {
      label: "Settings",
      short: "ST",
      path: "/admin/settings",
      icon: "settings",
    },
    {
      label: "Enrollments",
      short: "EN",
      path: "/admin/enrollments",
      icon: "enrollments",
    },
  ];

  /* =========================================================
     CLOSE DRAWER WHEN ROUTE CHANGES
  ========================================================= */

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =========================================================
     LOCK BODY SCROLL ON MOBILE DRAWER
  ========================================================= */

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("admin-sidebar-open");
    } else {
      document.body.classList.remove("admin-sidebar-open");
    }

    return () => {
      document.body.classList.remove("admin-sidebar-open");
    };
  }, [sidebarOpen]);

  /* =========================================================
     ACTIVE ROUTE
  ========================================================= */

  function isActive(path) {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function handleNavigation(path) {
    setSidebarOpen(false);
    navigate(path);
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    setSidebarOpen(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  }

  return (
    <div
      className={`admin-layout ${
        sidebarOpen ? "admin-sidebar-is-open" : ""
      }`}
    >
      {/* =====================================================
          MOBILE MENU BUTTON
      ===================================================== */}

      <button
        type="button"
        className="admin-mobile-menu-button"
        onClick={() => setSidebarOpen((value) => !value)}
        aria-label={
          sidebarOpen
            ? "Close admin navigation"
            : "Open admin navigation"
        }
        aria-expanded={sidebarOpen}
      >
        <MenuIcon open={sidebarOpen} />
      </button>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}

      {/* =====================================================
          SHARED ADMIN SIDEBAR
      ===================================================== */}

      <aside className="admin-layout-sidebar">
        {/* BRAND */}

        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">A</div>

          <div className="admin-brand-text">
            <strong>Attendify</strong>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav
          className="admin-layout-nav"
          aria-label="Admin navigation"
        >
          {navigationItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                className={`admin-nav-item ${
                  active ? "active" : ""
                }`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="admin-nav-icon">
                  <AdminIcon type={item.icon} size={18} />
                </span>

                <span className="admin-nav-label">
                  {item.label}
                </span>

                <span className="admin-nav-short">
                  {item.short}
                </span>
              </button>
            );
          })}
        </nav>

        {/* FOOTER */}

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-logout-item"
            onClick={handleLogout}
          >
            <span className="admin-nav-icon">
              <LogoutIcon size={18} />
            </span>

            <span className="admin-nav-label">
              Logout
            </span>

            <span className="admin-nav-short">
              OUT
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          PAGE CONTENT

          IMPORTANT:
          No margin-left here.
          Grid handles sidebar space.
      ===================================================== */}

      <main className="admin-layout-content">
        {children}
      </main>
    </div>
  );
}