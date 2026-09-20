const API_URL =
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
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    );
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
    "/login",
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
    "/register",
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
    "/me"
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
      method: "PUT",

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

export async function getStudents() {
  return apiRequest(
    "/students"
  );
}

export async function getEnrollmentSections() {
  return apiRequest(
    "/students/sections/available"
  );
}

export async function getStudentEnrollments(
  studentId
) {
  return apiRequest(
    `/students/${studentId}/enrollments`
  );
}

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

export async function getLecturerAttendanceReport(
  params = {}
) {
  const query = new URLSearchParams();

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