import "./Attendance.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCourses,
  getSections,
} from "../../services/api";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function Attendance() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "null"
      );
    } catch {
      return null;
    }
  });

  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [editModal, setEditModal] = useState(false);
  const [editStatus, setEditStatus] =
    useState("present");
  const [editReason, setEditReason] =
    useState("");
  const [saving, setSaving] = useState(false);

  const [selectedRows, setSelectedRows] =
    useState([]);

  /* =========================================================
     API HELPER
  ========================================================= */

  async function request(endpoint, options = {}) {
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

    let data = {};

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
     LOAD COURSES / SECTIONS
  ========================================================= */

  async function loadFilters() {
    try {
      const [
        coursesResponse,
        sectionsResponse,
      ] = await Promise.all([
        getCourses(),
        getSections(),
      ]);

      setCourses(
        Array.isArray(coursesResponse)
          ? coursesResponse
          : coursesResponse?.courses ||
              coursesResponse?.data ||
              []
      );

      setSections(
        Array.isArray(sectionsResponse)
          ? sectionsResponse
          : sectionsResponse?.sections ||
              sectionsResponse?.data ||
              []
      );
    } catch (err) {
      console.error(
        "Attendance filters error:",
        err
      );
    }
  }

  /* =========================================================
     LOAD ATTENDANCE
  ========================================================= */

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (courseId) {
        params.set(
          "courseId",
          courseId
        );
      }

      if (sectionId) {
        params.set(
          "sectionId",
          sectionId
        );
      }

      if (status) {
        params.set(
          "status",
          status
        );
      }

      if (date) {
        params.set(
          "startDate",
          date
        );

        params.set(
          "endDate",
          date
        );
      }

      const query =
        params.toString();

      const result =
        await request(
          `/reports/attendance${
            query
              ? `?${query}`
              : ""
          }`
        );

      setRecords(
        Array.isArray(
          result?.records
        )
          ? result.records
          : []
      );
    } catch (err) {
      console.error(
        "Attendance load error:",
        err
      );

      setError(
        err.message ||
          "Failed to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [
    courseId,
    sectionId,
    status,
    date,
  ]);

  /* =========================================================
     FILTER SEARCH
  ========================================================= */

  const filteredRecords =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return records;
      }

      return records.filter(
        (record) => {
          const text = [
            record.student_name,
            record.student_code,
            record.course_code,
            record.course_name,
            record.section_name,
            record.lecturer_name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return text.includes(
            keyword
          );
        }
      );
    }, [
      records,
      search,
    ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics =
    useMemo(() => {
      const students =
        new Set(
          filteredRecords.map(
            (r) =>
              r.student_id
          )
        );

      const present =
        filteredRecords.filter(
          (r) =>
            r.attendance_status ===
            "present"
        ).length;

      const late =
        filteredRecords.filter(
          (r) =>
            r.attendance_status ===
            "late"
        ).length;

      const absent =
        filteredRecords.filter(
          (r) =>
            r.attendance_status ===
            "absent"
        ).length;

      const excused =
        filteredRecords.filter(
          (r) =>
            r.attendance_status ===
            "excused"
        ).length;

      const total =
        present +
        late +
        absent +
        excused;

      const attendanceRate =
        total > 0
          ? Math.round(
              ((present + late) /
                total) *
                100
            )
          : 0;

      return {
        students:
          students.size,

        present,

        absent,

        late,

        excused,

        total,

        attendanceRate,
      };
    }, [
      filteredRecords,
    ]);

  /* =========================================================
     RESET
  ========================================================= */

  function resetFilters() {
    setSearch("");
    setCourseId("");
    setSectionId("");
    setStatus("");
    setDate("");
  }

  /* =========================================================
     CSV EXPORT
  ========================================================= */

  async function exportAttendance() {
    try {
      const params =
        new URLSearchParams();

      if (courseId) {
        params.set(
          "courseId",
          courseId
        );
      }

      if (sectionId) {
        params.set(
          "sectionId",
          sectionId
        );
      }

      if (status) {
        params.set(
          "status",
          status
        );
      }

      if (date) {
        params.set(
          "startDate",
          date
        );

        params.set(
          "endDate",
          date
        );
      }

      const token =
        localStorage.getItem(
          "token"
        );

      const response =
        await fetch(
          `${API_URL}/reports/attendance/export?${params.toString()}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          data.message ||
            "Export failed."
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        `attendance-report-${Date.now()}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (err) {
      alert(
        err.message ||
          "Could not export attendance."
      );
    }
  }

  /* =========================================================
     MANUAL ATTENDANCE EDIT
  ========================================================= */

  function openEdit(record) {
    setSelectedRecord(record);

    setEditStatus(
      record.attendance_status ||
        "present"
    );

    setEditReason(
      record.notes || ""
    );

    setEditModal(true);
  }

  async function saveAttendance() {
    if (!selectedRecord) {
      return;
    }

    if (
      !editReason.trim()
    ) {
      alert(
        "Please enter a reason for the manual change."
      );

      return;
    }

    try {
      setSaving(true);

      await request(
        `/corrections/${selectedRecord.attendance_id}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            sessionId:
              selectedRecord.session_id,

            studentId:
              selectedRecord.student_id,

            status:
              editStatus,

            reason:
              editReason.trim(),
          }),
        }
      );

      setEditModal(false);
      setSelectedRecord(null);

      await loadAttendance();

      alert(
        "Attendance updated successfully."
      );
    } catch (err) {
      alert(
        err.message ||
          "Could not update attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     SELECT ROW
  ========================================================= */

  function toggleRow(id) {
    setSelectedRows(
      (previous) =>
        previous.includes(id)
          ? previous.filter(
              (item) =>
                item !== id
            )
          : [
              ...previous,
              id,
            ]
    );
  }

  function toggleAll() {
    if (
      selectedRows.length ===
      filteredRecords.length
    ) {
      setSelectedRows([]);
      return;
    }

    setSelectedRows(
      filteredRecords
        .map(
          (record) =>
            record.attendance_id
        )
        .filter(Boolean)
    );
  }

  /* =========================================================
     FORMAT HELPERS
  ========================================================= */

  function formatDate(value) {
    if (!value) {
      return "---";
    }

    const dateObject =
      new Date(value);

    if (
      Number.isNaN(
        dateObject.getTime()
      )
    ) {
      return value;
    }

    return dateObject.toLocaleDateString(
      "en-CA"
    );
  }

  function formatTime(value) {
    if (!value) {
      return "---";
    }

    const dateObject =
      new Date(value);

    if (
      Number.isNaN(
        dateObject.getTime()
      )
    ) {
      return value;
    }

    return dateObject.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getStatusClass(
    value
  ) {
    switch (value) {
      case "present":
        return "attendance-status present";

      case "late":
        return "attendance-status late";

      case "excused":
        return "attendance-status excused";

      default:
        return "attendance-status absent";
    }
  }

  function getStatusLabel(
    value
  ) {
    switch (value) {
      case "present":
        return "Present";

      case "late":
        return "Late";

      case "excused":
        return "Excused";

      default:
        return "Absent";
    }
  }

  function getInitials(name) {
    if (!name) {
      return "?";
    }

    return name
      .split(" ")
      .slice(0, 2)
      .map(
        (part) =>
          part.charAt(0)
      )
      .join("")
      .toUpperCase();
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="attendance-page">

      <main className="attendance-main">

        {/* TOP BAR */}

        <header className="attendance-topbar">

          <div className="attendance-global-search">
            🔎
            <input
              placeholder="Search students, courses, sections, or rooms..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="attendance-user">

            <span className="attendance-notification">
              🔔
              <b>3</b>
            </span>

            <div className="attendance-user-avatar">
              {
                (
                  user?.firstName ||
                  user?.first_name ||
                  "S"
                )
                  .charAt(0)
                  .toUpperCase()
              }
            </div>

            <div className="attendance-user-info">

              <strong>
                {user?.firstName ||
                  user?.first_name ||
                  "System"}{" "}
                {user?.lastName ||
                  user?.last_name ||
                  "Admin"}
              </strong>

              <span>
                System Admin
              </span>

            </div>

            <span>
              ▾
            </span>

          </div>

        </header>

        {/* PAGE HEADER */}

        <section className="attendance-header">

          <div className="attendance-title">

            <div className="attendance-title-icon">
              👥
            </div>

            <div>

              <h1>
                Attendance Management
              </h1>

              <p>
                Track, manage, and monitor
                student attendance across
                all courses.
              </p>

            </div>

          </div>

          <div className="attendance-header-actions">

            <span>
              / Attendance
            </span>

            <button
              onClick={() =>
                navigate(
                  "/admin/sessions"
                )
              }
            >
              + Take Attendance
            </button>

          </div>

        </section>

        {/* STATS */}

        <section className="attendance-stats">

          <StatCard
            icon="👥"
            title="Total Students"
            value={
              statistics.students
            }
            subtitle="Students in records"
            className="green"
          />

          <StatCard
            icon="✓"
            title="Present Today"
            value={
              statistics.present
            }
            subtitle={`${statistics.attendanceRate}% attendance rate`}
            className="blue"
          />

          <StatCard
            icon="×"
            title="Absent Today"
            value={
              statistics.absent
            }
            subtitle="Students absent"
            className="orange"
          />

          <StatCard
            icon="◷"
            title="Late Today"
            value={
              statistics.late
            }
            subtitle="Students late"
            className="purple"
          />

        </section>

        {/* FILTERS */}

        <section className="attendance-filter-card">

          <div className="attendance-search">

            🔎

            <input
              placeholder="Search by student name, ID, or course..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <select
            value={courseId}
            onChange={(event) =>
              setCourseId(
                event.target.value
              )
            }
          >
            <option value="">
              All Courses
            </option>

            {courses.map(
              (course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.course_code ||
                    course.code}{" "}
                  -{" "}
                  {course.course_name ||
                    course.name}
                </option>
              )
            )}

          </select>

          <select
            value={sectionId}
            onChange={(event) =>
              setSectionId(
                event.target.value
              )
            }
          >

            <option value="">
              All Sections
            </option>

            {sections.map(
              (section) => (
                <option
                  key={section.id}
                  value={section.id}
                >
                  {section.section_name ||
                    section.name ||
                    `Section ${section.id}`}
                </option>
              )
            )}

          </select>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >

            <option value="">
              All Status
            </option>

            <option value="present">
              Present
            </option>

            <option value="absent">
              Absent
            </option>

            <option value="late">
              Late
            </option>

            <option value="excused">
              Excused
            </option>

          </select>

          <input
            className="attendance-date-input"
            type="date"
            value={date}
            onChange={(event) =>
              setDate(
                event.target.value
              )
            }
          />

          <button
            className="attendance-reset"
            onClick={
              resetFilters
            }
          >
            ↻ Reset
          </button>

          <button
            className="attendance-export"
            onClick={
              exportAttendance
            }
          >
            ↓ Export
          </button>

        </section>

        {/* CONTENT */}

        <section className="attendance-content">

          {/* TABLE */}

          <div className="attendance-table-card">

            <div className="attendance-table-header">

              <div>

                <h2>
                  Attendance Records
                </h2>

                <p>
                  Showing{" "}
                  {
                    filteredRecords.length
                  }{" "}
                  records
                </p>

              </div>

              <button
                onClick={
                  loadAttendance
                }
              >
                ↻ Refresh
              </button>

            </div>

            {error && (
              <div className="attendance-error">
                {error}
              </div>
            )}

            {loading ? (
              <div className="attendance-loading">
                Loading attendance...
              </div>
            ) : (
              <div className="attendance-table-wrapper">

                <table className="attendance-table">

                  <thead>

                    <tr>

                      <th>
                        <input
                          type="checkbox"
                          checked={
                            filteredRecords.length >
                              0 &&
                            selectedRows.length ===
                              filteredRecords.length
                          }
                          onChange={
                            toggleAll
                          }
                        />
                      </th>

                      <th>#</th>

                      <th>
                        Student
                      </th>

                      <th>
                        Course
                      </th>

                      <th>
                        Section
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Check-in Time
                      </th>

                      <th>
                        Marked By
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredRecords.length ===
                    0 ? (
                      <tr>

                        <td
                          colSpan="10"
                          className="attendance-empty"
                        >
                          No attendance
                          records found.
                        </td>

                      </tr>
                    ) : (
                      filteredRecords.map(
                        (
                          record,
                          index
                        ) => (
                          <tr
                            key={
                              record.attendance_id ||
                              `${record.student_id}-${record.session_id}`
                            }
                          >

                            <td>

                              <input
                                type="checkbox"
                                checked={selectedRows.includes(
                                  record.attendance_id
                                )}
                                onChange={() =>
                                  toggleRow(
                                    record.attendance_id
                                  )
                                }
                              />

                            </td>

                            <td>
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </td>

                            <td>

                              <div className="attendance-student">

                                <div className="attendance-avatar">
                                  {getInitials(
                                    record.student_name
                                  )}
                                </div>

                                <div>

                                  <strong>
                                    {
                                      record.student_name
                                    }
                                  </strong>

                                  <span>
                                    {
                                      record.student_code
                                    }
                                  </span>

                                </div>

                              </div>

                            </td>

                            <td>

                              <div className="attendance-course">

                                <strong>
                                  {
                                    record.course_code
                                  }
                                </strong>

                                <span>
                                  {
                                    record.course_name
                                  }
                                </span>

                              </div>

                            </td>

                            <td>
                              {
                                record.section_name ||
                                "---"
                              }
                            </td>

                            <td>
                              {formatDate(
                                record.session_date
                              )}
                            </td>

                            <td>

                              <span
                                className={getStatusClass(
                                  record.attendance_status
                                )}
                              >
                                <i />
                                {
                                  getStatusLabel(
                                    record.attendance_status
                                  )
                                }
                              </span>

                            </td>

                            <td>
                              {formatTime(
                                record.scanned_at
                              )}
                            </td>

                            <td>
                              {
                                record.lecturer_name ||
                                "---"
                              }
                            </td>

                            <td>

                              <div className="attendance-actions">

                                <button
                                  title="View"
                                  onClick={() =>
                                    setSelectedRecord(
                                      record
                                    )
                                  }
                                >
                                  👁
                                </button>

                                <button
                                  title="Edit"
                                  onClick={() =>
                                    openEdit(
                                      record
                                    )
                                  }
                                >
                                  ✎
                                </button>

                                <button
                                  title="More"
                                  onClick={() =>
                                    alert(
                                      `Source: ${
                                        record.source ||
                                        "---"
                                      }\nValidation: ${
                                        record.validation_status ||
                                        "---"
                                      }`
                                    )
                                  }
                                >
                                  ⋯
                                </button>

                              </div>

                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR */}

          <aside className="attendance-right-sidebar">

            {/* OVERVIEW */}

            <div className="attendance-side-card">

              <h3>
                Attendance Overview
              </h3>

              <div className="attendance-donut-wrapper">

                <div
                  className="attendance-donut"
                  style={{
                    "--attendance-rate":
                      `${statistics.attendanceRate * 3.6}deg`,
                  }}
                >
                  <div>
                    <strong>
                      {
                        statistics.attendanceRate
                      }%
                    </strong>

                    <span>
                      Present
                    </span>
                  </div>
                </div>

              </div>

              <div className="attendance-overview-list">

                <OverviewItem
                  color="green"
                  label="Present"
                  value={
                    statistics.present
                  }
                  total={
                    statistics.total
                  }
                />

                <OverviewItem
                  color="red"
                  label="Absent"
                  value={
                    statistics.absent
                  }
                  total={
                    statistics.total
                  }
                />

                <OverviewItem
                  color="orange"
                  label="Late"
                  value={
                    statistics.late
                  }
                  total={
                    statistics.total
                  }
                />

              </div>

            </div>

            {/* TODAY CLASSES */}

            <div className="attendance-side-card">

              <div className="attendance-side-title">

                <h3>
                  Today's Classes
                </h3>

                <button
                  onClick={() =>
                    navigate(
                      "/admin/timetable"
                    )
                  }
                >
                  View All
                </button>

              </div>

              {sections
                .slice(0, 3)
                .map(
                  (
                    section,
                    index
                  ) => (
                    <div
                      className="attendance-class-item"
                      key={
                        section.id
                      }
                    >

                      <div className="attendance-class-icon">
                        ▣
                      </div>

                      <div>

                        <strong>
                          {
                            section.course_code ||
                            section.courseCode ||
                            `Section ${section.section_name || section.id}`
                          }
                        </strong>

                        <span>
                          {section.course_name ||
                            section.courseName ||
                            "Scheduled class"}
                        </span>

                      </div>

                      <small>
                        {index === 0
                          ? "Ongoing"
                          : "Upcoming"}
                      </small>

                    </div>
                  )
                )}

            </div>

            {/* QUICK ACTIONS */}

            <div className="attendance-side-card">

              <h3>
                Quick Actions
              </h3>

              <div className="attendance-quick-actions">

                <button
                  onClick={() =>
                    navigate(
                      "/admin/sessions"
                    )
                  }
                >
                  👥 Take Attendance
                </button>

                <button
                  onClick={
                    exportAttendance
                  }
                >
                  ↓ Export CSV
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/admin/reports"
                    )
                  }
                >
                  ▥ View Reports
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/admin/sessions"
                    )
                  }
                >
                  ▣ Manage Sessions
                </button>

              </div>

            </div>

            {/* RECENT ACTIVITY */}

            <div className="attendance-side-card">

              <div className="attendance-side-title">

                <h3>
                  Recent Activity
                </h3>

              </div>

              <div className="attendance-activity">

                <ActivityItem
                  color="green"
                  text="Attendance records loaded"
                />

                <ActivityItem
                  color="blue"
                  text="Attendance session system connected"
                />

                <ActivityItem
                  color="orange"
                  text="Attendance report available"
                />

              </div>

            </div>

          </aside>

        </section>

        {/* ===================================================
            VIEW MODAL
        =================================================== */}

        {selectedRecord &&
          !editModal && (
            <div
              className="attendance-modal-overlay"
              onClick={() =>
                setSelectedRecord(
                  null
                )
              }
            >

              <div
                className="attendance-modal"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                <div className="attendance-modal-header">

                  <div>

                    <h2>
                      Attendance Details
                    </h2>

                    <p>
                      {
                        selectedRecord.student_name
                      }
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setSelectedRecord(
                        null
                      )
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="attendance-details-grid">

                  <Detail
                    label="Student Code"
                    value={
                      selectedRecord.student_code
                    }
                  />

                  <Detail
                    label="Course"
                    value={`${selectedRecord.course_code} - ${selectedRecord.course_name}`}
                  />

                  <Detail
                    label="Section"
                    value={
                      selectedRecord.section_name
                    }
                  />

                  <Detail
                    label="Date"
                    value={formatDate(
                      selectedRecord.session_date
                    )}
                  />

                  <Detail
                    label="Status"
                    value={getStatusLabel(
                      selectedRecord.attendance_status
                    )}
                  />

                  <Detail
                    label="Check-in"
                    value={formatTime(
                      selectedRecord.scanned_at
                    )}
                  />

                  <Detail
                    label="Source"
                    value={
                      selectedRecord.source
                    }
                  />

                  <Detail
                    label="Validation"
                    value={
                      selectedRecord.validation_status
                    }
                  />

                </div>

                <div className="attendance-modal-footer">

                  <button
                    onClick={() =>
                      setSelectedRecord(
                        null
                      )
                    }
                  >
                    Close
                  </button>

                  <button
                    className="primary"
                    onClick={() =>
                      openEdit(
                        selectedRecord
                      )
                    }
                  >
                    Edit Attendance
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* ===================================================
            EDIT MODAL
        =================================================== */}

        {editModal &&
          selectedRecord && (
            <div className="attendance-modal-overlay">

              <div className="attendance-modal">

                <div className="attendance-modal-header">

                  <div>

                    <h2>
                      Edit Attendance
                    </h2>

                    <p>
                      {
                        selectedRecord.student_name
                      }
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setEditModal(
                        false
                      )
                    }
                  >
                    ×
                  </button>

                </div>

                <div className="attendance-edit-form">

                  <label>
                    Attendance Status

                    <select
                      value={
                        editStatus
                      }
                      onChange={(
                        event
                      ) =>
                        setEditStatus(
                          event.target
                            .value
                        )
                      }
                    >
                      <option value="present">
                        Present
                      </option>

                      <option value="absent">
                        Absent
                      </option>

                      <option value="late">
                        Late
                      </option>

                      <option value="excused">
                        Excused
                      </option>

                    </select>

                  </label>

                  <label>
                    Reason

                    <textarea
                      value={
                        editReason
                      }
                      onChange={(
                        event
                      ) =>
                        setEditReason(
                          event.target
                            .value
                        )
                      }
                      placeholder="Enter the reason for this manual attendance change..."
                      rows="5"
                    />

                  </label>

                </div>

                <div className="attendance-modal-footer">

                  <button
                    onClick={() =>
                      setEditModal(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="primary"
                    disabled={saving}
                    onClick={
                      saveAttendance
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </div>

            </div>
          )}

      </main>

    </div>
  );
}

/* ===========================================================
   COMPONENTS
=========================================================== */

function StatCard({
  icon,
  title,
  value,
  subtitle,
  className,
}) {
  return (
    <div
      className={`attendance-stat-card ${className}`}
    >

      <div className="attendance-stat-icon">
        {icon}
      </div>

      <div className="attendance-stat-content">

        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>

      </div>

    </div>
  );
}

function OverviewItem({
  color,
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) *
            100
        )
      : 0;

  return (
    <div className="attendance-overview-item">

      <div>

        <i
          className={`overview-dot ${color}`}
        />

        <span>
          {label}
        </span>

      </div>

      <strong>
        {value}{" "}
        <small>
          ({percentage}%)
        </small>
      </strong>

    </div>
  );
}

function ActivityItem({
  color,
  text,
}) {
  return (
    <div className="attendance-activity-item">

      <i
        className={`activity-dot ${color}`}
      />

      <span>
        {text}
      </span>

      <small>
        now
      </small>

    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div className="attendance-detail">

      <span>
        {label}
      </span>

      <strong>
        {value || "---"}
      </strong>

    </div>
  );
}

