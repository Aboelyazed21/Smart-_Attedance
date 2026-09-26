const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   GENERIC API REQUEST
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    // Maintenance mode: tell the platform settings
    // provider to refetch and show the maintenance page.
    // A single event keeps every caller consistent
    // without polling or redirect loops.
    if (
      response.status === 503 &&
      data &&
      data.maintenance === true &&
      typeof window !== "undefined" &&
      typeof window.dispatchEvent === "function"
    ) {
      window.dispatchEvent(
        new Event("platform-maintenance")
      );
    }

    // Attach machine-readable context so callers can
    // branch on real backend states (e.g. 409 conflict
    // with a `conflict` payload). The message behavior
    // relied upon by existing callers is unchanged.
    const error = new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );

    error.status = response.status;
    error.details =
      data.conflict !== undefined
        ? data.conflict
        : data.details;

    throw error;
  }

  return data;
}


/* =========================================================
   AUTH
========================================================= */

export async function loginUser(
  identifier,
  password
) {
  return apiRequest(
    "/login",
    {
      method: "POST",

      // `identifier` is the new contract (email or University ID).
      // `email` is kept so older backends keep working.
      body: JSON.stringify({
        identifier,
        email: identifier,
        password,
      }),
    }
  );
}


export async function registerUser({
  firstName,
  lastName,
  email,
  password,
  studentCode,
  phone,
}) {
  return apiRequest(
    "/register",
    {
      method: "POST",

      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        studentCode,
        phone,
      }),
    }
  );
}


/* =========================================================
   CURRENT USER
========================================================= */

export async function getCurrentUser() {
  return apiRequest(
    "/me"
  );
}


/* Update the authenticated user's own phone number.
   Uses the existing users.phone field (verified ownership
   is enforced server-side). */

export async function updateMyPhone(
  phone
) {
  return apiRequest(
    "/me",
    {
      method: "PUT",

      body: JSON.stringify({
        phone,
      }),
    }
  );
}


/* Student attendance analytics (preferred summary endpoint).
   The backend derives the student identity from the JWT —
   never from a client supplied id. Falls back to
   /attendance/my when the endpoint is not deployed yet. */

export async function getStudentAttendanceSummary() {
  return apiRequest(
    "/student/attendance/summary"
  );
}


/* =========================================================
   PASSWORD RESET
========================================================= */

export async function forgotPassword(
  emailOrId
) {
  return apiRequest(
    "/auth/forgot-password",
    {
      method: "POST",

      body: JSON.stringify({
        email: emailOrId,
      }),
    }
  );
}


export async function resetPassword(
  token,
  newPassword
) {
  return apiRequest(
    "/auth/reset-password",
    {
      method: "POST",

      body: JSON.stringify({
        token,
        newPassword,
      }),
    }
  );
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export async function getDashboardReport() {
  return apiRequest(
    "/reports/dashboard"
  );
}


/* =========================================================
   USERS
========================================================= */

export async function getUsers() {
  return apiRequest(
    "/users"
  );
}


export async function createUser({
  firstName,
  lastName,
  email,
  password,
  role,
  phone,
}) {
  return apiRequest(
    "/users",
    {
      method: "POST",

      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        role,
        phone,
      }),
    }
  );
}


export async function updateUser(
  id,
  {
    firstName,
    lastName,
    email,
    password,
    role,
    phone,
    status,
  }
) {
  return apiRequest(
    `/users/${id}`,
    {
      method: "PATCH",

      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        role,
        phone,
        status,
      }),
    }
  );
}


export async function deleteUser(
  id
) {
  return apiRequest(
    `/users/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   COURSES
========================================================= */

export async function getCourses() {
  return apiRequest(
    "/courses"
  );
}


export async function createCourse({
  courseCode,
  courseName,
  description,
  creditHours,
}) {
  return apiRequest(
    "/courses",
    {
      method: "POST",

      body: JSON.stringify({
        courseCode,
        courseName,
        description,
        creditHours,
      }),
    }
  );
}


export async function updateCourse(
  id,
  {
    courseName,
    description,
    creditHours,
  }
) {
  return apiRequest(
    `/courses/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        courseName,
        description,
        creditHours,
      }),
    }
  );
}


export async function deleteCourse(
  id
) {
  return apiRequest(
    `/courses/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   SECTIONS
========================================================= */

export async function getSections() {
  return apiRequest(
    "/sections"
  );
}


export async function createSection({
  courseId,
  sectionName,
  academicYear,
  semester,
  lecturerId,
  capacity,
}) {
  return apiRequest(
    "/sections",
    {
      method: "POST",

      body: JSON.stringify({
        courseId,
        sectionName,
        academicYear,
        semester,
        lecturerId,
        capacity,
      }),
    }
  );
}


export async function updateSection(
  id,
  {
    courseId,
    sectionName,
    academicYear,
    semester,
    lecturerId,
    capacity,
  }
) {
  return apiRequest(
    `/sections/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        courseId,
        sectionName,
        academicYear,
        semester,
        lecturerId,
        capacity,
      }),
    }
  );
}


