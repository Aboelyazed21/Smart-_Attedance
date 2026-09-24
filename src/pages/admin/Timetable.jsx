import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getSections,
  getRooms,
} from "../../services/api";

import "./Timetable.css";

const DAYS = [
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
];

const DAY_COLORS = {
  saturday: "blue",
  sunday: "green",
  monday: "orange",
  tuesday: "purple",
  wednesday: "red",
  thursday: "blue",
  friday: "green",
};

const EMPTY_FORM = {
  sectionId: "",
  roomId: "",
  dayOfWeek: "saturday",
  startTime: "",
  endTime: "",
  startDate: "",
  endDate: "",
};

function formatTime(time) {
  if (!time) return "-";
  return String(time).slice(0, 5);
}

function formatDay(day) {
  const item = DAYS.find((currentDay) => currentDay.value === day);
  return item ? item.label : day || "-";
}

function getSectionLabel(section) {
  const courseCode =
    section.course_code ||
    section.courseCode ||
    "";

  const courseName =
    section.course_name ||
    section.courseName ||
    "";

  const sectionName =
    section.section_name ||
    section.sectionName ||
    "";

  return `${courseCode} - ${courseName} - Section ${sectionName}`;
}

function getRoomLabel(room) {
  const building = room.building || "";

  const roomName =
    room.room_name ||
    room.roomName ||
    "";

  return `${building} - ${roomName}`;
}

