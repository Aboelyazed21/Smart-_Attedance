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
import { useLanguage } from "../../utils/i18n";
import { usePlatformSettings } from "../../utils/platformSettings";

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

function formatDay(day, t) {
  if (typeof t === "function") {
    return t("timetable.day_" + day);
  }

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

    check: (
      <path d="m5 12 4 4L19 6" />
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
  const { t, lang } = useLanguage();
  const { platformName } = usePlatformSettings();
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

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [conflicts, setConflicts] = useState(null);

  const navigate = useNavigate();

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
            t("timetable.failed_to_load_timetable")
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
            t("timetable.failed_to_load_sections")
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
            t("timetable.failed_to_load_rooms")
        );
      }

      if (errors.length > 0) {
        setError(errors.join(" | "));
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          t("timetable.failed_to_load_timetable_data")
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
     PAGINATION (list view, client-side over filtered rows)
  ========================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    courseFilter,
    sectionFilter,
    roomFilter,
    dayFilter,
    viewMode,
    perPage,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTimetable.length / perPage)
  );

  const safePage = Math.min(page, totalPages);

  const paginatedTimetable = useMemo(() => {
    const start = (safePage - 1) * perPage;

    return filteredTimetable.slice(
      start,
      start + perPage
    );
  }, [filteredTimetable, safePage, perPage]);

  /* =========================================================
     CONFLICT DETECTION (same predicate as the backend:
     same room + same day + overlapping date ranges +
     overlapping times)
  ========================================================= */

  function dateOrNull(value) {
    if (!value) return null;

    const text = String(value).slice(0, 10);

    return /^\d{4}-\d{2}-\d{2}$/.test(text)
      ? text
      : null;
  }

  function slotsOverlap(a, b) {
    if (
      !a.room_id ||
      !b.room_id ||
      Number(a.room_id) !== Number(b.room_id)
    ) {
      return false;
    }

    if (
      !a.day_of_week ||
      a.day_of_week !== b.day_of_week
    ) {
      return false;
    }

    const aStartDate = dateOrNull(a.start_date);
    const aEndDate = dateOrNull(a.end_date);
    const bStartDate = dateOrNull(b.start_date);
    const bEndDate = dateOrNull(b.end_date);

    // Open-ended ranges always overlap each other.
    if (
      aStartDate &&
      bEndDate &&
      aStartDate > bEndDate
    ) {
      return false;
    }

    if (
      aEndDate &&
      bStartDate &&
      aEndDate < bStartDate
    ) {
      return false;
    }

    const aStart = String(a.start_time || "");
    const aEnd = String(a.end_time || "");
    const bStart = String(b.start_time || "");
    const bEnd = String(b.end_time || "");

    if (!aStart || !aEnd || !bStart || !bEnd) {
      return false;
    }

    return aStart < bEnd && aEnd > bStart;
  }

  function findConflicts(rows) {
    const pairs = [];

    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        if (slotsOverlap(rows[i], rows[j])) {
          pairs.push([rows[i], rows[j]]);
        }
      }
    }

    return pairs;
  }

  function handleViewConflicts() {
    setError("");
    setConflicts(findConflicts(timetable));
  }

  function slotStatus(item) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = dateOrNull(item.start_date);
    const end = dateOrNull(item.end_date);

    if (end) {
      const endTime = Date.parse(end);

      if (!Number.isNaN(endTime) && endTime < today.getTime()) {
        return { label: t("timetable.ended"), tone: "muted" };
      }
    }

    if (start) {
      const startTime = Date.parse(start);

      if (
        !Number.isNaN(startTime) &&
        startTime > today.getTime()
      ) {
        return { label: t("timetable.scheduled"), tone: "scheduled" };
      }
    }

    return { label: t("timetable.active"), tone: "active" };
  }

  function conflictLabel(item) {
    const room =
      item.room_name ||
      (item.building
        ? `${item.building}`
        : t("timetable.roomLabel").replace("{id}", item.room_id || "?"));

    return `${t("timetable.day_" + item.day_of_week)} ${formatTime(
      item.start_time
    )}-${formatTime(item.end_time)} · ${room}`;
  }

  function describeConflict(conflict) {
    if (!conflict || typeof conflict !== "object") {
      return "";
    }

    const roomName =
      rooms.find(
        (room) =>
          Number(room.id) ===
          Number(conflict.room_id)
      )?.room_name ||
      (conflict.room_id
        ? t("timetable.roomLabel").replace("{id}", conflict.room_id)
        : t("timetable.the_selected_room"));

    return `${formatDay(
      conflict.day_of_week,
      t
    )} ${formatTime(
      conflict.start_time
    )}-${formatTime(conflict.end_time)} · ${roomName}`;
  }

  /* =========================================================
     CSV EXPORT (real download of the filtered rows)
  ========================================================= */

  function escapeCsvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function handleExportCsv() {
    if (filteredTimetable.length === 0) {
      setError(t("timetable.nothing_to_export_with_current_filters"));
      return;
    }

    const header = [
      "Course Code",
      "Course Name",
      "Section",
      "Room",
      "Building",
      "Day",
      "Start Time",
      "End Time",
      "Start Date",
      "End Date",
    ];

    const lines = filteredTimetable.map((item) =>
      [
        item.course_code,
        item.course_name,
        item.section_name,
        item.room_name,
        item.building,
        formatDay(item.day_of_week),
        formatTime(item.start_time),
        formatTime(item.end_time),
        getDateValue(item.start_date),
        getDateValue(item.end_date),
      ]
        .map(escapeCsvCell)
        .join(",")
    );

    const blob = new Blob(
      [[...header].map(escapeCsvCell).join(","), ...lines].join(
        "\n"
      ),
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "timetable.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

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
        t("timetable.please_fill_all_required_fields")
      );

      return;
    }

    if (
      form.startTime >=
      form.endTime
    ) {
      setError(
        t("timetable.end_time_must_be_after_start_time")
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
        t("timetable.end_date_must_be_after_start_date")
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

      // 409 comes straight from backend room-conflict
      // validation and carries the conflicting slot.
      if (err?.status === 409 && err?.details) {
        const detail = describeConflict(err.details);

        setError(
          `${err.message}${
            detail ? ` (${detail}).` : ""
          }`
        );

        return;
      }

      setError(
        err.message ||
          t("timetable.failed_to_save_timetable")
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
        t("timetable.are_you_sure_you_want_to_delete_this_tim")
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
          t("timetable.failed_to_delete_timetable")
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
              placeholder={t("timetable.search_courses_rooms_or_anything")}
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
                  {t("timetable.system_admin")}
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
                {t("timetable.timetable_management")}
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
            {t("timetable.add_class_to_timetable")}
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
                aria-label={t("timetable.dismiss_error")}
              >
                <TtIcon name="close" size={15} />
              </button>
            </div>
          )}

          {conflicts !== null && (
            <div
              className={
                conflicts.length > 0
                  ? "tt-error"
                  : "tt-conflict-ok"
              }
              role="status"
            >
              <span>
                <TtIcon
                  name={
                    conflicts.length > 0
                      ? "alert"
                      : "check"
                  }
                  size={15}
                />
              </span>

              <div>
                {conflicts.length > 0 ? (
                  <>
                    <strong>
                      {conflicts.length}{" "}
                      {t("timetable.conflicting")}{" "}
                      {conflicts.length === 1
                        ? t("timetable.pair")
                        : t("timetable.pairs")}{" "}
                      {t("timetable.found")}:
                    </strong>

                    <ul className="tt-conflict-list">
                      {conflicts.map(
                        ([first, second], pairIndex) => (
                          <li
                            key={`${first.id}-${second.id}-${pairIndex}`}
                          >
                            {first.course_code ||
                              first.course_name ||
                              `Slot ${first.id}`}{" "}
                            ↔{" "}
                            {second.course_code ||
                              second.course_name ||
                              `Slot ${second.id}`}{" "}
                            ({conflictLabel(first)})
                          </li>
                        )
                      )}
                    </ul>
                  </>
                ) : (
                  <span>
                    {t("timetable.no_scheduling_conflicts_found_in_the_loa")}
                  </span>
                )}
              </div>

              <button
                onClick={() =>
                  setConflicts(null)
                }
                aria-label={t("timetable.dismiss_conflict_results")}
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
                <span>{t("timetable.total_classes")}</span>

                <strong>
                  {stats.totalClasses}
                </strong>

                <small>
                  {t("timetable.this_semester")}
                </small>
              </div>

            </div>

            <div className="tt-stat-card">

              <div className="tt-stat-icon blue">
                <TtIcon name="users" size={19} />
              </div>

              <div>
                <span>{t("timetable.active_courses")}</span>

                <strong>
                  {stats.activeCourses}
                </strong>

                <small>
                  {t("timetable.this_semester")}
                </small>
              </div>

            </div>

            <div className="tt-stat-card">

              <div className="tt-stat-icon green">
                <TtIcon name="building" size={19} />
              </div>

              <div>
                <span>{t("timetable.total_rooms")}</span>

                <strong>
                  {stats.totalRooms}
                </strong>

                <small>
                  {t("timetable.available_rooms")}
                </small>
              </div>

            </div>

            <div className="tt-stat-card">

              <div className="tt-stat-icon orange">
                <TtIcon name="clock" size={19} />
              </div>

              <div>
                <span>{t("timetable.total_sections")}</span>

                <strong>
                  {stats.totalSections}
                </strong>

                <small>
                  {t("timetable.scheduled_sections")}
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
                placeholder={t("timetable.search_by_course_section_or_room")}
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
                {t("timetable.all_courses")}
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
                {t("timetable.all_sections")}
              </option>

              {sectionOptions.map(
                (section) => (
                  <option
                    key={section}
                    value={section}
                  >
                    {t("timetable.section")} {section}
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
                {t("timetable.all_rooms")}
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
                {t("timetable.all_days")}
              </option>

              {DAYS.map((day) => (
                <option
                  key={day.value}
                  value={day.value}
                >
                  {t("timetable.day_" + day.value)}
                </option>
              ))}
            </select>

            <button
              className="tt-reset-button"
              onClick={resetFilters}
            >
              <TtIcon name="refresh" size={15} />
              {t("timetable.reset")}
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
                {t("timetable.list")}
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
                {t("timetable.calendar")}
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
                    {t("timetable.class_schedule")}
                  </h2>

                  <p>
                    {filteredTimetable.length} {t("timetable.scheduled_2")}
                    {filteredTimetable.length === 1
                      ? t("timetable.class")
                      : t("timetable.classes")}
                  </p>
                </div>

                <button
                  className="tt-small-add"
                  onClick={
                    openCreateModal
                  }
                >
                  <TtIcon name="plus" size={14} /> {t("timetable.add")}
                </button>

              </div>

              {loading ? (
                <div className="tt-empty">
                  <div className="tt-loading-spinner" />
                  <h3>
                    {t("timetable.loading_timetable")}
                  </h3>
                  <p>
                    {t("timetable.please_wait")}
                  </p>
                </div>
              ) : filteredTimetable.length === 0 ? (
                <div className="tt-empty">
                  <div className="tt-empty-icon">
                    <TtIcon name="calendar" size={24} />
                  </div>

                  <h3>
                    {t("timetable.no_timetable_slots_found")}
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
                    <TtIcon name="plus" size={15} /> {t("timetable.add_class")}
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
                            {t("timetable.day_" + day.value)}
                          </strong>

                          <span>
                            {dayItems.length}
                          </span>
                        </div>

                        <div className="tt-day-items">

                          {dayItems.length === 0 ? (
                            <div className="tt-day-empty">
                              {t("timetable.no_classes")}
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
                <>
                <div className="tt-table-scroll">

                  <table className="tt-table">

                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t("timetable.course")}</th>
                        <th>{t("timetable.section")}</th>
                        <th>{t("timetable.room")}</th>
                        <th>{t("timetable.day")}</th>
                        <th>{t("timetable.time")}</th>
                        <th>{t("timetable.start_date")}</th>
                        <th>{t("timetable.end_date")}</th>
                        <th>{t("timetable.status")}</th>
                        <th>{t("timetable.actions")}</th>
                      </tr>
                    </thead>

                    <tbody>

                      {paginatedTimetable.map(
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
                                    (safePage - 1) *
                                      perPage +
                                      index +
                                      1
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
                                      t("timetable.no_room")}
                                  </strong>

                                  <span>
                                    {item.building ||
                                      t("timetable.not_provided")}
                                  </span>

                                </div>
                              </td>

                              <td>
                                <span
                                  className={`tt-day-badge ${dayColor}`}
                                >
                                  {formatDay(
                                    item.day_of_week,
                                    t
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
                                {(() => {
                                  const slot =
                                    slotStatus(item);

                                  return (
                                    <span
                                      className={`tt-status ${slot.tone}`}
                                    >
                                      <i />
                                      {slot.label}
                                    </span>
                                  );
                                })()}
                              </td>

                              <td>
                                <div className="tt-actions">

                                  <button
                                    className="tt-action edit"
                                    title={t("timetable.edit")}
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
                                    title={t("timetable.delete")}
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

                <div className="tt-pagination">

                  <span className="tt-pagination-count">
                    {t("timetable.showing")}{" "}
                    {filteredTimetable.length === 0
                      ? 0
                      : (safePage - 1) * perPage + 1}
                    –{" "}
                    {Math.min(
                      safePage * perPage,
                      filteredTimetable.length
                    )}{" "}
                    {t("timetable.of")} {filteredTimetable.length}
                  </span>

                  <div className="tt-pagination-controls">

                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() =>
                        setPage(safePage - 1)
                      }
                      aria-label={t("timetable.previous_page")}
                    >
                      ‹
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    )
                      .filter(
                        (pageNumber) =>
                          pageNumber === 1 ||
                          pageNumber ===
                            totalPages ||
                          Math.abs(
                            pageNumber - safePage
                          ) <= 1
                      )
                      .map(
                        (
                          pageNumber,
                          position,
                          visible
                        ) => (
                          <span key={pageNumber}>
                            {position > 0 &&
                              visible[position - 1] !==
                                pageNumber - 1 &&
                              "…"}
                            <button
                              type="button"
                              className={
                                pageNumber === safePage
                                  ? "current"
                                  : ""
                              }
                              aria-current={
                                pageNumber === safePage
                                  ? "page"
                                  : undefined
                              }
                              onClick={() =>
                                setPage(pageNumber)
                              }
                            >
                              {pageNumber}
                            </button>
                          </span>
                        )
                      )}

                    <button
                      type="button"
                      disabled={
                        safePage >= totalPages
                      }
                      onClick={() =>
                        setPage(safePage + 1)
                      }
                      aria-label={t("timetable.next_page")}
                    >
                      ›
                    </button>

                    <select
                      className="tt-pagination-perpage"
                      aria-label={t("timetable.rows_per_page")}
                      value={perPage}
                      onChange={(event) =>
                        setPerPage(
                          Number(event.target.value)
                        )
                      }
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>

                  </div>

                </div>
                </>
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
                    t("timetable.sun"),
                    t("timetable.mon"),
                    t("timetable.tue"),
                    t("timetable.wed"),
                    t("timetable.thu"),
                    t("timetable.fri"),
                    t("timetable.sat"),
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
                  {t("timetable.quick_actions")}
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
                  {t("timetable.add_new_class")}
                </button>

                <button
                  className="tt-quick-action gray"
                  onClick={() =>
                    navigate(
                      "/admin/rooms"
                    )
                  }
                >
                  <span>
                    <TtIcon name="building" size={15} />
                  </span>
                  {t("timetable.manage_rooms")}
                </button>

                <button
                  className="tt-quick-action red"
                  onClick={
                    handleViewConflicts
                  }
                >
                  <span>
                    <TtIcon name="alert" size={15} />
                  </span>
                  {t("timetable.view_conflicts")}
                </button>

                <button
                  className="tt-quick-action green"
                  onClick={
                    handleExportCsv
                  }
                >
                  <span>
                    <TtIcon name="download" size={15} />
                  </span>
                  {t("timetable.export_timetable")}
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
                    {t("timetable.view_all")}
                  </button>
                </div>

                {todayClasses.length === 0 ? (
                  <div className="tt-no-today">
                    {t("timetable.no_classes_scheduled_today")}
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
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
                                t("timetable.no_room")}
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
                    © 2026 {platformName}.{" "}
          {lang === "ar"
            ? "جميع الحقوق محفوظة."
            : "All rights reserved."}
          <span>
            {t("timetable.smart_education_smarter_tomorrow")}
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
                      ? t("timetable.edit_class")
                      : t("timetable.add_class_to_timetable")}
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
                aria-label={t("timetable.close_dialog")}
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
                    {t("timetable.section")}
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
                      {t("timetable.select_course_section")}
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
                    {t("timetable.room")}
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
                      {t("timetable.no_room")}
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
                    {t("timetable.day")}
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
                          {t("timetable.day_" + day.value)}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="tt-form-group">

                  <label>
                    {t("timetable.start_time")}
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
                    {t("timetable.end_time")}
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
                    {t("timetable.start_date")}
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
                    {t("timetable.end_date")}
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
                  {t("timetable.cancel")}
                </button>

                <button
                  type="submit"
                  className="tt-save"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? t("timetable.saving")
                    : editingId
                    ? t("timetable.update_class")
                    : t("timetable.create_class")}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