export async function deleteSection(
  id
) {
  return apiRequest(
    `/sections/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   ROOMS
========================================================= */

export async function getRooms() {
  return apiRequest(
    "/rooms"
  );
}


export async function createRoom({
  building,
  roomName,
  roomType,
  capacity,
  latitude,
  longitude,
}) {
  return apiRequest(
    "/rooms",
    {
      method: "POST",

      body: JSON.stringify({
        building,
        roomName,
        roomType,
        capacity,
        latitude,
        longitude,
      }),
    }
  );
}


export async function updateRoom(
  id,
  {
    building,
    roomName,
    roomType,
    capacity,
    latitude,
    longitude,
  }
) {
  return apiRequest(
    `/rooms/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        building,
        roomName,
        roomType,
        capacity,
        latitude,
        longitude,
      }),
    }
  );
}


export async function deleteRoom(
  id
) {
  return apiRequest(
    `/rooms/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   TIMETABLE
========================================================= */

export async function getTimetable() {
  return apiRequest(
    "/timetable"
  );
}


export async function createTimetable({
  sectionId,
  roomId,
  dayOfWeek,
  startTime,
  endTime,
  startDate,
  endDate,
}) {
  return apiRequest(
    "/timetable",
    {
      method: "POST",

      body: JSON.stringify({
        sectionId,
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        startDate,
        endDate,
      }),
    }
  );
}


export async function updateTimetable(
  id,
  {
    sectionId,
    roomId,
    dayOfWeek,
    startTime,
    endTime,
    startDate,
    endDate,
  }
) {
  return apiRequest(
    `/timetable/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        sectionId,
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        startDate,
        endDate,
      }),
    }
  );
}


