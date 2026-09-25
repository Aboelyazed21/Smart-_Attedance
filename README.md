# Attendify Frontend (Smart Attendance)

React + Vite SPA for the Smart Attendance platform.
Talks to the backend REST API (`VITE_API_URL`, default
`http://localhost:5000/api`). Never connects to MySQL directly.

## Run

```bash
npm install
npm run dev     # local dev server
npm run build   # production build (also run by Vercel)
npm run lint    # oxlint
```

## Folder map

| Folder | Purpose |
|---|---|
| `src/App.jsx` | Route table (pathname-based) + inline `Login`, `StudentDashboard`, `LecturerLogout`. Role guards live here |
| `src/main.jsx` | Providers: router, language, platform settings, global toast host |
| `src/pages/admin/` | Admin screens (users, courses, sections, rooms, timetable, attendance, reports, enrollments, settings, weekly emails) — one `.jsx` + `.css` per screen |
| `src/pages/lecturer/` | Lecturer screens (dashboard, sessions, QR session, attendance, reports) + live `LecturerLayout.jsx` |
| `src/pages/student/` | Student screens (dashboard, scan, attendance, corrections, sessions, profile, chatbot) |
| `src/pages/dashboard/` | Role dashboards rendered inside layouts |
| `src/components/admin/` | `AdminLayout` (sidebar + nav). `components/lecturer/` is the live lecturer layout |
| `src/components/Toast.jsx` | Global toast notifications (`toast.success/error/info`) mounted once in `main.jsx` |
| `src/services/api.js` | All backend calls in one place (token header, 503 maintenance event). Add new endpoints here |
| `src/utils/i18n.jsx` | Arabic/English strings (`useLanguage().t(key)`) |
| `src/utils/platformSettings.jsx` | Platform name + maintenance mode from `GET /api/settings/public` (`usePlatformSettings()`) |
| `src/styles/` | Central `design-tokens.css` (colors, buttons, inputs, status pills) + theme/RTL/responsive layers |
| `src/_archive/` | Unmounted screens, documented in its own README. Not part of the build graph |

## Conventions

- New admin screen: add `pages/admin/X.jsx` + `X.css`, route in `App.jsx` (admin guard), nav item in `AdminLayout`, strings in `i18n.jsx`.
- Never hardcode the platform name — use `usePlatformSettings().platformName`.
- Never use `alert()` — use the global `toast`.
- Never use emojis as UI icons — use the inline SVG icon pattern.
