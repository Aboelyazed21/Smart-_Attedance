import { useEffect, useMemo, useState } from "react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../services/api";
import "./Users.css";
import { useLanguage } from "../../utils/i18n";

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
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

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
        err.message || t("users.failed_to_load_users")
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
    const roleValue = roleFilter.toLowerCase();
    const statusValue = statusFilter.toLowerCase();

    return users.filter((user) => {
      if (
        roleValue !== "all" &&
        (user.role || "").toLowerCase() !== roleValue
      ) {
        return false;
      }

      if (
        statusValue !== "all" &&
        (user.status || "").toLowerCase() !== statusValue
      ) {
        return false;
      }

      if (!value) {
        return true;
      }

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

      const userId = String(user.id || "").toLowerCase();

      return (
        fullName.includes(value) ||
        email.includes(value) ||
        role.includes(value) ||
        phone.includes(value) ||
        userId.includes(value)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  /* =========================================================
     PAGINATION (frontend — GET /users returns full list)
  ========================================================= */

  const totalUsers = filteredUsers.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalUsers / usersPerPage)
  );

  const safeCurrentPage = Math.min(
    Math.max(1, currentPage),
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * usersPerPage;

  const endIndex = startIndex + usersPerPage;

  const currentUsers = filteredUsers.slice(
    startIndex,
    endIndex
  );

  const rangeStart =
    totalUsers === 0 ? 0 : startIndex + 1;

  const rangeEnd = Math.min(endIndex, totalUsers);

  const isFiltering =
    search.trim() !== "" ||
    roleFilter !== "all" ||
    statusFilter !== "all";

  /* Keep page in range when data shrinks (e.g. after delete). */
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function getPageNumbers() {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    const pages = [1];
    const windowStart = Math.max(
      2,
      safeCurrentPage - 1
    );
    const windowEnd = Math.min(
      totalPages - 1,
      safeCurrentPage + 1
    );

    if (windowStart > 2) {
      pages.push("ellipsis-start");
    }

    for (
      let page = windowStart;
      page <= windowEnd;
      page += 1
    ) {
      pages.push(page);
    }

    if (windowEnd < totalPages - 1) {
      pages.push("ellipsis-end");
    }

    pages.push(totalPages);

    return pages;
  }

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  function handleRoleFilterChange(event) {
    setRoleFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleUsersPerPageChange(event) {
    setUsersPerPage(Number(event.target.value));
    setCurrentPage(1);
  }

  function goToPage(page) {
    const next = Math.min(
      Math.max(1, page),
      totalPages
    );
    setCurrentPage(next);
  }

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
        err.message || t("users.failed_to_save_user")
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
      t("users.confirmDelete").replace("{name}", fullName || user.email)
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteUser(user.id);

      const nextTotal = Math.max(
        0,
        filteredUsers.length - 1
      );

      const nextPages = Math.max(
        1,
        Math.ceil(nextTotal / usersPerPage)
      );

      setUsers((previous) =>
        previous.filter(
          (item) => item.id !== user.id
        )
      );

      if (safeCurrentPage > nextPages) {
        setCurrentPage(nextPages);
      }
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      setError(
        err.message ||
          t("users.failed_to_delete_user")
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
              {t("users.users_management")}
            </h1>

            <p>
              {t("users.manage_students_lecturers_teaching_assis")}
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

            {t("users.add_user")}
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
                  {t("users.all_users")}
                </h2>

                <p>
                  {loading
                    ? t("users.loading_users")
                    : `${totalUsers} ${
                        totalUsers === 1
                          ? t("users.user")
                          : t("users.users")
                      } ${t("users.foundWord")}`}
                </p>
              </div>

              <div className="users-controls">
                <div className="users-search">

                  <span>
                    <AdminIcon name="search" size={16} />
                  </span>

                  <input
                    type="text"
                    placeholder={t("users.search_by_name_email_phone_id")}
                    value={search}
                    onChange={handleSearchChange}
                    aria-label={t("users.search_users")}
                  />

                </div>

                <div className="users-filters">
                  <label className="users-filter">
                    <span className="users-filter-label">
                      {t("users.role")}
                    </span>
                    <select
                      value={roleFilter}
                      onChange={handleRoleFilterChange}
                      aria-label={t("users.filter_by_role")}
                    >
                      <option value="all">{t("users.all_roles")}</option>
                      <option value="student">{t("role.student")}</option>
                      <option value="lecturer">{t("role.lecturer")}</option>
                      <option value="ta">{t("users.teaching_assistant")}</option>
                      <option value="auditor">{t("users.auditor")}</option>
                      <option value="admin">{t("users.administrator")}</option>
                    </select>
                  </label>

                  <label className="users-filter">
                    <span className="users-filter-label">
                      {t("users.status")}
                    </span>
                    <select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      aria-label={t("users.filter_by_status")}
                    >
                      <option value="all">{t("users.all_statuses")}</option>
                      <option value="active">{t("users.active")}</option>
                      <option value="inactive">{t("users.inactive")}</option>
                      <option value="suspended">{t("users.suspended")}</option>
                    </select>
                  </label>
                </div>
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
                    {t("users.loading_users")}
                  </p>

                </div>

              ) : filteredUsers.length === 0 ? (

                <div className="users-empty">

                  <div className="empty-icon">
                    <AdminIcon name="users" size={24} />
                  </div>

                  <h3>
                    {t("users.no_users_found")}
                  </h3>

                  <p>
                    {isFiltering
                      ? t("users.no_users_match_your_search")
                      : t("users.try_another_search_or_add_a_new_user")}
                  </p>

                </div>

              ) : (

                <table className="users-table">

                  <thead>

                    <tr>

                      <th>
                        {t("users.user_2")}
                      </th>

                      <th>
                        {t("users.email")}
                      </th>

                      <th>
                        {t("users.phone")}
                      </th>

                      <th>
                        {t("users.role")}
                      </th>

                      <th>
                        {t("users.status")}
                      </th>

                      <th>
                        {t("users.created")}
                      </th>

                      <th>
                        {t("users.actions")}
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {currentUsers.map(
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
                                      t("users.unknown_user")}
                                  </strong>

                                  <small>{t("users.idLabel").replace("{id}", user.id)}</small>

                                </div>

                              </div>

                            </td>

                            {/* EMAIL */}

                            <td>
                              {user.email}
                            </td>

                            {/* PHONE */}

                            <td>
                              {user.phone || t("users.not_provided")}
                            </td>

                            {/* ROLE */}

                            <td>

                              <span
                                className={getRoleClass(
                                  user.role
                                )}
                              >
                                {user.role ||
                                  t("users.unknown")}
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
                                  t("users.unknown")}

                              </span>

                            </td>

                            {/* CREATED */}

                            <td>

                              {user.created_at
                                ? new Date(
                                    user.created_at
                                  ).toLocaleDateString()
                                : t("users.not_provided")}

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
                                  title={t("users.edit_user")}
                                >
                                  <span>
                                    <AdminIcon name="edit" size={15} />
                                  </span>

                                  {t("users.edit")}
                                </button>

                                <button
                                  type="button"
                                  className="action-button delete-button"
                                  onClick={() =>
                                    handleDeleteUser(
                                      user
                                    )
                                  }
                                  title={t("users.delete_user")}
                                >
                                  <span>
                                    <AdminIcon name="trash" size={15} />
                                  </span>

                                  {t("users.delete")}
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

            {/* =================================================
                PAGINATION
            ================================================= */}

            {!loading && totalUsers > 0 && (
              <div className="users-pagination">
                <p
                  className="pagination-count"
                  aria-live="polite"
                >
                  {t("users.showing")} {rangeStart}–{rangeEnd} {t("users.of")}{" "}
                  {totalUsers}{" "}
                  {isFiltering ? t("users.matching_users") : t("users.users")}
                </p>

                <div className="pagination-controls">
                  <label className="rows-per-page">
                    <span>{t("users.rows_per_page_2")}</span>
                    <select
                      value={usersPerPage}
                      onChange={handleUsersPerPageChange}
                      aria-label={t("users.rows_per_page")}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>

                  <nav
                    className="pagination-pages"
                    aria-label={t("users.users_pages")}
                  >
                    <button
                      type="button"
                      className="pagination-button pagination-prev"
                      onClick={() =>
                        goToPage(safeCurrentPage - 1)
                      }
                      disabled={safeCurrentPage <= 1}
                      aria-label={t("users.previous_page")}
                    >
                      ‹<span className="pagination-prev-text"> {t("users.previous")}</span>
                    </button>

                    {getPageNumbers().map((page) =>
                      typeof page === "string" ? (
                        <span
                          key={page}
                          className="pagination-ellipsis"
                          aria-hidden="true"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          className={
                            page === safeCurrentPage
                              ? "pagination-button pagination-number active"
                              : "pagination-button pagination-number"
                          }
                          onClick={() => goToPage(page)}
                          disabled={page === safeCurrentPage}
                          aria-label={t("users.goToPage").replace("{page}", page)}
                          aria-current={
                            page === safeCurrentPage
                              ? "page"
                              : undefined
                          }
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      className="pagination-button pagination-next"
                      onClick={() =>
                        goToPage(safeCurrentPage + 1)
                      }
                      disabled={
                        safeCurrentPage >= totalPages
                      }
                      aria-label={t("users.next_page")}
                    >
                      <span className="pagination-next-text">{t("users.next")} </span>›
                    </button>
                  </nav>
                </div>
              </div>
            )}

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
                      ? t("users.modalEditTitle")
                      : t("users.modalAddTitle")}
                  </h2>

                  <p>
                    {editingUser
                      ? t("users.modalEditSub")
                      : t("users.modalAddSub")}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label={t("users.close_dialog")}
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
                    {t("users.first_name")}
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder={t("users.enter_first_name")}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    {t("users.last_name")}
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder={t("users.enter_last_name")}
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="form-group">

                <label>
                  {t("users.email")}
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
                    {t("users.role")}
                  </label>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >

                    <option value="student">{t("role.student")}</option>

                    <option value="lecturer">{t("role.lecturer")}</option>

                    <option value="ta">
                      {t("users.teaching_assistant")}
                    </option>

                    <option value="auditor">
                      {t("users.auditor")}
                    </option>

                    <option value="admin">
                      {t("users.administrator")}
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    {t("users.status")}
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >

                    <option value="active">
                      {t("users.active")}
                    </option>

                    <option value="inactive">
                      {t("users.inactive")}
                    </option>

                    <option value="suspended">
                      {t("users.suspended")}
                    </option>

                  </select>

                </div>

              </div>

              {/* PHONE */}

              <div className="form-group">

                <label>
                  {t("users.phone")}
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
                  {t("users.password")}

                  {editingUser && (
                    <span className="optional-label">
                      {t("users.optional")}
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
                      ? t("users.leave_empty_to_keep_current_password")
                      : t("users.enter_password")
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
                  {t("users.cancel")}
                </button>

                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      {t("users.saving")}
                    </>
                  ) : (
                    <>
                      <span>
                        {editingUser
                          ? <AdminIcon name="edit" size={15} />
                          : <AdminIcon name="plus" size={15} />}
                      </span>

                      {editingUser
                        ? t("users.save_changes")
                        : t("users.create_user")}
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