export async function deleteTimetable(
  id
) {
  return apiRequest(
    `/timetable/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   ATTENDANCE SESSIONS
========================================================= */

export async function getSessions() {
  return apiRequest(
    "/sessions"
  );
}


/* =========================================================
   GET ATTENDANCE SESSION BY ID
========================================================= */

export async function getSessionById(
  id
) {
  return apiRequest(
    `/sessions/${id}`
  );
}


/* =========================================================
   MY SESSIONS
   STUDENT
========================================================= */

export async function getMySessions() {
  return apiRequest(
    "/sessions/my"
  );
}


export async function createSession({
  sectionId,
  roomId,
  sessionDate,
  scheduledStart,
  scheduledEnd,
}) {
  return apiRequest(
    "/sessions",
    {
      method: "POST",

      body: JSON.stringify({
        sectionId,
        roomId,
        sessionDate,
        scheduledStart,
        scheduledEnd,
      }),
    }
  );
}


export async function openSession(
  id
) {
  return apiRequest(
    `/sessions/${id}/qr`
  );
}


export async function refreshSessionQr(
  id
) {
  return apiRequest(
    `/sessions/${id}/qr/refresh`,
    {
      method: "POST",
    }
  );
}


export async function closeSession(
  id
) {
  return apiRequest(
    `/sessions/${id}/close`,
    {
      method: "PATCH",
    }
  );
}


export async function getSessionRoster(
  id
) {
  return apiRequest(
    `/sessions/${id}/roster`
  );
}


/* =========================================================
   MANUAL ATTENDANCE CORRECTION
========================================================= */

export async function updateAttendanceCorrection(
  eventId,
  {
    sessionId,
    studentId,
    status,
    reason,
  }
) {
  return apiRequest(
    `/corrections/${eventId}`,
    {
      method: "PATCH",

      body: JSON.stringify({
        sessionId,
        studentId,
        status,
        reason,
      }),
    }
  );
}


/* =========================================================
   STUDENT ATTENDANCE
========================================================= */

export async function getMyAttendance() {
  return apiRequest(
    "/attendance/my"
  );
}


/* =========================================================
   ENROLLMENT MANAGEMENT
========================================================= */

/*
  Get all students
*/

export async function getStudents() {
  return apiRequest(
    "/students"
  );
}


/*
  Get all available sections
*/

export async function getEnrollmentSections() {
  return apiRequest(
    "/students/sections/available"
  );
}


/*
  Get enrollments for specific student
*/

export async function getStudentEnrollments(
  studentId
) {
  return apiRequest(
    `/students/${studentId}/enrollments`
  );
}


/*
  Enroll student into section
*/

export async function enrollStudent(
  studentId,
  sectionId
) {
  return apiRequest(
    `/students/${studentId}/enrollments`,
    {
      method: "POST",

      body: JSON.stringify({
        sectionId,
      }),
    }
  );
}


/*
  Remove student enrollment
*/

export async function removeEnrollment(
  enrollmentId
) {
  return apiRequest(
    `/students/enrollments/${enrollmentId}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   ADMIN ENROLLMENTS
   Used by Course Students Management
========================================================= */

export async function getAdminEnrollments() {
  return apiRequest(
    "/admin/enrollments"
  );
}


/* =========================================================
   UPDATE STUDENT
   PUT /api/students/:id
========================================================= */

export async function updateStudent(
  id,
  {
    firstName,
    lastName,
    email,
    phone,
    studentCode,
    status,
    password,
  }
) {
  return apiRequest(
    `/students/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        studentCode,
        status,
        password,
      }),
    }
  );
}


/* =========================================================
   DELETE STUDENT
   DELETE /api/students/:id

   NOTE:
   This deletes the student account itself.
   Course page will NOT use this for "Remove".
========================================================= */

export async function deleteStudent(
  id
) {
  return apiRequest(
    `/students/${id}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   LECTURER
========================================================= */

export async function getLecturerDashboardStats() {
  return apiRequest(
    "/lecturer-dashboard/stats"
  );
}


export async function getLecturerSections() {
  return apiRequest(
    "/lecturer/sections"
  );
}


/* =========================================================
   LECTURER ENROLLMENT
   Lecturer-only student management
========================================================= */

/*
  Get sections owned by the logged-in lecturer

  GET /api/lecturer/enrollment/sections
*/

export async function getLecturerEnrollmentSections() {
  return apiRequest(
    "/lecturer/enrollment/sections"
  );
}


/*
  Get students enrolled in one lecturer-owned section

  GET /api/lecturer/enrollment/sections/:sectionId/students
*/

export async function getLecturerSectionStudents(
  sectionId
) {
  return apiRequest(
    `/lecturer/enrollment/sections/${sectionId}/students`
  );
}


/*
  Add an existing student to a lecturer-owned section by email

  POST /api/lecturer/enrollment/sections/:sectionId/students
*/

export async function addStudentToLecturerSection(
  sectionId,
  email
) {
  return apiRequest(
    `/lecturer/enrollment/sections/${sectionId}/students`,
    {
      method: "POST",

      body: JSON.stringify({
        email,
      }),
    }
  );
}


/*
  Remove a student enrollment from a lecturer-owned section

  DELETE /api/lecturer/enrollment/:enrollmentId
*/

export async function removeLecturerEnrollment(
  enrollmentId
) {
  return apiRequest(
    `/lecturer/enrollment/${enrollmentId}`,
    {
      method: "DELETE",
    }
  );
}


/* =========================================================
   LECTURER ATTENDANCE REPORT
========================================================= */

export async function getLecturerAttendanceReport(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(key, value);
      }
    }
  );

  const suffix =
    query.toString()
      ? `?${query.toString()}`
      : "";

  return apiRequest(
    `/reports/attendance${suffix}`
  );
}


/* ============================================================
   ATTENDANCE REPORTS
============================================================ */

export async function getAttendanceReport(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(key, value);
      }
    }
  );

  const queryString =
    query.toString();

  return apiRequest(
    `/reports/attendance${
      queryString
        ? `?${queryString}`
        : ""
    }`
  );
}


