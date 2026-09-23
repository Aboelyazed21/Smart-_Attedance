import { useEffect, useMemo, useState } from "react";
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

function TtIcon({ name, size = 16 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),

    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M16 5a3.5 3.5 0 0 1 0 7" />
        <path d="M18 14.5A6 6 0 0 1 21 20" />
      </>
    ),

    building: (
      <>
        <path d="M3 21h18" />
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        <path d="M9 9h2M13 9h2M9 13h2M13 13h2" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),

    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21" />
        <path d="M6.5 2H21v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),

    list: (
      <>
        <path d="M9 6h12M9 12h12M9 18h12" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </>
    ),

    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),

    refresh: (
      <>
        <path d="M20 11a8 8 0 1 0-2.3 6.3" />
        <path d="M20 5v6h-6" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

    close: <path d="M6 6l12 12M18 6 6 18" />,

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),

    download: (
      <>
        <path d="M12 4v11" />
        <path d="m7 11 5 5 5-5" />
        <path d="M4 20h16" />
      </>
    ),

    alert: (
      <>
        <path d="M12 4v9" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
      </>
    ),

    target: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Timetable() {
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
     RENDER
  ========================================================= */

  return (
    <div className="timetable-page">

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="timetable-main">

        {/* TOP BAR */}

        <div className="tt-topbar">

          <div className="tt-global-search">
            <span>
              <TtIcon name="search" />
            </span>

            <input
              type="text"
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

            <div className="tt-title-icon">
              <TtIcon name="calendar" size={20} />
            </div>

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
            <span>
              <TtIcon name="grid" size={15} />
            </span>

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
            <span>
              <TtIcon name="plus" size={15} />
            </span>
            Add Class to Timetable
          </button>

        </header>

        {/* CONTENT */}

        <section className="tt-content">

          {error && (
            <div className="tt-error">
              <span>
                <TtIcon name="alert" size={15} />
              </span>
              <div>
                {error}
              </div>

              <button
                onClick={() =>
                  setError("")
                }
                aria-label="Dismiss error"
              >
                <TtIcon name="close" size={15} />
              </button>
            </div>
          )}

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="tt-stats">

            <div className="tt-stat-card">

              <div className="tt-stat-icon purple">
                <TtIcon name="book" size={19} />
              </div>

              <div>
                <span>Total Classes</span>

                <strong>
                  {stats.totalClasses}
                </strong>

                <small>
                  This semester
                </small>
              </div>

              <div className="tt-stat-badge green">
                + 12%
              </div>

            </div>

            <div className="tt-stat-card">

              <div className="tt-stat-icon blue">
                <TtIcon name="users" size={19} />
              </div>

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

              <div className="tt-stat-icon green">
                <TtIcon name="building" size={19} />
              </div>

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

              <div className="tt-stat-icon orange">
                <TtIcon name="clock" size={19} />
              </div>

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
              <span>
                <TtIcon name="search" size={16} />
              </span>

              <input
                type="text"
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
              <TtIcon name="refresh" size={15} />
              Reset
            </button>

            <div className="tt-view-toggle">

              <button
                className={
                  viewMode === "list"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode("list")
                }
              >
                <TtIcon name="list" size={15} />
                List
              </button>

              <button
                className={
                  viewMode === "calendar"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setViewMode(
                    "calendar"
                  )
                }
              >
                <TtIcon name="grid" size={15} />
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
                  <TtIcon name="plus" size={14} /> Add
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
                  <div className="tt-empty-icon">
                    <TtIcon name="calendar" size={24} />
                  </div>

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
                    <TtIcon name="plus" size={15} /> Add Class
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
                                  <div className="tt-calendar-course-icon">
                                    <TtIcon name="book" size={16} />
                                  </div>

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

                                  <div className="tt-course-icon">
                                    <TtIcon name="book" size={16} />
                                  </div>

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
                                      "Not provided"}
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
                                <span className="tt-status active">
                                  <i />
                                  Active
                                </span>
                              </td>

                              <td>
                                <div className="tt-actions">

                                  <button
                                    className="tt-action edit"
                                    title="Edit"
                                    onClick={() =>
                                      openEditModal(
                                        item
                                      )
                                    }
                                  >
                                    <TtIcon name="edit" size={15} />
                                  </button>

                                  <button
                                    className="tt-action delete"
                                    title="Delete"
                                    onClick={() =>
                                      handleDelete(
                                        item.id
                                      )
                                    }
                                  >
                                    <TtIcon name="trash" size={15} />
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

                  <div>
                    <button>‹</button>
                    <button>›</button>
                  </div>
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
                  <span>
                    <TtIcon name="plus" size={15} />
                  </span>
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
                  <span>
                    <TtIcon name="building" size={15} />
                  </span>
                  Manage Rooms
                </button>

                <button
                  className="tt-quick-action red"
                  onClick={() =>
                    setError(
                      "Conflict detection can be connected to the timetable backend."
                    )
                  }
                >
                  <span>
                    <TtIcon name="alert" size={15} />
                  </span>
                  View Conflicts
                </button>

                <button
                  className="tt-quick-action green"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <span>
                    <TtIcon name="download" size={15} />
                  </span>
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

                          <div className="tt-today-icon">
                            📘
                          </div>

                          <div>
                            <strong>
                              {item.course_code ||
                                "-"}{" "}
                              -{" "}
                              {item.course_name ||
                                "-"}
                            </strong>

                            <span>
                              <TtIcon name="clock" size={12} />{" "}
                              {formatTime(
                                item.start_time
                              )}{" "}
                              -{" "}
                              {formatTime(
                                item.end_time
                              )}
                            </span>

                            <span>
                              <TtIcon name="target" size={12} />{" "}
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
          <span>
            Smart Education. Smarter Tomorrow.
          </span>
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
                <div className="tt-modal-icon">
                  <TtIcon name="calendar" size={20} />
                </div>

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
                onClick={
                  closeModal
                }
                aria-label="Close dialog"
              >
                <TtIcon name="close" size={15} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="tt-form-grid">

                <div className="tt-form-group full">

                  <label>
                    Section
                    <span>*</span>
                  </label>

                  <select
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

                  <label>
                    Room
                  </label>

                  <select
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

                  <label>
                    Day
                    <span>*</span>
                  </label>

                  <select
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

                  <label>
                    Start Time
                    <span>*</span>
                  </label>

                  <input
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

                  <label>
                    End Time
                    <span>*</span>
                  </label>

                  <input
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

                  <label>
                    Start Date
                  </label>

                  <input
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

                  <label>
                    End Date
                  </label>

                  <input
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
                <div className="tt-modal-error">
                  <TtIcon name="alert" size={14} /> {error}
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
