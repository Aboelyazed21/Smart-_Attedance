import { useNavigate, useLocation } from "react-router-dom";
import "./StudentMobileNav.css";

function NavIcon({ type }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "home") {
    return (
      <svg {...common}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13v-9.5" />
        <path d="M9.5 20v-5h5v5" />
      </svg>
    );
  }

  if (type === "attendance") {
    return (
      <svg {...common}>
        <path d="M5 19V10" />
        <path d="M12 19V5" />
        <path d="M19 19v-6" />
        <path d="M3 19h18" />
      </svg>
    );
  }

  if (type === "scan") {
    return (
      <svg {...common}>
        <path d="M5 5h5v5H5z" />
        <path d="M14 5h5v5h-5z" />
        <path d="M5 14h5v5H5z" />
        <path d="M14 14h2" />
        <path d="M19 14v5h-3" />
        <path d="M14 19v-2" />
      </svg>
    );
  }

  if (type === "correction") {
    return (
      <svg {...common}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }

  return null;
}

function StudentMobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  const items = [
    {
      label: "Home",
      path: "/dashboard",
      icon: "home",
    },
    {
      label: "Attendance",
      path: "/student/attendance",
      icon: "attendance",
    },
    {
      label: "Scan",
      path: "/student/scan",
      icon: "scan",
    },
    {
      label: "Requests",
      path: "/student/correction-requests",
      icon: "correction",
    },
  ];

  function isActive(item) {
    if (item.path === "/dashboard") {
      return currentPath === "/dashboard";
    }

    return currentPath.startsWith(item.path);
  }

  return (
    <nav
      className="student-mobile-bottom-nav"
      aria-label="Student navigation"
    >
      {items.map((item) => (
        <button
          key={item.path}
          type="button"
          className={
            isActive(item)
              ? "student-mobile-nav-item active"
              : "student-mobile-nav-item"
          }
          onClick={() => navigate(item.path)}
        >
          <span className="student-mobile-nav-icon">
            <NavIcon type={item.icon} />
          </span>

          <span className="student-mobile-nav-label">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

export default StudentMobileNav;