export async function exportAttendanceReport(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(key, value);
      }
    }
  );

  const queryString =
    query.toString();

  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/reports/attendance/export${
      queryString
        ? `?${queryString}`
        : ""
    }`,
    {
      method: "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message =
      "Failed to export attendance report";

    try {
      const errorData =
        await response.json();

      message =
        errorData.message ||
        message;
    } catch {
      // Response is not JSON
    }

    throw new Error(message);
  }

  const blob =
    await response.blob();

  const url =
    window.URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "attendance-report.csv";

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);

  return true;
}


/* =========================================================
   CORRECTION REQUESTS (STUDENT)
========================================================= */

export async function getMyCorrections() {
  return apiRequest(
    "/corrections/me"
  );
}


export async function createCorrection({
  attendanceEventId = null,
  requestedStatus,
  reason,
  evidenceUrl = null,
} = {}) {
  return apiRequest(
    "/corrections",
    {
      method: "POST",

      body: JSON.stringify({
        attendanceEventId,
        requestedStatus,
        reason,
        evidenceUrl,
      }),
    }
  );
}


/* =========================================================
   CORRECTION REQUESTS (LECTURER)
   Lecturer inbox for student correction requests.
   GET /corrections?status=&sectionId= (lecturer sees only
   own sections, admin sees all).
======================================================== */

export async function getLecturerCorrections(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.set(key, value);
    }
  });

  const suffix = query.toString()
    ? `?${query.toString()}`
    : "";

  return apiRequest(`/corrections${suffix}`);
}


export async function reviewCorrection(
  id,
  {
    decision,
    status,
    reviewerComment = "",
    finalStatus,
  } = {}
) {
  const normalizedDecision = String(
    decision || status || ""
  ).toLowerCase();

  const comment = String(reviewerComment ?? "").trim();

  const body = {
    status: normalizedDecision,
    reviewerComment: comment,
  };

  if (finalStatus) {
    body.finalStatus = String(finalStatus).toLowerCase();
  }

  return apiRequest(`/corrections/${Number(id)}/review`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}


/* =========================================================
   NOTIFICATION CENTER (ALL ROLES)
   Unified bell feed: direct + role-broadcast rows.
========================================================= */

export async function getNotifications(limit = 30) {
  return apiRequest(
    `/notifications?limit=${Number(limit) || 30}`
  );
}


export async function markNotificationRead(id) {
  return apiRequest(
    `/notifications/${Number(id)}/read`,
    {
      method: "PATCH",
    }
  );
}


export async function markAllNotificationsRead() {
  return apiRequest(
    "/notifications/read-all",
    {
      method: "PATCH",
    }
  );
}


/* =========================================================
   SECTION STUDENT UPLOAD (CSV / EXCEL)
   Admin  -> /admin/import/sections/:id/students
   Lecturer (own sections) -> /lecturer/enrollment/...
========================================================= */

function getRoleName() {
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    return String(
      user?.role_name || user?.role || ""
    )
      .toLowerCase()
      .trim();
  } catch {
    return "";
  }
}


export async function uploadSectionStudents(
  sectionId,
  file
) {
  const role = getRoleName();

  const endpoint =
    role === "admin" || role === "administrator"
      ? `/admin/import/sections/${Number(sectionId)}/students`
      : `/lecturer/enrollment/sections/${Number(sectionId)}/students/upload`;

  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      method: "POST",

      headers: {
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      body: formData,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
        data.error ||
        `Upload failed with status ${response.status}`
    );

    error.status = response.status;
    error.details = data.errors || data.details;

    throw error;
  }

  return data;
}


/* =========================================================
   WEEKLY EMAIL REPORTS (ADMIN)
======================================================== */

export async function getWeeklyEmailSettings() {
  return apiRequest(
    "/admin/weekly-reports/settings"
  );
}


export async function updateWeeklyEmailSettings(
  patch
) {
  return apiRequest(
    "/admin/weekly-reports/settings",
    {
      method: "PATCH",

      body: JSON.stringify(patch),
    }
  );
}


export async function sendWeeklyEmails({
  periodStart,
  periodEnd,
  studentId,
  force,
  dryRun,
} = {}) {
  return apiRequest(
    "/admin/weekly-reports/send",
    {
      method: "POST",

      body: JSON.stringify({
        periodStart,
        periodEnd,
        studentId,
        force,
        dryRun,
      }),
    }
  );
}


export async function sendWeeklyTestEmail(
  to
) {
  return apiRequest(
    "/admin/weekly-reports/test",
    {
      method: "POST",

      body: JSON.stringify({ to }),
    }
  );
}


export async function previewWeeklyEmail({
  studentId,
  periodStart,
  periodEnd,
} = {}) {
  return apiRequest(
    "/admin/weekly-reports/preview",
    {
      method: "POST",

      body: JSON.stringify({
        studentId,
        periodStart,
        periodEnd,
      }),
    }
  );
}


export async function getWeeklyEmailLogs(
  params = {}
) {
  const query =
    new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        query.set(key, value);
      }
    }
  );

  const suffix =
    query.toString()
      ? `?${query.toString()}`
      : "";

  return apiRequest(
    `/admin/weekly-reports/logs${suffix}`
  );
}


export async function retryWeeklyEmail(
  id
) {
  return apiRequest(
    `/admin/weekly-reports/retry/${id}`,
    {
      method: "POST",
    }
  );
}


export async function getWeeklyEmailStatus() {
  return apiRequest(
    "/admin/weekly-reports/status"
  );
}


/* =========================================================
   PLATFORM SETTINGS
======================================================== */

/* Public safe settings (no authentication required). */

export async function getPublicSettings() {
  return apiRequest(
    "/settings/public"
  );
}


/* Admin platform settings (name + maintenance mode). */

export async function getAdminSettings() {
  return apiRequest(
    "/admin/settings"
  );
}


export async function updateAdminSettings({
  platformName,
  maintenanceMode,
  maintenanceMessage,
  maintenanceUntil,
} = {}) {
  return apiRequest(
    "/admin/settings",
    {
      method: "PATCH",

      body: JSON.stringify({
        platformName,
        maintenanceMode,
        maintenanceMessage,
        maintenanceUntil,
      }),
    }
  );
}