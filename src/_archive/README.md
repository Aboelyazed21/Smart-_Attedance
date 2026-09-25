# `_archive` — Unmounted / Superseded Screens

These files are **not imported by the running app** (verified:
zero importers in `src/`). They were moved here with fixed
relative imports so the live folders stay clean. Git history
preserves the originals.

To reactivate a screen: move it back, restore its import
paths, wire it in `src/App.jsx`, and rebuild.

## Contents

| File | Status |
|---|---|
| `AuditorDashboard.jsx` | No route and no role branch renders it (`App.jsx` handles admin/lecturer/student only) |
| `TADashboard.jsx` | Same as above (TA role has no frontend branch) |
| `AttendanceSessions.jsx` + `.css` | Superseded by live `pages/lecturer/LecturerSessions.jsx` |
| `LecturerLayout.jsx` + `.css` | Superseded by live `components/lecturer/LecturerLayout.jsx` |
| `Login.jsx` | Superseded by the `Login` component inside `src/App.jsx` |
