import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../Footer";
import "../Footer.css";
import ThemeToggle from "../ThemeToggle";
import { useLanguage, LanguageToggle } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";

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
  { label: "nav.dashboard", icon: "dashboard", path: "/dashboard" },
  {
    label: "nav.sessions",
    icon: "sessions",
    path: "/lecturer/sessions",
  },
  {
    label: "nav.mySections",
    icon: "sections",
    path: "/lecturer/sections",
  },
  {
    label: "nav.attendance",
    icon: "attendance",
    path: "/lecturer/attendance",
  },
  {
    label: "nav.reports",
    icon: "reports",
    path: "/lecturer/reports",
  },
];

const pageTitles = {
  "/dashboard": "Dashboard",
  "/lecturer/sessions": "Attendance Sessions",
  "/lecturer/sections": "My Sections",
  "/lecturer/attendance": "Attendance",
  "/lecturer/reports": "Reports",
};

function getPageTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/lecturer/sessions/"))
    return "Session Details";
  if (pathname.startsWith("/lecturer/")) return "Lecturer Portal";
  return "Lecturer Portal";
}

function NavIcon({ name }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    sessions: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    sections: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </>
    ),
    attendance: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
    reports: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 4v16" />
      </>
    ),
  };

  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.dashboard}
    </svg>
  );
}

export default function LecturerLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { platformName } = usePlatformSettings();

  const platformInitial =
    String(platformName || "A").trim().charAt(0).toUpperCase() ||
    "A";

  const [navOpen, setNavOpen] = useState(false);

  const savedUser = useMemo(() => getSavedUser(), []);

  /* Close the mobile drawer whenever the route changes. */
  const [lastPath, setLastPath] = useState(location.pathname);

  useEffect(() => {
    if (lastPath !== location.pathname) {
      setLastPath(location.pathname);
      setNavOpen(false);
    }
  }, [lastPath, location.pathname]);

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
    navigate("/logout");
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

      <header className="lecturer-mobile-header">
        <button
          type="button"
          className="lecturer-menu-button"
          aria-label={
            navOpen ? t("a11y.closeNav") : t("a11y.openNav")
          }
          aria-expanded={navOpen}
          aria-controls="lecturer-sidebar"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="lecturer-mobile-header-text">
          <strong>{platformName}</strong>
          <span>{getPageTitle(location.pathname)}</span>
        </div>

        <ThemeToggle />

        <div
          className="lecturer-mobile-header-avatar"
          aria-hidden="true"
        >
          {initials}
        </div>
      </header>

      {navOpen && (
        <button
          type="button"
          className="lecturer-sidebar-overlay"
          aria-label={t("a11y.closeNav")}
          onClick={() => setNavOpen(false)}
        />
      )}

      <button
        type="button"
        className="lecturer-sidebar-close"
        aria-label={t("a11y.closeNav")}
        aria-expanded={navOpen}
        aria-controls="lecturer-sidebar"
        onClick={() => setNavOpen(false)}
        tabIndex={navOpen ? 0 : -1}
      >
        <span aria-hidden="true">×</span>
      </button>

      <aside
        id="lecturer-sidebar"
        className="lecturer-layout-sidebar"
      >
        <div className="lecturer-layout-brand">
          <div className="lecturer-layout-brand-mark">
            {platformInitial}
          </div>

          <div className="lecturer-layout-brand-text">
            <strong>{platformName}</strong>
            <span>{t("brand.tagline")}</span>
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
            <span>{t("role.lecturer")}</span>
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
                  <NavIcon name={item.icon} />
                </span>

                <span className="lecturer-layout-nav-label">
                  {t(item.label)}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="lecturer-layout-footer">
          <div className="lecturer-layout-workspace">
            <strong>{t("workspace.title")}</strong>

            <p>{t("workspace.text")}</p>
          </div>

          <button
            type="button"
            className="lecturer-layout-logout"
            onClick={handleLogout}
          >
            <span className="lecturer-layout-logout-icon">
              <NavIcon name="logout" />
            </span>

            <span>{t("action.logout")}</span>
          </button>

          <LanguageToggle className="lang-toggle-block" />

          <div className="lecturer-layout-theme">
            <span>{t("common.theme")}</span>
            <ThemeToggle />
          </div>
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
