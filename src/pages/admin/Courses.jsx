import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminEnrollments,
  getStudents,
  getSections,
  enrollStudent,
  removeEnrollment,
  updateStudent,
} from "../../services/api";
import "./Courses.css";
import { useLanguage } from "../../utils/i18n";

function CourseIcon({ name, size = 15 }) {
  const paths = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

    close: <path d="M6 6l12 12M18 6 6 18" />,
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


function Courses() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  /* =========================================================
     COURSES
  ========================================================= */

  const [courses, setCourses] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");


  /* =========================================================
     COURSE CREATE / EDIT
  ========================================================= */

  const [showModal, setShowModal] =
    useState(false);

  const [editingCourse, setEditingCourse] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    courseCode: "",
    courseName: "",
    description: "",
    creditHours: 3,
  });


  /* =========================================================
     COURSE STUDENTS MODAL
  ========================================================= */

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState(null);

  const [
    showStudentsModal,
    setShowStudentsModal,
  ] = useState(false);

  const [
    enrollments,
    setEnrollments,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    sections,
    setSections,
  ] = useState([]);

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(false);

  const [
    studentsError,
    setStudentsError,
  ] = useState("");

  const [
    studentSearch,
    setStudentSearch,
  ] = useState("");


  /* =========================================================
     ADD STUDENT
  ========================================================= */

  const [
    showAddStudent,
    setShowAddStudent,
  ] = useState(false);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    selectedSectionId,
    setSelectedSectionId,
  ] = useState("");

  const [
    addingStudent,
    setAddingStudent,
  ] = useState(false);


  /* =========================================================
     EDIT STUDENT
  ========================================================= */

  const [
    showEditStudent,
    setShowEditStudent,
  ] = useState(false);

  const [
    editingStudent,
    setEditingStudent,
  ] = useState(null);

  const [
    editingStudentSaving,
    setEditingStudentSaving,
  ] = useState(false);

  const [
    studentForm,
    setStudentForm,
  ] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentCode: "",
    status: "active",
    password: "",
  });


  /* =========================================================
     LOAD COURSES
  ========================================================= */

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getCourses();

      setCourses(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Courses error:",
        err
      );

      setError(
        err.message ||
          t("courses.failed_to_load_courses")
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadCourses();
  }, []);


  /* =========================================================
     SEARCH COURSES
  ========================================================= */

  const filteredCourses =
    useMemo(() => {
      const value =
        search
          .toLowerCase()
          .trim();

      if (!value) {
        return courses;
      }

      return courses.filter(
        (course) => {
          const code =
            (
              course.course_code ||
              ""
            ).toLowerCase();

          const name =
            (
              course.course_name ||
              ""
            ).toLowerCase();

          const description =
            (
              course.description ||
              ""
            ).toLowerCase();

          return (
            code.includes(value) ||
            name.includes(value) ||
            description.includes(value)
          );
        }
      );
    }, [courses, search]);


  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (previous) => ({
        ...previous,

        [name]:
          name ===
          "creditHours"
            ? Number(value)
            : value,
      })
    );
  }


  /* =========================================================
     CREATE COURSE
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
     EDIT COURSE
  ========================================================= */

  function openEditModal(course) {
    setEditingCourse(course);

    setForm({
      courseCode:
        course.course_code ||
        "",

      courseName:
        course.course_name ||
        "",

      description:
        course.description ||
        "",

      creditHours:
        course.credit_hours ??
        3,
    });

    setError("");

    setShowModal(true);
  }


  /* =========================================================
     CLOSE COURSE MODAL
  ========================================================= */

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingCourse(null);
  }


  /* =========================================================
     SAVE COURSE
  ========================================================= */

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingCourse) {
        await updateCourse(
          editingCourse.id,
          {
            courseName:
              form.courseName,

            description:
              form.description,

            creditHours:
              form.creditHours,
          }
        );
      } else {
        await createCourse({
          courseCode:
            form.courseCode,

          courseName:
            form.courseName,

          description:
            form.description,

          creditHours:
            form.creditHours,
        });
      }

      setShowModal(false);

      setEditingCourse(null);

      await loadCourses();

    } catch (err) {
      console.error(
        "Save course error:",
        err
      );

      setError(
        err.message ||
          t("courses.failed_to_save_course")
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================================================
     DELETE COURSE
  ========================================================= */

  async function handleDeleteCourse(
    course
  ) {
    const confirmed =
      window.confirm(
        t("courses.confirmDelete").replace("{name}", course.course_name)
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteCourse(
        course.id
      );

      setCourses(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== course.id
          )
      );

    } catch (err) {
      console.error(
        "Delete course error:",
        err
      );

      setError(
        err.message ||
          t("courses.failed_to_delete_course")
      );
    }
  }


  /* =========================================================
     LOAD COURSE STUDENTS
  ========================================================= */

  async function loadCourseStudents(
    course
  ) {
    try {
      setStudentsLoading(true);

      setStudentsError("");

      const [
        enrollmentData,
        studentsData,
        sectionsData,
      ] = await Promise.all([
        getAdminEnrollments(),
        getStudents(),
        getSections(),
      ]);

      const allEnrollments =
        Array.isArray(
          enrollmentData
        )
          ? enrollmentData
          : Array.isArray(
              enrollmentData?.enrollments
            )
          ? enrollmentData.enrollments
          : [];

      const allStudents =
        Array.isArray(
          studentsData
        )
          ? studentsData
          : Array.isArray(
              studentsData?.students
            )
          ? studentsData.students
          : [];

      const allSections =
        Array.isArray(
          sectionsData
        )
          ? sectionsData
          : Array.isArray(
              sectionsData?.sections
            )
          ? sectionsData.sections
          : [];

      /*
        Show enrollments belonging
        to the selected course.
      */

      const courseEnrollments =
        allEnrollments.filter(
          (item) =>
            Number(
              item.course_id
            ) ===
              Number(
                course.id
              ) ||
            String(
              item.course_code ||
                ""
            ).toLowerCase() ===
              String(
                course.course_code ||
                  ""
              ).toLowerCase()
        );

      /*
        Sections belonging
        to selected course.
      */

      const courseSections =
        allSections.filter(
          (section) =>
            Number(
              section.course_id
            ) ===
            Number(course.id)
        );

      setEnrollments(
        courseEnrollments
      );

      setStudents(
        allStudents
      );

      setSections(
        courseSections
      );

    } catch (err) {
      console.error(
        "Load course students error:",
        err
      );

      setStudentsError(
        err.message ||
          t("courses.failed_to_load_course_students")
      );

    } finally {
      setStudentsLoading(
        false
      );
    }
  }


  /* =========================================================
     OPEN COURSE STUDENTS
  ========================================================= */

  async function openCourseStudents(
    course
  ) {
    setSelectedCourse(course);

    setShowStudentsModal(true);

    setStudentSearch("");

    setShowAddStudent(false);

    setShowEditStudent(false);

    setSelectedStudentId("");

    setSelectedSectionId("");

    await loadCourseStudents(
      course
    );
  }


  /* =========================================================
     CLOSE COURSE STUDENTS
  ========================================================= */

  function closeStudentsModal() {
    if (addingStudent) {
      return;
    }

    if (editingStudentSaving) {
      return;
    }

    setShowStudentsModal(
      false
    );

    setSelectedCourse(null);

    setEnrollments([]);

    setStudentSearch("");

    setShowAddStudent(false);

    setShowEditStudent(false);

    setEditingStudent(null);
  }


  /* =========================================================
     FILTER COURSE STUDENTS
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
            (
              item.student_name ||
              ""
            ).toLowerCase();

          const code =
            (
              item.student_code ||
              ""
            ).toLowerCase();

          const section =
            (
              item.section_name ||
              ""
            ).toLowerCase();

          return (
            name.includes(value) ||
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
     AVAILABLE STUDENTS FOR ADD
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


  const availableStudents =
    useMemo(() => {
      return students.filter(
        (student) =>
          !enrolledStudentIds.has(
            Number(
              student.student_id
            )
          )
      );
    }, [
      students,
      enrolledStudentIds,
    ]);


  /* =========================================================
     OPEN ADD STUDENT
  ========================================================= */

  function openAddStudent() {
    setStudentsError("");

    setSelectedStudentId("");

    setSelectedSectionId("");

    setShowAddStudent(true);
  }


  /* =========================================================
     CLOSE ADD STUDENT
  ========================================================= */

  function closeAddStudent() {
    if (addingStudent) {
      return;
    }

    setShowAddStudent(false);

    setSelectedStudentId("");

    setSelectedSectionId("");
  }


  /* =========================================================
     ADD STUDENT
  ========================================================= */

  async function handleAddStudent(
    event
  ) {
    event.preventDefault();

    if (
      !selectedCourse
    ) {
      return;
    }

    if (
      !selectedStudentId
    ) {
      setStudentsError(
        t("courses.please_select_a_student")
      );

      return;
    }

    if (
      !selectedSectionId
    ) {
      setStudentsError(
        t("courses.please_select_a_section")
      );

      return;
    }

    try {
      setAddingStudent(true);

      setStudentsError("");

      await enrollStudent(
        Number(
          selectedStudentId
        ),
        Number(
          selectedSectionId
        )
      );

      await loadCourseStudents(
        selectedCourse
      );

      setShowAddStudent(
        false
      );

      setSelectedStudentId("");

      setSelectedSectionId("");

    } catch (err) {
      console.error(
        "Add student error:",
        err
      );

      setStudentsError(
        err.message ||
          t("courses.failed_to_add_student")
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
        t("courses.confirmRemove").replace("{name}", enrollment.student_name).replace("{course}", selectedCourse?.course_name)
      );

    if (!confirmed) {
      return;
    }

    try {
      setStudentsError("");

      await removeEnrollment(
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
        "Remove student error:",
        err
      );

      setStudentsError(
        err.message ||
          t("courses.failed_to_remove_student")
      );
    }
  }


  /* =========================================================
     OPEN EDIT STUDENT
  ========================================================= */

  function openEditStudent(
    enrollment
  ) {
    const student =
      students.find(
        (item) =>
          Number(
            item.student_id
          ) ===
          Number(
            enrollment.student_id
          )
      );

    if (!student) {
      setStudentsError(
        t("courses.student_information_could_not_be_loaded")
      );

      return;
    }

    setEditingStudent(
      student
    );

    setStudentForm({
      firstName:
        student.first_name ||
        "",

      lastName:
        student.last_name ||
        "",

      email:
        student.email ||
        "",

      phone:
        student.phone ||
        "",

      studentCode:
        student.student_code ||
        "",

      status:
        student.status ||
        "active",

      password: "",
    });

    setStudentsError("");

    setShowEditStudent(
      true
    );
  }


  /* =========================================================
     CLOSE EDIT STUDENT
  ========================================================= */

  function closeEditStudent() {
    if (
      editingStudentSaving
    ) {
      return;
    }

    setShowEditStudent(
      false
    );

    setEditingStudent(null);

    setStudentForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      studentCode: "",
      status: "active",
      password: "",
    });
  }


  /* =========================================================
     STUDENT FORM CHANGE
  ========================================================= */

  function handleStudentChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setStudentForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }


  /* =========================================================
     SAVE STUDENT
  ========================================================= */

  async function handleSaveStudent(
    event
  ) {
    event.preventDefault();

    if (!editingStudent) {
      return;
    }

    try {
      setEditingStudentSaving(
        true
      );

      setStudentsError("");

      const payload = {
        firstName:
          studentForm.firstName,

        lastName:
          studentForm.lastName,

        email:
          studentForm.email,

        phone:
          studentForm.phone,

        studentCode:
          studentForm.studentCode,

        status:
          studentForm.status,
      };

      /*
        Only send password
        when admin entered one.
      */

      if (
        studentForm.password.trim()
      ) {
        payload.password =
          studentForm.password;
      }

      await updateStudent(
        editingStudent.student_id,
        payload
      );

      await loadCourseStudents(
        selectedCourse
      );

      closeEditStudent();

    } catch (err) {
      console.error(
        "Update student error:",
        err
      );

      setStudentsError(
        err.message ||
          t("courses.failed_to_update_student")
      );

    } finally {
      setEditingStudentSaving(
        false
      );
    }
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="courses-page admin-courses-page">


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="courses-main">

        <header className="dashboard-header">

          <div>

            <h1>
              {t("courses.courses_management")}
            </h1>

            <p>
              {t("courses.manage_courses_and_academic_information")}
            </p>

          </div>


          <button
            type="button"
            className="professional-add-button"
            onClick={
              openCreateModal
            }
          >

            <span className="button-icon">
              <CourseIcon name="plus" size={16} />
            </span>

            {t("courses.add_course")}

          </button>

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


          <section className="dashboard-panel users-panel">

            <div className="panel-header users-toolbar">

              <div>

                <h2>
                  {t("courses.all_courses")}
                </h2>

                <p>
                  {loading
                    ? t("courses.loading_courses")
                    : t("courses.coursesFound").replace("{n}", courses.length)}
                </p>

              </div>


              <div className="users-search">

                <span>
                  <CourseIcon name="search" size={16} />
                </span>

                <input
                  type="text"
                  placeholder={t("courses.search_courses")}
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="users-table-wrapper">

              {loading ? (

                <div className="users-loading">

                  <div className="loading-spinner"></div>

                  <p>
                    {t("courses.loading_courses")}
                  </p>

                </div>

              ) : filteredCourses.length ===
                0 ? (

                <div className="users-empty">

                  <div className="empty-icon">
                    C
                  </div>

                  <h3>
                    {t("courses.no_courses_found")}
                  </h3>

                  <p>
                    Try another search or add a new course.
                  </p>

                </div>

              ) : (

                <table className="users-table">

                  <thead>

                    <tr>
                      <th>
                        {t("courses.course")}
                      </th>

                      <th>
                        {t("courses.code")}
                      </th>

                      <th>
                        {t("courses.description")}
                      </th>

                      <th>
                        {t("courses.credit_hours")}
                      </th>

                      <th>
                        {t("courses.created")}
                      </th>

                      <th>
                        {t("courses.actions")}
                      </th>
                    </tr>

                  </thead>


                  <tbody>

                    {filteredCourses.map(
                      (course) => (

                        <tr
                          key={
                            course.id
                          }
                        >

                          <td>

                            <div
                              className="user-cell"
                              onClick={() =>
                                navigate(
                                  `/admin/courses/${course.id}`
                                )
                              }
                              style={{
                                cursor:
                                  "pointer",
                              }}
                              title={t("courses.open_course_details")}
                            >

                              <div className="user-table-avatar course-avatar">
                                C
                              </div>

                              <div>

                                <strong
                                  style={{
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  {
                                    course.course_name
                                  }
                                </strong>

                                <small>
                                  {t("courses.id")}
                                  {
                                    course.id
                                  }
                                </small>

                              </div>

                            </div>

                          </td>


                          <td>

                            <span className="course-code-badge">
                              {
                                course.course_code
                              }
                            </span>

                          </td>


                          <td>

                            <span className="course-description">
                              {
                                course.description ||
                                t("courses.no_description")
                              }
                            </span>

                          </td>


                          <td>

                            <span className="credit-hours-badge">
                              {
                                course.credit_hours
                              }{" "}
                              {t("courses.hours")}
                            </span>

                          </td>


                          <td>

                            {course.created_at
                              ? new Date(
                                  course.created_at
                                ).toLocaleDateString()
                              : t("courses.not_provided")}

                          </td>


                          <td>

                            <div className="user-actions">

                              <button
                                type="button"
                                className="action-button edit-button"
                                onClick={() =>
                                  openEditModal(
                                    course
                                  )
                                }
                                title={t("courses.edit_course")}
                              >

                                {t("courses.edit")}

                              </button>


                              <button
                                type="button"
                                className="action-button delete-button"
                                onClick={() =>
                                  handleDeleteCourse(
                                    course
                                  )
                                }
                                title={t("courses.delete_course")}
                              >

                                {t("courses.delete")}

                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              )}

            </div>

          </section>

        </section>

      </main>


      {/* =====================================================
          COURSE CREATE / EDIT MODAL
      ===================================================== */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="user-modal"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <div className="modal-title-icon">
                  {
                    editingCourse
                      ? <CourseIcon name="edit" size={18} />
                      : <CourseIcon name="plus" size={18} />
                  }
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
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                <CourseIcon name="close" size={15} />
              </button>

            </div>


            <form
              className="user-form"
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label>
                  {t("courses.course_code")}
                </label>

                <input
                  type="text"
                  name="courseCode"
                  value={
                    form.courseCode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. CS101"
                  disabled={
                    !!editingCourse
                  }
                  required
                />

                {editingCourse && (
                  <small className="form-help">
                    {t("courses.course_code_cannot_be_changed_after_crea")}
                  </small>
                )}

              </div>


              <div className="form-group">

                <label>
                  {t("courses.course_name")}
                </label>

                <input
                  type="text"
                  name="courseName"
                  value={
                    form.courseName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. Data Structures"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  {t("courses.credit_hours")}
                </label>

                <select
                  name="creditHours"
                  value={
                    form.creditHours
                  }
                  onChange={
                    handleChange
                  }
                >

                  <option value={1}>
                    {t("courses.1_hour")}
                  </option>

                  <option value={2}>
                    {t("courses.2_hours")}
                  </option>

                  <option value={3}>
                    {t("courses.3_hours")}
                  </option>

                  <option value={4}>
                    {t("courses.4_hours")}
                  </option>

                  <option value={5}>
                    {t("courses.5_hours")}
                  </option>

                  <option value={6}>
                    {t("courses.6_hours")}
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  {t("courses.description")}
                </label>

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder={t("courses.enter_course_description")}
                  rows="4"
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                >
                  {t("courses.cancel")}
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    saving
                  }
                >

                  {saving ? (
                    <>
                      <span className="button-spinner"></span>

                      {t("courses.saving")}
                    </>
                  ) : (
                    <>
                      <span>
                        {
                          editingCourse
                            ? <CourseIcon name="edit" size={15} />
                            : <CourseIcon name="plus" size={15} />
                        }
                      </span>

                      {
                        editingCourse
                          ? t("courses.save_changes")
                          : "Create Course"
                      }
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          COURSE STUDENTS MODAL
      ===================================================== */}

      {showStudentsModal && (

        <div
          className="modal-overlay"
          onMouseDown={
            closeStudentsModal
          }
        >

          <div
            className="user-modal"
            style={{
              width:
                "min(1100px, 95vw)",
              maxWidth:
                "1100px",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
            }}
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <div className="modal-title-icon">
                  C
                </div>

                <div>

                  <h2>
                    {
                      selectedCourse?.course_name
                    }
                  </h2>

                  <p>
                    {t("courses.course_students_management")}
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeStudentsModal
                }
              >
                <CourseIcon name="close" size={15} />
              </button>

            </div>


            {/* COURSE INFO */}

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap:
                  "12px",
                marginBottom:
                  "20px",
              }}
            >

              <div
                style={{
                  padding:
                    "14px",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <small>
                  {t("courses.course_code")}
                </small>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "5px",
                  }}
                >
                  {
                    selectedCourse?.course_code
                  }
                </strong>
              </div>


              <div
                style={{
                  padding:
                    "14px",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <small>
                  {t("courses.students")}
                </small>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "5px",
                  }}
                >
                  {
                    enrollments.length
                  }
                </strong>
              </div>


              <div
                style={{
                  padding:
                    "14px",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc",
                  border:
                    "1px solid #e2e8f0",
                }}
              >
                <small>
                  {t("courses.sections")}
                </small>

                <strong
                  style={{
                    display:
                      "block",
                    marginTop:
                      "5px",
                  }}
                >
                  {
                    sections.length
                  }
                </strong>
              </div>

            </div>


            {/* ERROR */}

            {studentsError && (

              <div
                className="dashboard-error"
                style={{
                  marginBottom:
                    "16px",
                }}
              >

                <span>
                  !
                </span>

                {
                  studentsError
                }

              </div>

            )}


            {/* TOOLBAR */}

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap:
                  "12px",
                flexWrap:
                  "wrap",
                marginBottom:
                  "18px",
              }}
            >

              <div
                className="users-search"
                style={{
                  flex:
                    "1 1 280px",
                }}
              >

                <span>
                  <CourseIcon name="search" size={16} />
                </span>

                <input
                  type="text"
                  placeholder={t("courses.search_students")}
                  value={
                    studentSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setStudentSearch(
                      event.target.value
                    )
                  }
                />

              </div>


              <button
                type="button"
                className="professional-add-button"
                onClick={
                  openAddStudent
                }
                disabled={
                  sections.length ===
                    0 ||
                  availableStudents.length ===
                    0
                }
              >

                <span className="button-icon">
                  +
                </span>

                {t("courses.add_student")}

              </button>

            </div>


            {/* ADD STUDENT FORM */}

            {showAddStudent && (

              <form
                onSubmit={
                  handleAddStudent
                }
                style={{
                  padding:
                    "18px",
                  borderRadius:
                    "14px",
                  border:
                    "1px solid #e2e8f0",
                  background:
                    "#f8fafc",
                  marginBottom:
                    "20px",
                }}
              >

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap:
                      "14px",
                  }}
                >

                  <div className="form-group">

                    <label>{t("role.student")}</label>

                    <select
                      value={
                        selectedStudentId
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedStudentId(
                          event.target.value
                        )
                      }
                      required
                    >

                      <option value="">
                        {t("courses.select_student")}
                      </option>

                      {availableStudents.map(
                        (
                          student
                        ) => (

                          <option
                            key={
                              student.student_id
                            }
                            value={
                              student.student_id
                            }
                          >
                            {
                              student.first_name
                            }{" "}
                            {
                              student.last_name
                            }{" "}
                            -{" "}
                            {
                              student.student_code
                            }
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      {t("courses.section")}
                    </label>

                    <select
                      value={
                        selectedSectionId
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedSectionId(
                          event.target.value
                        )
                      }
                      required
                    >

                      <option value="">
                        {t("courses.select_section")}
                      </option>

                      {sections.map(
                        (
                          section
                        ) => (

                          <option
                            key={
                              section.id
                            }
                            value={
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


                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap:
                      "10px",
                    marginTop:
                      "15px",
                  }}
                >

                  <button
                    type="button"
                    className="professional-cancel-button"
                    onClick={
                      closeAddStudent
                    }
                    disabled={
                      addingStudent
                    }
                  >
                    {t("courses.cancel")}
                  </button>


                  <button
                    type="submit"
                    className="professional-save-button"
                    disabled={
                      addingStudent
                    }
                  >

                    {addingStudent
                      ? t("courses.adding")
                      : t("courses.add_student")}

                  </button>

                </div>

              </form>

            )}


            {/* STUDENTS TABLE */}

            {studentsLoading ? (

              <div className="users-loading">

                <div className="loading-spinner"></div>

                <p>
                  {t("courses.loading_students")}
                </p>

              </div>

            ) : filteredEnrollments.length ===
              0 ? (

              <div className="users-empty">

                <div className="empty-icon">
                  U
                </div>

                <h3>
                  {t("courses.no_students_found")}
                </h3>

                <p>
                  {t("courses.this_course_currently_has_no_matching_st")}
                </p>

              </div>

            ) : (

              <div
                className="users-table-wrapper"
                style={{
                  overflowX:
                    "auto",
                }}
              >

                <table className="users-table">

                  <thead>

                    <tr>

                      <th>{t("role.student")}</th>

                      <th>
                        {t("courses.student_code")}
                      </th>

                      <th>
                        {t("courses.section")}
                      </th>

                      <th>
                        {t("courses.status")}
                      </th>

                      <th>
                        {t("courses.actions")}
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredEnrollments.map(
                      (
                        enrollment
                      ) => (

                        <tr
                          key={
                            enrollment.enrollment_id
                          }
                        >

                          <td>

                            <div className="user-cell">

                              <div className="user-table-avatar">
                                <CourseIcon name="user" size={18} />
                              </div>

                              <div>

                                <strong>
                                  {
                                    enrollment.student_name
                                  }
                                </strong>

                                <small>
                                  {t("courses.student_id")}
                                  {
                                    enrollment.student_id
                                  }
                                </small>

                              </div>

                            </div>

                          </td>


                          <td>

                            <span className="course-code-badge">
                              {
                                enrollment.student_code
                              }
                            </span>

                          </td>


                          <td>

                            {
                              enrollment.section_name ||
                              t("courses.not_provided")
                            }

                          </td>


                          <td>

                            <span
                              style={{
                                display:
                                  "inline-flex",
                                padding:
                                  "5px 10px",
                                borderRadius:
                                  "999px",
                                background:
                                  enrollment.status ===
                                  "active"
                                    ? "#dcfce7"
                                    : "#fee2e2",
                                color:
                                  enrollment.status ===
                                  "active"
                                    ? "#166534"
                                    : "#991b1b",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  "600",
                              }}
                            >
                              {
                                enrollment.status ||
                                "active"
                              }
                            </span>

                          </td>


                          <td>

                            <div className="user-actions">

                              <button
                                type="button"
                                className="action-button edit-button"
                                onClick={() =>
                                  openEditStudent(
                                    enrollment
                                  )
                                }
                              >

                                {t("courses.edit")}

                              </button>


                              <button
                                type="button"
                                className="action-button delete-button"
                                onClick={() =>
                                  handleRemoveStudent(
                                    enrollment
                                  )
                                }
                              >

                                {t("courses.remove")}

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

        </div>

      )}


      {/* =====================================================
          EDIT STUDENT MODAL
      ===================================================== */}

      {showEditStudent && (

        <div
          className="modal-overlay"
          style={{
            zIndex:
              1100,
          }}
          onMouseDown={
            closeEditStudent
          }
        >

          <div
            className="user-modal"
            style={{
              maxWidth:
                "650px",
              width:
                "95vw",
              maxHeight:
                "90vh",
              overflowY:
                "auto",
            }}
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <div className="modal-title-icon">
                  <CourseIcon name="edit" size={18} />
                </div>

                <div>

                  <h2>
                    {t("courses.edit_student")}
                  </h2>

                  <p>
                    {t("courses.update_student_information")}
                  </p>

                </div>

              </div>


              <button
                type="button"
                className="modal-close"
                onClick={
                  closeEditStudent
                }
                disabled={
                  editingStudentSaving
                }
              >
                <CourseIcon name="close" size={15} />
              </button>

            </div>


            <form
              className="user-form"
              onSubmit={
                handleSaveStudent
              }
            >

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap:
                    "12px",
                }}
              >

                <div className="form-group">

                  <label>
                    {t("courses.first_name")}
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={
                      studentForm.firstName
                    }
                    onChange={
                      handleStudentChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    {t("courses.last_name")}
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={
                      studentForm.lastName
                    }
                    onChange={
                      handleStudentChange
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  {t("courses.student_code")}
                </label>

                <input
                  type="text"
                  name="studentCode"
                  value={
                    studentForm.studentCode
                  }
                  onChange={
                    handleStudentChange
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  {t("courses.email")}
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    studentForm.email
                  }
                  onChange={
                    handleStudentChange
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  {t("courses.phone")}
                </label>

                <input
                  type="text"
                  name="phone"
                  value={
                    studentForm.phone
                  }
                  onChange={
                    handleStudentChange
                  }
                />

              </div>


              <div className="form-group">

                <label>
                  {t("courses.status")}
                </label>

                <select
                  name="status"
                  value={
                    studentForm.status
                  }
                  onChange={
                    handleStudentChange
                  }
                >

                  <option value="active">
                    {t("courses.active")}
                  </option>

                  <option value="inactive">
                    {t("courses.inactive")}
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  {t("courses.new_password")}
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    studentForm.password
                  }
                  onChange={
                    handleStudentChange
                  }
                  placeholder={t("courses.leave_empty_to_keep_current_password")}
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={
                    closeEditStudent
                  }
                  disabled={
                    editingStudentSaving
                  }
                >
                  {t("courses.cancel")}
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    editingStudentSaving
                  }
                >

                  {editingStudentSaving
                    ? t("courses.saving")
                    : t("courses.save_changes")}

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