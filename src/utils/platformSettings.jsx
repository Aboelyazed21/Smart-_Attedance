import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

import { getPublicSettings } from "../services/api";

const DEFAULTS = {
  platformName: "Attendify",
  maintenanceMode: false,
  maintenanceMessage:
    "The platform is currently under maintenance. Please check back soon.",
  maintenanceUntil: null,
};

const PlatformSettingsContext = createContext({
  ...DEFAULTS,
  loaded: false,
  refresh: async () => {},
});

/* Short label per route for dynamic document.title. */

function titleForPath(pathname) {
  const path = String(pathname || "/");

  if (path === "/") return "Login";
  if (path === "/register") return "Register";
  if (path === "/forgot-password") return "Forgot Password";
  if (path === "/reset-password") return "Reset Password";
  if (path === "/dashboard") return "Dashboard";
  if (path === "/logout") return "Signed Out";

  if (path.startsWith("/admin/weekly-emails")) {
    return "Weekly Emails";
  }

  if (path.startsWith("/admin/")) return "Admin";

  if (path.startsWith("/lecturer/")) return "Lecturer";

  if (path === "/student/attendance") return "Attendance";
  if (path === "/student/scan") return "Scan Attendance";
  if (path.startsWith("/student/")) return "Student";

  return null;
}

export function PlatformSettingsProvider({ children }) {
  const location = useLocation();
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await getPublicSettings();

      setSettings({
        platformName:
          data.platformName || DEFAULTS.platformName,
        maintenanceMode: Boolean(data.maintenanceMode),
        maintenanceMessage:
          data.maintenanceMessage ||
          DEFAULTS.maintenanceMessage,
        maintenanceUntil: data.maintenanceUntil ?? null,
      });
    } catch {
      // Backend unreachable or endpoint missing:
      // keep safe defaults, never crash the app.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Refetch when any API reports maintenance (no polling). */

  useEffect(() => {
    function handleMaintenance() {
      refresh();
    }

    window.addEventListener(
      "platform-maintenance",
      handleMaintenance
    );

    return () =>
      window.removeEventListener(
        "platform-maintenance",
        handleMaintenance
      );
  }, [refresh]);

  /* Dynamic browser title from the platform name,
     refreshed on every client-side navigation. */

  useEffect(() => {
    try {
      const label = titleForPath(location.pathname);

      document.title = label
        ? `${settings.platformName} | ${label}`
        : settings.platformName;
    } catch {
      /* non-DOM environment */
    }
  }, [settings.platformName, location.pathname]);

  const value = useMemo(
    () => ({ ...settings, loaded, refresh }),
    [settings, loaded, refresh]
  );

  return (
    <PlatformSettingsContext.Provider value={value}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  return useContext(PlatformSettingsContext);
}
