import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getCourses,
  getUsers,
} from "../../services/api";

function Sections() {
  const navigate = useNavigate();

  /* =========================================================
     STATE
  ========================================================= */

  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const [form, setForm] = useState({
    courseId: "",
    sectionName: "",
    academicYear: "",
    semester: "first",
    lecturerId: "",
    capacity: 100,
  });

  /* =========================================================
     USER
  ========================================================= */

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const firstName = user?.first_name || "Admin";
  const lastName = user?.last_name || "";

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadData = async () => {
    setLoading(true);
    setError("");

    /*
      IMPORTANT:
      We intentionally do NOT use Promise.all here.

      If courses/users fail, sections should still load.
    */

    const sectionsResult = await Promise.allSettled([
      getSections(),
    ]);

    const coursesResult = await Promise.allSettled([
      getCourses(),
    ]);

    const usersResult = await Promise.allSettled([
      getUsers(),
    ]);

    /* =======================================================
       SECTIONS
    ======================================================= */

    if (sectionsResult[0].status === "fulfilled") {
      const sectionsData = sectionsResult[0].value;

      setSections(
        Array.isArray(sectionsData)
          ? sectionsData
          : []
      );
    } else {
      console.error(
        "Sections load error:",
        sectionsResult[0].reason
      );

      setSections([]);

      setError(
        sectionsResult[0].reason?.message ||
          "Failed to load sections data"
      );
    }

    /* =======================================================
       COURSES
    ======================================================= */

    if (coursesResult[0].status === "fulfilled") {
      const coursesData = coursesResult[0].value;

      setCourses(
        Array.isArray(coursesData)
          ? coursesData
          : []
      );
    } else {
      console.error(
        "Courses load error:",
        coursesResult[0].reason
      );

      setCourses([]);
    }

    /* =======================================================
       USERS
    ======================================================= */

    if (usersResult[0].status === "fulfilled") {
      const usersData = usersResult[0].value;

      setUsers(
        Array.isArray(usersData)
          ? usersData
          : []
      );
    } else {
      console.error(
        "Users load error:",
        usersResult[0].reason
      );

      setUsers([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     LECTURERS
  ========================================================= */

  const lecturers = useMemo(() => {
    return users.filter((item) => {
      const role = String(
        item.role || ""
      )
        .toLowerCase()
        .trim();

      return (
        role === "lecturer" ||
        role === "ta"
      );
    });
  }, [users]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredSections = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return sections;
    }

    return sections.filter((section) => {
      const text = [
        section.course_code,
        section.course_name,
        section.section_name,
        section.academic_year,
        section.semester,
        section.lecturer_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(value);
    });
  }, [sections, search]);

  /* =========================================================
     FORM
  ========================================================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingSection(null);

    setForm({
      courseId:
        courses.length > 0
          ? String(courses[0].id)
          : "",
      sectionName: "",
      academicYear: "2026-2027",
      semester: "first",
      lecturerId: "",
      capacity: 100,
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (section) => {
    setEditingSection(section);

    setForm({
      courseId: String(
        section.course_id || ""
      ),

      sectionName:
        section.section_name || "",

      academicYear:
        section.academic_year || "",

      semester:
        section.semester || "first",

      lecturerId:
        section.lecturer_id
          ? String(section.lecturer_id)
          : "",

      capacity:
        section.capacity || 100,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingSection(null);
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.courseId) {
      alert("Please select a course.");
      return;
    }

    if (!form.sectionName.trim()) {
      alert("Please enter section name.");
      return;
    }

    if (!form.academicYear.trim()) {
      alert("Please enter academic year.");
      return;
    }

    if (!form.semester) {
      alert("Please select semester.");
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
        courseId: Number(form.courseId),

        sectionName:
          form.sectionName.trim(),

        academicYear:
          form.academicYear.trim(),

        /*
          Database enum:
          first / second / summer
        */
        semester: form.semester,

        lecturerId:
          form.lecturerId
            ? Number(form.lecturerId)
            : null,

        capacity:
          Number(form.capacity),
      };

      if (editingSection) {
        await updateSection(
          editingSection.id,
          payload
        );
      } else {
        await createSection(payload);
      }

      await loadData();

      setShowModal(false);
      setEditingSection(null);
    } catch (err) {
      console.error(
        "Save section error:",
        err
      );

      alert(
        err.message ||
          "Failed to save section"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (section) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete section "${section.section_name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSection(section.id);

      await loadData();
    } catch (err) {
      console.error(
        "Delete section error:",
        err
      );

      alert(
        err.message ||
          "Failed to delete section"
      );
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
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
            <h2>Attendify</h2>

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
              navigate("/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/admin/users")
            }
          >
            <span>👥</span>
            Users
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/admin/courses")
            }
          >
            <span>📚</span>
            Courses
          </button>

          <button className="nav-item active">
            <span>▤</span>
            Sections
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/admin/rooms")
            }
          >
            <span>🏫</span>
            Rooms
          </button>

          <button
            className="nav-item"
            onClick={() =>
              navigate("/admin/timetable")
            }
          >
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
            onClick={handleLogout}
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

        {/* HEADER */}

        <header className="dashboard-header">

          <div>
            <h1>Sections</h1>

            <p>
              Manage course sections
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
                  Sections Management
                </h2>

                <p>
                  Manage courses, lecturers,
                  semesters and capacities.
                </p>
              </div>

              <button
                className="professional-save-button"
                onClick={
                  openCreateModal
                }
              >
                + Add Section
              </button>

            </div>

            {/* SEARCH */}

            <div className="users-search">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search sections..."
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
                  padding: "14px",
                  marginBottom: "15px",
                  borderRadius: "10px",
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
                Loading sections...
              </div>

            ) : filteredSections.length ===
              0 ? (

              <div className="users-empty">

                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "12px",
                  }}
                >
                  ▤
                </div>

                <h3>
                  No sections found
                </h3>

                <p>
                  {search
                    ? "Try another search."
                    : "Create your first section."}
                </p>

              </div>

            ) : (

              <div className="users-table-wrapper">

                <table className="users-table">

                  <thead>

                    <tr>

                      <th>
                        Course
                      </th>

                      <th>
                        Section
                      </th>

                      <th>
                        Academic Year
                      </th>

                      <th>
                        Semester
                      </th>

                      <th>
                        Lecturer
                      </th>

                      <th>
                        Capacity
                      </th>

                      <th>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredSections.map(
                      (section) => (

                        <tr
                          key={
                            section.id
                          }
                        >

                          {/* COURSE */}

                          <td>

                            <div
                              className="user-cell"
                            >

                              <div
                                className="user-table-avatar"
                              >
                                📚
                              </div>

                              <div>

                                <strong>
                                  {
                                    section.course_code
                                  }
                                </strong>

                                <span>
                                  {
                                    section.course_name
                                  }
                                </span>

                              </div>

                            </div>

                          </td>

                          {/* SECTION */}

                          <td>
                            <strong>
                              {
                                section.section_name
                              }
                            </strong>
                          </td>

                          {/* YEAR */}

                          <td>
                            {
                              section.academic_year
                            }
                          </td>

                          {/* SEMESTER */}

                          <td>
                            {section.semester ===
                            "first"
                              ? "Semester 1"
                              : section.semester ===
                                "second"
                              ? "Semester 2"
                              : "Summer"}
                          </td>

                          {/* LECTURER */}

                          <td>
                            {
                              section.lecturer_name ||
                              "Not assigned"
                            }
                          </td>

                          {/* CAPACITY */}

                          <td>
                            {
                              section.capacity
                            }
                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="user-actions">

                              <button
                                className="action-button edit-button"
                                onClick={() =>
                                  openEditModal(
                                    section
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="action-button delete-button"
                                onClick={() =>
                                  handleDelete(
                                    section
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
                  {editingSection
                    ? "Edit Section"
                    : "Add Section"}
                </h2>

                <p>
                  {editingSection
                    ? "Update section information"
                    : "Create a new course section"}
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

              {/* COURSE */}

              <div className="form-group">

                <label>
                  Course
                </label>

                <select
                  name="courseId"
                  value={
                    form.courseId
                  }
                  onChange={
                    handleInputChange
                  }
                  required
                >

                  <option value="">
                    Select Course
                  </option>

                  {courses.map(
                    (course) => (

                      <option
                        key={
                          course.id
                        }
                        value={
                          course.id
                        }
                      >
                        {course.course_code}
                        {" - "}
                        {course.course_name}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* SECTION NAME */}

              <div className="form-group">

                <label>
                  Section Name
                </label>

                <input
                  type="text"
                  name="sectionName"
                  placeholder="Example: Section A"
                  value={
                    form.sectionName
                  }
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              {/* ACADEMIC YEAR */}

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Academic Year
                  </label>

                  <input
                    type="text"
                    name="academicYear"
                    placeholder="2026-2027"
                    value={
                      form.academicYear
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>

                {/* SEMESTER */}

                <div className="form-group">

                  <label>
                    Semester
                  </label>

                  <select
                    name="semester"
                    value={
                      form.semester
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  >

                    <option value="first">
                      Semester 1
                    </option>

                    <option value="second">
                      Semester 2
                    </option>

                    <option value="summer">
                      Summer
                    </option>

                  </select>

                </div>

              </div>

              {/* LECTURER */}

              <div className="form-group">

                <label>
                  Lecturer / TA
                </label>

                <select
                  name="lecturerId"
                  value={
                    form.lecturerId
                  }
                  onChange={
                    handleInputChange
                  }
                >

                  <option value="">
                    Not assigned
                  </option>

                  {lecturers.map(
                    (lecturer) => (

                      <option
                        key={
                          lecturer.id
                        }
                        value={
                          lecturer.id
                        }
                      >
                        {
                          lecturer.first_name
                        }{" "}
                        {
                          lecturer.last_name
                        }
                        {" - "}
                        {lecturer.role}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* CAPACITY */}

              <div className="form-group">

                <label>
                  Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  max="1000"
                  value={
                    form.capacity
                  }
                  onChange={
                    handleInputChange
                  }
                  required
                />

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
                    : editingSection
                    ? "Update Section"
                    : "Create Section"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Sections;