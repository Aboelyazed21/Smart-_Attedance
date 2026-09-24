import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../../services/api";

import "./Rooms.css";
import { useLanguage } from "../../utils/i18n";


/* =========================================================
   ICON
========================================================= */

function Icon({
  name,
  size = 20,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "courses":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
        </svg>
      );

    case "sections":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h10" />
          <path d="M7 16h6" />
        </svg>
      );

    case "rooms":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" />
          <path d="M16 8h3a2 2 0 0 1 2 2v11" />
          <path d="M9 7h3" />
          <path d="M9 11h3" />
          <path d="M9 15h3" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
          <path d="M8 18h.01" />
          <path d="M12 18h.01" />
        </svg>
      );

    case "attendance":
      return (
        <svg {...common}>
          <path d="m9 11 3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );

    case "reports":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h17" />
          <path d="m7 15 4-4 3 2 5-6" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.4h.84A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06A1.7 1.7 0 0 0 11.64 6a1.7 1.7 0 0 0 1.03-1.56V4h2.4v.44A1.7 1.7 0 0 0 16.1 6a1.7 1.7 0 0 0 1.88.34l.06-.06 1.7 1.7-.06.06A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.56 1.03H21v2.4h-.04A1.7 1.7 0 0 0 19.4 15Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      );

    case "building":
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v17" />
          <path d="M15 9h3a1 1 0 0 1 1 1v11" />
          <path d="M8 7h3" />
          <path d="M8 11h3" />
          <path d="M8 15h3" />
        </svg>
      );

    case "door":
      return (
        <svg {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 21V7a2 2 0 0 1 2-2h8" />
          <circle cx="15" cy="12" r=".8" fill="currentColor" stroke="none" />
        </svg>
      );

    case "capacity":
      return (
        <svg {...common}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M16 14a5 5 0 0 1 5 5v2" />
        </svg>
      );

    case "classroom":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );

    case "lab":
      return (
        <svg {...common}>
          <path d="M9 3h6" />
          <path d="M10 3v6l-5 9a2 2 0 0 0 1.75 3h10.5A2 2 0 0 0 19 18l-5-9V3" />
          <path d="M8 15h8" />
        </svg>
      );

    case "location":
      return (
        <svg {...common}>
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 15H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.9-4" />
          <path d="M4 4v5h5" />
          <path d="M4 13a8 8 0 0 0 14.9 4" />
          <path d="M20 20v-5h-5" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </svg>
      );

    default:
      return null;
  }
}


/* =========================================================
   ROOM TYPE
========================================================= */

function getRoomTypeLabel(type, t) {
  const tr = typeof t === "function" ? t : (key) => key;
  switch (type) {
    case "lab":
      return tr("rooms.typeLaboratory");
    case "hall":
      return tr("rooms.typeHall");
    case "classroom":
      return tr("rooms.typeClassroom");
    default:
      return type || tr("rooms.typeUnknown");
  }
}


/* =========================================================
   ROOM TYPE ICON
========================================================= */

function RoomTypeIcon({
  type,
}) {
  if (type === "lab") {
    return <Icon name="lab" size={15} />;
  }

  if (type === "classroom") {
    return <Icon name="classroom" size={15} />;
  }

  return <Icon name="building" size={15} />;
}


/* =========================================================
   MAIN
========================================================= */

