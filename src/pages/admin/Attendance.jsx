import "./Attendance.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCourses,
  getSections,
} from "../../services/api";
import { useLanguage } from "../../utils/i18n";
import { toast } from "../../components/Toast";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function Attendance() {
  const { t } = useLanguage();
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
          t("attendance.failed_to_load_attendance_records")
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
            t("attendance.export_failed")
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
      toast.error(
        err.message ||
          t("attendance.could_not_export_attendance")
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
      toast.error(
        t("attendance.please_enter_a_reason_for_the_manual_cha")
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

      toast.success(
        t("attendance.attendance_updated_successfully")
      );
    } catch (err) {
      toast.error(
        err.message ||
          t("attendance.could_not_update_attendance")
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
        return t("attendance.present");

      case "late":
        return t("attendance.late");

      case "excused":
        return t("attendance.excused");

      default:
        return t("attendance.absent");
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
            <input
              placeholder={t("attendance.search_students_courses_sections_or_room")}
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="attendance-user">

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
                  t("attendance.system")}{" "}
                {user?.lastName ||
                  user?.last_name ||
                  t("attendance.admin")}
              </strong>

              <span>
                {t("attendance.system_admin")}
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

            <div>

              <h1>
                {t("attendance.attendance_management")}
              </h1>

              <p>
                {t("attendance.track_manage_and_monitor_student_attenda")}
              </p>

            </div>

          </div>

          <div className="attendance-header-actions">

            <span>
              {t("attendance.attendance")}
            </span>

          </div>

        </section>

        {/* STATS */}

        <section className="attendance-stats">

          <StatCard
            title={t("attendance.total_students")}
            value={
              statistics.students
            }
            subtitle={t("attendance.students_in_records")}
            className="green"
          />

          <StatCard
            title={t("attendance.present_today")}
            value={
              statistics.present
            }
            subtitle={t("attendance.rateSubtitle").replace("{n}", statistics.attendanceRate)}
            className="blue"
          />

          <StatCard
            title={t("attendance.absent_today")}
            value={
              statistics.absent
            }
            subtitle={t("attendance.students_absent")}
            className="orange"
          />

          <StatCard
            title={t("attendance.late_today")}
            value={
              statistics.late
            }
            subtitle={t("attendance.students_late")}
            className="purple"
          />

        </section>

        {/* FILTERS */}

        <section className="attendance-filter-card">

          <div className="attendance-search">

            <input
              placeholder={t("attendance.search_by_student_name_id_or_course")}
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
              {t("attendance.all_courses")}
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
              {t("attendance.all_sections")}
            </option>

            {sections.map(
              (section) => (
                <option
                  key={section.id}
                  value={section.id}
                >
                  {section.section_name ||
                    section.name ||
                    t("attendance.sectionFallback").replace("{id}", section.id)}
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
              {t("attendance.all_status")}
            </option>

            <option value="present">
              {t("attendance.present")}
            </option>

            <option value="absent">
              {t("attendance.absent")}
            </option>

            <option value="late">
              {t("attendance.late")}
            </option>

            <option value="excused">
              {t("attendance.excused")}
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
            {t("attendance.reset")}
          </button>

          <button
            className="attendance-export"
            onClick={
              exportAttendance
            }
          >
            {t("attendance.export")}
          </button>

        </section>

        {/* CONTENT */}

        <section className="attendance-content">

          {/* ATTENDANCE OVERVIEW */}

          <div className="attendance-overview-inline">

            <div className="attendance-overview-chart">

              <div
                className="attendance-donut-wrapper"
              >
                <div
                  className="attendance-donut"
                  style={{
                    "--present-deg": `${
                      statistics.total > 0
                        ? (statistics.present / statistics.total) * 360
                        : 0
                    }deg`,
                    "--absent-deg": `${
                      statistics.total > 0
                        ? (statistics.absent / statistics.total) * 360
                        : 0
                    }deg`,
                    "--late-deg": `${
                      statistics.total > 0
                        ? (statistics.late / statistics.total) * 360
                        : 0
                    }deg`,
                    "--excused-deg": `${
                      statistics.total > 0
                        ? (statistics.excused / statistics.total) * 360
                        : 0
                    }deg`,
                  }}
                >
                  <div>
                    <strong>
                      {statistics.attendanceRate}%
                    </strong>
                    <span>{t("attendance.attendance_rate")}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3>{t("attendance.attendance_overview")}</h3>
                <p>{t("attendance.distribution_of_the_currently_filtered_a")}</p>
              </div>

            </div>

            <div className="attendance-overview-list">

              <OverviewItem
                color="green"
                label={t("attendance.present")}
                value={statistics.present}
                total={statistics.total}
              />

              <OverviewItem
                color="red"
                label={t("attendance.absent")}
                value={statistics.absent}
                total={statistics.total}
              />

              <OverviewItem
                color="orange"
                label={t("attendance.late")}
                value={statistics.late}
                total={statistics.total}
              />

              <OverviewItem
                color="purple"
                label={t("attendance.excused")}
                value={statistics.excused}
                total={statistics.total}
              />

            </div>

          </div>

          {/* TABLE */}

          <div className="attendance-table-card">

            <div className="attendance-table-header">

              <div>

                <h2>
                  {t("attendance.attendance_records")}
                </h2>

                <p>
                  {t("attendance.showing")}{" "}
                  {
                    filteredRecords.length
                  }{" "}
                  {t("attendance.records")}
                </p>

              </div>

              <button
                onClick={
                  loadAttendance
                }
              >{t("action.refresh")}</button>

            </div>

            {error && (
              <div className="attendance-error">
                {error}
              </div>
            )}

            {loading ? (
              <div className="attendance-loading">
                {t("attendance.loading_attendance")}
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

                      <th>{t("role.student")}</th>

                      <th>
                        {t("attendance.course")}
                      </th>

                      <th>
                        {t("attendance.section")}
                      </th>

                      <th>
                        {t("attendance.date")}
                      </th>

                      <th>
                        {t("attendance.status")}
                      </th>

                      <th>
                        {t("attendance.check_in_time")}
                      </th>

                      <th>
                        {t("attendance.marked_by")}
                      </th>

                      <th>
                        {t("attendance.actions")}
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
                          {t("attendance.no_attendance_records_found")}
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
                                  title={t("attendance.view")}
                                  onClick={() =>
                                    setSelectedRecord(
                                      record
                                    )
                                  }
                                >
                                  {t("attendance.view")}
                                </button>

                                <button
                                  title={t("attendance.edit")}
                                  onClick={() =>
                                    openEdit(
                                      record
                                    )
                                  }
                                >
                                  {t("attendance.edit")}
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
                      {t("attendance.attendance_details")}
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
                    {t("attendance.close")}
                  </button>

                </div>

                <div className="attendance-details-grid">

                  <Detail
                    label={t("attendance.student_code")}
                    value={
                      selectedRecord.student_code
                    }
                  />

                  <Detail
                    label={t("attendance.course")}
                    value={`${selectedRecord.course_code} - ${selectedRecord.course_name}`}
                  />

                  <Detail
                    label={t("attendance.section")}
                    value={
                      selectedRecord.section_name
                    }
                  />

                  <Detail
                    label={t("attendance.date")}
                    value={formatDate(
                      selectedRecord.session_date
                    )}
                  />

                  <Detail
                    label={t("attendance.status")}
                    value={getStatusLabel(
                      selectedRecord.attendance_status
                    )}
                  />

                  <Detail
                    label={t("attendance.check_in")}
                    value={formatTime(
                      selectedRecord.scanned_at
                    )}
                  />

                  <Detail
                    label={t("attendance.source")}
                    value={
                      selectedRecord.source
                    }
                  />

                  <Detail
                    label={t("attendance.validation")}
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
                    {t("attendance.close")}
                  </button>

                  <button
                    className="primary"
                    onClick={() =>
                      openEdit(
                        selectedRecord
                      )
                    }
                  >
                    {t("attendance.edit_attendance")}
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
                      {t("attendance.edit_attendance")}
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
                    {t("attendance.close")}
                  </button>

                </div>

                <div className="attendance-edit-form">

                  <label>
                    {t("attendance.attendance_status")}

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
                        {t("attendance.present")}
                      </option>

                      <option value="absent">
                        {t("attendance.absent")}
                      </option>

                      <option value="late">
                        {t("attendance.late")}
                      </option>

                      <option value="excused">
                        {t("attendance.excused")}
                      </option>

                    </select>

                  </label>

                  <label>
                    {t("attendance.reason")}

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
                      placeholder={t("attendance.enter_the_reason_for_this_manual_attenda")}
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
                    {t("attendance.cancel")}
                  </button>

                  <button
                    className="primary"
                    disabled={saving}
                    onClick={
                      saveAttendance
                    }
                  >
                    {saving
                      ? t("attendance.saving")
                      : t("attendance.save_changes")}
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
  title,
  value,
  subtitle,
  className,
}) {
  return (
    <div
      className={`attendance-stat-card ${className}`}
    >

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
        {t("attendance.now")}
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

