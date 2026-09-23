import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

const navigationItems = [
  {
    label: "Dashboard",
    short: "DB",
    path: "/dashboard",
  },
  {
    label: "Users",
    short: "US",
    path: "/admin/users",
  },
  {
    label: "Courses",
    short: "CO",
    path: "/admin/courses",
  },
  {
    label: "Sections",
    short: "SC",
    path: "/admin/sections",
  },
  {
    label: "Rooms",
    short: "RM",
    path: "/admin/rooms",
  },
  {
    label: "Timetable",
    short: "TT",
    path: "/admin/timetable",
  },
  {
    label: "Attendance",
    short: "AT",
    path: "/admin/attendance",
  },
  {
    label: "Reports",
    short: "RP",
    path: "/admin/reports",
  },
  {
    label: "Settings",
    short: "ST",
    path: "/admin/settings",
  },
  {
    label: "Enrollments",
    short: "EN",
    path: "/admin/enrollments",
  },
];

function AdminIcon({ type }) {
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
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "users":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "courses":
      return (
        <svg {...commonProps}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );

    case "sections":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M17.5 14v7" />
          <path d="M14 17.5h7" />
        </svg>
      );

    case "rooms":
      return (
        <svg {...commonProps}>
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
          <path d="M9 7h4" />
          <path d="M9 11h4" />
          <path d="M9 15h4" />
          <path d="M17 9h2a2 2 0 0 1 2 2v10" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...commonProps}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
        </svg>
      );

    case "attendance":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );

    case "reports":
      return (
        <svg {...commonProps}>
          <path d="M4 19V5" />
          <path d="M4 19h17" />
          <path d="m7 15 3-4 3 2 5-6" />
        </svg>
      );

    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.5 1.5-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V20h-2.12v-.09a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-1.5-1.5.06-.06A1.7 1.7 0 0 0 9.2 15a1.7 1.7 0 0 0-1.55-1.03H7.56v-2.12h.09A1.7 1.7 0 0 0 9.2 10.8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.5-1.5.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.55V6h2.12v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.5 1.5-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03H20v2.12h-.09A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      );

    case "enrollments":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </svg>
      );

    default:
      return null;
  }
}

function LogoutIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
      <path d="M13 21h6a2 2 0 0 0 2-2" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <span className={`admin-menu-icon ${open ? "is-open" : ""}`}>
      <span />
      <span />
      <span />
    </span>
  );
}

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.classList.remove("admin-sidebar-open");
      return;
    }

    document.body.classList.add("admin-sidebar-open");

    return () => {
      document.body.classList.remove("admin-sidebar-open");
    };
  }, [sidebarOpen]);

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const handleNavigation = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setSidebarOpen(false);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };

  return (
    <div
      className={`admin-layout ${
        sidebarOpen ? "admin-sidebar-is-open" : ""
      }`}
    >
      {/* Mobile menu button */}
      <button
        type="button"
        className="admin-mobile-menu-button"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={sidebarOpen}
      >
        <MenuIcon open={sidebarOpen} />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Shared admin sidebar */}
      <aside className="admin-layout-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">SA</div>

          <div className="admin-brand-text">
            <strong>Smart Attendance</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="admin-layout-nav" aria-label="Admin navigation">
          {navigationItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`admin-nav-item ${
                isActive(item.path) ? "active" : ""
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="admin-nav-icon">
                <AdminIcon
                  type={
                    item.path === "/dashboard"
                      ? "dashboard"
                      : item.path === "/admin/users"
                      ? "users"
                      : item.path === "/admin/courses"
                      ? "courses"
                      : item.path === "/admin/sections"
                      ? "sections"
                      : item.path === "/admin/rooms"
                      ? "rooms"
                      : item.path === "/admin/timetable"
                      ? "calendar"
                      : item.path === "/admin/attendance"
                      ? "attendance"
                      : item.path === "/admin/reports"
                      ? "reports"
                      : item.path === "/admin/settings"
                      ? "settings"
                      : "enrollments"
                  }
                />
              </span>

              <span className="admin-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-nav-item admin-logout-item"
            onClick={handleLogout}
          >
            <span className="admin-nav-icon">
              <LogoutIcon />
            </span>

            <span className="admin-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Page content */}
      <main className="admin-layout-content">
        {children}
      </main>
    </div>
  );
}