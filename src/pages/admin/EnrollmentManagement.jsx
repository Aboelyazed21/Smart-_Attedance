import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../services/api";
import "./EnrollmentManagement.css";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        data ||
        `Request failed: ${response.status}`
    );
  }

  return data;
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  studentCode: "",
  password: "",
  status: "active",
};

function getFullName(student) {
  return `${student?.first_name || ""} ${
    student?.last_name || ""
  }`.trim() || "Student";
}

function getInitial(student) {
  return (
    student?.first_name?.charAt(0)?.toUpperCase() ||
    student?.last_name?.charAt(0)?.toUpperCase() ||
    "S"
  );
}

export default function EnrollmentManagement() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [studentForm, setStudentForm] = useState(EMPTY_FORM);

  /* =========================================================
     LOAD STUDENTS + SECTIONS
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [studentsData, sectionsData] = await Promise.all([
        apiRequest("/students"),
        apiRequest("/students/sections/available"),
      ]);

      setStudents(
        Array.isArray(studentsData) ? studentsData : []
      );

      setSections(
        Array.isArray(sectionsData) ? sectionsData : []
      );
    } catch (err) {
      console.error("Students management load error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD SELECTED STUDENT ENROLLMENTS
  ========================================================= */

  async function loadEnrollments(studentId) {
    if (!studentId) {
      setEnrollments([]);
      return;
    }

    try {
      setDetailsLoading(true);

      const data = await apiRequest(
        `/students/${studentId}/enrollments`
      );

      setEnrollments(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error("Enrollment loading error:", err);
      setError(
        err.message || "Failed to load student enrollments"
      );
      setEnrollments([]);
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedStudentId) {
      loadEnrollments(selectedStudentId);
    } else {
      setEnrollments([]);
    }
  }, [selectedStudentId]);

  /* =========================================================
     FILTER STUDENTS
  ========================================================= */

  const filteredStudents = useMemo(() => {
    const query = studentSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      const values = [
        getFullName(student),
        student.student_code,
        student.email,
        student.phone,
        student.status,
      ];

      return values
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [students, studentSearch]);

  /* =========================================================
     FILTER SECTIONS
  ========================================================= */

  const filteredSections = useMemo(() => {
    const query = sectionSearch
      .trim()
      .toLowerCase();

    if (!query) {
      return sections;
    }

    return sections.filter((section) => {
      const values = [
        section.course_code,
        section.course_name,
        section.section_name,
        section.lecturer_name,
      ];

      return values
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [sections, sectionSearch]);

  /* =========================================================
     SELECTED STUDENT
  ========================================================= */

  const selectedStudent = students.find(
    (student) =>
      Number(student.student_id) ===
      Number(selectedStudentId)
  );

  /* =========================================================
     STATS
  ========================================================= */

  const activeStudents = students.filter(
    (student) => student.status === "active"
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status !== "active"
  ).length;

  const activeEnrollments = enrollments.filter(
    (item) => item.enrollment_status === "active"
  ).length;

  /* =========================================================
     STUDENT MODAL
  ========================================================= */

  function openCreateStudent() {
    setEditingStudent(null);

    setStudentForm({
      ...EMPTY_FORM,
      password: "",
    });

    setError("");
    setSuccess("");
    setShowStudentModal(true);
  }

  function openEditStudent(student) {
    setEditingStudent(student);

    setStudentForm({
      firstName: student.first_name || "",
      lastName: student.last_name || "",
      email: student.email || "",
      phone: student.phone || "",
      studentCode: student.student_code || "",
      password: "",
      status: student.status || "active",
    });

    setError("");
    setSuccess("");
    setShowStudentModal(true);
  }

  function closeStudentModal() {
    if (saving) return;

    setShowStudentModal(false);
    setEditingStudent(null);
    setStudentForm(EMPTY_FORM);
    setError("");
  }

  function handleStudentChange(event) {
    const { name, value } = event.target;

    setStudentForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  /* =========================================================
     CREATE / UPDATE STUDENT
  ========================================================= */

  async function handleStudentSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !studentForm.firstName.trim() ||
      !studentForm.lastName.trim() ||
      !studentForm.email.trim() ||
      !studentForm.studentCode.trim()
    ) {
      setError(
        "First name, last name, email and student code are required."
      );
      return;
    }

    if (!editingStudent && !studentForm.password) {
      setError("Password is required for a new student.");
      return;
    }

    try {
      setSaving(true);

      if (editingStudent) {
        const payload = {
          firstName: studentForm.firstName,
          lastName: studentForm.lastName,
          email: studentForm.email,
          phone: studentForm.phone,
          studentCode: studentForm.studentCode,
          status: studentForm.status,
        };

        if (studentForm.password) {
          payload.password = studentForm.password;
        }

        const result = await apiRequest(
          `/students/${editingStudent.student_id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          result.message ||
            "Student updated successfully."
        );
      } else {
        const result = await apiRequest(
          "/students",
          {
            method: "POST",
            body: JSON.stringify({
              firstName: studentForm.firstName,
              lastName: studentForm.lastName,
              email: studentForm.email,
              phone: studentForm.phone,
              studentCode: studentForm.studentCode,
              password: studentForm.password,
            }),
          }
        );

        setSuccess(
          result.message ||
            "Student created successfully."
        );
      }

      closeStudentModal();

      await loadData();
    } catch (err) {
      console.error("Student save error:", err);

      setError(
        err.message ||
          "Failed to save student."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE STUDENT
  ========================================================= */

  async function handleDeleteStudent(student) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${getFullName(
        student
      )}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(
        `/students/${student.student_id}`,
        {
          method: "DELETE",
        }
      );

      if (
        Number(selectedStudentId) ===
        Number(student.student_id)
      ) {
        setSelectedStudentId(null);
        setEnrollments([]);
      }

      setSuccess(
        result.message ||
          "Student deleted successfully."
      );

      await loadData();
    } catch (err) {
      console.error("Student delete error:", err);

      setError(
        err.message ||
          "Failed to delete student."
      );
    }
  }

  /* =========================================================
     ENROLL STUDENT
  ========================================================= */

  async function handleEnroll(event) {
    event.preventDefault();

    if (!selectedStudentId) {
      setError("Please select a student first.");
      return;
    }

    if (!selectedSectionId) {
      setError("Please select a section.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const result = await apiRequest(
        `/students/${selectedStudentId}/enrollments`,
        {
          method: "POST",
          body: JSON.stringify({
            sectionId: Number(selectedSectionId),
          }),
        }
      );

      setSuccess(
        result.message ||
          "Student enrolled successfully."
      );

      setSelectedSectionId("");

      await loadEnrollments(
        selectedStudentId
      );

      await loadData();
    } catch (err) {
      console.error("Enrollment error:", err);

      setError(
        err.message ||
          "Failed to enroll student."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     REMOVE ENROLLMENT
  ========================================================= */

  async function handleRemoveEnrollment(
    enrollmentId
  ) {
    const confirmed = window.confirm(
      "Remove this student from this section?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const result = await apiRequest(
        `/students/enrollments/${enrollmentId}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        result.message ||
          "Enrollment removed successfully."
      );

      await loadEnrollments(
        selectedStudentId
      );

      await loadData();
    } catch (err) {
      console.error(
        "Remove enrollment error:",
        err
      );

      setError(
        err.message ||
          "Failed to remove enrollment."
      );
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  }

  /* =========================================================
     STYLES
  ========================================================= */

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f5f7fb",
      display: "flex",
    },

    sidebar: {
      width: "260px",
      background: "#092b68",
      color: "#fff",
      padding: "28px 18px",
      boxSizing: "border-box",
      position: "fixed",
      top: 0,
      bottom: 0,
      left: 0,
      overflowY: "auto",
      zIndex: 20,
    },

    brand: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginBottom: "30px",
      padding: "4px 8px",
    },

    brandIcon: {
      width: "48px",
      height: "48px",
      borderRadius: "14px",
      background: "#1677ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
    },

    profile: {
      background: "rgba(255,255,255,0.08)",
      borderRadius: "16px",
      padding: "16px",
      display: "flex",
      gap: "12px",
      alignItems: "center",
      marginBottom: "24px",
    },

    avatar: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "#fff",
      color: "#1264d8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      flexShrink: 0,
    },

    nav: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },

    navButton: {
      border: "none",
      background: "transparent",
      color: "#dce9ff",
      padding: "13px 14px",
      borderRadius: "12px",
      cursor: "pointer",
      textAlign: "left",
      fontSize: "14px",
      fontWeight: 700,
    },

    activeNav: {
      background: "#1677ff",
      color: "#fff",
    },

    main: {
      marginLeft: "260px",
      width: "calc(100% - 260px)",
      minHeight: "100vh",
    },

    header: {
      background: "#fff",
      padding: "28px 34px",
      borderBottom: "1px solid #e5eaf2",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
    },

    content: {
      padding: "28px 34px 50px",
    },

    stats: {
      display: "grid",
      gridTemplateColumns:
        "repeat(4, minmax(0, 1fr))",
      gap: "16px",
      marginBottom: "22px",
    },

    stat: {
      background: "#fff",
      border: "1px solid #e8edf5",
      borderRadius: "16px",
      padding: "20px",
      boxShadow:
        "0 8px 25px rgba(15, 23, 42, 0.04)",
    },

    statNumber: {
      fontSize: "28px",
      fontWeight: 800,
      color: "#0f2f66",
      marginTop: "8px",
    },

    card: {
      background: "#fff",
      border: "1px solid #e8edf5",
      borderRadius: "18px",
      padding: "22px",
      boxShadow:
        "0 8px 25px rgba(15, 23, 42, 0.04)",
    },

    grid: {
      display: "grid",
      gridTemplateColumns:
        "minmax(0, 1.35fr) minmax(360px, 0.65fr)",
      gap: "20px",
      alignItems: "start",
    },

    input: {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #d8e0ec",
      borderRadius: "10px",
      padding: "11px 13px",
      outline: "none",
      fontSize: "14px",
      background: "#fff",
    },

    primaryButton: {
      border: "none",
      background: "#1677ff",
      color: "#fff",
      padding: "11px 17px",
      borderRadius: "10px",
      fontWeight: 700,
      cursor: "pointer",
    },

    secondaryButton: {
      border: "1px solid #d8e0ec",
      background: "#fff",
      color: "#173968",
      padding: "10px 15px",
      borderRadius: "10px",
      fontWeight: 700,
      cursor: "pointer",
    },

    dangerButton: {
      border: "none",
      background: "#fee2e2",
      color: "#b91c1c",
      padding: "8px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: 700,
    },

    studentRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "13px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "1px solid transparent",
      background: "#fff",
      width: "100%",
      textAlign: "left",
      marginBottom: "7px",
    },

    selectedRow: {
      background: "#eef5ff",
      border: "1px solid #bcd7ff",
    },

    list: {
      marginTop: "14px",
      maxHeight: "520px",
      overflowY: "auto",
      paddingRight: "4px",
    },

    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(8, 25, 55, 0.62)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      zIndex: 9999,
    },

    modal: {
      width: "min(650px, 100%)",
      maxHeight: "90vh",
      overflowY: "auto",
      background: "#fff",
      borderRadius: "20px",
      padding: "28px",
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.12)",
      boxSizing: "border-box",
    },

    formGrid: {
      display: "grid",
      gridTemplateColumns:
        "1fr 1fr",
      gap: "15px",
    },

    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "7px",
      marginBottom: "15px",
    },

    tableWrap: {
      width: "100%",
      overflowX: "auto",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "760px",
    },

    th: {
      textAlign: "left",
      padding: "13px 12px",
      background: "#f8fafc",
      borderBottom: "1px solid #e5eaf2",
      color: "#475569",
      fontSize: "12px",
      textTransform: "uppercase",
    },

    td: {
      padding: "14px 12px",
      borderBottom: "1px solid #edf1f6",
      color: "#253858",
      fontSize: "14px",
    },
  };

  return (
    <div className="enr-page" style={styles.page}>
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="enr-sidebar" style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.brandIcon}>
            A
          </div>

          <div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              Attendify
            </div>

            <div
              style={{
                fontSize: "10px",
                letterSpacing: "2px",
                opacity: 0.75,
              }}
            >
              SMART ATTENDANCE
            </div>
          </div>
        </div>

        <div style={styles.profile}>
          <div style={styles.avatar}>A</div>

          <div>
            <strong>Administrator</strong>

            <div
              style={{
                fontSize: "12px",
                opacity: 0.75,
                marginTop: "3px",
              }}
            >
              System Admin
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          <button
            style={styles.navButton}
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              navigate("/admin/users")
            }
          >
            Users
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              navigate("/admin/courses")
            }
          >
            Courses
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              navigate("/admin/sections")
            }
          >
            Sections
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              navigate("/admin/rooms")
            }
          >
            Rooms
          </button>

          <button
            style={styles.navButton}
            onClick={() =>
              navigate("/admin/timetable")
            }
          >
            Timetable
          </button>

          <button
            style={{
              ...styles.navButton,
              ...styles.activeNav,
            }}
            aria-current="page"
          >
            Students
          </button>
        </nav>

        <button
          className="enr-logout"
          style={{
            ...styles.navButton,
            position: "absolute",
            bottom: "25px",
            left: "18px",
            right: "18px",
          }}
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="enr-main" style={styles.main}>
        {/* HEADER */}

        <header className="enr-header" style={styles.header}>
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0b2c60",
                fontSize: "28px",
              }}
            >
              Students Management
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: "#64748b",
              }}
            >
              Manage students, accounts and course
              enrollments.
            </p>
          </div>

          <div
            className="enr-header-actions"
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              style={styles.secondaryButton}
              onClick={loadData}
            >
              Refresh
            </button>

            <button
              style={styles.primaryButton}
              onClick={openCreateStudent}
            >
              Add Student
            </button>
          </div>
        </header>

        <section className="enr-content" style={styles.content}>
          {/* ALERTS */}

          {error && !showStudentModal && (
            <div
              role="alert"
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "13px 16px",
                borderRadius: "11px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span>{error}</span>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={loadData}
              >
                Try again
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              style={{
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "13px 16px",
                borderRadius: "11px",
                marginBottom: "18px",
              }}
            >
              {success}
            </div>
          )}

          {/* STATS */}

          <div className="enr-stats" style={styles.stats}>
            <div style={styles.stat}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                TOTAL STUDENTS
              </div>

              <div style={styles.statNumber}>
                {loading ? "..." : students.length}
              </div>
            </div>

            <div style={styles.stat}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                ACTIVE
              </div>

              <div
                style={{
                  ...styles.statNumber,
                  color: "#16a34a",
                }}
              >
                {loading ? "..." : activeStudents}
              </div>
            </div>

            <div style={styles.stat}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                INACTIVE
              </div>

              <div
                style={{
                  ...styles.statNumber,
                  color: "#dc2626",
                }}
              >
                {loading ? "..." : inactiveStudents}
              </div>
            </div>

            <div style={styles.stat}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                SELECTED ENROLLMENTS
              </div>

              <div
                style={{
                  ...styles.statNumber,
                  color: "#2563eb",
                }}
              >
                {selectedStudent
                  ? activeEnrollments
                  : "-"}
              </div>
            </div>
          </div>

          {/* MAIN GRID */}

          <div className="enr-grid" style={styles.grid}>
            {/* STUDENTS */}

            <section style={styles.card}>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#102f61",
                    }}
                  >
                    Students
                  </h2>

                  <p
                    style={{
                      margin:
                        "5px 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    {filteredStudents.length}{" "}
                    student
                    {filteredStudents.length !==
                    1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>

              <input
                style={{
                  ...styles.input,
                  marginTop: "18px",
                }}
                placeholder="Search by name, ID, email or phone..."
                aria-label="Search students"
                value={studentSearch}
                onChange={(event) =>
                  setStudentSearch(
                    event.target.value
                  )
                }
              />

              <div style={styles.list}>
                {loading ? (
                  <div
                    className="enr-loading"
                    role="status"
                  >
                    <span
                      className="enr-spinner"
                      aria-hidden="true"
                    />
                    Loading students...
                  </div>
                ) : filteredStudents.length ===
                  0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "#64748b",
                    }}
                  >
                    <p style={{ margin: "0 0 14px" }}>
                      No students found.
                    </p>

                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={
                        studentSearch
                          ? () => setStudentSearch("")
                          : openCreateStudent
                      }
                    >
                      {studentSearch
                        ? "Clear search"
                        : "Add Student"}
                    </button>
                  </div>
                ) : (
                  filteredStudents.map(
                    (student) => {
                      const selected =
                        Number(
                          selectedStudentId
                        ) ===
                        Number(
                          student.student_id
                        );

                      return (
                        <button
                          key={
                            student.student_id
                          }
                          onClick={() =>
                            setSelectedStudentId(
                              student.student_id
                            )
                          }
                          style={{
                            ...styles.studentRow,
                            ...(selected
                              ? styles.selectedRow
                              : {}),
                          }}
                        >
                          <div
                            style={{
                              ...styles.avatar,
                              background:
                                selected
                                  ? "#1677ff"
                                  : "#eef4ff",
                              color: selected
                                ? "#fff"
                                : "#1764c0",
                            }}
                          >
                            {getInitial(
                              student
                            )}
                          </div>

                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                color:
                                  "#173968",
                              }}
                            >
                              {getFullName(
                                student
                              )}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#64748b",
                                marginTop:
                                  "3px",
                                wordBreak:
                                  "break-word",
                              }}
                            >
                              {
                                student.student_code
                              }{" "}
                              •{" "}
                              {student.email}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize:
                                "11px",
                              fontWeight: 800,
                              padding:
                                "5px 9px",
                              borderRadius:
                                "20px",
                              background:
                                student.status ===
                                "active"
                                  ? "#dcfce7"
                                  : "#fee2e2",
                              color:
                                student.status ===
                                "active"
                                  ? "#15803d"
                                  : "#b91c1c",
                            }}
                          >
                            {student.status ||
                              "unknown"}
                          </span>
                        </button>
                      );
                    }
                  )
                )}
              </div>
            </section>

            {/* STUDENT DETAILS */}

            <section style={styles.card}>
              {!selectedStudent ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "80px 20px",
                    color: "#64748b",
                  }}
                >
                  <h3
                    style={{
                      color: "#243b61",
                      margin:
                        "0 0 7px",
                    }}
                  >
                    Select a student
                  </h3>

                  <p style={{ margin: 0 }}>
                    Select a student to view
                    details and manage
                    enrollments.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "13px",
                      marginBottom:
                        "20px",
                    }}
                  >
                    <div
                      style={{
                        ...styles.avatar,
                        width: "58px",
                        height: "58px",
                        background:
                          "#1677ff",
                        color: "#fff",
                        fontSize: "20px",
                      }}
                    >
                      {getInitial(
                        selectedStudent
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          color:
                            "#102f61",
                        }}
                      >
                        {getFullName(
                          selectedStudent
                        )}
                      </h2>

                      <div
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "13px",
                          marginTop:
                            "4px",
                        }}
                      >
                        {
                          selectedStudent.student_code
                        }
                      </div>
                    </div>
                  </div>

                  {/* DETAILS */}

                  <div
                    style={{
                      background:
                        "#f8fafc",
                      borderRadius:
                        "13px",
                      padding: "15px",
                      marginBottom:
                        "18px",
                    }}
                  >
                    <div
                      className="enr-details-grid"
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "1fr 1fr",
                        gap:
                          "13px",
                      }}
                    >
                      <div>
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Email
                        </small>

                        <div
                          style={{
                            fontWeight:
                              700,
                            color:
                              "#243b61",
                            marginTop:
                              "3px",
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {
                            selectedStudent.email
                          }
                        </div>
                      </div>

                      <div>
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Phone
                        </small>

                        <div
                          style={{
                            fontWeight:
                              700,
                            color:
                              "#243b61",
                            marginTop:
                              "3px",
                          }}
                        >
                          {selectedStudent.phone ||
                            "N/A"}
                        </div>
                      </div>

                      <div>
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Status
                        </small>

                        <div
                          style={{
                            fontWeight:
                              700,
                            color:
                              selectedStudent.status ===
                              "active"
                                ? "#15803d"
                                : "#b91c1c",
                            marginTop:
                              "3px",
                          }}
                        >
                          {
                            selectedStudent.status
                          }
                        </div>
                      </div>

                      <div>
                        <small
                          style={{
                            color:
                              "#64748b",
                          }}
                        >
                          Enrollments
                        </small>

                        <div
                          style={{
                            fontWeight:
                              700,
                            color:
                              "#2563eb",
                            marginTop:
                              "3px",
                          }}
                        >
                          {
                            activeEnrollments
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}

                  <div
                    style={{
                      display: "flex",
                      gap: "9px",
                      marginBottom:
                        "22px",
                    }}
                  >
                    <button
                      style={styles.primaryButton}
                      onClick={() =>
                        openEditStudent(
                          selectedStudent
                        )
                      }
                    >
                      Edit Student
                    </button>

                    <button
                      style={styles.dangerButton}
                      onClick={() =>
                        handleDeleteStudent(
                          selectedStudent
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>

                  {/* ENROLL */}

                  <div
                    style={{
                      borderTop:
                        "1px solid #e8edf5",
                      paddingTop: "20px",
                    }}
                  >
                    <h3
                      style={{
                        margin:
                          "0 0 5px",
                        color:
                          "#173968",
                      }}
                    >
                      Add Enrollment
                    </h3>

                    <p
                      style={{
                        color:
                          "#64748b",
                        fontSize:
                          "13px",
                        margin:
                          "0 0 14px",
                      }}
                    >
                      Assign this student
                      to a course section.
                    </p>

                    <input
                      style={{
                        ...styles.input,
                        marginBottom:
                          "10px",
                      }}
                      placeholder="Search course, section or lecturer..."
                      aria-label="Search sections"
                      value={sectionSearch}
                      onChange={(event) =>
                        setSectionSearch(
                          event.target.value
                        )
                      }
                    />

                    <form
                      onSubmit={
                        handleEnroll
                      }
                    >
                      <select
                        aria-label="Select section"
                        style={{
                          ...styles.input,
                          marginBottom:
                            "10px",
                        }}
                        value={
                          selectedSectionId
                        }
                        onChange={(event) =>
                          setSelectedSectionId(
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Select Section
                        </option>

                        {filteredSections.map(
                          (section) => {
                            const full =
                              section.capacity !==
                                null &&
                              Number(
                                section.available_seats
                              ) <= 0;

                            return (
                              <option
                                key={
                                  section.section_id
                                }
                                value={
                                  section.section_id
                                }
                                disabled={
                                  full
                                }
                              >
                                {
                                  section.course_code
                                }{" "}
                                -{" "}
                                {
                                  section.course_name
                                }{" "}
                                | Section{" "}
                                {
                                  section.section_name
                                }{" "}
                                | Seats:{" "}
                                {section.available_seats ??
                                  "N/A"}
                              </option>
                            );
                          }
                        )}
                      </select>

                      <button
                        type="submit"
                        style={{
                          ...styles.primaryButton,
                          width: "100%",
                          opacity:
                            saving ||
                            !selectedSectionId
                              ? 0.6
                              : 1,
                        }}
                        disabled={
                          saving ||
                          !selectedSectionId
                        }
                      >
                        {saving
                          ? "Processing..."
                          : "Enroll Student"}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* ENROLLMENT TABLE */}

          <section
            style={{
              ...styles.card,
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom:
                  "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#102f61",
                  }}
                >
                  Student Enrollments
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color: "#64748b",
                    fontSize:
                      "13px",
                  }}
                >
                  {selectedStudent
                    ? `Enrollments for ${getFullName(
                        selectedStudent
                      )}`
                    : "Select a student to view enrollments."}
                </p>
              </div>

              {selectedStudent && (
                <span
                  style={{
                    background:
                      "#eef5ff",
                    color:
                      "#2563eb",
                    padding:
                      "8px 12px",
                    borderRadius:
                      "20px",
                    fontWeight:
                      800,
                  }}
                >
                  {enrollments.length}
                </span>
              )}
            </div>

            {!selectedStudent ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "#64748b",
                }}
              >
                Select a student first.
              </div>
            ) : detailsLoading ? (
              <div
                className="enr-loading"
                role="status"
              >
                <span
                  className="enr-spinner"
                  aria-hidden="true"
                />
                Loading enrollments...
              </div>
            ) : enrollments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "#64748b",
                }}
              >
                <p style={{ margin: "0 0 14px" }}>
                  No enrollments found.
                </p>

                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() =>
                    loadEnrollments(selectedStudentId)
                  }
                >
                  Refresh
                </button>
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        Course
                      </th>

                      <th style={styles.th}>
                        Section
                      </th>

                      <th style={styles.th}>
                        Lecturer
                      </th>

                      <th style={styles.th}>
                        Semester
                      </th>

                      <th style={styles.th}>
                        Status
                      </th>

                      <th style={styles.th}>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {enrollments.map(
                      (enrollment) => (
                        <tr
                          key={
                            enrollment.enrollment_id
                          }
                        >
                          <td
                            style={styles.td}
                          >
                            <strong>
                              {
                                enrollment.course_code
                              }
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#64748b",
                                marginTop:
                                  "3px",
                              }}
                            >
                              {
                                enrollment.course_name
                              }
                            </div>
                          </td>

                          <td
                            style={styles.td}
                          >
                            {
                              enrollment.section_name
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            {
                              enrollment.lecturer_name ||
                              "Not assigned"
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            {
                              enrollment.semester
                            }
                          </td>

                          <td
                            style={styles.td}
                          >
                            <span
                              style={{
                                background:
                                  enrollment.enrollment_status ===
                                  "active"
                                    ? "#dcfce7"
                                    : "#f1f5f9",
                                color:
                                  enrollment.enrollment_status ===
                                  "active"
                                    ? "#15803d"
                                    : "#64748b",
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  "20px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  800,
                              }}
                            >
                              {
                                enrollment.enrollment_status
                              }
                            </span>
                          </td>

                          <td
                            style={styles.td}
                          >
                            {enrollment.enrollment_status ===
                              "active" && (
                              <button
                                style={
                                  styles.dangerButton
                                }
                                onClick={() =>
                                  handleRemoveEnrollment(
                                    enrollment.enrollment_id
                                  )
                                }
                              >
                                Remove
                              </button>
                            )}
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

      {/* =====================================================
          STUDENT MODAL
      ===================================================== */}

      {showStudentModal && (
        <div style={styles.modalOverlay}>
          <div className="enr-modal" style={styles.modal}>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom:
                  "22px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#102f61",
                  }}
                >
                  {editingStudent
                    ? "Edit Student"
                    : "Add New Student"}
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color: "#64748b",
                    fontSize:
                      "13px",
                  }}
                >
                  {editingStudent
                    ? "Update student account information."
                    : "Create a new student account."}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={
                  closeStudentModal
                }
                style={{
                  border: "none",
                  background:
                    "#f1f5f9",
                  width: "38px",
                  height: "38px",
                  borderRadius:
                    "50%",
                  cursor:
                    "pointer",
                  fontSize:
                    "20px",
                }}
              >
                ×
              </button>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleStudentSubmit
              }
            >
              <div
                className="enr-form-grid"
                style={styles.formGrid}
              >
                <div style={styles.formGroup}>
                  <label htmlFor="student-first-name">
                    First Name *
                  </label>

                  <input
                    id="student-first-name"
                    style={styles.input}
                    name="firstName"
                    value={
                      studentForm.firstName
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder="First name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label htmlFor="student-last-name">
                    Last Name *
                  </label>

                  <input
                    id="student-last-name"
                    style={styles.input}
                    name="lastName"
                    value={
                      studentForm.lastName
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder="Last name"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label htmlFor="student-code">
                    Student Code *
                  </label>

                  <input
                    id="student-code"
                    style={styles.input}
                    name="studentCode"
                    value={
                      studentForm.studentCode
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder="STU00001"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label htmlFor="student-phone">
                    Phone
                  </label>

                  <input
                    id="student-phone"
                    style={styles.input}
                    name="phone"
                    value={
                      studentForm.phone
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="student-email">
                  Email *
                </label>

                <input
                  type="email"
                  id="student-email"
                  style={styles.input}
                  name="email"
                  value={
                    studentForm.email
                  }
                  onChange={
                    handleStudentChange
                  }
                  placeholder="student@example.com"
                />
              </div>

              <div style={styles.formGroup}>
                <label htmlFor="student-password">
                  {editingStudent
                    ? "New Password (optional)"
                    : "Password *"}
                </label>

                <input
                  type="password"
                  id="student-password"
                  style={styles.input}
                  name="password"
                  value={
                    studentForm.password
                  }
                  onChange={
                    handleStudentChange
                  }
                  placeholder={
                    editingStudent
                      ? "Leave empty to keep current password"
                      : "Student password"
                  }
                />
              </div>

              {editingStudent && (
                <div style={styles.formGroup}>
                  <label htmlFor="student-status">
                    Account Status
                  </label>

                  <select
                    id="student-status"
                    style={styles.input}
                    name="status"
                    value={
                      studentForm.status
                    }
                    onChange={
                      handleStudentChange
                    }
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
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  type="button"
                  style={
                    styles.secondaryButton
                  }
                  onClick={
                    closeStudentModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.primaryButton,
                    opacity: saving
                      ? 0.6
                      : 1,
                  }}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingStudent
                    ? "Save Changes"
                    : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}