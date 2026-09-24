export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* =========================================================
   API REQUEST
   Attaches the bearer token and normalises failures so every
   caller gets a readable, user-facing message (401/403/404/500
   and network errors included) instead of a bare fetch throw.
========================================================= */

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(
      "Unable to reach the server. Check your connection and try again."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    const fallback =
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : response.status === 403
          ? "You do not have permission to perform this action."
          : response.status === 404
            ? "The requested record could not be found."
            : response.status >= 500
              ? "The server could not complete the request. Please try again."
              : `Request failed with status ${response.status}`;

    throw new Error(data.message || data.error || fallback);
  }

  return data;
}


/* =========================================================
   AUTH
========================================================= */

export async function loginUser(
  email,
  password
) {
  return apiRequest(
    "/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        email,
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
}) {
  return apiRequest(
    "/auth/register",
    {
      method: "POST",

      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        studentCode,
      }),
    }
  );
}


/* =========================================================
   CURRENT USER
========================================================= */

export async function getCurrentUser() {
  return apiRequest(
    "/auth/me"
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

   NOTE: The backend exposes GET /sessions (list) but has no
   GET /sessions/:id route, so requesting the id directly 404s.
   Resolve the record from the list instead.
========================================================= */

export async function getSessionById(id) {
  const data = await getSessions();

  const sessions = Array.isArray(data)
    ? data
    : Array.isArray(data?.sessions)
      ? data.sessions
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.sessions)
          ? data.data.sessions
          : [];

  const found = sessions.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!found) {
    throw new Error("Attendance session was not found.");
  }

  return found;
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
    `/sessions/${id}/open`,
    {
      method: "POST",
    }
  );
}


export async function refreshSessionQr(
  id
) {
  return apiRequest(
    `/sessions/${id}/qr`,
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
      method: "POST",
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