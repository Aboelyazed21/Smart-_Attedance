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

const DAYS = [
  {
    value: "saturday",
    label: "Saturday",
  },
  {
    value: "sunday",
    label: "Sunday",
  },
  {
    value: "monday",
    label: "Monday",
  },
  {
    value: "tuesday",
    label: "Tuesday",
  },
  {
    value: "wednesday",
    label: "Wednesday",
  },
  {
    value: "thursday",
    label: "Thursday",
  },
  {
    value: "friday",
    label: "Friday",
  },
];

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
  const item = DAYS.find(
    (currentDay) =>
      currentDay.value === day
  );

  return item
    ? item.label
    : day || "-";
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
  const building =
    room.building || "";

  const roomName =
    room.room_name ||
    room.roomName ||
    "";

  return `${building} - ${roomName}`;
}

export default function Timetable() {
  const navigate = useNavigate();

  const [timetable, setTimetable] =
    useState([]);

  const [sections, setSections] =
    useState([]);

  const [rooms, setRooms] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {
    setLoading(true);
    setError("");

    /*
      Load each resource independently.
      If one API fails, the other data can still be displayed.
    */
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

    /* =======================================================
       TIMETABLE
    ======================================================= */

    if (timetableResult.status === "fulfilled") {
      const timetableData = timetableResult.value;

      setTimetable(
        Array.isArray(timetableData)
          ? timetableData
          : Array.isArray(timetableData?.data)
          ? timetableData.data
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

    /* =======================================================
       SECTIONS
    ======================================================= */

    if (sectionsResult.status === "fulfilled") {
      const sectionsData = sectionsResult.value;

      setSections(
        Array.isArray(sectionsData)
          ? sectionsData
          : Array.isArray(sectionsData?.data)
          ? sectionsData.data
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

    /* =======================================================
       ROOMS
    ======================================================= */

    if (roomsResult.status === "fulfilled") {
      const roomsData = roomsResult.value;

      setRooms(
        Array.isArray(roomsData)
          ? roomsData
          : Array.isArray(roomsData?.data)
          ? roomsData.data
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

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredTimetable =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return timetable;
      }

      return timetable.filter(
        (item) => {
          const values = [
            item.course_code,
            item.course_name,
            item.section_name,
            item.room_name,
            item.building,
            item.day_of_week,
          ];

          return values.some(
            (value) =>
              String(
                value || ""
              )
                .toLowerCase()
                .includes(query)
          );
        }
      );
    }, [timetable, search]);

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
      sectionId:
        item.section_id
          ? String(item.section_id)
          : "",

      roomId:
        item.room_id
          ? String(item.room_id)
          : "",

      dayOfWeek:
        item.day_of_week ||
        "saturday",

      startTime:
        formatTime(
          item.start_time
        ),

      endTime:
        formatTime(
          item.end_time
        ),

      startDate:
        item.start_date
          ? String(
              item.start_date
            ).slice(0, 10)
          : "",

      endDate:
        item.end_date
          ? String(
              item.end_date
            ).slice(0, 10)
          : "",
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

      closeModal();

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
     SIDEBAR
  ========================================================= */

  function goTo(path) {
    navigate(path);
  }

  return (
    <div className="dashboard-page">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            🎓
          </div>

          <div>
            <h2>Attendify</h2>

            <span>
              SMART ATTENDANCE
            </span>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button
            className="nav-item"
            onClick={() =>
              goTo("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo("/admin/users")
            }
          >
            <span>♙</span>
            Users
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo("/admin/courses")
            }
          >
            <span>▤</span>
            Courses
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo("/admin/sections")
            }
          >
            <span>§</span>
            Sections
          </button>

          <button
            className="nav-item"
            onClick={() =>
              goTo("/admin/rooms")
            }
          >
            <span>⌂</span>
            Rooms
          </button>

          <button
            className="nav-item active"
          >
            <span>◫</span>
            Timetable
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button
            className="nav-item logout-button"
            onClick={() => {
              localStorage.removeItem(
                "token"
              );

              localStorage.removeItem(
                "user"
              );

              navigate("/");
            }}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>Timetable</h1>

            <p>
              Manage course schedules,
              rooms and class times.
            </p>
          </div>

          <button
            type="button"
            className="sign-in-button"
            style={{
              width: "auto",
              padding:
                "12px 22px",
              cursor: "pointer",
            }}
            onClick={
              openCreateModal
            }
          >
            + Add Timetable
          </button>
        </header>

        <section className="dashboard-content">
          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              style={{
                background:
                  "#fee2e2",
                color:
                  "#991b1b",
                padding:
                  "12px 16px",
                borderRadius:
                  "10px",
                marginBottom:
                  "18px",
                border:
                  "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              TOOLBAR
          ================================================= */}

          <div
            className="dashboard-panel"
            style={{
              marginBottom:
                "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: "15px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      "0 0 5px",
                  }}
                >
                  Class Schedule
                </h2>

                <p
                  style={{
                    margin: 0,
                  }}
                >
                  {filteredTimetable.length}{" "}
                  timetable slot
                  {filteredTimetable.length !==
                  1
                    ? "s"
                    : ""}
                </p>
              </div>

              <input
                type="text"
                placeholder="Search course, room or day..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                style={{
                  width:
                    "min(100%, 360px)",
                  padding:
                    "12px 14px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "10px",
                  outline:
                    "none",
                  fontSize:
                    "14px",
                  boxSizing:
                    "border-box",
                }}
              />
            </div>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="dashboard-panel">
            {loading ? (
              <div className="empty-state">
                <div className="empty-icon">
                  ◷
                </div>

                <h3>
                  Loading timetable...
                </h3>

                <p>
                  Please wait.
                </p>
              </div>
            ) : filteredTimetable.length ===
              0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  ◫
                </div>

                <h3>
                  No timetable
                  slots found
                </h3>

                <p>
                  Add your first
                  timetable slot.
                </p>
              </div>
            ) : (
              <div
                style={{
                  width:
                    "100%",
                  overflowX:
                    "auto",
                }}
              >
                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                    minWidth:
                      "900px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Course",
                        "Section",
                        "Room",
                        "Day",
                        "Time",
                        "Start Date",
                        "End Date",
                        "Actions",
                      ].map(
                        (
                          heading
                        ) => (
                          <th
                            key={
                              heading
                            }
                            style={{
                              textAlign:
                                "left",
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #e5e7eb",
                              fontSize:
                                "13px",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {
                              heading
                            }
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTimetable.map(
                      (item) => (
                        <tr
                          key={
                            item.id
                          }
                        >
                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <strong>
                              {item.course_code ||
                                "-"}
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#6b7280",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {item.course_name ||
                                "-"}
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {item.section_name ||
                              "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            <strong>
                              {item.room_name ||
                                "-"}
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#6b7280",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {item.building ||
                                ""}
                            </div>
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {formatDay(
                              item.day_of_week
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {formatTime(
                              item.start_time
                            )}{" "}
                            -{" "}
                            {formatTime(
                              item.end_time
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {item.start_date
                              ? String(
                                  item.start_date
                                ).slice(
                                  0,
                                  10
                                )
                              : "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                              borderBottom:
                                "1px solid #f1f5f9",
                            }}
                          >
                            {item.end_date
                              ? String(
                                  item.end_date
                                ).slice(
                                  0,
                                  10
                                )
                              : "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "14px 12px",
                                borderBottom:
                                  "1px solid #f1f5f9",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  item
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "#eef2ff",
                                color:
                                  "#3730a3",
                                padding:
                                  "8px 12px",
                                borderRadius:
                                  "8px",
                                cursor:
                                  "pointer",
                                marginRight:
                                  "6px",
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              style={{
                                border:
                                  "none",
                                background:
                                  "#fee2e2",
                                color:
                                  "#991b1b",
                                padding:
                                  "8px 12px",
                                borderRadius:
                                  "8px",
                                cursor:
                                  "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {showModal && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(15, 23, 42, 0.55)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding:
              "20px",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width:
                "min(650px, 100%)",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
              background:
                "#ffffff",
              borderRadius:
                "18px",
              padding:
                "26px",
              boxSizing:
                "border-box",
              boxShadow:
                "0 25px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                marginBottom:
                  "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      "0 0 5px",
                  }}
                >
                  {editingId
                    ? "Edit Timetable"
                    : "Add Timetable"}
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      "#64748b",
                    fontSize:
                      "14px",
                  }}
                >
                  Configure the
                  class schedule.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                style={{
                  border:
                    "none",
                  background:
                    "#f1f5f9",
                  width:
                    "38px",
                  height:
                    "38px",
                  borderRadius:
                    "50%",
                  cursor:
                    "pointer",
                  fontSize:
                    "20px",
                }}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >
              {/* SECTION */}

              <div
                className="form-group"
                style={{
                  marginBottom:
                    "15px",
                }}
              >
                <label>
                  Section *
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
                  style={{
                    width:
                      "100%",
                    padding:
                      "12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "10px",
                    boxSizing:
                      "border-box",
                    background:
                      "#fff",
                  }}
                >
                  <option value="">
                    Select Section
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

              {/* ROOM */}

              <div
                className="form-group"
                style={{
                  marginBottom:
                    "15px",
                }}
              >
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
                  style={{
                    width:
                      "100%",
                    padding:
                      "12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "10px",
                    boxSizing:
                      "border-box",
                    background:
                      "#fff",
                  }}
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

              {/* DAY */}

              <div
                className="form-group"
                style={{
                  marginBottom:
                    "15px",
                }}
              >
                <label>
                  Day *
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
                  style={{
                    width:
                      "100%",
                    padding:
                      "12px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "10px",
                    boxSizing:
                      "border-box",
                    background:
                      "#fff",
                  }}
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
                        {
                          day.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* TIMES */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap:
                    "14px",
                }}
              >
                <div
                  className="form-group"
                >
                  <label>
                    Start Time *
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
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "10px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </div>

                <div
                  className="form-group"
                >
                  <label>
                    End Time *
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
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "10px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </div>
              </div>

              {/* DATES */}

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap:
                    "14px",
                  marginTop:
                    "15px",
                }}
              >
                <div
                  className="form-group"
                >
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
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "10px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </div>

                <div
                  className="form-group"
                >
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
                    style={{
                      width:
                        "100%",
                      padding:
                        "12px",
                      border:
                        "1px solid #d1d5db",
                      borderRadius:
                        "10px",
                      boxSizing:
                        "border-box",
                    }}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop:
                      "15px",
                    background:
                      "#fee2e2",
                    color:
                      "#991b1b",
                    padding:
                      "10px 12px",
                    borderRadius:
                      "8px",
                    fontSize:
                      "14px",
                  }}
                >
                  {error}
                </div>
              )}

              {/* BUTTONS */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "10px",
                  marginTop:
                    "24px",
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  style={{
                    border:
                      "1px solid #d1d5db",
                    background:
                      "#fff",
                    padding:
                      "11px 18px",
                    borderRadius:
                      "9px",
                    cursor:
                      "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="sign-in-button"
                  style={{
                    width:
                      "auto",
                    padding:
                      "11px 20px",
                    cursor:
                      "pointer",
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}