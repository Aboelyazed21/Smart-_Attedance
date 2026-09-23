import { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/api";
import "./Users.css";

function AdminIcon({ name, size = 16 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),

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

    plus: <path d="M12 5v14M5 12h14" />,

    close: <path d="M6 6l12 12M18 6 6 18" />,

    alert: (
      <>
        <path d="M12 4v9" />
        <path d="M12 17h.01" />
        <path d="M10.3 3.7 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3l-7.6-13.3a2 2 0 0 0-3.4 0z" />
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

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
    status: "active",
  });

  /* =========================================================
     LOAD USERS
  ========================================================= */

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Users error:", err);

      setError(
        err.message || "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      const fullName =
        `${user.first_name || ""} ${
          user.last_name || ""
        }`.toLowerCase();

      const email =
        (user.email || "").toLowerCase();

      const role =
        (user.role || "").toLowerCase();

      const phone =
        (user.phone || "").toLowerCase();

      return (
        fullName.includes(value) ||
        email.includes(value) ||
        role.includes(value) ||
        phone.includes(value)
      );
    });
  }, [users, search]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  function openCreateModal() {
    setEditingUser(null);

    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "student",
      phone: "",
      status: "active",
    });

    setError("");
    setShowModal(true);
  }

  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  function openEditModal(user) {
    setEditingUser(user);

    setForm({
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      password: "",
      role: user.role || "student",
      phone: user.phone || "",
      status: user.status || "active",
    });

    setError("");
    setShowModal(true);
  }

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
  }

  /* =========================================================
     SAVE USER
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingUser) {
        await updateUser(
          editingUser.id,
          form
        );
      } else {
        await createUser({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone,
        });
      }

      setShowModal(false);
      setEditingUser(null);

      await loadUsers();
    } catch (err) {
      console.error("Save user error:", err);

      setError(
        err.message || "Failed to save user"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE USER
  ========================================================= */

  async function handleDeleteUser(user) {
    const fullName =
      `${user.first_name || ""} ${
        user.last_name || ""
      }`.trim();

    const confirmed = window.confirm(
      `Are you sure you want to delete ${
        fullName || user.email
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteUser(user.id);

      setUsers((previous) =>
        previous.filter(
          (item) => item.id !== user.id
        )
      );
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      setError(
        err.message ||
          "Failed to delete user"
      );
    }
  }

  /* =========================================================
     ROLE STYLE
  ========================================================= */

  function getRoleClass(role) {
    const normalized =
      (role || "").toLowerCase();

    if (normalized === "admin") {
      return "role-badge role-admin";
    }

    if (normalized === "lecturer") {
      return "role-badge role-lecturer";
    }

    if (normalized === "ta") {
      return "role-badge role-ta";
    }

    if (normalized === "student") {
      return "role-badge role-student";
    }

    if (normalized === "auditor") {
      return "role-badge role-auditor";
    }

    return "role-badge";
  }

  /* =========================================================
     STATUS STYLE
  ========================================================= */

  function getStatusClass(status) {
    if (
      (status || "").toLowerCase() ===
      "active"
    ) {
      return "status-badge status-active";
    }

    return "status-badge status-inactive";
  }

  return (
    <div className="dashboard-page admin-users-page">

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>
            <h1>
              Users Management
            </h1>

            <p>
              Manage students, lecturers,
              teaching assistants and
              administrators.
            </p>
          </div>

          <button
            type="button"
            className="professional-add-button"
            onClick={openCreateModal}
          >
            <span className="button-icon">
              <AdminIcon name="plus" size={16} />
            </span>

            Add User
          </button>

        </header>

        <section className="dashboard-content">

          {/* ERROR */}

          {error && (
            <div className="dashboard-error">
              <span>
                <AdminIcon name="alert" size={15} />
              </span>

              {error}
            </div>
          )}

          {/* =================================================
              USERS PANEL
          ================================================= */}

          <section className="dashboard-panel users-panel">

            <div className="panel-header users-toolbar">

              <div>
                <h2>
                  All Users
                </h2>

                <p>
                  {loading
                    ? "Loading users..."
                    : `${users.length} users found`}
                </p>
              </div>

              <div className="users-search">

                <span>
                  <AdminIcon name="search" size={16} />
                </span>

                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>

            {/* =================================================
                TABLE
            ================================================= */}

            <div className="users-table-wrapper">

              {loading ? (

                <div className="users-loading">

                  <div className="loading-spinner"></div>

                  <p>
                    Loading users...
                  </p>

                </div>

              ) : filteredUsers.length === 0 ? (

                <div className="users-empty">

                  <div className="empty-icon">
                    <AdminIcon name="users" size={24} />
                  </div>

                  <h3>
                    No users found
                  </h3>

                  <p>
                    Try another search or add
                    a new user.
                  </p>

                </div>

              ) : (

                <table className="users-table">

                  <thead>

                    <tr>

                      <th>
                        User
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Phone
                      </th>

                      <th>
                        Role
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Created
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredUsers.map(
                      (user) => {

                        const fullName =
                          `${user.first_name || ""} ${
                            user.last_name || ""
                          }`.trim();

                        const initial =
                          user.first_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          "U";

                        return (
                          <tr key={user.id}>

                            {/* USER */}

                            <td>

                              <div className="user-cell">

                                <div className="user-table-avatar">
                                  {initial}
                                </div>

                                <div>

                                  <strong>
                                    {fullName ||
                                      "Unknown User"}
                                  </strong>

                                  <small>
                                    ID #{user.id}
                                  </small>

                                </div>

                              </div>

                            </td>

                            {/* EMAIL */}

                            <td>
                              {user.email}
                            </td>

                            {/* PHONE */}

                            <td>
                              {user.phone || "Not provided"}
                            </td>

                            {/* ROLE */}

                            <td>

                              <span
                                className={getRoleClass(
                                  user.role
                                )}
                              >
                                {user.role ||
                                  "Unknown"}
                              </span>

                            </td>

                            {/* STATUS */}

                            <td>

                              <span
                                className={getStatusClass(
                                  user.status
                                )}
                              >

                                <span className="status-dot"></span>

                                {user.status ||
                                  "Unknown"}

                              </span>

                            </td>

                            {/* CREATED */}

                            <td>

                              {user.created_at
                                ? new Date(
                                    user.created_at
                                  ).toLocaleDateString()
                                : "Not provided"}

                            </td>

                            {/* ACTIONS */}

                            <td>

                              <div className="user-actions">

                                <button
                                  type="button"
                                  className="action-button edit-button"
                                  onClick={() =>
                                    openEditModal(
                                      user
                                    )
                                  }
                                  title="Edit user"
                                >
                                  <span>
                                    <AdminIcon name="edit" size={15} />
                                  </span>

                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="action-button delete-button"
                                  onClick={() =>
                                    handleDeleteUser(
                                      user
                                    )
                                  }
                                  title="Delete user"
                                >
                                  <span>
                                    <AdminIcon name="trash" size={15} />
                                  </span>

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

              )}

            </div>

          </section>

        </section>

      </main>

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={closeModal}
        >

          <div
            className="user-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <div className="modal-title-icon">
                  {editingUser
                    ? <AdminIcon name="edit" size={18} />
                    : <AdminIcon name="plus" size={18} />}
                </div>

                <div>

                  <h2>
                    {editingUser
                      ? "Edit User"
                      : "Add New User"}
                  </h2>

                  <p>
                    {editingUser
                      ? "Update user information and account settings."
                      : "Create a new system account."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
              >
                <AdminIcon name="close" size={16} />
              </button>

            </div>

            <form
              className="user-form"
              onSubmit={handleSubmit}
            >

              {/* NAME */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  required
                />

              </div>

              {/* ROLE + STATUS */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Role
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >

                    <option value="student">
                      Student
                    </option>

                    <option value="lecturer">
                      Lecturer
                    </option>

                    <option value="ta">
                      Teaching Assistant
                    </option>

                    <option value="auditor">
                      Auditor
                    </option>

                    <option value="admin">
                      Administrator
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >

                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>

                    <option value="suspended">
                      Suspended
                    </option>

                  </select>

                </div>

              </div>

              {/* PHONE */}

              <div className="form-group">

                <label>
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01xxxxxxxxx"
                />

              </div>

              {/* PASSWORD */}

              <div className="form-group">

                <label>
                  Password

                  {editingUser && (
                    <span className="optional-label">
                      Optional
                    </span>
                  )}

                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingUser
                      ? "Leave empty to keep current password"
                      : "Enter password"
                  }
                  minLength={
                    form.password
                      ? 8
                      : undefined
                  }
                  required={!editingUser}
                />

              </div>

              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>
                        {editingUser
                          ? <AdminIcon name="edit" size={15} />
                          : <AdminIcon name="plus" size={15} />}
                      </span>

                      {editingUser
                        ? "Save Changes"
                        : "Create User"}
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

export default Users;