import { usePlatformSettings } from "../utils/platformSettings";

import "./MaintenancePage.css";

function formatUntil(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString();
}

function MaintenancePage() {
  const {
    platformName,
    maintenanceMessage,
    maintenanceUntil,
  } = usePlatformSettings();

  const estimatedReturn = formatUntil(maintenanceUntil);

  return (
    <div className="maintenance-page">
      <main className="maintenance-card">
        <div className="maintenance-logo" aria-hidden="true">
          {String(platformName || "A")
            .trim()
            .charAt(0)
            .toUpperCase() || "A"}
        </div>

        <p className="maintenance-eyebrow">
          {platformName}
        </p>

        <h1>Platform Under Maintenance</h1>

        <p className="maintenance-text">
          {maintenanceMessage}
        </p>

        {estimatedReturn && (
          <p className="maintenance-return">
            Estimated return: {estimatedReturn}
          </p>
        )}
      </main>
    </div>
  );
}

export default MaintenancePage;