function getDateValue(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

function parseDateValue(value) {
  if (!value) return null;

  const [year, month, day] = String(value)
    .slice(0, 10)
    .split("-")
    .map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getStatus(item) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseDateValue(item.start_date);
  const end = parseDateValue(item.end_date);

  if (end && end < today) {
    return { label: "Ended", className: "ended" };
  }

  if (start && start > today) {
    return { label: "Upcoming", className: "upcoming" };
  }

  return { label: "Active", className: "active" };
}

export default function Timetable() {
  const navigate = useNavigate();

  const [timetable, setTimetable] = useState([]);
  const [sections, setSections] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");

  const [viewMode, setViewMode] = useState("list");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    ...EMPTY_FORM,
  });

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        timetableResult,
        sectionsResult,
        roomsResult,
      ] = await Promise.allSettled([
        getTimetable(),
        getSections(),
        getRooms(),
      ]);

      const errors = [];

      if (timetableResult.status === "fulfilled") {
        const data = timetableResult.value;

        setTimetable(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : []
        );
      } else {
        console.error(
          "Timetable loading error:",
          timetableResult.reason
        );

        setTimetable([]);

        errors.push(
          timetableResult.reason?.message ||
            "Failed to load timetable"
        );
      }

      if (sectionsResult.status === "fulfilled") {
        const data = sectionsResult.value;

        setSections(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : []
        );
      } else {
        console.error(
          "Sections loading error:",
          sectionsResult.reason
        );

        setSections([]);

        errors.push(
          sectionsResult.reason?.message ||
            "Failed to load sections"
        );
      }

      if (roomsResult.status === "fulfilled") {
        const data = roomsResult.value;

        setRooms(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : []
        );
      } else {
        console.error(
          "Rooms loading error:",
          roomsResult.reason
        );

        setRooms([]);

        errors.push(
          roomsResult.reason?.message ||
            "Failed to load rooms"
        );
      }

      if (errors.length > 0) {
        setError(errors.join(" | "));
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to load timetable data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     UNIQUE FILTER OPTIONS
  ========================================================= */

  const courseOptions = useMemo(() => {
    const map = new Map();

    timetable.forEach((item) => {
      const code = item.course_code || "";
      const name = item.course_name || "";

      if (code) {
        map.set(code, {
          code,
          name,
        });
      }
    });

    return Array.from(map.values());
  }, [timetable]);

  const sectionOptions = useMemo(() => {
    const map = new Map();

    timetable.forEach((item) => {
      const section = item.section_name || "";

      if (section) {
        map.set(section, section);
      }
    });

    return Array.from(map.values());
  }, [timetable]);

  const roomOptions = useMemo(() => {
    const map = new Map();

    timetable.forEach((item) => {
      const room = item.room_name || "";

      if (room) {
        map.set(room, room);
      }
    });

    return Array.from(map.values());
  }, [timetable]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredTimetable = useMemo(() => {
    const query = search.trim().toLowerCase();

    return timetable.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.course_code,
          item.course_name,
          item.section_name,
          item.room_name,
          item.building,
          item.day_of_week,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );

      const matchesCourse =
        courseFilter === "all" ||
        item.course_code === courseFilter;

      const matchesSection =
        sectionFilter === "all" ||
        item.section_name === sectionFilter;

      const matchesRoom =
        roomFilter === "all" ||
        item.room_name === roomFilter;

      const matchesDay =
        dayFilter === "all" ||
        item.day_of_week === dayFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesSection &&
        matchesRoom &&
        matchesDay
      );
    });
  }, [
    timetable,
    search,
    courseFilter,
    sectionFilter,
    roomFilter,
    dayFilter,
  ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const uniqueCourses = new Set(
      timetable
        .map((item) => item.course_code)
        .filter(Boolean)
    );

    const uniqueRooms = new Set(
      timetable
        .map((item) => item.room_name)
        .filter(Boolean)
    );

    const uniqueSections = new Set(
      timetable
        .map((item) => item.section_name)
        .filter(Boolean)
    );

    return {
      totalClasses: timetable.length,
      activeCourses: uniqueCourses.size,
      totalRooms:
        rooms.length ||
        uniqueRooms.size,
      totalSections:
        uniqueSections.size,
    };
  }, [timetable, rooms]);

  /* =========================================================
     TODAY
  ========================================================= */

  const todayClasses = useMemo(() => {
    const dayIndex = new Date().getDay();

    const dayMap = {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

    const today = dayMap[dayIndex];

    return timetable
      .filter(
        (item) =>
          item.day_of_week === today
      )
      .sort((a, b) =>
        String(a.start_time || "").localeCompare(
          String(b.start_time || "")
        )
      )
      .slice(0, 4);
  }, [timetable]);

  /* =========================================================
     FORM
  ========================================================= */

  function openCreateModal() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");

    setShowModal(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);

    setForm({
      sectionId: item.section_id
        ? String(item.section_id)
        : "",

      roomId: item.room_id
        ? String(item.room_id)
        : "",

      dayOfWeek:
        item.day_of_week ||
        "saturday",

      startTime:
        formatTime(item.start_time),

      endTime:
        formatTime(item.end_time),

      startDate:
        getDateValue(item.start_date),

      endDate:
        getDateValue(item.end_date),
    });

    setError("");

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,
    });
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !form.sectionId ||
      !form.dayOfWeek ||
      !form.startTime ||
      !form.endTime
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    if (
      form.startTime >=
      form.endTime
    ) {
      setError(
        "End time must be after start time."
      );

      return;
    }

    if (
      form.startDate &&
      form.endDate &&
      form.startDate >
        form.endDate
    ) {
      setError(
        "End date must be after start date."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        sectionId:
          Number(form.sectionId),

        roomId:
          form.roomId
            ? Number(form.roomId)
            : null,

        dayOfWeek:
          form.dayOfWeek,

        startTime:
          form.startTime,

        endTime:
          form.endTime,

        startDate:
          form.startDate || null,

        endDate:
          form.endDate || null,
      };

      if (editingId) {
        await updateTimetable(
          editingId,
          payload
        );
      } else {
        await createTimetable(
          payload
        );
      }

      setShowModal(false);
      setEditingId(null);

      setForm({
        ...EMPTY_FORM,
      });

      await loadData();
    } catch (err) {
      console.error(
        "Timetable save error:",
        err
      );

      setError(
        err.message ||
          "Failed to save timetable"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDelete(id) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this timetable slot?"
      );

    if (!confirmed) return;

    try {
      setError("");

      await deleteTimetable(id);

      await loadData();
    } catch (err) {
      console.error(
        "Timetable delete error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete timetable"
      );
    }
  }

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  function resetFilters() {
    setSearch("");
    setCourseFilter("all");
    setSectionFilter("all");
    setRoomFilter("all");
    setDayFilter("all");
  }

  /* =========================================================
     NAVIGATION
  ========================================================= */

  function goTo(path) {
    navigate(path);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="timetable-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="timetable-sidebar">

        <div className="tt-brand">
          <div className="tt-brand-logo">
            A
          </div>

          <div>
            <h2>Attendify</h2>
            <span>SMART ATTENDANCE</span>
          </div>
        </div>

        <nav className="tt-nav">

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/users")
            }
          >
            Users
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/courses")
            }
          >
            Courses
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/sections")
            }
          >
            Sections
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/rooms")
            }
          >
            Rooms
          </button>

          <button
            className="tt-nav-item active"
            aria-current="page"
          >
            Timetable
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/attendance")
            }
          >
            Attendance
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/reports")
            }
          >
            Reports
          </button>

          <button
            className="tt-nav-item"
            onClick={() =>
              goTo("/admin/settings")
            }
          >
            Settings
          </button>

        </nav>

        <div className="tt-sidebar-bottom">

          <div className="tt-sidebar-message">
            <strong>
              Good Morning
            </strong>

            <p>
              Manage your academic
              schedule efficiently.
            </p>
          </div>

          <button
            className="tt-nav-item tt-logout"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="timetable-main">

        {/* TOP BAR */}

        <div className="tt-topbar">

          <div className="tt-global-search">
            <input
              type="text"
              aria-label="Search timetable"
              placeholder="Search courses, rooms, or anything..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="tt-topbar-right">

            <div className="tt-user">

              <div className="tt-user-avatar">
                S
              </div>

              <div>
                <strong>
                  System Admin
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* PAGE HEADER */}

        <header className="tt-page-header">

          <div className="tt-title-wrapper">

            <div>
              <h1>
                Timetable Management
              </h1>

              <p>
                Organize and manage your class
                schedules, rooms, and time slots.
              </p>
            </div>

          </div>

          <div className="tt-header-date">
            {new Date().toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}
          </div>

          <button
            className="tt-add-button"
            onClick={
              openCreateModal
            }
          >
            Add Class to Timetable
          </button>

        </header>

        {/* CONTENT */}

        <section className="tt-content">

          {error && (
            <div className="tt-error" role="alert">
              <div>
                {error}
              </div>

              <button
                className="tt-retry-btn"
                onClick={() => {
                  setError("");
                  loadData();
                }}
              >
                Try again
              </button>

              <button
                aria-label="Dismiss"
                onClick={() =>
                  setError("")
                }
              >
                ×
              </button>
            </div>
          )}

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="tt-stats">

            <div className="tt-stat-card">

              <div>
                <span>Total Classes</span>

                <strong>
                  {stats.totalClasses}
                </strong>

                <small>
                  This semester
                </small>
              </div>

            </div>

            <div className="tt-stat-card">

              <div>
                <span>Active Courses</span>

                <strong>
                  {stats.activeCourses}
                </strong>

                <small>
                  This semester
                </small>
              </div>

            </div>

            <div className="tt-stat-card">

              <div>
                <span>Total Rooms</span>

                <strong>
                  {stats.totalRooms}
                </strong>

                <small>
                  Available rooms
                </small>
              </div>

            </div>

            <div className="tt-stat-card">

              <div>
                <span>Total Sections</span>

                <strong>
                  {stats.totalSections}
                </strong>

                <small>
                  Scheduled sections
                </small>
              </div>

            </div>

          </div>

          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="tt-filter-bar">

            <div className="tt-filter-search">
              <input
                type="text"
                aria-label="Search by course, section, or room"
                placeholder="Search by course, section, or room..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <select
              aria-label="Filter by course"
              value={courseFilter}
              onChange={(event) =>
                setCourseFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Courses
              </option>

              {courseOptions.map(
                (course) => (
                  <option
                    key={course.code}
                    value={course.code}
                  >
                    {course.code}
                  </option>
                )
              )}
            </select>

            <select
              aria-label="Filter by section"
              value={sectionFilter}
              onChange={(event) =>
                setSectionFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Sections
              </option>

              {sectionOptions.map(
                (section) => (
                  <option
                    key={section}
                    value={section}
                  >
                    Section {section}
                  </option>
                )
              )}
            </select>

            <select
              aria-label="Filter by room"
              value={roomFilter}
              onChange={(event) =>
                setRoomFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Rooms
              </option>

              {roomOptions.map(
                (room) => (
                  <option
                    key={room}
                    value={room}
                  >
                    {room}
                  </option>
                )
              )}
            </select>

            <select
              aria-label="Filter by day"
              value={dayFilter}
              onChange={(event) =>
                setDayFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Days
              </option>

              {DAYS.map((day) => (
                <option
                  key={day.value}
                  value={day.value}
                >
                  {day.label}
                </option>
              ))}
            </select>

            <button
              className="tt-reset-button"
              onClick={resetFilters}
            >
              Reset
            </button>

            <div className="tt-view-toggle">

              <button
                className={
                  viewMode === "list"
                    ? "active"
                    : ""
                }
                aria-pressed={
                  viewMode === "list"
                }
                onClick={() =>
                  setViewMode("list")
                }
              >
                List
              </button>

              <button
                className={
                  viewMode === "calendar"
                    ? "active"
                    : ""
                }
                aria-pressed={
                  viewMode === "calendar"
                }
                onClick={() =>
                  setViewMode(
                    "calendar"
                  )
                }
              >
                Calendar
              </button>

            </div>

          </div>

          {/* =================================================
              GRID
          ================================================= */}

          <div className="tt-layout">

            {/* MAIN TABLE */}

            <div className="tt-table-card">

              <div className="tt-table-header">

                <div>
                  <h2>
                    Class Schedule
                  </h2>

                  <p>
                    {filteredTimetable.length} scheduled
                    {filteredTimetable.length === 1
                      ? " class"
                      : " classes"}
                  </p>
                </div>

                <button
                  className="tt-small-add"
                  onClick={
                    openCreateModal
                  }
                >
                  Add
                </button>

              </div>

              {loading ? (
                <div className="tt-empty">
                  <div className="tt-loading-spinner" />
                  <h3>
                    Loading timetable...
                  </h3>
                  <p>
                    Please wait.
                  </p>
                </div>
              ) : filteredTimetable.length === 0 ? (
                <div className="tt-empty">
                  <h3>
                    No timetable slots found
                  </h3>

                  <p>
                    Try changing your filters
                    or add a new class.
                  </p>

                  <button
                    onClick={
                      openCreateModal
                    }
                  >
                    Add Class
                  </button>
                </div>
              ) : viewMode === "calendar" ? (
                <div className="tt-calendar-view">

                  {DAYS.map((day) => {
                    const dayItems =
                      filteredTimetable.filter(
                        (item) =>
                          item.day_of_week ===
                          day.value
                      );

                    return (
                      <div
                        className="tt-calendar-day"
                        key={day.value}
                      >
                        <div className="tt-calendar-day-header">
                          <strong>
                            {day.label}
                          </strong>

                          <span>
                            {dayItems.length}
                          </span>
                        </div>

                        <div className="tt-day-items">

                          {dayItems.length === 0 ? (
                            <div className="tt-day-empty">
                              No classes
                            </div>
                          ) : (
                            dayItems.map(
                              (item) => (
                                <div
                                  className="tt-calendar-item"
                                  key={item.id}
                                >
                                  <div>
                                    <strong>
                                      {item.course_code ||
                                        "-"}
                                    </strong>

                                    <span>
                                      {item.course_name ||
                                        "-"}
                                    </span>

                                    <small>
                                      {formatTime(
                                        item.start_time
                                      )}{" "}
                                      -{" "}
                                      {formatTime(
                                        item.end_time
                                      )}
                                    </small>
                                  </div>
                                </div>
                              )
                            )
                          )}

                        </div>
                      </div>
                    );
                  })}

                </div>
              ) : (
                <div className="tt-table-scroll">

                  <table className="tt-table">

                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Course</th>
                        <th>Section</th>
                        <th>Room</th>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredTimetable.map(
                        (item, index) => {

                          const dayColor =
                            DAY_COLORS[
                              item.day_of_week
                            ] ||
                            "blue";

                          const status =
                            getStatus(item);

                          return (
                            <tr
                              key={item.id}
                            >

                              <td>
                                <span className="tt-row-number">
                                  {String(
                                    index + 1
                                  ).padStart(
                                    2,
                                    "0"
                                  )}
                                </span>
                              </td>

                              <td>
                                <div className="tt-course-cell">

                                  <div>
                                    <strong>
                                      {item.course_code ||
                                        "-"}
                                    </strong>

                                    <span>
                                      {item.course_name ||
                                        "-"}
                                    </span>
                                  </div>

                                </div>
                              </td>

                              <td>
                                <strong>
                                  {item.section_name ||
                                    "-"}
                                </strong>
                              </td>

                              <td>
                                <div className="tt-room-cell">

                                  <strong>
                                    {item.room_name ||
                                      "No Room"}
                                  </strong>

                                  <span>
                                    {item.building ||
                                      "—"}
                                  </span>

                                </div>
                              </td>

                              <td>
                                <span
                                  className={`tt-day-badge ${dayColor}`}
                                >
                                  {formatDay(
                                    item.day_of_week
                                  )}
                                </span>
                              </td>

                              <td>
                                <strong className="tt-time">
                                  {formatTime(
                                    item.start_time
                                  )}{" "}
                                  -{" "}
                                  {formatTime(
                                    item.end_time
                                  )}
                                </strong>
                              </td>

                              <td>
                                {getDateValue(
                                  item.start_date
                                ) || "-"}
                              </td>

                              <td>
                                {getDateValue(
                                  item.end_date
                                ) || "-"}
                              </td>

                              <td>
                                <span
                                  className={`tt-status ${status.className}`}
                                >
                                  <i />
                                  {status.label}
                                </span>
                              </td>

                              <td>
                                <div className="tt-actions">

                                  <button
                                    className="tt-action edit"
                                    onClick={() =>
                                      openEditModal(
                                        item
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    className="tt-action delete"
                                    onClick={() =>
                                      handleDelete(
                                        item.id
                                      )
                                    }
                                  >
                                    Delete
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* =================================================
                RIGHT SIDEBAR
            ================================================= */}

            <aside className="tt-right-sidebar">

              {/* CALENDAR */}

              <div className="tt-side-card">

                <div className="tt-side-card-header">
                  <h3>
                    {new Date().toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </h3>
                </div>

                <div className="tt-weekdays">
                  {[
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ].map(
                    (day) => (
                      <span key={day}>
                        {day}
                      </span>
                    )
                  )}
                </div>

                <div className="tt-calendar-grid">

                  {Array.from(
                    {
                      length:
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1
                        ).getDay(),
                    },
                    (_, index) => (
                      <span
                        key={`empty-${index}`}
                      />
                    )
                  )}

                  {Array.from(
                    {
                      length:
                        new Date(
                          new Date().getFullYear(),
                          new Date().getMonth() + 1,
                          0
                        ).getDate(),
                    },
                    (_, index) => {

                      const day =
                        index + 1;

                      const isToday =
                        day ===
                          new Date().getDate();

                      return (
                        <span
                          key={day}
                          className={
                            isToday
                              ? "today"
                              : ""
                          }
                        >
                          {day}
                        </span>
                      );
                    }
                  )}

                </div>

              </div>

              {/* QUICK ACTIONS */}

              <div className="tt-side-card">

                <h3 className="tt-side-title">
                  Quick Actions
                </h3>

                <button
                  className="tt-quick-action blue"
                  onClick={
                    openCreateModal
                  }
                >
                  Add New Class
                </button>

                <button
                  className="tt-quick-action gray"
                  onClick={() =>
                    goTo(
                      "/admin/rooms"
                    )
                  }
                >
                  Manage Rooms
                </button>

                <button
                  className="tt-quick-action green"
                  onClick={() => {
                    window.print();
                  }}
                >
                  Export Timetable
                </button>

              </div>

              {/* TODAY CLASSES */}

              <div className="tt-side-card">

                <div className="tt-side-card-header">
                  <h3>
                    Today's Classes
                  </h3>

                  <button
                    className="tt-view-all"
                    onClick={() => {
                      setDayFilter(
                        DAYS.find(
                          (day) =>
                            day.value ===
                            timetable.find(
                              (item) =>
                                item.day_of_week
                            )?.day_of_week
                        )?.value ||
                          "all"
                      );
                    }}
                  >
                    View All
                  </button>
                </div>

                {todayClasses.length === 0 ? (
                  <div className="tt-no-today">
                    No classes scheduled
                    today.
                  </div>
                ) : (
                  <div className="tt-today-list">

                    {todayClasses.map(
                      (item) => (
                        <div
                          className="tt-today-item"
                          key={item.id}
                        >

                          <div>
                            <strong>
                              {item.course_code ||
                                "-"}{" "}
                              -{" "}
                              {item.course_name ||
                                "-"}
                            </strong>

                            <span>
                              {formatTime(
                                item.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                item.end_time
                              )}
                            </span>

                            <span>
                              {item.room_name ||
                                "No Room"}
                            </span>
                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </aside>

          </div>

        </section>

        <footer className="tt-footer">
          © 2026 Attendify. All rights reserved.
        </footer>

      </main>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          className="tt-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="tt-modal">

            <div className="tt-modal-header">

              <div>
                <div>
                  <h2>
                    {editingId
                      ? "Edit Class"
                      : "Add Class to Timetable"}
                  </h2>

                  <p>
                    Configure the class
                    schedule.
                  </p>
                </div>
              </div>

              <button
                className="tt-modal-close"
                aria-label="Close"
                onClick={
                  closeModal
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="tt-form-grid">

                <div className="tt-form-group full">

                  <label htmlFor="tt-section">
                    Section
                    <span>*</span>
                  </label>

                  <select
                    id="tt-section"
                    name="sectionId"
                    value={
                      form.sectionId
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option value="">
                      Select Course / Section
                    </option>

                    {sections.map(
                      (section) => (
                        <option
                          key={
                            section.id
                          }
                          value={
                            section.id
                          }
                        >
                          {getSectionLabel(
                            section
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="tt-form-group">

                  <label htmlFor="tt-room">
                    Room
                  </label>

                  <select
                    id="tt-room"
                    name="roomId"
                    value={
                      form.roomId
                    }
                    onChange={
                      handleChange
                    }
                  >

                    <option value="">
                      No Room
                    </option>

                    {rooms.map(
                      (room) => (
                        <option
                          key={
                            room.id
                          }
                          value={
                            room.id
                          }
                        >
                          {getRoomLabel(
                            room
                          )}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="tt-form-group">

                  <label htmlFor="tt-day">
                    Day
                    <span>*</span>
                  </label>

                  <select
                    id="tt-day"
                    name="dayOfWeek"
                    value={
                      form.dayOfWeek
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    {DAYS.map(
                      (day) => (
                        <option
                          key={
                            day.value
                          }
                          value={
                            day.value
                          }
                        >
                          {day.label}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="tt-form-group">

                  <label htmlFor="tt-start-time">
                    Start Time
                    <span>*</span>
                  </label>

                  <input
                    id="tt-start-time"
                    type="time"
                    name="startTime"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="tt-form-group">

                  <label htmlFor="tt-end-time">
                    End Time
                    <span>*</span>
                  </label>

                  <input
                    id="tt-end-time"
                    type="time"
                    name="endTime"
                    value={
                      form.endTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />

                </div>

                <div className="tt-form-group">

                  <label htmlFor="tt-start-date">
                    Start Date
                  </label>

                  <input
                    id="tt-start-date"
                    type="date"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

                <div className="tt-form-group">

                  <label htmlFor="tt-end-date">
                    End Date
                  </label>

                  <input
                    id="tt-end-date"
                    type="date"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>

              </div>

              {error && (
                <div className="tt-modal-error" role="alert">
                  {error}
                </div>
              )}

              <div className="tt-modal-footer">

                <button
                  type="button"
                  className="tt-cancel"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="tt-save"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Class"
                    : "Create Class"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}