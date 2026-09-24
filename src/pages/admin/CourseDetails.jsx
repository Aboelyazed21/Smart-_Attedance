import {
    useEffect,
    useMemo,
    useState,
  } from "react";
import { useLanguage } from "../../utils/i18n";
  
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
  const { t } = useLanguage();
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
            t("courseDetails.course_could_not_be_found")
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
            t("courseDetails.failed_to_load_course_details")
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
          t("courseDetails.please_enter_the_student_s_email")
        );
  
        return;
      }
  
      if (!selectedSectionId) {
        setAddError(
          t("courseDetails.please_select_a_section")
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
          t("courseDetails.student_added_successfully")
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
            t("courseDetails.failed_to_add_student")
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
          t("courseDetails.confirmRemove").replace("{name}", enrollment.student_name)
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
            t("courseDetails.failed_to_remove_student")
        );
      }
    }
  
  
    /* =========================================================
       LOADING
    ========================================================= */
  
    if (loading) {
      return (
        <div className="course-details-page">
  
  
          <main className="course-details-main">
  
            <div className="course-details-loading">
  
              <div className="loading-spinner"></div>
  
              <h2>
                {t("courseDetails.loading_course")}
              </h2>
  
              <p>
                {t("courseDetails.preparing_course_information")}
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
        <div className="course-details-page">
  
  
          <main className="course-details-main">
  
            <div className="course-details-error">
  
              <div className="course-error-code">
                404
              </div>
  
              <h2>
                {t("courseDetails.course_not_found")}
              </h2>
  
              <p>
                {t("courseDetails.the_requested_course_could_not_be_found")}
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
                {t("courseDetails.back_to_courses")}
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
      <div className="course-details-page">
  
        {/* =====================================================
            SIDEBAR
        ===================================================== */}
  
  
        {/* =====================================================
            MAIN
        ===================================================== */}
  
        <main className="course-details-main">
  
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
                {t("courseDetails.back_to_courses_2")}
              </button>
  
              <h1>
                {course.course_name}
              </h1>
  
              <p>
                {t("courseDetails.course_details_and_student_enrollment_ma")}
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
                    {t("courseDetails.course")}
                  </span>
  
                  <h2>
                    {course.course_name}
                  </h2>
  
                  <p>
                    {course.description ||
                      t("courseDetails.no_course_description_available")}
                  </p>
  
                </div>
  
              </div>
  
  
              <div className="course-hero-meta">
  
                <div className="course-meta-item">
  
                  <span>
                    {t("courseDetails.course_code")}
                  </span>
  
                  <strong>
                    {course.course_code}
                  </strong>
  
                </div>
  
  
                <div className="course-meta-item">
  
                  <span>
                    {t("courseDetails.credit_hours")}
                  </span>
  
                  <strong>
                    {course.credit_hours}
                  </strong>
  
                </div>
  
  
                <div className="course-meta-item">
  
                  <span>
                    {t("courseDetails.enrolled_students")}
                  </span>
  
                  <strong>
                    {enrollments.length}
                  </strong>
  
                </div>
  
  
                <div className="course-meta-item">
  
                  <span>
                    {t("courseDetails.sections")}
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
                    {t("courseDetails.enrollment")}
                  </span>
  
                  <h2>
                    {t("courseDetails.add_student")}
                  </h2>
  
                  <p>
                    {t("courseDetails.add_an_existing_student_to_this_course_u")}
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
  
                    {t("courseDetails.add_student")}
  
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
                        {t("courseDetails.student_email")}
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
                        {t("courseDetails.enter_the_email_already_registered_in_th")}
                      </small>
  
                    </div>
  
  
                    <div className="form-group">
  
                      <label>
                        {t("courseDetails.section")}
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
                          {t("courseDetails.select_section")}
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
                      {t("courseDetails.cancel")}
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
                        ? t("courseDetails.adding_student")
                        : t("courseDetails.add_student")}
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
                    {t("courseDetails.course_roster")}
                  </span>
  
                  <h2>
                    {t("courseDetails.enrolled_students")}
                  </h2>
  
                  <p>
                    {t("courseDetails.students_currently_registered_in_this_co")}
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
                    placeholder={t("courseDetails.search_by_name_email_code_or_section")}
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
                    {t("courseDetails.loading_students")}
                  </p>
  
                </div>
  
              ) : filteredEnrollments.length ===
                0 ? (
  
                <div className="course-empty-state">
  
                  <div className="course-empty-icon">
                    —
                  </div>
  
                  <h3>
                    {t("courseDetails.no_students_enrolled")}
                  </h3>
  
                  <p>
                    {t("courseDetails.add_a_student_using_their_registered_ema")}
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
  
                    {t("courseDetails.add_first_student")}
  
                  </button>
  
                </div>
  
              ) : (
  
                <div className="users-table-wrapper">
  
                  <table className="users-table">
  
                    <thead>
  
                      <tr>
  
                        <th>{t("role.student")}</th>
  
                        <th>
                          {t("courseDetails.email")}
                        </th>
  
                        <th>
                          {t("courseDetails.student_code")}
                        </th>
  
                        <th>
                          {t("courseDetails.section")}
                        </th>
  
                        <th>
                          {t("courseDetails.status")}
                        </th>
  
                        <th>
                          {t("courseDetails.actions")}
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
                                      t("courseDetails.unknown_student")
                                    }
                                  </strong>
  
                                  <small>
                                    {t("courseDetails.student_id")}
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
                                {t("courseDetails.remove")}
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