function Rooms() {
  const { t } = useLanguage();

  /* =======================================================
     STATE
  ======================================================= */

  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [buildingFilter, setBuildingFilter] =
    useState("all");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [locationFilter, setLocationFilter] =
    useState("all");

  const [activeBuilding, setActiveBuilding] =
    useState("all");

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingRoom, setEditingRoom] =
    useState(null);

  const [form, setForm] = useState({
    building: "",
    roomName: "",
    roomType: "classroom",
    capacity: 40,
    latitude: "",
    longitude: "",
  });

  /* =======================================================
     USER
  ======================================================= */

  const [user] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user")
      );
    } catch {
      return null;
    }
  });

  const firstName =
    user?.first_name ||
    user?.firstName ||
    "Admin";

  const lastName =
    user?.last_name ||
    user?.lastName ||
    "";

  const displayName =
    `${firstName} ${lastName}`.trim();


  /* =======================================================
     LOAD ROOMS
  ======================================================= */

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError("");

      const data =
        await getRooms();

      const normalized =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.rooms)
            ? data.rooms
            : Array.isArray(data?.data)
              ? data.data
              : [];

      setRooms(normalized);

    } catch (err) {
      console.error(
        "Rooms load error:",
        err
      );

      setError(
        err?.message ||
        t("rooms.failed_to_load_rooms")
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadRooms();
  }, []);


  /* =======================================================
     OPTIONS
  ======================================================= */

  const buildings = useMemo(() => {
    return [
      ...new Set(
        rooms
          .map(
            (room) =>
              room.building
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [rooms]);


  const roomTypes = useMemo(() => {
    return [
      ...new Set(
        rooms
          .map(
            (room) =>
              room.room_type
          )
          .filter(Boolean)
      ),
    ];
  }, [rooms]);


  const locationOptions = useMemo(() => {
    const locations =
      rooms
        .map((room) => {
          if (
            room.latitude !== null &&
            room.latitude !== undefined &&
            room.longitude !== null &&
            room.longitude !== undefined
          ) {
            return "set";
          }

          return "not-set";
        });

    return [
      ...new Set(locations),
    ];
  }, [rooms]);


  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    const totalCapacity =
      rooms.reduce(
        (sum, room) =>
          sum +
          Number(room.capacity || 0),
        0
      );

    const classroomCount =
      rooms.filter(
        (room) =>
          room.room_type ===
          "classroom"
      ).length;

    const laboratoryCount =
      rooms.filter(
        (room) =>
          room.room_type ===
          "lab"
      ).length;

    const hallCount =
      rooms.filter(
        (room) =>
          room.room_type ===
          "hall"
      ).length;

    return {
      totalBuildings:
        buildings.length,

      totalRooms:
        rooms.length,

      totalCapacity,

      classroomCount,

      laboratoryCount,

      hallCount,

      averageCapacity:
        rooms.length
          ? Math.round(
              totalCapacity /
                rooms.length
            )
          : 0,
    };
  }, [
    rooms,
    buildings,
  ]);


  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRooms =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return rooms.filter(
        (room) => {
          const matchesSearch =
            !value ||
            [
              room.building,
              room.room_name,
              room.room_type,
              room.capacity,
            ]
              .filter(
                (item) =>
                  item !==
                  null &&
                  item !==
                  undefined
              )
              .join(" ")
              .toLowerCase()
              .includes(value);

          const matchesBuilding =
            buildingFilter ===
              "all" ||
            room.building ===
              buildingFilter;

          const matchesType =
            typeFilter ===
              "all" ||
            room.room_type ===
              typeFilter;

          const hasLocation =
            room.latitude !==
              null &&
            room.latitude !==
              undefined &&
            room.longitude !==
              null &&
            room.longitude !==
              undefined;

          const matchesLocation =
            locationFilter ===
              "all" ||
            (
              locationFilter ===
                "set" &&
              hasLocation
            ) ||
            (
              locationFilter ===
                "not-set" &&
              !hasLocation
            );

          const matchesTab =
            activeBuilding ===
              "all" ||
            room.building ===
              activeBuilding;

          return (
            matchesSearch &&
            matchesBuilding &&
            matchesType &&
            matchesLocation &&
            matchesTab
          );
        }
      );
    }, [
      rooms,
      search,
      buildingFilter,
      typeFilter,
      locationFilter,
      activeBuilding,
    ]);


  /* =======================================================
     RECENT ROOMS
  ======================================================= */

  const recentRooms =
    useMemo(() => {
      return [
        ...rooms,
      ].sort(
        (a, b) =>
          Number(b.id || 0) -
          Number(a.id || 0)
      ).slice(0, 3);
    }, [rooms]);


  /* =======================================================
     INPUT
  ======================================================= */

  const handleInputChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );
    };


  /* =======================================================
     CREATE MODAL
  ======================================================= */

  const openCreateModal =
    () => {
      setEditingRoom(null);

      setForm({
        building:
          buildings[0] ||
          "",
        roomName: "",
        roomType:
          "classroom",
        capacity: 40,
        latitude: "",
        longitude: "",
      });

      setError("");
      setShowModal(true);
    };


  /* =======================================================
     EDIT MODAL
  ======================================================= */

  const openEditModal =
    (room) => {
      setEditingRoom(room);

      setForm({
        building:
          room.building ||
          "",

        roomName:
          room.room_name ||
          "",

        roomType:
          room.room_type ||
          "classroom",

        capacity:
          room.capacity ||
          40,

        latitude:
          room.latitude ??
          "",

        longitude:
          room.longitude ??
          "",
      });

      setError("");
      setShowModal(true);
    };


  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal =
    () => {
      if (saving) {
        return;
      }

      setShowModal(false);
      setEditingRoom(null);
    };


  /* =======================================================
     SAVE ROOM
  ======================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const building =
        form.building.trim();

      const roomName =
        form.roomName.trim();

      const capacity =
        Number(form.capacity);

      if (!building) {
        setError(
          t("rooms.please_enter_a_building_name")
        );
        return;
      }

      if (!roomName) {
        setError(
          t("rooms.please_enter_a_room_name")
        );
        return;
      }

      if (
        !capacity ||
        capacity <= 0
      ) {
        setError(
          t("rooms.capacity_must_be_greater_than_0")
        );
        return;
      }

      try {
        setSaving(true);
        setError("");

        const payload = {
          building,

          roomName,

          roomType:
            form.roomType,

          capacity,

          latitude:
            form.latitude === ""
              ? null
              : Number(
                  form.latitude
                ),

          longitude:
            form.longitude === ""
              ? null
              : Number(
                  form.longitude
                ),
        };

        if (editingRoom) {
          await updateRoom(
            editingRoom.id,
            payload
          );
        } else {
          await createRoom(
            payload
          );
        }

        await loadRooms();

        setShowModal(false);
        setEditingRoom(null);

      } catch (err) {
        console.error(
          "Save room error:",
          err
        );

        setError(
          err?.message ||
          t("rooms.failed_to_save_room")
        );

      } finally {
        setSaving(false);
      }
    };


  /* =======================================================
     DELETE
  ======================================================= */

  const handleDelete =
    async (room) => {
      const confirmed =
        window.confirm(
          t("rooms.confirmDelete").replace("{name}", room.room_name)
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(
          room.id
        );

        setError("");

        await deleteRoom(
          room.id
        );

        await loadRooms();

      } catch (err) {
        console.error(
          "Delete room error:",
          err
        );

        setError(
          err?.message ||
          t("rooms.failed_to_delete_room")
        );

      } finally {
        setDeletingId(null);
      }
    };


  /* =======================================================
     RESET FILTERS
  ======================================================= */

  const resetFilters =
    () => {
      setSearch("");
      setBuildingFilter("all");
      setTypeFilter("all");
      setLocationFilter("all");
      setActiveBuilding("all");
    };
  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="rooms-page">
{/* ===================================================
          MAIN
      =================================================== */}

      <main className="rooms-main">

        {/* HEADER */}

        <header className="rooms-header">

          <div className="rooms-breadcrumb">
            <span>
              {t("rooms.home")}
            </span>

            <Icon
              name="chevron"
              size={14}
            />

            <strong>
              {t("rooms.rooms")}
            </strong>
          </div>


          <div className="rooms-header-row">

            <div>

              <h1>
                {t("rooms.rooms")}
              </h1>

              <p>
                {t("rooms.manage_classrooms_labs_and_halls_across")}
              </p>

            </div>


            <div className="rooms-header-actions">

              <button
                className="header-icon-button"
                title={t("rooms.search")}
                onClick={() =>
                  document
                    .getElementById(
                      "rooms-search-input"
                    )
                    ?.focus()
                }
              >
                <Icon
                  name="search"
                />
              </button>


              <button
                className="header-icon-button notification-button"
                title={t("rooms.notifications")}
              >
                <Icon
                  name="bell"
                />

                <span>
                  3
                </span>
              </button>


              <div className="header-admin">

                <div className="header-admin-avatar">
                  {firstName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>

                  <strong>
                    {displayName}
                  </strong>

                  <span>
                    {t("rooms.administrator")}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <section className="rooms-content">


          {/* ===============================================
              ERROR
          =============================================== */}

          {error && !showModal && (
            <div className="rooms-error">

              <strong>
                {t("rooms.something_went_wrong")}
              </strong>

              <span>
                {error}
              </span>

              <button
                onClick={
                  loadRooms
                }
              >
                <Icon
                  name="refresh"
                  size={15}
                />

                {t("rooms.retry")}
              </button>

            </div>
          )}


          {/* ===============================================
              STAT CARDS
          =============================================== */}

          <div className="rooms-stats-grid">

            <div className="room-stat-card">

              <div className="room-stat-icon blue">
                <Icon
                  name="building"
                />
              </div>

              <div>

                <strong>
                  {stats.totalBuildings}
                </strong>

                <span>
                  {t("rooms.total_buildings")}
                </span>

                <small>
                  {t("rooms.campus_buildings")}
                </small>

              </div>

            </div>


            <div className="room-stat-card">

              <div className="room-stat-icon purple">
                <Icon
                  name="door"
                />
              </div>

              <div>

                <strong>
                  {stats.totalRooms}
                </strong>

                <span>
                  {t("rooms.total_rooms")}
                </span>

                <small>
                  {t("rooms.classrooms_labs")}
                </small>

              </div>

            </div>


            <div className="room-stat-card">

              <div className="room-stat-icon green">
                <Icon
                  name="capacity"
                />
              </div>

              <div>

                <strong>
                  {stats.totalCapacity}
                </strong>

                <span>
                  {t("rooms.total_capacity")}
                </span>

                <small>
                  {t("rooms.across_all_rooms")}
                </small>

              </div>

            </div>


            <div className="room-stat-card">

              <div className="room-stat-icon orange">
                <Icon
                  name="classroom"
                />
              </div>

              <div>

                <strong>
                  {stats.classroomCount}
                </strong>

                <span>
                  {t("rooms.classrooms")}
                </span>

                <small>
                  {t("rooms.regular_classrooms")}
                </small>

              </div>

            </div>


            <div className="room-stat-card">

              <div className="room-stat-icon violet">
                <Icon
                  name="lab"
                />
              </div>

              <div>

                <strong>
                  {stats.laboratoryCount}
                </strong>

                <span>
                  {t("rooms.laboratories")}
                </span>

                <small>
                  {t("rooms.specialized_labs")}
                </small>

              </div>

            </div>

          </div>


          {/* ===============================================
              MAIN MANAGEMENT PANEL
          =============================================== */}

          <section className="rooms-management-card">


            {/* PANEL HEADER */}

            <div className="rooms-management-header">

              <div>

                <h2>
                  {t("rooms.rooms_management")}
                </h2>

                <p>
                  {t("rooms.view_add_edit_and_manage_campus_rooms")}
                </p>

              </div>


              <button
                className="add-room-button"
                onClick={
                  openCreateModal
                }
              >
                <Icon
                  name="plus"
                  size={18}
                />

                {t("rooms.add_room")}
              </button>

            </div>


            {/* FILTER BAR */}

            <div className="rooms-filter-bar">

              <div className="rooms-search-box">

                <Icon
                  name="search"
                  size={18}
                />

                <input
                  id="rooms-search-input"
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder={t("rooms.search_by_room_name_building_or_type")}
                />

                {search && (
                  <button
                    className="clear-search"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>
                )}

              </div>


              <select
                value={
                  buildingFilter
                }
                onChange={(event) =>
                  setBuildingFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  {t("rooms.all_buildings")}
                </option>

                {buildings.map(
                  (building) => (
                    <option
                      key={building}
                      value={building}
                    >
                      {building}
                    </option>
                  )
                )}

              </select>


              <select
                value={
                  typeFilter
                }
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  {t("rooms.all_types")}
                </option>

                {roomTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {getRoomTypeLabel(type, t)}
                    </option>
                  )
                )}

              </select>


              <select
                value={
                  locationFilter
                }
                onChange={(event) =>
                  setLocationFilter(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  {t("rooms.all_locations")}
                </option>

                <option value="set">
                  {t("rooms.location_set")}
                </option>

                <option value="not-set">
                  {t("rooms.location_not_set")}
                </option>

              </select>


              <button
                className="reset-filter-button"
                onClick={
                  resetFilters
                }
              >
                <Icon
                  name="refresh"
                  size={16}
                />

                {t("rooms.reset")}
              </button>

            </div>


            {/* BUILDING TABS */}

            <div className="rooms-tabs">

              <button
                className={
                  activeBuilding ===
                  "all"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveBuilding(
                    "all"
                  )
                }
              >
                {t("rooms.all_rooms")}

                <span>
                  {rooms.length}
                </span>
              </button>


              {buildings.map(
                (building) => {
                  const count =
                    rooms.filter(
                      (room) =>
                        room.building ===
                        building
                    ).length;

                  return (
                    <button
                      key={
                        building
                      }
                      className={
                        activeBuilding ===
                        building
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveBuilding(
                          building
                        )
                      }
                    >
                      {building}

                      <span>
                        {count}
                      </span>
                    </button>
                  );
                }
              )}

            </div>


            {/* TABLE */}

            <div className="rooms-table-container">

              {loading ? (

                <div className="rooms-loading">

                  <div className="rooms-spinner" />

                  <strong>
                    {t("rooms.loading_rooms")}
                  </strong>

                  <span>
                    {t("rooms.fetching_campus_room_data")}
                  </span>

                </div>

              ) : filteredRooms.length === 0 ? (

                <div className="rooms-empty">

                  <div className="rooms-empty-icon">
                    <Icon
                      name="rooms"
                      size={30}
                    />
                  </div>

                  <h3>
                    {t("rooms.no_rooms_found")}
                  </h3>

                  <p>
                    {search ||
                    buildingFilter !==
                      "all" ||
                    typeFilter !==
                      "all"
                      ? t("rooms.try_changing_your_filters")
                      : t("rooms.create_your_first_campus_room")}
                  </p>

                  <button
                    onClick={
                      search ||
                      buildingFilter !==
                        "all" ||
                      typeFilter !==
                        "all"
                        ? resetFilters
                        : openCreateModal
                    }
                  >
                    {search ||
                    buildingFilter !==
                      "all" ||
                    typeFilter !==
                      "all"
                      ? t("rooms.reset_filters")
                      : t("rooms.add_room")}
                  </button>

                </div>

              ) : (

                <table className="rooms-table">

                  <thead>

                    <tr>

                      <th className="check-column">
                        <input
                          type="checkbox"
                          aria-label={t("rooms.select_all_rooms")}
                        />
                      </th>

                      <th>
                        #
                      </th>

                      <th>
                        {t("rooms.room")}
                      </th>

                      <th>
                        {t("rooms.building")}
                      </th>

                      <th>
                        {t("rooms.type")}
                      </th>

                      <th>
                        {t("rooms.capacity")}
                      </th>

                      <th>
                        {t("rooms.location")}
                      </th>

                      <th>
                        {t("rooms.status")}
                      </th>

                      <th>
                        {t("rooms.actions")}
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredRooms.map(
                      (room, index) => {

                        const hasLocation =
                          room.latitude !==
                            null &&
                          room.latitude !==
                            undefined &&
                          room.longitude !==
                            null &&
                          room.longitude !==
                            undefined;

                        return (
                          <tr
                            key={
                              room.id
                            }
                          >

                            <td className="check-column">
                              <input
                                type="checkbox"
                                aria-label={t("rooms.selectRoom").replace("{name}", room.room_name)}
                              />
                            </td>


                            <td className="index-cell">
                              {index + 1}
                            </td>


                            {/* ROOM */}

                            <td>

                              <div className="room-name-cell">

                                <div
                                  className={
                                    `room-thumbnail ${
                                      room.room_type ===
                                      "lab"
                                        ? "lab-thumb"
                                        : room.room_type ===
                                          "classroom"
                                        ? "class-thumb"
                                        : "hall-thumb"
                                    }`
                                  }
                                >
                                  <RoomTypeIcon
                                    type={
                                      room.room_type
                                    }
                                  />
                                </div>


                                <div>

                                  <strong>
                                    {
                                      room.room_name
                                    }
                                  </strong>

                                  <span>
                                    <RoomTypeIcon
                                      type={
                                        room.room_type
                                      }
                                    />

                                    {getRoomTypeLabel(room.room_type, t)}
                                  </span>

                                </div>

                              </div>

                            </td>


                            {/* BUILDING */}

                            <td>

                              <div className="building-cell">

                                <strong>
                                  {
                                    room.building
                                  }
                                </strong>

                                <span>
                                  {t("rooms.campus")}
                                </span>

                              </div>

                            </td>


                            {/* TYPE */}

                            <td>

                              <span
                                className={
                                  `room-type-badge ${
                                    room.room_type
                                  }`
                                }
                              >
                                <RoomTypeIcon
                                  type={
                                    room.room_type
                                  }
                                />

                                {getRoomTypeLabel(room.room_type, t)}
                              </span>

                            </td>


                            {/* CAPACITY */}

                            <td>

                              <div className="capacity-cell">

                                <Icon
                                  name="capacity"
                                  size={17}
                                />

                                <strong>
                                  {
                                    room.capacity
                                  }
                                </strong>

                                <span>
                                  {t("rooms.seats")}
                                </span>

                              </div>

                            </td>


                            {/* LOCATION */}

                            <td>

                              {hasLocation ? (

                                <div className="location-cell">

                                  <Icon
                                    name="location"
                                    size={16}
                                  />

                                  <span>
                                    {Number(
                                      room.latitude
                                    ).toFixed(4)}
                                    ,
                                    {" "}
                                    {Number(
                                      room.longitude
                                    ).toFixed(4)}
                                  </span>

                                </div>

                              ) : (

                                <span className="not-set-location">
                                  {t("rooms.not_set")}
                                </span>

                              )}

                            </td>


                            {/* STATUS */}

                            <td>

                              <span className="room-status available">

                                <i />

                                {t("rooms.available")}

                              </span>

                            </td>


                            {/* ACTIONS */}

                            <td>

                              <div className="room-actions">

                                <button
                                  className="room-action edit"
                                  onClick={() =>
                                    openEditModal(
                                      room
                                    )
                                  }
                                >
                                  <Icon
                                    name="edit"
                                    size={15}
                                  />

                                  {t("rooms.edit")}
                                </button>


                                <button
                                  className="room-action delete"
                                  onClick={() =>
                                    handleDelete(
                                      room
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    room.id
                                  }
                                >

                                  <Icon
                                    name="trash"
                                    size={15}
                                  />

                                  {deletingId ===
                                  room.id
                                    ? t("rooms.deleting")
                                    : t("rooms.delete")}

                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              )}

            </div>


            {/* TABLE FOOTER */}

            {!loading &&
              filteredRooms.length >
                0 && (

                <div className="rooms-table-footer">

                  <span>
                    {t("rooms.showing")}{" "}
                    <strong>
                      1
                    </strong>{" "}
                    {t("rooms.to")}{" "}
                    <strong>
                      {
                        filteredRooms.length
                      }
                    </strong>{" "}
                    {t("rooms.of")}{" "}
                    <strong>
                      {
                        filteredRooms.length
                      }
                    </strong>{" "}
                    {t("rooms.rooms_2")}
                  </span>


                  <div className="rooms-pagination">

                    <button
                      disabled
                    >
                      ‹
                    </button>

                    <button
                      className="current"
                    >
                      1
                    </button>

                    <button
                      disabled
                    >
                      ›
                    </button>

                  </div>

                </div>

              )}

          </section>


          {/* ===============================================
              BOTTOM ANALYTICS
          =============================================== */}

          <div className="rooms-bottom-grid">


            {/* TYPE DISTRIBUTION */}

            <section className="rooms-info-card">

              <div className="rooms-card-title">

                <div>

                  <h3>
                    {t("rooms.room_type_distribution")}
                  </h3>

                  <p>
                    {t("rooms.overview_of_room_types")}
                  </p>

                </div>

              </div>


              <div className="distribution-content">

                <div
                  className="donut-chart"
                  style={{
                    "--classroom":
                      `${stats.classroomCount}`,
                    "--lab":
                      `${stats.laboratoryCount}`,
                    "--hall":
                      `${stats.hallCount}`,
                  }}
                >

                  <div>
                    <strong>
                      {rooms.length}
                    </strong>

                    <span>
                      {t("rooms.rooms")}
                    </span>
                  </div>

                </div>


                <div className="distribution-legend">

                  <div>

                    <span className="legend-dot purple" />

                    <span>
                      {t("rooms.laboratories")}
                    </span>

                    <strong>
                      {stats.laboratoryCount}
                    </strong>

                    <small>
                      {rooms.length
                        ? Math.round(
                            (
                              stats.laboratoryCount /
                              rooms.length
                            ) *
                              100
                          )
                        : 0}
                      %
                    </small>

                  </div>


                  <div>

                    <span className="legend-dot orange" />

                    <span>
                      {t("rooms.classrooms")}
                    </span>

                    <strong>
                      {stats.classroomCount}
                    </strong>

                    <small>
                      {rooms.length
                        ? Math.round(
                            (
                              stats.classroomCount /
                              rooms.length
                            ) *
                              100
                          )
                        : 0}
                      %
                    </small>

                  </div>


                  {stats.hallCount >
                    0 && (

                    <div>

                      <span className="legend-dot blue" />

                      <span>
                        {t("rooms.halls")}
                      </span>

                      <strong>
                        {stats.hallCount}
                      </strong>

                      <small>
                        {Math.round(
                          (
                            stats.hallCount /
                            rooms.length
                          ) *
                            100
                        )}
                        %
                      </small>

                    </div>

                  )}

                </div>

              </div>

            </section>


            {/* CAPACITY */}

            <section className="rooms-info-card">

              <div className="rooms-card-title">

                <div>

                  <h3>
                    {t("rooms.capacity_overview")}
                  </h3>

                  <p>
                    {t("rooms.room_capacity_statistics")}
                  </p>

                </div>

              </div>


              <div className="capacity-overview">

                <div className="capacity-overview-item">

                  <div className="capacity-overview-icon blue">
                    <Icon
                      name="capacity"
                      size={25}
                    />
                  </div>

                  <strong>
                    {stats.totalCapacity}
                  </strong>

                  <span>
                    {t("rooms.total_capacity")}
                  </span>

                  <small>
                    {t("rooms.across_all_rooms")}
                  </small>

                </div>


                <div className="capacity-overview-divider" />


                <div className="capacity-overview-item">

                  <div className="capacity-overview-icon green">
                    <Icon
                      name="reports"
                      size={25}
                    />
                  </div>

                  <strong>
                    {stats.averageCapacity}
                  </strong>

                  <span>
                    {t("rooms.average_capacity")}
                  </span>

                  <small>
                    {t("rooms.per_room")}
                  </small>

                </div>

              </div>

            </section>


            {/* RECENT ROOMS */}

            <section className="rooms-info-card recent-card">

              <div className="rooms-card-title">

                <div>

                  <h3>
                    {t("rooms.recent_rooms")}
                  </h3>

                  <p>
                    {t("rooms.recently_added_rooms")}
                  </p>

                </div>

              </div>


              <div className="recent-rooms-list">

                {recentRooms.length ===
                0 ? (

                  <div className="recent-empty">
                    {t("rooms.no_rooms_yet")}
                  </div>

                ) : (

                  recentRooms.map(
                    (room) => (
                      <div
                        className="recent-room-item"
                        key={
                          room.id
                        }
                      >

                        <div
                          className={
                            `recent-room-thumb ${
                              room.room_type
                            }`
                          }
                        >
                          <RoomTypeIcon
                            type={
                              room.room_type
                            }
                          />
                        </div>


                        <div className="recent-room-info">

                          <strong>
                            {
                              room.room_name
                            }
                          </strong>

                          <span>
                            {
                              room.building
                            }
                            {" "}
                            <span className="recent-room-sep">/</span>{" "}
                            {getRoomTypeLabel(room.room_type, t)}
                          </span>

                        </div>


                        <div className="recent-room-meta">

                          <strong>
                            {
                              room.capacity
                            }{" "}
                            {t("rooms.seats")}
                          </strong>

                          <span>
                            {t("rooms.today")}
                          </span>

                        </div>

                      </div>
                    )
                  )

                )}

              </div>

            </section>

          </div>

        </section>

      </main>


      {/* ===================================================
          MODAL
      =================================================== */}

      {showModal && (

        <div
          className="rooms-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="rooms-modal">

            {/* MODAL HEADER */}

            <div className="rooms-modal-header">

              <div>

                <div className="rooms-modal-icon">
                  <Icon
                    name={
                      editingRoom
                        ? "edit"
                        : "plus"
                    }
                    size={22}
                  />
                </div>

                <div>

                  <h2>
                    {editingRoom
                      ? t("rooms.edit_room")
                      : t("rooms.add_room")}
                  </h2>

                  <p>
                    {editingRoom
                      ? t("rooms.update_room_information")
                      : t("rooms.create_a_new_campus_room")}
                  </p>

                </div>

              </div>


              <button
                className="rooms-modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <Icon
                  name="close"
                  size={18}
                />
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="rooms-form"
            >

              {error && (
                <div className="rooms-form-error">
                  {error}
                </div>
              )}


              {/* BUILDING */}

              <div className="rooms-form-group">

                <label>
                  {t("rooms.building_2")}
                </label>

                <input
                  type="text"
                  name="building"
                  value={
                    form.building
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder={t("rooms.example_building_a")}
                  required
                />

              </div>


              {/* ROOM */}

              <div className="rooms-form-group">

                <label>
                  {t("rooms.room_name")}
                </label>

                <input
                  type="text"
                  name="roomName"
                  value={
                    form.roomName
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder={t("rooms.example_lab_1")}
                  required
                />

              </div>


              {/* TYPE + CAPACITY */}

              <div className="rooms-form-grid">

                <div className="rooms-form-group">

                  <label>
                    {t("rooms.room_type")}
                  </label>

                  <select
                    name="roomType"
                    value={
                      form.roomType
                    }
                    onChange={
                      handleInputChange
                    }
                  >

                    <option value="classroom">
                      {t("rooms.classroom")}
                    </option>

                    <option value="lab">
                      {t("rooms.laboratory")}
                    </option>

                    <option value="hall">
                      {t("rooms.hall")}
                    </option>

                  </select>

                </div>


                <div className="rooms-form-group">

                  <label>
                    {t("rooms.capacity_2")}
                  </label>

                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    max="10000"
                    value={
                      form.capacity
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>

              </div>


              {/* LOCATION */}

              <div className="rooms-location-section">

                <div className="rooms-location-title">

                  <div>

                    <h3>
                      {t("rooms.location_2")}
                    </h3>

                    <span>
                      {t("rooms.optional_gps_coordinates")}
                    </span>

                  </div>

                  <Icon
                    name="location"
                    size={19}
                  />

                </div>


                <div className="rooms-form-grid">

                  <div className="rooms-form-group">

                    <label>
                      {t("rooms.latitude")}
                      <span>
                        {t("rooms.optional")}
                      </span>
                    </label>

                    <input
                      type="number"
                      name="latitude"
                      step="0.0000001"
                      value={
                        form.latitude
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="31.0409"
                    />

                  </div>


                  <div className="rooms-form-group">

                    <label>
                      {t("rooms.longitude")}
                      <span>
                        {t("rooms.optional")}
                      </span>
                    </label>

                    <input
                      type="number"
                      name="longitude"
                      step="0.0000001"
                      value={
                        form.longitude
                      }
                      onChange={
                        handleInputChange
                      }
                      placeholder="31.3785"
                    />

                  </div>

                </div>

              </div>


              {/* ACTIONS */}

              <div className="rooms-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  {t("rooms.cancel")}
                </button>


                <button
                  type="submit"
                  className="modal-save-button"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? (
                      <>
                        <span className="button-spinner" />
                        {t("rooms.saving")}
                      </>
                    )
                    : (
                      <>
                        <Icon
                          name={
                            editingRoom
                              ? "edit"
                              : "plus"
                          }
                          size={17}
                        />

                        {editingRoom
                          ? t("rooms.update_room")
                          : t("rooms.create_room")}
                      </>
                    )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Rooms;