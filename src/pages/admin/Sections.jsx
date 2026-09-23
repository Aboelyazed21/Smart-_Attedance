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


function Sections() {
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
        "Failed to load sections."
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
            "Unknown Student",

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
      alert(
        "Please select a course."
      );
      return;
    }

    if (
      !sectionForm.sectionName.trim()
    ) {
      alert(
        "Please enter section name."
      );
      return;
    }

    if (
      !sectionForm.academicYear.trim()
    ) {
      alert(
        "Please enter academic year."
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

      alert(
        err.message ||
        "Failed to save section."
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
        `Delete section "${section.section_name}"?`
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

      alert(
        err.message ||
        "Failed to delete section."
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
        "Please enter the student's email."
      );

      return;

    }


    if (!selectedSection) {

      setAddStudentError(
        "Please select a section first."
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
        "No registered student was found with this email."
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
        "Student ID is invalid."
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
        "This student is already enrolled in this section."
      );

      return;

    }


    if (
      sectionStats.capacity > 0 &&
      sectionStats.students >=
        sectionStats.capacity
    ) {

      setAddStudentError(
        "This section has reached its capacity."
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
        `${student.email} was added successfully.`
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
        "Failed to enroll student."
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
        `Remove ${student.student_name} from this section?`
      );

    if (!confirmed) {
      return;
    }


    if (!student.id) {

      alert(
        "Enrollment ID is missing."
      );

      return;

    }


    try {

      await removeEnrollment(
        student.id
      );


      await loadData();

    } catch (err) {

      alert(
        err.message ||
        "Failed to remove student."
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

      alert(
        err.message ||
        "Failed to update student."
      );

    } finally {

      setEditingStudentSaving(false);

    }

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <div className="dashboard-page">

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="dashboard-main">


        <header className="dashboard-header">

          <div>

            <div className="admin-breadcrumb">
              Home
              <span>›</span>
              Sections
            </div>

            <h1>
              Sections
            </h1>

            <p>
              Manage course sections,
              students and academic content
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
                ▤
              </div>

              <div>

                <strong>
                  {sections.length}
                </strong>

                <span>
                  Total Sections
                </span>

                <small>
                  Academic sections
                </small>

              </div>

            </div>


            <div className="section-stat-card">

              <div className="section-stat-icon purple">
                👥
              </div>

              <div>

                <strong>
                  {enrollments.length}
                </strong>

                <span>
                  Total Enrollments
                </span>

                <small>
                  Across all sections
                </small>

              </div>

            </div>


            <div className="section-stat-card">

              <div className="section-stat-icon green">
                📚
              </div>

              <div>

                <strong>
                  {courses.length}
                </strong>

                <span>
                  Active Courses
                </span>

                <small>
                  Available courses
                </small>

              </div>

            </div>


            <div className="section-stat-card">

              <div className="section-stat-icon orange">
                🎓
              </div>

              <div>

                <strong>
                  {lecturers.length}
                </strong>

                <span>
                  Lecturers
                </span>

                <small>
                  Teaching staff
                </small>

              </div>

            </div>


            <button
              className="section-add-top-button"
              onClick={
                openCreateSection
              }
            >
              <span>+</span>
              Add Section
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
                    Sections List
                  </h2>

                  <p>
                    Select a section to manage
                    students and course information
                  </p>

                </div>

              </div>


              <div className="sections-list-search">

                <span>
                  🔍
                </span>

                <input
                  type="text"
                  placeholder="Search course, section or lecturer..."
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
                    Loading sections...
                  </div>

                ) : filteredSections.length === 0 ? (

                  <div className="section-list-empty">

                    <strong>
                      No sections found
                    </strong>

                    <span>
                      Create your first section.
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
                            📚
                          </div>


                          <div className="section-list-info">

                            <strong>

                              {section.course_code}
                              {" - "}
                              {section.course_name}

                            </strong>

                            <span>

                              Section{" "}
                              {section.section_name}

                              {" • "}

                              Semester{" "}
                              {section.semester}

                              {" • "}

                              {section.academic_year}

                            </span>

                            <small>

                              👤{" "}
                              {section.lecturer_name ||
                                "Not assigned"}

                            </small>

                          </div>


                          <div className="section-list-count">

                            {count}

                          </div>


                          <span className="section-list-arrow">
                            ›
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
                    📚
                  </div>

                  <h2>
                    Select a Section
                  </h2>

                  <p>
                    Choose a section from the list
                    to view students, course information
                    and management options.
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
                        📚
                      </div>

                      <div>

                        <div className="section-code-row">

                          <h2>

                            {selectedSection.course_code}
                            {" - "}
                            {selectedSection.course_name}

                          </h2>

                          <span className="active-status">
                            ● Active
                          </span>

                        </div>


                        <p>

                          Section{" "}
                          <strong>
                            {selectedSection.section_name}
                          </strong>

                          {" • "}

                          Semester{" "}
                          {selectedSection.semester}

                          {" • "}

                          {selectedSection.academic_year}

                        </p>


                        <small>

                          👤{" "}
                          {selectedSection.lecturer_name ||
                            "No lecturer assigned"}

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
                        ✎ Edit Section
                      </button>


                      <button
                        className="detail-delete-button"
                        onClick={() =>
                          handleDeleteSection(
                            selectedSection
                          )
                        }
                      >
                        Delete
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
                      <span>◉</span>
                      Overview
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
                      <span>👥</span>
                      Students
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
                      <span>📖</span>
                      Course Content
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
                      <span>⚙</span>
                      Settings
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
                            Course Code
                          </span>

                          <strong>
                            {selectedSection.course_code}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            Section
                          </span>

                          <strong>
                            {selectedSection.section_name}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            Academic Year
                          </span>

                          <strong>
                            {selectedSection.academic_year}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            Semester
                          </span>

                          <strong>
                            Semester{" "}
                            {selectedSection.semester}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            Students
                          </span>

                          <strong>
                            {sectionStats.students}
                            {" / "}
                            {sectionStats.capacity}
                          </strong>

                        </div>


                        <div className="detail-info-card">

                          <span>
                            Available Seats
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
                            Students in This Section
                          </h3>

                          <p>
                            Manage students enrolled
                            in this section.
                          </p>

                        </div>


                        <button
                          className="add-student-button"
                          onClick={
                            openAddStudent
                          }
                        >
                          <span>
                            +
                          </span>

                          Add Student
                        </button>

                      </div>


                      <div className="students-summary-row">

                        <div>

                          <strong>
                            {sectionStats.students}
                          </strong>

                          <span>
                            Active Students
                          </span>

                        </div>


                        <div>

                          <strong>
                            {sectionStats.available}
                          </strong>

                          <span>
                            Available Seats
                          </span>

                        </div>


                        <div>

                          <strong>
                            {sectionStats.capacity}
                          </strong>

                          <span>
                            Section Capacity
                          </span>

                        </div>

                      </div>


                      <div className="student-search-box">

                        <span>
                          🔍
                        </span>

                        <input
                          type="text"
                          placeholder="Search students by name, email or ID..."
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
                            👥
                          </div>

                          <h3>
                            No students enrolled
                          </h3>

                          <p>
                            Add a registered student
                            using their email address.
                          </p>

                          <button
                            onClick={
                              openAddStudent
                            }
                          >
                            + Add Student
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

                                <th>
                                  Student
                                </th>

                                <th>
                                  Student ID
                                </th>

                                <th>
                                  Email
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

                                          <span>
                                            Student
                                          </span>

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

                                        ●{" "}
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
                                          Edit
                                        </button>


                                        <button
                                          className="student-remove-button"
                                          onClick={() =>
                                            handleRemoveStudent(
                                              student
                                            )
                                          }
                                        >
                                          Remove
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
                          📖
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
                              Credit Hours:{" "}
                              {selectedCourse?.credit_hours ||
                                "-"}
                            </span>

                          </div>

                        </div>

                      </div>


                      <div className="content-note">

                        <strong>
                          Course Content
                        </strong>

                        <p>
                          The current database contains
                          the course description and academic
                          information. If you want actual
                          lectures, PDFs, videos, assignments
                          and course modules, we can add a
                          dedicated course-content system next.
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
                          Section Settings
                        </h3>

                        <p>
                          Manage the academic settings
                          of this section.
                        </p>


                        <div className="settings-grid">

                          <div>

                            <span>
                              Capacity
                            </span>

                            <strong>
                              {selectedSection.capacity}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Lecturer
                            </span>

                            <strong>
                              {selectedSection.lecturer_name ||
                                "Not assigned"}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Academic Year
                            </span>

                            <strong>
                              {selectedSection.academic_year}
                            </strong>

                          </div>


                          <div>

                            <span>
                              Semester
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
                          ✎ Edit Section
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
                  Manage course section information.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={
                  closeSectionModal
                }
              >
                ×
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
                  Course
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


              <div className="form-group">

                <label>
                  Section Name
                </label>

                <input
                  type="text"
                  name="sectionName"
                  placeholder="Section A"
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
                    Academic Year
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
                    Semester
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
                      Semester 1
                    </option>

                    <option value="2">
                      Semester 2
                    </option>

                    <option value="summer">
                      Summer
                    </option>

                  </select>

                </div>

              </div>


              <div className="form-group">

                <label>
                  Lecturer
                </label>

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

                        {lecturer.first_name}{" "}
                        {lecturer.last_name}

                      </option>

                    )
                  )}

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
                  Cancel
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingSection
                      ? "Save Changes"
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
                  Add Student
                </h2>

                <p>
                  Add a registered student
                  to this section using email.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setShowAddStudent(false)
                }
              >
                ×
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
                  📚
                </div>

                <div>

                  <strong>

                    {selectedSection.course_code}
                    {" - "}
                    {selectedSection.course_name}

                  </strong>

                  <span>

                    Section{" "}
                    {selectedSection.section_name}

                  </span>

                </div>

              </div>


              <div className="form-group">

                <label>
                  Student Email
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
                  Close
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    addingStudent
                  }
                >
                  {addingStudent
                    ? "Adding..."
                    : "Add Student"}
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
                  Edit Student
                </h2>

                <p>
                  Update student account information.
                </p>

              </div>


              <button
                className="modal-close"
                onClick={() =>
                  setShowEditStudent(false)
                }
              >
                ×
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
                    First Name
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
                    Last Name
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
                  Email
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
                    Student ID
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
                    Phone
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
                  Status
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
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  New Password
                  <small>
                    Optional
                  </small>
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder="Leave empty to keep current password"
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
                  Cancel
                </button>


                <button
                  type="submit"
                  className="professional-save-button"
                  disabled={
                    editingStudentSaving
                  }
                >
                  {editingStudentSaving
                    ? "Saving..."
                    : "Save Changes"}
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