import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getCourses,
  getUsers,
  getAdminEnrollments,
  getStudents,
  enrollStudent,
  removeEnrollment,
  updateStudent,
} from "../../services/api";
import "./Sections.css";
import "./Sections.css";
import { useLanguage } from "../../utils/i18n";
import { toast } from "../../components/Toast";

function SectionIcon({ name, size = 15 }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
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

    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21" />
        <path d="M6.5 2H21v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),

    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),

    plus: <path d="M12 5v14M5 12h14" />,

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

    chevron: <path d="m9 6 6 6-6 6" />,

    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </>
    ),

    close: <path d="M6 6l12 12M18 6 6 18" />,

    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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


function Sections() {
  const { t } = useLanguage();
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
     DATA
  ========================================================= */

  const [sections, setSections] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [enrollments, setEnrollments] =
    useState([]);


  /* =========================================================
     UI
  ========================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [studentSearch, setStudentSearch] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState("students");


  /* =========================================================
     SECTION MODAL
  ========================================================= */

  const [showSectionModal, setShowSectionModal] =
    useState(false);

  const [editingSection, setEditingSection] =
    useState(null);

  const [sectionForm, setSectionForm] =
    useState({
      courseId: "",
      sectionName: "",
      academicYear: "2026/2027",
      semester: "1",
      lecturerId: "",
      capacity: 100,
    });


  /* =========================================================
     ADD STUDENT MODAL
  ========================================================= */

  const [showAddStudent, setShowAddStudent] =
    useState(false);

  const [studentEmail, setStudentEmail] =
    useState("");

  const [addingStudent, setAddingStudent] =
    useState(false);

  const [addStudentError, setAddStudentError] =
    useState("");

  const [addStudentSuccess, setAddStudentSuccess] =
    useState("");


  /* =========================================================
     EDIT STUDENT MODAL
  ========================================================= */

  const [showEditStudent, setShowEditStudent] =
    useState(false);

  const [editingStudent, setEditingStudent] =
    useState(null);

  const [editingStudentSaving, setEditingStudentSaving] =
    useState(false);

  const [studentForm, setStudentForm] =
    useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      studentCode: "",
      status: "active",
      password: "",
    });


  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {

    try {

      setLoading(true);
      setError("");

      const [
        sectionsData,
        coursesData,
        usersData,
        studentsData,
        enrollmentsData,
      ] = await Promise.all([

        getSections(),
        getCourses(),
        getUsers(),
        getStudents(),
        getAdminEnrollments(),

      ]);


      const normalizeArray = (data, keys = []) => {

        if (Array.isArray(data)) {
          return data;
        }

        for (const key of keys) {

          if (Array.isArray(data?.[key])) {
            return data[key];
          }

        }

        if (Array.isArray(data?.data)) {
          return data.data;
        }

        if (Array.isArray(data?.data?.data)) {
          return data.data.data;
        }

        return [];

      };


      setSections(
        normalizeArray(
          sectionsData,
          ["sections"]
        )
      );


      setCourses(
        normalizeArray(
          coursesData,
          ["courses"]
        )
      );


      setUsers(
        normalizeArray(
          usersData,
          ["users"]
        )
      );


      setStudents(
        normalizeArray(
          studentsData,
          ["students"]
        )
      );


      setEnrollments(
        normalizeArray(
          enrollmentsData,
          ["enrollments"]
        )
      );

    } catch (err) {

      console.error(
        "Sections loading error:",
        err
      );

      setError(
        err.message ||
        t("sections.failed_to_load_sections")
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadData();

  }, []);


  /* =========================================================
     LECTURERS
  ========================================================= */

  const lecturers = useMemo(() => {

    return users.filter((item) => {

      const role =
        String(
          item.role ||
          item.role_name ||
          ""
        )
          .toLowerCase()
          .trim();

      return (
        role === "lecturer" ||
        role === "ta" ||
        role === "instructor"
      );

    });

  }, [users]);


  /* =========================================================
     FILTER SECTIONS
  ========================================================= */

  const filteredSections = useMemo(() => {

    const value =
      search
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
     SELECT SECTION
  ========================================================= */

  function selectSection(section) {

    setSelectedSection(section);

    setActiveTab("students");

    setStudentSearch("");

  }


  /* =========================================================
     SECTION STUDENTS
  ========================================================= */

  const sectionStudents = useMemo(() => {

    if (!selectedSection) {
      return [];
    }

    const sectionId =
      Number(selectedSection.id);

    const sectionEnrollments =
      enrollments.filter(
        (item) =>
          Number(item.section_id) ===
          sectionId
      );


    return sectionEnrollments
      .map((enrollment) => {

        const student =
          students.find(
            (item) =>
              Number(
                item.student_id ??
                item.id
              ) ===
              Number(
                enrollment.student_id
              )
          );

        return {

          ...enrollment,

          ...(student || {}),

          student_id:
            enrollment.student_id ??
            student?.student_id ??
            student?.id,

          student_name:
            enrollment.student_name ||
            student?.student_name ||
            [
              student?.first_name,
              student?.last_name,
            ]
              .filter(Boolean)
              .join(" ") ||
            t("sections.unknown_student"),

          email:
            enrollment.email ||
            student?.email ||
            "",

          student_code:
            enrollment.student_code ||
            student?.student_code ||
            "",

        };

      });

  }, [
    selectedSection,
    enrollments,
    students,
  ]);


  /* =========================================================
     FILTER STUDENTS
  ========================================================= */

  const filteredStudents = useMemo(() => {

    const value =
      studentSearch
        .trim()
        .toLowerCase();

    if (!value) {
      return sectionStudents;
    }

    return sectionStudents.filter(
      (student) => {

        const text = [

          student.student_name,

          student.email,

          student.student_code,

          student.phone,

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(value);

      }
    );

  }, [
    sectionStudents,
    studentSearch,
  ]);


  /* =========================================================
     COURSE INFO
  ========================================================= */

  const selectedCourse = useMemo(() => {

    if (!selectedSection) {
      return null;
    }

    return courses.find(
      (course) =>
        Number(course.id) ===
        Number(selectedSection.course_id)
    ) || null;

  }, [
    selectedSection,
    courses,
  ]);


  /* =========================================================
     STATS
  ========================================================= */

  const sectionStats = useMemo(() => {

    if (!selectedSection) {

      return {
        students: 0,
        capacity: 0,
        available: 0,
      };

    }

    const capacity =
      Number(
        selectedSection.capacity || 0
      );

    const studentsCount =
      sectionStudents.filter(
        (student) =>
          String(
            student.status ||
            "active"
          ).toLowerCase() ===
          "active"
      ).length;

    return {

      students:
        studentsCount,

      capacity,

      available:
        Math.max(
          capacity -
          studentsCount,
          0
        ),

    };

  }, [
    selectedSection,
    sectionStudents,
  ]);


  /* =========================================================
     SECTION FORM
  ========================================================= */

  function openCreateSection() {

    setEditingSection(null);

    setSectionForm({

      courseId:
        courses.length
          ? String(courses[0].id)
          : "",

      sectionName: "",

      academicYear:
        "2026/2027",

      semester: "1",

      lecturerId: "",

      capacity: 100,

    });

    setError("");

    setShowSectionModal(true);

  }


  function openEditSection(section) {

    setEditingSection(section);

    setSectionForm({

      courseId:
        String(
          section.course_id || ""
        ),

      sectionName:
        section.section_name || "",

      academicYear:
        section.academic_year || "",

      semester:
        section.semester || "1",

      lecturerId:
        section.lecturer_id
          ? String(
              section.lecturer_id
            )
          : "",

      capacity:
        section.capacity || 100,

    });

    setError("");

    setShowSectionModal(true);

  }


  function closeSectionModal() {

    if (saving) {
      return;
    }

    setShowSectionModal(false);

    setEditingSection(null);

  }


  function handleSectionInput(e) {

    const {
      name,
      value,
    } = e.target;

    setSectionForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  }


  /* =========================================================
     SAVE SECTION
  ========================================================= */

  async function handleSectionSubmit(e) {

    e.preventDefault();

    if (!sectionForm.courseId) {
      toast.error(
        t("sections.please_select_a_course")
      );
      return;
    }

    if (
      !sectionForm.sectionName.trim()
    ) {
      toast.error(
        t("sections.please_enter_section_name")
      );
      return;
    }

    if (
      !sectionForm.academicYear.trim()
    ) {
      toast.error(
        t("sections.please_enter_academic_year")
      );
      return;
    }

    try {

      setSaving(true);

      const payload = {

        courseId:
          Number(
            sectionForm.courseId
          ),

        sectionName:
          sectionForm.sectionName.trim(),

        academicYear:
          sectionForm.academicYear.trim(),

        semester:
          sectionForm.semester,

        lecturerId:
          sectionForm.lecturerId
            ? Number(
                sectionForm.lecturerId
              )
            : null,

        capacity:
          Number(
            sectionForm.capacity
          ),

      };


      if (editingSection) {

        await updateSection(
          editingSection.id,
          payload
        );

      } else {

        await createSection(
          payload
        );

      }


      await loadData();

      setShowSectionModal(false);

      setEditingSection(null);

    } catch (err) {

      console.error(
        "Save section error:",
        err
      );

      toast.error(
        err.message ||
          t("sections.failed_to_save_section")
      );

    } finally {

      setSaving(false);

    }

  }


  /* =========================================================
     DELETE SECTION
  ========================================================= */

  async function handleDeleteSection(section) {

    const confirmed =
      window.confirm(
        t("sections.confirmDelete").replace("{name}", section.section_name)
      );

    if (!confirmed) {
      return;
    }

    try {

      await deleteSection(
        section.id
      );

      if (
        Number(
          selectedSection?.id
        ) ===
        Number(section.id)
      ) {

        setSelectedSection(null);

      }

      await loadData();

    } catch (err) {

      toast.error(
        err.message ||
          t("sections.failed_to_delete_section")
      );

    }

  }


  /* =========================================================
     ADD STUDENT
  ========================================================= */

  function openAddStudent() {

    if (!selectedSection) {
      return;
    }

    setStudentEmail("");

    setAddStudentError("");

    setAddStudentSuccess("");

    setShowAddStudent(true);

  }


  async function handleAddStudent(e) {

    e.preventDefault();

    setAddStudentError("");

    setAddStudentSuccess("");


    const normalizedEmail =
      studentEmail
        .trim()
        .toLowerCase();


    if (!normalizedEmail) {

      setAddStudentError(
        t("sections.please_enter_the_student_s_email")
      );

      return;

    }


    if (!selectedSection) {

      setAddStudentError(
        t("sections.please_select_a_section_first")
      );

      return;

    }


    const student =
      students.find(
        (item) =>
          String(
            item.email || ""
          )
            .trim()
            .toLowerCase() ===
          normalizedEmail
      );


    if (!student) {

      setAddStudentError(
        t("sections.no_registered_student_was_found_with_thi")
      );

      return;

    }


    const studentId =
      Number(
        student.student_id ??
        student.id
      );


    if (!studentId) {

      setAddStudentError(
        t("sections.student_id_is_invalid")
      );

      return;

    }


    const alreadyEnrolled =
      sectionStudents.some(
        (item) =>
          Number(
            item.student_id
          ) === studentId
      );


    if (alreadyEnrolled) {

      setAddStudentError(
        t("sections.this_student_is_already_enrolled_in_this")
      );

      return;

    }


    if (
      sectionStats.capacity > 0 &&
      sectionStats.students >=
        sectionStats.capacity
    ) {

      setAddStudentError(
        t("sections.this_section_has_reached_its_capacity")
      );

      return;

    }


    try {

      setAddingStudent(true);


      await enrollStudent(
        studentId,
        Number(
          selectedSection.id
        )
      );


      setAddStudentSuccess(
        t("sections.addedSuccess").replace("{email}", student.email)
      );


      await loadData();


      setStudentEmail("");


    } catch (err) {

      console.error(
        "Add student error:",
        err
      );

      setAddStudentError(
        err.message ||
        t("sections.failed_to_enroll_student")
      );

    } finally {

      setAddingStudent(false);

    }

  }


  /* =========================================================
     REMOVE STUDENT
  ========================================================= */

  async function handleRemoveStudent(student) {

    const confirmed =
      window.confirm(
        t("sections.confirmRemove").replace("{name}", student.student_name)
      );

    if (!confirmed) {
      return;
    }


    if (!student.id) {

      toast.error(
        t("sections.enrollment_id_is_missing")
      );

      return;

    }


    try {

      await removeEnrollment(
        student.id
      );


      await loadData();

    } catch (err) {

      toast.error(
        err.message ||
          t("sections.failed_to_remove_student")
      );

    }

  }


  /* =========================================================
     EDIT STUDENT
  ========================================================= */

  function openEditStudent(student) {

    setEditingStudent(student);

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

    setShowEditStudent(true);

  }


  function handleStudentInput(e) {

    const {
      name,
      value,
    } = e.target;

    setStudentForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );

  }


  async function handleEditStudent(e) {

    e.preventDefault();

    if (!editingStudent) {
      return;
    }

    try {

      setEditingStudentSaving(true);


      await updateStudent(
        editingStudent.student_id ||
        editingStudent.id,
        {

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

          password:
            studentForm.password ||
            undefined,

        }
      );


      setShowEditStudent(false);

      setEditingStudent(null);

      await loadData();

    } catch (err) {

      toast.error(
        err.message ||
          t("sections.failed_to_update_student")
      );

    } finally {

      setEditingStudentSaving(false);

    }

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="dashboard-page admin-sections-page">

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">


        <header className="dashboard-header">

          <div>

            <div className="admin-breadcrumb">
              {t("sections.home")}
              <span>/</span>
              {t("sections.sections")}
            </div>

            <h1>
              {t("sections.sections")}
            </h1>

            <p>
              {t("sections.manage_course_sections_students_and_acad")}
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


        <section className="dashboard-content">


          {/* =================================================
              TOP STATS
          ================================================= */}

          <div className="section-stat-grid">

            <div className="section-stat-card">

              <div className="section-stat-icon blue">
                <SectionIcon name="grid" size={18} />
              </div>

              <div>

                <strong>
                  {sections.length}
                </strong>

                <span>
                  {t("sections.total_sections")}
                </span>

                <small>
                  {t("sections.academic_sections")}
                </small>

              </div>

            </div>


            <div className="section-stat-card">

              <div className="section-stat-icon purple">
                <SectionIcon name="users" size={18} />
              </div>

              <div>

                <strong>
                  {enrollments.length}
                </strong>

                <span>
                  {t("sections.total_enrollments")}
                </span>

                <small>
                  {t("sections.across_all_sections")}
                </small>

              </div>

            </div>


            <div className="section-stat-card">

              <div className="section-stat-icon green">
                <SectionIcon name="book" size={18} />
              </div>

              <div>

                <strong>
                  {courses.length}
                </strong>

                <span>
                  {t("sections.active_courses")}
                </span>

                <small>
                  {t("sections.available_courses")}
                </small>

              </div>

            </div>


            <div className="section-stat-card">

              <div className="section-stat-icon orange">
                <SectionIcon name="briefcase" size={18} />
              </div>

              <div>

                <strong>
                  {lecturers.length}
                </strong>

                <span>
                  {t("sections.lecturers")}
                </span>

                <small>
                  {t("sections.teaching_staff")}
                </small>

              </div>

            </div>


            <button
              className="section-add-top-button"
              onClick={
                openCreateSection
              }
            >
              <span>
                <SectionIcon name="plus" size={16} />
              </span>
              {t("sections.add_section")}
            </button>

          </div>


          {/* =================================================
              MASTER DETAIL
          ================================================= */}

          <div className="sections-workspace">


            {/* =================================================
                SECTION LIST
            ================================================= */}

            <div className="sections-list-panel">

              <div className="sections-list-header">

                <div>

                  <h2>
                    {t("sections.sections_list")}
                  </h2>

                  <p>
                    {t("sections.select_a_section_to_manage_students_and")}
                  </p>

                </div>

              </div>


              <div className="sections-list-search">

                <span>
                  <SectionIcon name="search" size={16} />
                </span>

                <input
                  type="text"
                  placeholder={t("sections.search_course_section_or_lecturer")}
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                />

              </div>


              <div className="sections-list">

                {loading ? (

                  <div className="section-list-empty">
                    {t("sections.loading_sections")}
                  </div>

                ) : filteredSections.length === 0 ? (

                  <div className="section-list-empty">

                    <strong>
                      {t("sections.no_sections_found")}
                    </strong>

                    <span>
                      {t("sections.create_your_first_section")}
                    </span>

                  </div>

                ) : (

                  filteredSections.map(
                    (section) => {

                      const count =
                        enrollments.filter(
                          (item) =>
                            Number(
                              item.section_id
                            ) ===
                            Number(
                              section.id
                            )
                        ).length;


                      const active =
                        Number(
                          selectedSection?.id
                        ) ===
                        Number(
                          section.id
                        );


                      return (

                        <button
                          key={
                            section.id
                          }
                          className={
                            `section-list-item ${
                              active
                                ? "selected"
                                : ""
                            }`
                          }
                          onClick={() =>
                            selectSection(
                              section
                            )
                          }
                        >

                          <div className="section-list-icon">
                            <SectionIcon name="book" size={18} />
                          </div>


                          <div className="section-list-info">

                            <strong>

                              {section.course_code}
                              {" - "}
                              {section.course_name}

                            </strong>

                            <span>

                              {t("sections.section")}{" "}
                              {section.section_name}

                              <span className="section-sep">/</span>

                              {t("sections.semester")}{" "}
                              {section.semester}

                              <span className="section-sep">/</span>

                              {section.academic_year}

                            </span>

                            <small>

                              <SectionIcon name="user" size={12} />{" "}
                              {section.lecturer_name ||
                                t("sections.not_assigned")}

                            </small>

                          </div>


                          <div className="section-list-count">

                            {count}

                          </div>


                          <span className="section-list-arrow">
                            <SectionIcon name="chevron" size={14} />
                          </span>

                        </button>

                      );

                    }
                  )

                )}

              </div>

            </div>


            {/* =================================================
                DETAIL
            ================================================= */}

            <div className="section-detail-panel">


              {!selectedSection ? (

                <div className="section-detail-empty">

                  <div className="section-empty-icon">
                    <SectionIcon name="book" size={24} />
                  </div>

                  <h2>
                    {t("sections.select_a_section")}
                  </h2>

                  <p>
                    {t("sections.choose_a_section_from_the_list_to_view_s")}
                  </p>

                </div>

              ) : (

                <>

                  {/* =================================================
                      DETAIL HEADER
                  ================================================= */}

                  <div className="section-detail-header">

                    <div className="section-detail-title">

                      <div className="section-detail-icon">
                        <SectionIcon name="book" size={20} />
                      </div>

                      <div>

                        <div className="section-code-row">

                          <h2>

                            {selectedSection.course_code}
                            {" - "}
                            {selectedSection.course_name}

                          </h2>

                          <span className="active-status">
                            {t("sections.active")}
                          </span>

                        </div>


                        <p>

                          {t("sections.section")}{" "}
                          <strong>
                            {selectedSection.section_name}
                          </strong>

                          <span className="section-sep">/</span>

                          {t("sections.semester")}{" "}
                          {selectedSection.semester}

                          <span className="section-sep">/</span>

                          {selectedSection.academic_year}

                        </p>


                        <small>

                          <SectionIcon name="user" size={12} />{" "}
                          {selectedSection.lecturer_name ||
                            t("sections.no_lecturer_assigned")}

                        </small>

                      </div>

                    </div>


                    <div className="section-detail-actions">

                      <button
                        className="detail-edit-button"
                        onClick={() =>
                          openEditSection(
                            selectedSection
                          )
                        }
                      >
                        <SectionIcon name="edit" size={15} /> {t("sections.edit_section")}
                      </button>


                      <button
                        className="detail-delete-button"
                        onClick={() =>
                          handleDeleteSection(
                            selectedSection
                          )
                        }
                      >
                        {t("sections.delete")}
                      </button>

                    </div>

                  </div>


                  {/* =================================================
                      TABS
                  ================================================= */}

                  <div className="section-tabs">

                    <button
                      className={
                        activeTab === "overview"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          "overview"
                        )
                      }
                    >
                      <span>
                        <SectionIcon name="grid" size={15} />
                      </span>
                      {t("sections.overview")}
                    </button>


                    <button
                      className={
                        activeTab === "students"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          "students"
                        )
                      }
                    >
                      <span>
                        <SectionIcon name="users" size={15} />
                      </span>
                      {t("sections.students")}
                      <b>
                        {sectionStats.students}
                      </b>
                    </button>


                    <button
                      className={
                        activeTab === "content"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          "content"
                        )
                      }
                    >
                      <span>
                        <SectionIcon name="book" size={15} />
                      </span>
                      {t("sections.course_content")}
                    </button>


                    <button
                      className={
                        activeTab === "settings"
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setActiveTab(
                          "settings"
                        )
                      }
                    >
                      <span>
                        <SectionIcon name="gear" size={15} />
                      </span>
                      {t("sections.settings")}
                    </button>

                  </div>


                  {/* =================================================
                      OVERVIEW
                  ================================================= */}

                  {activeTab === "overview" && (

                    <div className="section-tab-content">

                      <div className="detail-overview-grid">


                        <div className="detail-info-card">

                          <span>
                            {t("sections.course_code")}
                          </span>

                          <strong>
                            {selectedSection.course_code}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            {t("sections.section")}
                          </span>

                          <strong>
                            {selectedSection.section_name}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            {t("sections.academic_year")}
                          </span>

                          <strong>
                            {selectedSection.academic_year}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            {t("sections.semester")}
                          </span>

                          <strong>
                            {t("sections.semester")}{" "}
                            {selectedSection.semester}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            {t("sections.students")}
                          </span>

                          <strong>
                            {sectionStats.students}
                            {" / "}
                            {sectionStats.capacity}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            {t("sections.available_seats")}
                          </span>

                          <strong>
                            {sectionStats.available}
                          </strong>

                        </div>

                      </div>

                    </div>

                  )}


                  {/* =================================================
                      STUDENTS
                  ================================================= */}

                  {activeTab === "students" && (

                    <div className="section-tab-content">


                      <div className="students-toolbar">

                        <div>

                          <h3>
                            {t("sections.students_in_this_section")}
                          </h3>

                          <p>
                            {t("sections.manage_students_enrolled_in_this_section")}
                          </p>

                        </div>


                        <button
                          className="add-student-button"
                          onClick={
                            openAddStudent
                          }
                        >
                          <span>
                            <SectionIcon name="plus" size={15} />
                          </span>

                          {t("sections.add_student")}
                        </button>

                      </div>


                      <div className="students-summary-row">

                        <div>

                          <strong>
                            {sectionStats.students}
                          </strong>

                          <span>
                            {t("sections.active_students")}
                          </span>

                        </div>


                        <div>

                          <strong>
                            {sectionStats.available}
                          </strong>

                          <span>
                            {t("sections.available_seats")}
                          </span>

                        </div>


                        <div>

                          <strong>
                            {sectionStats.capacity}
                          </strong>

                          <span>
                            {t("sections.section_capacity")}
                          </span>

                        </div>

                      </div>


                      <div className="student-search-box">

                        <span>
                          <SectionIcon name="search" size={16} />
                        </span>

                        <input
                          type="text"
                          placeholder={t("sections.search_students_by_name_email_or_id")}
                          value={
                            studentSearch
                          }
                          onChange={(e) =>
                            setStudentSearch(
                              e.target.value
                            )
                          }
                        />

                      </div>


                      {filteredStudents.length === 0 ? (

                        <div className="section-empty-students">

                          <div>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                          </div>

                          <h3>
                            {t("sections.no_students_enrolled")}
                          </h3>

                          <p>
                            {t("sections.add_a_registered_student_using_their_ema")}
                          </p>

                          <button
                            onClick={
                              openAddStudent
                            }
                          >
                            {t("sections.add_student_2")}
                          </button>

                        </div>

                      ) : (

                        <div className="students-table-wrapper">

                          <table className="section-students-table">

                            <thead>

                              <tr>

                                <th>
                                  #
                                </th>

                                <th>{t("role.student")}</th>

                                <th>
                                  {t("sections.student_id")}
                                </th>

                                <th>
                                  {t("sections.email")}
                                </th>

                                <th>
                                  {t("sections.status")}
                                </th>

                                <th>
                                  {t("sections.actions")}
                                </th>

                              </tr>

                            </thead>


                            <tbody>

                              {filteredStudents.map(
                                (
                                  student,
                                  index
                                ) => (

                                  <tr
                                    key={
                                      student.id ||
                                      student.student_id
                                    }
                                  >

                                    <td>
                                      {index + 1}
                                    </td>


                                    <td>

                                      <div className="student-name-cell">

                                        <div className="student-avatar">
                                          {String(
                                            student.student_name ||
                                            "S"
                                          )
                                            .charAt(0)
                                            .toUpperCase()}
                                        </div>

                                        <div>

                                          <strong>
                                            {
                                              student.student_name
                                            }
                                          </strong>

                                          <span>{t("role.student")}</span>

                                        </div>

                                      </div>

                                    </td>


                                    <td>

                                      <strong>
                                        {
                                          student.student_code ||
                                          "-"
                                        }
                                      </strong>

                                    </td>


                                    <td>

                                      {
                                        student.email ||
                                        "-"
                                      }

                                    </td>


                                    <td>

                                      <span
                                        className={
                                          String(
                                            student.status ||
                                            "active"
                                          ).toLowerCase() ===
                                          "active"
                                            ? "student-status active"
                                            : "student-status inactive"
                                        }
                                      >

                                        {
                                          student.status ||
                                          "active"
                                        }

                                      </span>

                                    </td>


                                    <td>

                                      <div className="student-actions">

                                        <button
                                          className="student-edit-button"
                                          onClick={() =>
                                            openEditStudent(
                                              student
                                            )
                                          }
                                        >
                                          {t("sections.edit")}
                                        </button>


                                        <button
                                          className="student-remove-button"
                                          onClick={() =>
                                            handleRemoveStudent(
                                              student
                                            )
                                          }
                                        >
                                          {t("sections.remove")}
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

                  )}


                  {/* =================================================
                      CONTENT
                  ================================================= */}

                  {activeTab === "content" && (

                    <div className="section-tab-content">

                      <div className="course-content-card">

                        <div className="course-content-icon">
                          <SectionIcon name="book" size={20} />
                        </div>

                        <div>

                          <h3>
                            {selectedCourse?.course_name ||
                              selectedSection.course_name}
                          </h3>

                          <p>
                            {selectedCourse?.description ||
                              "No course description has been added yet."}
                          </p>

                          <div className="course-content-meta">

                            <span>
                              Code:{" "}
                              {selectedCourse?.course_code ||
                                selectedSection.course_code}
                            </span>

                            <span>
                              {t("sections.credit_hours")}{" "}
                              {selectedCourse?.credit_hours ||
                                "-"}
                            </span>

                          </div>

                        </div>

                      </div>


                      <div className="content-note">

                        <strong>
                          {t("sections.course_content")}
                        </strong>

                        <p>
                          {t("sections.the_current_database_contains_the_course")}
                        </p>

                      </div>

                    </div>

                  )}


                  {/* =================================================
                      SETTINGS
                  ================================================= */}

                  {activeTab === "settings" && (

                    <div className="section-tab-content">

                      <div className="settings-card">

                        <h3>
                          {t("sections.section_settings")}
                        </h3>

                        <p>
                          {t("sections.manage_the_academic_settings_of_this_sec")}
                        </p>


                        <div className="settings-grid">

                          <div>

                            <span>
                              {t("sections.capacity")}
                            </span>

                            <strong>
                              {selectedSection.capacity}
                            </strong>

                          </div>


                          <div>

                            <span>{t("role.lecturer")}</span>

                            <strong>
                              {selectedSection.lecturer_name ||
                                t("sections.not_assigned")}
                            </strong>

                          </div>


                          <div>

                            <span>
                              {t("sections.academic_year")}
                            </span>

                            <strong>
                              {selectedSection.academic_year}
                            </strong>

                          </div>


                          <div>

                            <span>
                              {t("sections.semester")}
                            </span>

                            <strong>
                              {selectedSection.semester}
                            </strong>

                          </div>

                        </div>


                        <button
                          className="detail-edit-button"
                          onClick={() =>
                            openEditSection(
                              selectedSection
                            )
                          }
                        >
                          <SectionIcon name="edit" size={15} /> {t("sections.edit_section")}
                        </button>

                      </div>

                    </div>

                  )}

                </>

              )}

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          ADD SECTION MODAL
      ===================================================== */}

      {showSectionModal && (

        <div className="modal-overlay">

          <div className="user-modal section-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingSection
                    ? "Edit Section"
                    : "Add Section"}
                </h2>

                <p>
                  {t("sections.manage_course_section_information")}
                </p>

              </div>


              <button
                className="modal-close"
                onClick={
                  closeSectionModal
                }
              >
                <SectionIcon name="close" size={15} />
              </button>

            </div>


            <form
              className="user-form"
              onSubmit={
                handleSectionSubmit
              }
            >

              <div className="form-group">

                <label>
                  {t("sections.course")}
                </label>

                <select
                  name="courseId"
                  value={
                    sectionForm.courseId
                  }
                  onChange={
                    handleSectionInput
                  }
                  required
                >

                  <option value="">
                    {t("sections.select_course")}
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


              <div className="form-group">

                <label>
                  {t("sections.section_name")}
                </label>

                <input
                  type="text"
                  name="sectionName"
                  placeholder={t("sections.section_a")}
                  value={
                    sectionForm.sectionName
                  }
                  onChange={
                    handleSectionInput
                  }
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    {t("sections.academic_year")}
                  </label>

                  <input
                    type="text"
                    name="academicYear"
                    value={
                      sectionForm.academicYear
                    }
                    onChange={
                      handleSectionInput
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    {t("sections.semester")}
                  </label>

                  <select
                    name="semester"
                    value={
                      sectionForm.semester
                    }
                    onChange={
                      handleSectionInput
                    }
                  >

                    <option value="1">
                      {t("sections.semester_1")}
                    </option>

                    <option value="2">
                      {t("sections.semester_2")}
                    </option>

                    <option value="summer">
                      {t("sections.summer")}
                    </option>

                  </select>

                </div>

              </div>


              <div className="form-group">

                <label>{t("role.lecturer")}</label>

                <select
                  name="lecturerId"
                  value={
                    sectionForm.lecturerId
                  }
                  onChange={
                    handleSectionInput
                  }
                >

                  <option value="">
                    {t("sections.not_assigned")}
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

                        {lecturer.first_name}{" "}
                        {lecturer.last_name}

                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-group">

                <label>
                  {t("sections.capacity")}
                </label>

                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={
                    sectionForm.capacity
                  }
                  onChange={
                    handleSectionInput
                  }
                  required
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={
                    closeSectionModal
                  }
                >
                  {t("sections.cancel")}
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? t("sections.saving")
                    : editingSection
                      ? t("sections.save_changes")
                      : "Create Section"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          ADD STUDENT MODAL
      ===================================================== */}

      {showAddStudent && (

        <div className="modal-overlay">

          <div className="user-modal student-add-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {t("sections.add_student")}
                </h2>

                <p>
                  {t("sections.add_a_registered_student_to_this_section")}
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setShowAddStudent(false)
                }
              >
                <SectionIcon name="close" size={15} />
              </button>

            </div>


            <form
              className="user-form"
              onSubmit={
                handleAddStudent
              }
            >

              <div className="selected-section-preview">

                <div>
                  <SectionIcon name="book" size={20} />
                </div>

                <div>

                  <strong>

                    {selectedSection.course_code}
                    {" - "}
                    {selectedSection.course_name}

                  </strong>

                  <span>

                    {t("sections.section")}{" "}
                    {selectedSection.section_name}

                  </span>

                </div>

              </div>


              <div className="form-group">

                <label>
                  {t("sections.student_email")}
                </label>

                <input
                  type="email"
                  placeholder="student@example.com"
                  value={
                    studentEmail
                  }
                  onChange={(e) =>
                    setStudentEmail(
                      e.target.value
                    )
                  }
                  required
                  autoFocus
                />

              </div>


              {addStudentError && (

                <div className="form-message error">
                  {addStudentError}
                </div>

              )}


              {addStudentSuccess && (

                <div className="form-message success">
                  {addStudentSuccess}
                </div>

              )}


              <div className="modal-actions">

                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={() =>
                    setShowAddStudent(false)
                  }
                >
                  {t("sections.close")}
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    addingStudent
                  }
                >
                  {addingStudent
                    ? t("sections.adding")
                    : t("sections.add_student")}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =====================================================
          EDIT STUDENT MODAL
      ===================================================== */}

      {showEditStudent && (

        <div className="modal-overlay">

          <div className="user-modal student-edit-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {t("sections.edit_student")}
                </h2>

                <p>
                  {t("sections.update_student_account_information")}
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setShowEditStudent(false)
                }
              >
                <SectionIcon name="close" size={15} />
              </button>

            </div>


            <form
              className="user-form"
              onSubmit={
                handleEditStudent
              }
            >

              <div className="form-row">

                <div className="form-group">

                  <label>
                    {t("sections.first_name")}
                  </label>

                  <input
                    name="firstName"
                    value={
                      studentForm.firstName
                    }
                    onChange={
                      handleStudentInput
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    {t("sections.last_name")}
                  </label>

                  <input
                    name="lastName"
                    value={
                      studentForm.lastName
                    }
                    onChange={
                      handleStudentInput
                    }
                    required
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  {t("sections.email")}
                </label>

                <input
                  type="email"
                  name="email"
                  value={
                    studentForm.email
                  }
                  onChange={
                    handleStudentInput
                  }
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    {t("sections.student_id")}
                  </label>

                  <input
                    name="studentCode"
                    value={
                      studentForm.studentCode
                    }
                    onChange={
                      handleStudentInput
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    {t("sections.phone")}
                  </label>

                  <input
                    name="phone"
                    value={
                      studentForm.phone
                    }
                    onChange={
                      handleStudentInput
                    }
                  />

                </div>

              </div>


              <div className="form-group">

                <label>
                  {t("sections.status")}
                </label>

                <select
                  name="status"
                  value={
                    studentForm.status
                  }
                  onChange={
                    handleStudentInput
                  }
                >

                  <option value="active">
                    {t("sections.active")}
                  </option>

                  <option value="inactive">
                    {t("sections.inactive")}
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  {t("sections.new_password")}
                  <small>
                    {t("sections.optional")}
                  </small>
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder={t("sections.leave_empty_to_keep_current_password")}
                  value={
                    studentForm.password
                  }
                  onChange={
                    handleStudentInput
                  }
                />

              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={() =>
                    setShowEditStudent(false)
                  }
                >
                  {t("sections.cancel")}
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    editingStudentSaving
                  }
                >
                  {editingStudentSaving
                    ? t("sections.saving")
                    : t("sections.save_changes")}
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