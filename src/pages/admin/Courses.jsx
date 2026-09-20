import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../../services/api";

function Courses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    description: "",
    creditHours: 3,
  });

  /* =========================================================
     LOAD COURSES
  ========================================================= */

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const data = await getCourses();

      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Courses error:", err);
      setError(err.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredCourses = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return courses;
    }

    return courses.filter((course) => {
      const code = (course.course_code || "").toLowerCase();
      const name = (course.course_name || "").toLowerCase();
      const description = (course.description || "").toLowerCase();

      return (
        code.includes(value) ||
        name.includes(value) ||
        description.includes(value)
      );
    });
  }, [courses, search]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "creditHours" ? Number(value) : value,
    }));
  }

  /* =========================================================
     CREATE
  ========================================================= */

  function openCreateModal() {
    setEditingCourse(null);

    setForm({
      courseCode: "",
      courseName: "",
      description: "",
      creditHours: 3,
    });

    setError("");
    setShowModal(true);
  }

  /* =========================================================
     EDIT
  ========================================================= */

  function openEditModal(course) {
    setEditingCourse(course);

    setForm({
      courseCode: course.course_code || "",
      courseName: course.course_name || "",
      description: course.description || "",
      creditHours: course.credit_hours ?? 3,
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
    setEditingCourse(null);
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingCourse) {
        await updateCourse(editingCourse.id, {
          courseName: form.courseName,
          description: form.description,
          creditHours: form.creditHours,
        });
      } else {
        await createCourse({
          courseCode: form.courseCode,
          courseName: form.courseName,
          description: form.description,
          creditHours: form.creditHours,
        });
      }

      setShowModal(false);
      setEditingCourse(null);

      await loadCourses();
    } catch (err) {
      console.error("Save course error:", err);
      setError(err.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDeleteCourse(course) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.course_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteCourse(course.id);

      setCourses((previous) =>
        previous.filter((item) => item.id !== course.id)
      );
    } catch (err) {
      console.error("Delete course error:", err);

      setError(
        err.message || "Failed to delete course"
      );
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">
          <div className="sidebar-logo">
            A
          </div>

          <div>
            <h2>Attendify</h2>

            <span>
              Smart Attendance
            </span>
          </div>
        </div>

        <div className="sidebar-profile">

          <div className="profile-avatar">
            A
          </div>

          <div>
            <strong>
              System Admin
            </strong>

            <span>
              Administrator
            </span>
          </div>

        </div>

        <nav className="dashboard-nav">

          <button
            className="nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/users")}
          >
            <span>👥</span>
            Users
          </button>

          <button className="nav-item active">
            <span>📚</span>
            Courses
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/sections")}
          >
            <span>▤</span>
            Sections
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/rooms")}
          >
            <span>🏫</span>
            Rooms
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/timetable")}
          >
            <span>🗓</span>
            Timetable
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/attendance")}
          >
            <span>✓</span>
            Attendance
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/reports")}
          >
            <span>▥</span>
            Reports
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/admin/settings")}
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <button
          className="nav-item logout-item"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>
            <h1>
              Courses Management
            </h1>

            <p>
              Manage courses and academic information.
            </p>
          </div>

          <button
            type="button"
            className="professional-add-button"
            onClick={openCreateModal}
          >
            <span className="button-icon">
              +
            </span>

            Add Course
          </button>

        </header>

        <section className="dashboard-content">

          {error && (
            <div className="dashboard-error">
              <span>!</span>
              {error}
            </div>
          )}

          <section className="dashboard-panel users-panel">

            <div className="panel-header users-toolbar">

              <div>
                <h2>
                  All Courses
                </h2>

                <p>
                  {loading
                    ? "Loading courses..."
                    : `${courses.length} courses found`}
                </p>
              </div>

              <div className="users-search">

                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

              </div>

            </div>

            <div className="users-table-wrapper">

              {loading ? (

                <div className="users-loading">

                  <div className="loading-spinner"></div>

                  <p>
                    Loading courses...
                  </p>

                </div>

              ) : filteredCourses.length === 0 ? (

                <div className="users-empty">

                  <div className="empty-icon">
                    📚
                  </div>

                  <h3>
                    No courses found
                  </h3>

                  <p>
                    Try another search or add a new course.
                  </p>

                </div>

              ) : (

                <table className="users-table">

                  <thead>

                    <tr>
                      <th>Course</th>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Credit Hours</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>

                  </thead>

                  <tbody>

                    {filteredCourses.map((course) => (

                      <tr key={course.id}>

                        <td>

                          <div className="user-cell">

                            <div className="user-table-avatar course-avatar">
                              📚
                            </div>

                            <div>

                              <strong>
                                {course.course_name}
                              </strong>

                              <small>
                                ID #{course.id}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="course-code-badge">
                            {course.course_code}
                          </span>

                        </td>

                        <td>

                          <span className="course-description">
                            {course.description ||
                              "No description"}
                          </span>

                        </td>

                        <td>

                          <span className="credit-hours-badge">
                            {course.credit_hours} Hours
                          </span>

                        </td>

                        <td>
                          {course.created_at
                            ? new Date(
                                course.created_at
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        <td>

                          <div className="user-actions">

                            <button
                              type="button"
                              className="action-button edit-button"
                              onClick={() =>
                                openEditModal(course)
                              }
                              title="Edit course"
                            >
                              <span>
                                ✎
                              </span>

                              Edit
                            </button>

                            <button
                              type="button"
                              className="action-button delete-button"
                              onClick={() =>
                                handleDeleteCourse(course)
                              }
                              title="Delete course"
                            >
                              <span>
                                🗑
                              </span>

                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              )}

            </div>

          </section>

        </section>

      </main>

      {/* =====================================================
          MODAL
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
                  {editingCourse ? "✎" : "+"}
                </div>

                <div>

                  <h2>
                    {editingCourse
                      ? "Edit Course"
                      : "Add New Course"}
                  </h2>

                  <p>
                    {editingCourse
                      ? "Update course information."
                      : "Create a new course."}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="user-form"
              onSubmit={handleSubmit}
            >

              <div className="form-group">

                <label>
                  Course Code
                </label>

                <input
                  type="text"
                  name="courseCode"
                  value={form.courseCode}
                  onChange={handleChange}
                  placeholder="e.g. CS101"
                  disabled={!!editingCourse}
                  required
                />

                {editingCourse && (
                  <small className="form-help">
                    Course code cannot be changed after creation.
                  </small>
                )}

              </div>

              <div className="form-group">

                <label>
                  Course Name
                </label>

                <input
                  type="text"
                  name="courseName"
                  value={form.courseName}
                  onChange={handleChange}
                  placeholder="e.g. Data Structures"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Credit Hours
                </label>

                <select
                  name="creditHours"
                  value={form.creditHours}
                  onChange={handleChange}
                >
                  <option value={1}>
                    1 Hour
                  </option>

                  <option value={2}>
                    2 Hours
                  </option>

                  <option value={3}>
                    3 Hours
                  </option>

                  <option value={4}>
                    4 Hours
                  </option>

                  <option value={5}>
                    5 Hours
                  </option>

                  <option value={6}>
                    6 Hours
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter course description..."
                  rows="4"
                />

              </div>

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
                        {editingCourse ? "✓" : "+"}
                      </span>

                      {editingCourse
                        ? "Save Changes"
                        : "Create Course"}
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

export default Courses;