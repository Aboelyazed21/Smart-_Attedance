import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import { useNavigate } from "react-router-dom";
  
  import {
    getRooms,
    createRoom,
    updateRoom,
    deleteRoom,
  } from "../../services/api";
  
  function Rooms() {
    const navigate = useNavigate();
  
    /* =========================================================
       STATE
    ========================================================= */
  
    const [rooms, setRooms] =
      useState([]);
  
    const [loading, setLoading] =
      useState(true);
  
    const [saving, setSaving] =
      useState(false);
  
    const [search, setSearch] =
      useState("");
  
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
      capacity: 100,
      latitude: "",
      longitude: "",
    });
  
    /* =========================================================
       USER
    ========================================================= */
  
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
      user?.first_name || "Admin";
  
    const lastName =
      user?.last_name || "";
  
    /* =========================================================
       LOAD ROOMS
    ========================================================= */
  
    const loadRooms = async () => {
      try {
        setLoading(true);
        setError("");
  
        const data =
          await getRooms();
  
        setRooms(
          Array.isArray(data)
            ? data
            : []
        );
  
      } catch (err) {
        console.error(
          "Rooms load error:",
          err
        );
  
        setError(
          err.message ||
          "Failed to load rooms"
        );
  
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      loadRooms();
    }, []);
  
    /* =========================================================
       SEARCH
    ========================================================= */
  
    const filteredRooms =
      useMemo(() => {
        const value =
          search
            .trim()
            .toLowerCase();
  
        if (!value) {
          return rooms;
        }
  
        return rooms.filter(
          (room) => {
            const text = [
              room.building,
              room.room_name,
              room.room_type,
              room.capacity,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
  
            return text.includes(value);
          }
        );
      }, [rooms, search]);
  
    /* =========================================================
       INPUT
    ========================================================= */
  
    const handleInputChange = (
      e
    ) => {
      const {
        name,
        value,
      } = e.target;
  
      setForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    };
  
    /* =========================================================
       CREATE
    ========================================================= */
  
    const openCreateModal = () => {
      setEditingRoom(null);
  
      setForm({
        building: "",
        roomName: "",
        roomType: "classroom",
        capacity: 100,
        latitude: "",
        longitude: "",
      });
  
      setError("");
      setShowModal(true);
    };
  
    /* =========================================================
       EDIT
    ========================================================= */
  
    const openEditModal = (
      room
    ) => {
      setEditingRoom(room);
  
      setForm({
        building:
          room.building || "",
  
        roomName:
          room.room_name || "",
  
        roomType:
          room.room_type ||
          "classroom",
  
        capacity:
          room.capacity || 100,
  
        latitude:
          room.latitude ?? "",
  
        longitude:
          room.longitude ?? "",
      });
  
      setError("");
      setShowModal(true);
    };
  
    /* =========================================================
       CLOSE
    ========================================================= */
  
    const closeModal = () => {
      if (saving) {
        return;
      }
  
      setShowModal(false);
      setEditingRoom(null);
    };
  
    /* =========================================================
       SAVE
    ========================================================= */
  
    const handleSubmit = async (
      e
    ) => {
      e.preventDefault();
  
      if (
        !form.building.trim()
      ) {
        alert(
          "Please enter building."
        );
        return;
      }
  
      if (
        !form.roomName.trim()
      ) {
        alert(
          "Please enter room name."
        );
        return;
      }
  
      if (
        !form.capacity ||
        Number(form.capacity) <= 0
      ) {
        alert(
          "Capacity must be greater than 0."
        );
        return;
      }
  
      try {
        setSaving(true);
        setError("");
  
        const payload = {
          building:
            form.building.trim(),
  
          roomName:
            form.roomName.trim(),
  
          roomType:
            form.roomType,
  
          capacity:
            Number(form.capacity),
  
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
  
        alert(
          err.message ||
          "Failed to save room"
        );
  
      } finally {
        setSaving(false);
      }
    };
  
    /* =========================================================
       DELETE
    ========================================================= */
  
    const handleDelete = async (
      room
    ) => {
      const confirmed =
        window.confirm(
          `Are you sure you want to delete "${room.room_name}"?`
        );
  
      if (!confirmed) {
        return;
      }
  
      try {
        await deleteRoom(
          room.id
        );
  
        await loadRooms();
  
      } catch (err) {
        console.error(
          "Delete room error:",
          err
        );
  
        alert(
          err.message ||
          "Failed to delete room"
        );
      }
    };
  
    /* =========================================================
       LOGOUT
    ========================================================= */
  
    const handleLogout = () => {
      localStorage.removeItem(
        "token"
      );
  
      localStorage.removeItem(
        "user"
      );
  
      navigate("/");
    };
  
    /* =========================================================
       ROOM TYPE LABEL
    ========================================================= */
  
    const getRoomTypeLabel = (
      type
    ) => {
      switch (type) {
        case "lab":
          return "Laboratory";
  
        case "hall":
          return "Hall";
  
        case "classroom":
          return "Classroom";
  
        default:
          return type || "-";
      }
    };
  
    /* =========================================================
       RENDER
    ========================================================= */
  
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
  
              <h2>
                Attendify
              </h2>
  
              <span>
                SMART ATTENDANCE
              </span>
  
            </div>
  
          </div>
  
          {/* PROFILE */}
  
          <div className="sidebar-profile">
  
            <div className="profile-avatar">
  
              {firstName
                .charAt(0)
                .toUpperCase()}
  
            </div>
  
            <div className="profile-info">
  
              <strong>
                {firstName} {lastName}
              </strong>
  
              <span>
                System Administrator
              </span>
  
            </div>
  
          </div>
  
          {/* NAVIGATION */}
  
          <nav className="dashboard-nav">
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              <span>▦</span>
              Dashboard
            </button>
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/users"
                )
              }
            >
              <span>👥</span>
              Users
            </button>
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/courses"
                )
              }
            >
              <span>📚</span>
              Courses
            </button>
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/sections"
                )
              }
            >
              <span>▤</span>
              Sections
            </button>
  
            <button
              className="nav-item active"
            >
              <span>🏫</span>
              Rooms
            </button>
  
            <button className="nav-item">
              <span>🗓</span>
              Timetable
            </button>
  
            <button className="nav-item">
              <span>✓</span>
              Attendance
            </button>
  
            <button className="nav-item">
              <span>▥</span>
              Reports
            </button>
  
            <button className="nav-item">
              <span>⚙</span>
              Settings
            </button>
  
          </nav>
  
          {/* LOGOUT */}
  
          <div className="sidebar-bottom">
  
            <button
              className="nav-item logout-button"
              onClick={
                handleLogout
              }
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
  
              <h1>
                Rooms
              </h1>
  
              <p>
                Manage classrooms,
                labs and halls
              </p>
  
            </div>
  
            <div className="dashboard-user">
  
              <div className="header-avatar">
  
                {firstName
                  .charAt(0)
                  .toUpperCase()}
  
              </div>
  
            </div>
  
          </header>
  
          {/* CONTENT */}
  
          <section className="dashboard-content">
  
            <div className="dashboard-panel users-panel">
  
              {/* TOOLBAR */}
  
              <div className="users-toolbar">
  
                <div>
  
                  <h2>
                    Rooms Management
                  </h2>
  
                  <p>
                    Manage campus rooms
                    and their capacities.
                  </p>
  
                </div>
  
                <button
                  className="professional-save-button"
                  onClick={
                    openCreateModal
                  }
                >
                  + Add Room
                </button>
  
              </div>
  
              {/* SEARCH */}
  
              <div className="users-search">
  
                <span>
                  🔍
                </span>
  
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />
  
              </div>
  
              {/* ERROR */}
  
              {error && (
                <div
                  style={{
                    padding:
                      "14px",
                    marginBottom:
                      "15px",
                    borderRadius:
                      "10px",
                    background:
                      "#fff1f2",
                    color:
                      "#b91c1c",
                  }}
                >
                  {error}
                </div>
              )}
  
              {/* LOADING */}
  
              {loading ? (
  
                <div className="users-loading">
                  Loading rooms...
                </div>
  
              ) : filteredRooms.length === 0 ? (
  
                <div className="users-empty">
  
                  <div
                    style={{
                      fontSize:
                        "42px",
                      marginBottom:
                        "12px",
                    }}
                  >
                    🏫
                  </div>
  
                  <h3>
                    No rooms found
                  </h3>
  
                  <p>
                    {search
                      ? "Try another search."
                      : "Create your first room."}
                  </p>
  
                </div>
  
              ) : (
  
                <div className="users-table-wrapper">
  
                  <table className="users-table">
  
                    <thead>
  
                      <tr>
  
                        <th>
                          Building
                        </th>
  
                        <th>
                          Room
                        </th>
  
                        <th>
                          Type
                        </th>
  
                        <th>
                          Capacity
                        </th>
  
                        <th>
                          Location
                        </th>
  
                        <th>
                          Actions
                        </th>
  
                      </tr>
  
                    </thead>
  
                    <tbody>
  
                      {filteredRooms.map(
                        (room) => (
  
                          <tr
                            key={
                              room.id
                            }
                          >
  
                            {/* BUILDING */}
  
                            <td>
  
                              <div className="user-cell">
  
                                <div className="user-table-avatar">
                                  🏫
                                </div>
  
                                <div>
  
                                  <strong>
                                    {
                                      room.building
                                    }
                                  </strong>
  
                                  <span>
                                    Campus
                                  </span>
  
                                </div>
  
                              </div>
  
                            </td>
  
                            {/* ROOM */}
  
                            <td>
  
                              <strong>
                                {
                                  room.room_name
                                }
                              </strong>
  
                            </td>
  
                            {/* TYPE */}
  
                            <td>
  
                              <span>
                                {
                                  getRoomTypeLabel(
                                    room.room_type
                                  )
                                }
                              </span>
  
                            </td>
  
                            {/* CAPACITY */}
  
                            <td>
  
                              <strong>
                                {
                                  room.capacity
                                }
                              </strong>
  
                              <span
                                style={{
                                  marginLeft:
                                    "5px",
                                  color:
                                    "#64748b",
                                }}
                              >
                                seats
                              </span>
  
                            </td>
  
                            {/* LOCATION */}
  
                            <td>
  
                              {room.latitude !==
                                null &&
                              room.longitude !==
                                null
                                ? (
                                  <span>
                                    📍{" "}
                                    {
                                      room.latitude
                                    }
                                    ,{" "}
                                    {
                                      room.longitude
                                    }
                                  </span>
                                )
                                : (
                                  <span
                                    style={{
                                      color:
                                        "#94a3b8",
                                    }}
                                  >
                                    Not set
                                  </span>
                                )}
  
                            </td>
  
                            {/* ACTIONS */}
  
                            <td>
  
                              <div className="user-actions">
  
                                <button
                                  className="action-button edit-button"
                                  onClick={() =>
                                    openEditModal(
                                      room
                                    )
                                  }
                                >
                                  Edit
                                </button>
  
                                <button
                                  className="action-button delete-button"
                                  onClick={() =>
                                    handleDelete(
                                      room
                                    )
                                  }
                                >
                                  Delete
                                </button>
  
                              </div>
  
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
  
          <div className="modal-overlay">
  
            <div className="user-modal">
  
              {/* HEADER */}
  
              <div className="modal-header">
  
                <div>
  
                  <h2>
                    {editingRoom
                      ? "Edit Room"
                      : "Add Room"}
                  </h2>
  
                  <p>
                    {editingRoom
                      ? "Update room information"
                      : "Create a new campus room"}
                  </p>
  
                </div>
  
                <button
                  className="modal-close"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  ×
                </button>
  
              </div>
  
              {/* FORM */}
  
              <form
                className="user-form"
                onSubmit={
                  handleSubmit
                }
              >
  
                {/* BUILDING */}
  
                <div className="form-group">
  
                  <label>
                    Building
                  </label>
  
                  <input
                    type="text"
                    name="building"
                    placeholder="Example: Building A"
                    value={
                      form.building
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
  
                </div>
  
                {/* ROOM NAME */}
  
                <div className="form-group">
  
                  <label>
                    Room Name
                  </label>
  
                  <input
                    type="text"
                    name="roomName"
                    placeholder="Example: LAB-1"
                    value={
                      form.roomName
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />
  
                </div>
  
                {/* TYPE + CAPACITY */}
  
                <div className="form-row">
  
                  <div className="form-group">
  
                    <label>
                      Room Type
                    </label>
  
                    <select
                      name="roomType"
                      value={
                        form.roomType
                      }
                      onChange={
                        handleInputChange
                      }
                      required
                    >
  
                      <option value="classroom">
                        Classroom
                      </option>
  
                      <option value="lab">
                        Laboratory
                      </option>
  
                      <option value="hall">
                        Hall
                      </option>
  
                    </select>
  
                  </div>
  
                  <div className="form-group">
  
                    <label>
                      Capacity
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
  
                {/* LATITUDE */}
  
                <div className="form-row">
  
                  <div className="form-group">
  
                    <label>
                      Latitude
                      <span
                        className="optional-label"
                      >
                        {" "}
                        Optional
                      </span>
                    </label>
  
                    <input
                      type="number"
                      name="latitude"
                      step="0.0000001"
                      placeholder="Example: 31.0409"
                      value={
                        form.latitude
                      }
                      onChange={
                        handleInputChange
                      }
                    />
  
                  </div>
  
                  {/* LONGITUDE */}
  
                  <div className="form-group">
  
                    <label>
                      Longitude
                      <span
                        className="optional-label"
                      >
                        {" "}
                        Optional
                      </span>
                    </label>
  
                    <input
                      type="number"
                      name="longitude"
                      step="0.0000001"
                      placeholder="Example: 31.3785"
                      value={
                        form.longitude
                      }
                      onChange={
                        handleInputChange
                      }
                    />
  
                  </div>
  
                </div>
  
                {/* ACTIONS */}
  
                <div className="modal-actions">
  
                  <button
                    type="button"
                    className="professional-cancel-button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>
  
                  <button
                    type="submit"
                    className="professional-save-button"
                    disabled={saving}
                  >
  
                    {saving
                      ? "Saving..."
                      : editingRoom
                      ? "Update Room"
                      : "Create Room"}
  
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