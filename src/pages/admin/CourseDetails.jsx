import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import {
    getCourses,
    getLecturerEnrollmentSections,
    getLecturerSectionStudents,
    addStudentToLecturerSection,
    removeLecturerEnrollment,
  } from "../../services/api";
  
  
  function CourseDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
  
    /* =========================================================
       COURSE
    ========================================================= */
  
    const [course, setCourse] =
      useState(null);
  
    const [loading, setLoading] =
      useState(true);
  
    const [error, setError] =
      useState("");
  
  
    /* =========================================================
       COURSE DATA
    ========================================================= */
  
    const [enrollments, setEnrollments] =
      useState([]);
  
    const [students, setStudents] =
      useState([]);
  
    const [sections, setSections] =
      useState([]);
  
    const [loadingStudents, setLoadingStudents] =
      useState(false);
  
  
    /* =========================================================
       ADD STUDENT
    ========================================================= */
  
    const [showAddStudent, setShowAddStudent] =
      useState(false);
  
    const [studentEmail, setStudentEmail] =
      useState("");
  
    const [selectedSectionId, setSelectedSectionId] =
      useState("");
  
    const [addingStudent, setAddingStudent] =
      useState(false);
  
    const [addMessage, setAddMessage] =
      useState("");
  
    const [addError, setAddError] =
      useState("");
  
  
    /* =========================================================
       SEARCH
    ========================================================= */
  
    const [studentSearch, setStudentSearch] =
      useState("");
  
  
    /* =========================================================
       LOAD COURSE
    ========================================================= */
  
    async function loadCourseData() {
      try {
        setLoading(true);
        setLoadingStudents(true);
        setError("");
  
        const [
          coursesData,
          lecturerSectionsData,
        ] = await Promise.all([
          getCourses(),
          getLecturerEnrollmentSections(),
        ]);
  
        const courses =
          Array.isArray(coursesData)
            ? coursesData
            : Array.isArray(
                coursesData?.courses
              )
            ? coursesData.courses
            : Array.isArray(
                coursesData?.data
              )
            ? coursesData.data
            : Array.isArray(
                coursesData?.data?.courses
              )
            ? coursesData.data.courses
            : [];
  
        const lecturerSections =
          Array.isArray(
            lecturerSectionsData?.sections
          )
            ? lecturerSectionsData.sections
            : Array.isArray(
                lecturerSectionsData
              )
            ? lecturerSectionsData
            : Array.isArray(
                lecturerSectionsData?.data
              )
            ? lecturerSectionsData.data
            : Array.isArray(
                lecturerSectionsData?.data?.sections
              )
            ? lecturerSectionsData.data.sections
            : [];
  
        const foundCourse =
          courses.find(
            (item) =>
              Number(item.id) === Number(id) ||
              Number(item.course_id) === Number(id)
          );
  
        if (!foundCourse) {
          setError(
            "Course could not be found."
          );
  
          setCourse(null);
          setEnrollments([]);
          setSections([]);
  
          return;
        }
  
        const courseId =
          Number(
            foundCourse.id ??
            foundCourse.course_id
          );
  
        const courseSections =
          lecturerSections.filter(
            (section) =>
              Number(
                section.course_id
              ) === courseId
          );
  
        setCourse(foundCourse);
        setSections(courseSections);
  
        if (courseSections.length === 0) {
          setEnrollments([]);
          setStudents([]);
          return;
        }
  
        const studentResponses =
          await Promise.all(
            courseSections.map(
              (section) =>
                getLecturerSectionStudents(
                  section.section_id ??
                  section.id
                )
            )
          );
  
        const combinedEnrollments =
          studentResponses.flatMap(
            (response, index) => {
              const rows =
                Array.isArray(
                  response?.students
                )
                  ? response.students
                  : Array.isArray(
                      response?.data?.students
                    )
                  ? response.data.students
                  : Array.isArray(
                      response?.data
                    )
                  ? response.data
                  : Array.isArray(response)
                  ? response
                  : [];
  
              const section =
                courseSections[index];
  
              const sectionId =
                section.section_id ??
                section.id;
  
              return rows.map(
                (student) => ({
                  ...student,
  
                  section_id:
                    student.section_id ??
                    sectionId,
  
                  section_name:
                    student.section_name ??
                    section.section_name ??
                    "—",
                })
              );
            }
          );
  
        setEnrollments(
          combinedEnrollments
        );
  
        setStudents(
          combinedEnrollments
        );
  
      } catch (err) {
        console.error(
          "Course details error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to load course details."
        );
  
      } finally {
        setLoading(false);
        setLoadingStudents(false);
      }
    }
  
  
    useEffect(() => {
      loadCourseData();
    }, [id]);
  
  
    /* =========================================================
       FILTER STUDENTS
    ========================================================= */
  
    const filteredEnrollments =
      useMemo(() => {
        const value =
          studentSearch
            .toLowerCase()
            .trim();
  
        if (!value) {
          return enrollments;
        }
  
        return enrollments.filter(
          (item) => {
            const name =
              String(
                item.student_name || ""
              ).toLowerCase();
  
            const email =
              String(
                item.email ||
                item.student_email ||
                ""
              ).toLowerCase();
  
            const code =
              String(
                item.student_code || ""
              ).toLowerCase();
  
            const section =
              String(
                item.section_name || ""
              ).toLowerCase();
  
            return (
              name.includes(value) ||
              email.includes(value) ||
              code.includes(value) ||
              section.includes(value)
            );
          }
        );
      }, [
        enrollments,
        studentSearch,
      ]);
  
  
    /* =========================================================
       ENROLLED STUDENT IDS
    ========================================================= */
  
    const enrolledStudentIds =
      useMemo(() => {
        return new Set(
          enrollments.map(
            (item) =>
              Number(
                item.student_id
              )
          )
        );
      }, [enrollments]);
  
  
    /* =========================================================
       ADD STUDENT
    ========================================================= */
  
    async function handleAddStudent(
      event
    ) {
      event.preventDefault();
  
      setAddMessage("");
      setAddError("");
  
      const normalizedEmail =
        studentEmail
          .trim()
          .toLowerCase();
  
      if (!normalizedEmail) {
        setAddError(
          "Please enter the student's email."
        );
  
        return;
      }
  
      if (!selectedSectionId) {
        setAddError(
          "Please select a section."
        );
  
        return;
      }
  
      try {
        setAddingStudent(true);
  
        await addStudentToLecturerSection(
          Number(selectedSectionId),
          normalizedEmail
        );
  
        setStudentEmail("");
        setSelectedSectionId("");
  
        setAddMessage(
          "Student added successfully."
        );
  
        await loadCourseData();
  
        setTimeout(() => {
          setAddMessage("");
        }, 3000);
  
      } catch (err) {
        console.error(
          "Add student error:",
          err
        );
  
        setAddError(
          err.message ||
            "Failed to add student."
        );
  
      } finally {
        setAddingStudent(false);
      }
    }
  
  
    /* =========================================================
       REMOVE STUDENT
    ========================================================= */
  
    async function handleRemoveStudent(
      enrollment
    ) {
      const confirmed =
        window.confirm(
          `Remove ${enrollment.student_name} from this course?`
        );
  
      if (!confirmed) {
        return;
      }
  
      try {
        setError("");
  
        await removeLecturerEnrollment(
          enrollment.enrollment_id
        );
  
        setEnrollments(
          (previous) =>
            previous.filter(
              (item) =>
                Number(
                  item.enrollment_id
                ) !==
                Number(
                  enrollment.enrollment_id
                )
            )
        );
  
      } catch (err) {
        console.error(
          "Remove enrollment error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to remove student."
        );
      }
    }
  
  
    /* =========================================================
       LOGOUT
    ========================================================= */
  
    function handleLogout() {
      localStorage.removeItem(
        "token"
      );
  
      localStorage.removeItem(
        "user"
      );
  
      navigate("/");
    }
  
  
    /* =========================================================
       LOADING
    ========================================================= */
  
    if (loading) {
      return (
        <div className="dashboard-page">
  
          <aside className="dashboard-sidebar">
  
            <div className="sidebar-brand">
  
              <div className="sidebar-logo">
                A
              </div>
  
              <div>
                <h2>
                  Attendify
                </h2>
  
                <span>
                  Smart Attendance
                </span>
              </div>
  
            </div>
  
          </aside>
  
  
          <main className="dashboard-main">
  
            <div className="course-details-loading">
  
              <div className="loading-spinner"></div>
  
              <h2>
                Loading course
              </h2>
  
              <p>
                Preparing course information.
              </p>
  
            </div>
  
          </main>
  
        </div>
      );
    }
  
  
    /* =========================================================
       ERROR
    ========================================================= */
  
    if (error && !course) {
      return (
        <div className="dashboard-page">
  
          <aside className="dashboard-sidebar">
  
            <div className="sidebar-brand">
  
              <div className="sidebar-logo">
                A
              </div>
  
              <div>
                <h2>
                  Attendify
                </h2>
  
                <span>
                  Smart Attendance
                </span>
              </div>
  
            </div>
  
          </aside>
  
  
          <main className="dashboard-main">
  
            <div className="course-details-error">
  
              <div className="course-error-code">
                404
              </div>
  
              <h2>
                Course not found
              </h2>
  
              <p>
                The requested course could not
                be found in the system.
              </p>
  
              <button
                type="button"
                className="professional-save-button"
                onClick={() =>
                  navigate(
                    "/admin/courses"
                  )
                }
              >
                Back to Courses
              </button>
  
            </div>
  
          </main>
  
        </div>
      );
    }
  
  
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
              A
            </div>
  
            <div>
              <h2>
                Attendify
              </h2>
  
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
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              <span className="nav-symbol">
                D
              </span>
  
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
              <span className="nav-symbol">
                U
              </span>
  
              Users
            </button>
  
  
            <button
              className="nav-item active"
              onClick={() =>
                navigate(
                  "/admin/courses"
                )
              }
            >
              <span className="nav-symbol">
                C
              </span>
  
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
              <span className="nav-symbol">
                S
              </span>
  
              Sections
            </button>
  
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/rooms"
                )
              }
            >
              <span className="nav-symbol">
                R
              </span>
  
              Rooms
            </button>
  
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/timetable"
                )
              }
            >
              <span className="nav-symbol">
                T
              </span>
  
              Timetable
            </button>
  
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/attendance"
                )
              }
            >
              <span className="nav-symbol">
                A
              </span>
  
              Attendance
            </button>
  
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/reports"
                )
              }
            >
              <span className="nav-symbol">
                P
              </span>
  
              Reports
            </button>
  
  
            <button
              className="nav-item"
              onClick={() =>
                navigate(
                  "/admin/settings"
                )
              }
            >
              <span className="nav-symbol">
                S
              </span>
  
              Settings
            </button>
  
          </nav>
  
  
          <button
            className="nav-item logout-item"
            onClick={
              handleLogout
            }
          >
            <span className="nav-symbol">
              L
            </span>
  
            Logout
          </button>
  
        </aside>
  
  
        {/* =====================================================
            MAIN
        ===================================================== */}
  
        <main className="dashboard-main">
  
          {/* HEADER */}
  
          <header className="dashboard-header">
  
            <div>
  
              <button
                type="button"
                className="course-back-button"
                onClick={() =>
                  navigate(
                    "/admin/courses"
                  )
                }
              >
                ← Back to Courses
              </button>
  
              <h1>
                {course.course_name}
              </h1>
  
              <p>
                Course details and student enrollment
                management.
              </p>
  
            </div>
  
          </header>
  
  
          <section className="dashboard-content">
  
            {error && (
              <div className="dashboard-error">
  
                <span>
                  !
                </span>
  
                {error}
  
              </div>
            )}
  
  
            {/* =================================================
                COURSE HERO
            ================================================= */}
  
            <section className="course-details-hero">
  
              <div className="course-hero-main">
  
                <div className="course-hero-icon">
                  C
                </div>
  
                <div>
  
                  <span className="course-hero-label">
                    COURSE
                  </span>
  
                  <h2>
                    {course.course_name}
                  </h2>
  
                  <p>
                    {course.description ||
                      "No course description available."}
                  </p>
  
                </div>
  
              </div>
  
  
              <div className="course-hero-meta">
  
                <div className="course-meta-item">
  
                  <span>
                    Course Code
                  </span>
  
                  <strong>
                    {course.course_code}
                  </strong>
  
                </div>
  
  
                <div className="course-meta-item">
  
                  <span>
                    Credit Hours
                  </span>
  
                  <strong>
                    {course.credit_hours}
                  </strong>
  
                </div>
  
  
                <div className="course-meta-item">
  
                  <span>
                    Enrolled Students
                  </span>
  
                  <strong>
                    {enrollments.length}
                  </strong>
  
                </div>
  
  
                <div className="course-meta-item">
  
                  <span>
                    Sections
                  </span>
  
                  <strong>
                    {sections.length}
                  </strong>
  
                </div>
  
              </div>
  
            </section>
  
  
            {/* =================================================
                ADD STUDENT
            ================================================= */}
  
            <section className="course-management-card">
  
              <div className="course-section-header">
  
                <div>
  
                  <span className="section-eyebrow">
                    ENROLLMENT
                  </span>
  
                  <h2>
                    Add Student
                  </h2>
  
                  <p>
                    Add an existing student to this
                    course using their registered email.
                  </p>
  
                </div>
  
  
                {!showAddStudent && (
                  <button
                    type="button"
                    className="professional-add-button"
                    onClick={() => {
                      setShowAddStudent(true);
                      setAddError("");
                      setAddMessage("");
                    }}
                  >
  
                    <span className="button-icon">
                      +
                    </span>
  
                    Add Student
  
                  </button>
                )}
  
              </div>
  
  
              {showAddStudent && (
  
                <form
                  className="course-add-form"
                  onSubmit={
                    handleAddStudent
                  }
                >
  
                  <div className="course-form-grid">
  
                    <div className="form-group">
  
                      <label>
                        Student Email
                      </label>
  
                      <input
                        type="email"
                        value={
                          studentEmail
                        }
                        onChange={(event) =>
                          setStudentEmail(
                            event.target.value
                          )
                        }
                        placeholder="student@example.com"
                        autoComplete="off"
                        required
                      />
  
                      <small className="form-help">
                        Enter the email already registered
                        in the system.
                      </small>
  
                    </div>
  
  
                    <div className="form-group">
  
                      <label>
                        Section
                      </label>
  
                      <select
                        value={
                          selectedSectionId
                        }
                        onChange={(event) =>
                          setSelectedSectionId(
                            event.target.value
                          )
                        }
                        required
                      >
  
                        <option value="">
                          Select section
                        </option>
  
                        {sections.map(
                          (section) => (
  
                            <option
                              key={
                                section.section_id ??
                                section.id
                              }
                              value={
                                section.section_id ??
                                section.id
                              }
                            >
                              {
                                section.section_name
                              }
                            </option>
  
                          )
                        )}
  
                      </select>
  
                    </div>
  
                  </div>
  
  
                  {addError && (
                    <div className="course-form-message error">
                      {addError}
                    </div>
                  )}
  
  
                  {addMessage && (
                    <div className="course-form-message success">
                      {addMessage}
                    </div>
                  )}
  
  
                  <div className="course-form-actions">
  
                    <button
                      type="button"
                      className="professional-cancel-button"
                      onClick={() => {
                        setShowAddStudent(false);
                        setStudentEmail("");
                        setSelectedSectionId("");
                        setAddError("");
                        setAddMessage("");
                      }}
                      disabled={
                        addingStudent
                      }
                    >
                      Cancel
                    </button>
  
  
                    <button
                      type="submit"
                      className="professional-save-button"
                      disabled={
                        addingStudent ||
                        sections.length === 0
                      }
                    >
                      {addingStudent
                        ? "Adding Student..."
                        : "Add Student"}
                    </button>
  
                  </div>
  
                </form>
  
              )}
  
            </section>
  
  
            {/* =================================================
                STUDENTS
            ================================================= */}
  
            <section className="course-management-card">
  
              <div className="course-section-header">
  
                <div>
  
                  <span className="section-eyebrow">
                    COURSE ROSTER
                  </span>
  
                  <h2>
                    Enrolled Students
                  </h2>
  
                  <p>
                    Students currently registered in
                    this course.
                  </p>
  
                </div>
  
  
                <div className="course-student-count">
                  {enrollments.length}
                </div>
  
              </div>
  
  
              <div className="course-student-toolbar">
  
                <div className="users-search course-search">
  
                  <span>
                    /
                  </span>
  
                  <input
                    type="text"
                    placeholder="Search by name, email, code or section..."
                    value={
                      studentSearch
                    }
                    onChange={(event) =>
                      setStudentSearch(
                        event.target.value
                      )
                    }
                  />
  
                </div>
  
              </div>
  
  
              {loadingStudents ? (
  
                <div className="users-loading">
  
                  <div className="loading-spinner"></div>
  
                  <p>
                    Loading students...
                  </p>
  
                </div>
  
              ) : filteredEnrollments.length ===
                0 ? (
  
                <div className="course-empty-state">
  
                  <div className="course-empty-icon">
                    —
                  </div>
  
                  <h3>
                    No students enrolled
                  </h3>
  
                  <p>
                    Add a student using their registered
                    email address.
                  </p>
  
                  <button
                    type="button"
                    className="professional-add-button"
                    onClick={() => {
                      setShowAddStudent(true);
                      setAddError("");
                      setAddMessage("");
                    }}
                  >
  
                    <span className="button-icon">
                      +
                    </span>
  
                    Add First Student
  
                  </button>
  
                </div>
  
              ) : (
  
                <div className="users-table-wrapper">
  
                  <table className="users-table">
  
                    <thead>
  
                      <tr>
  
                        <th>
                          Student
                        </th>
  
                        <th>
                          Email
                        </th>
  
                        <th>
                          Student Code
                        </th>
  
                        <th>
                          Section
                        </th>
  
                        <th>
                          Status
                        </th>
  
                        <th>
                          Actions
                        </th>
  
                      </tr>
  
                    </thead>
  
  
                    <tbody>
  
                      {filteredEnrollments.map(
                        (enrollment) => (
  
                          <tr
                            key={
                              enrollment.enrollment_id
                            }
                          >
  
                            <td>
  
                              <div className="user-cell">
  
                                <div className="user-table-avatar">
  
                                  {String(
                                    enrollment.student_name ||
                                      "S"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
  
                                </div>
  
  
                                <div>
  
                                  <strong>
                                    {
                                      enrollment.student_name ||
                                      "Unknown Student"
                                    }
                                  </strong>
  
                                  <small>
                                    Student ID #
                                    {
                                      enrollment.student_id
                                    }
                                  </small>
  
                                </div>
  
                              </div>
  
                            </td>
  
  
                            <td>
  
                              <span className="student-email-cell">
  
                                {
                                  enrollment.email ||
                                  enrollment.student_email ||
                                  "—"
                                }
  
                              </span>
  
                            </td>
  
  
                            <td>
  
                              <span className="course-code-badge">
  
                                {
                                  enrollment.student_code ||
                                  "—"
                                }
  
                              </span>
  
                            </td>
  
  
                            <td>
  
                              <span className="student-section-cell">
  
                                {
                                  enrollment.section_name ||
                                  "—"
                                }
  
                              </span>
  
                            </td>
  
  
                            <td>
  
                              <span
                                className={
                                  enrollment.status ===
                                  "active"
                                    ? "student-status active"
                                    : "student-status inactive"
                                }
                              >
  
                                {
                                  enrollment.status ||
                                  "active"
                                }
  
                              </span>
  
                            </td>
  
  
                            <td>
  
                              <button
                                type="button"
                                className="action-button delete-button"
                                onClick={() =>
                                  handleRemoveStudent(
                                    enrollment
                                  )
                                }
                              >
                                Remove
                              </button>
  
                            </td>
  
                          </tr>
  
                        )
                      )}
  
                    </tbody>
  
                  </table>
  
                </div>
  
              )}
  
            </section>
  
          </section>
  
        </main>
  
      </div>
    );
  }
  
  
  export default CourseDetails;