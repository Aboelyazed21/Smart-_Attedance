import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../utils/i18n";
import { uploadSectionStudents } from "../../services/api";
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${path}`, {
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
  }`.trim() || t("enroll.student");
}

function getInitial(student) {
  return (
    student?.first_name?.charAt(0)?.toUpperCase() ||
    student?.last_name?.charAt(0)?.toUpperCase() ||
    "S"
  );
}

export default function EnrollmentManagement() {
  const { t } = useLanguage();
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

  const [uploadSectionId, setUploadSectionId] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

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
      setError(err.message || t("enroll.failed_to_load_data"));
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
        err.message || t("enroll.failed_to_load_student_enrollments")
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
        t("enroll.first_name_last_name_email_and_student_c")
      );
      return;
    }

    if (!editingStudent && !studentForm.password) {
      setError(t("enroll.password_is_required_for_a_new_student"));
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
            t("enroll.student_updated_successfully")
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
            t("enroll.student_created_successfully")
        );
      }

      closeStudentModal();

      await loadData();
    } catch (err) {
      console.error("Student save error:", err);

      setError(
        err.message ||
          t("enroll.failed_to_save_student")
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
      t("enroll.confirmDelete").replace("{name}", getFullName(student))
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
          t("enroll.student_deleted_successfully")
      );

      await loadData();
    } catch (err) {
      console.error("Student delete error:", err);

      setError(
        err.message ||
          t("enroll.failed_to_delete_student")
      );
    }
  }

  /* =========================================================
     ENROLL STUDENT
  ========================================================= */

  async function handleEnroll(event) {
    event.preventDefault();

    if (!selectedStudentId) {
      setError(t("enroll.please_select_a_student_first"));
      return;
    }

    if (!selectedSectionId) {
      setError(t("enroll.please_select_a_section"));
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
          t("enroll.student_enrolled_successfully")
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
          t("enroll.failed_to_enroll_student")
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
      t("enroll.remove_this_student_from_this_section")
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
          t("enroll.enrollment_removed_successfully")
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
          t("enroll.failed_to_remove_enrollment")
      );
    }
  }

  /* =========================================================
     STYLES
  ========================================================= */

  const styles = {
    page: {
      minHeight: "100vh",
      width: "100%",
      minWidth: 0,
      background: "#f4f7fb",
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
      border: "1px solid #0f2851",
      background: "#0f2851",
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
      background: "#e8eef7",
      border: "1px solid #0f2851",
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
      boxShadow:
        "0 25px 80px rgba(0,0,0,0.25)",
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

  /* =========================================================
     BULK UPLOAD STUDENTS INTO ONE SECTION (CSV / EXCEL)
  ========================================================= */

  function downloadUploadTemplate() {
    const header =
      "first_name,last_name,student_code,email,phone,university_id,department,level,academic_year,password";

    const example =
      "Ahmed,Mohamed,STU-1001,ahmed@example.com,01001234567,U-1001,CS,2,2026,";

    const blob = new Blob([`${header}\n${example}\n`], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "section-students-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function handleBulkUpload(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setUploadResult(null);

    if (!uploadSectionId) {
      setError(t("enroll.please_select_a_section"));
      return;
    }

    if (!uploadFile) {
      setError(t("enroll.please_choose_a_file"));
      return;
    }

    setUploading(true);

    try {
      const result = await uploadSectionStudents(
        Number(uploadSectionId),
        uploadFile
      );

      setUploadResult(result);
      setSuccess(
        result.message || t("enroll.upload_finished")
      );
      setUploadFile(null);

      await loadData();
    } catch (err) {
      setError(
        err.message || t("enroll.failed_to_upload_students")
      );

      if (Array.isArray(err.details) && err.details.length > 0) {
        setUploadResult({ errors: err.details });
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        {/* HEADER */}

        <header style={styles.header}>
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0b2c60",
                fontSize: "28px",
              }}
            >
              {t("enroll.students_management")}
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                color: "#64748b",
              }}
            >
              {t("enroll.manage_students_accounts_and_course_enro")}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <button
              style={styles.secondaryButton}
              onClick={loadData}
            >{t("action.refresh")}</button>

            <button
              style={styles.primaryButton}
              onClick={openCreateStudent}
            >
              {t("enroll.add_student")}
            </button>
          </div>
        </header>

        {/* BULK UPLOAD STUDENTS INTO A SECTION */}

        <section
          style={{
            ...styles.card,
            marginBottom: "20px",
            borderInlineStart: "4px solid #2563eb",
          }}
        >
          <h2
            style={{
              margin: "0 0 5px",
              color: "#102f61",
              fontSize: "17px",
            }}
          >
            {t("enroll.bulk_upload_title")}
          </h2>

          <p
            style={{
              margin: "0 0 14px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            {t("enroll.bulk_upload_desc")}
          </p>

          <form onSubmit={handleBulkUpload}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr auto",
                gap: "10px",
                alignItems: "end",
              }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {t("enroll.target_section")}

                <select
                  style={styles.input}
                  value={uploadSectionId}
                  onChange={(event) =>
                    setUploadSectionId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    {t("enroll.select_section")}
                  </option>

                  {sections.map((section) => (
                    <option
                      key={section.section_id}
                      value={section.section_id}
                    >
                      {section.course_code} -{" "}
                      {section.course_name} |
                      Section{" "}
                      {section.section_name}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#334155",
                }}
              >
                {t("enroll.csv_excel_file")}

                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  style={styles.input}
                  onChange={(event) =>
                    setUploadFile(
                      event.target.files?.[0] || null
                    )
                  }
                />
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={downloadUploadTemplate}
                >
                  {t("enroll.download_template")}
                </button>

                <button
                  type="submit"
                  style={{
                    ...styles.primaryButton,
                    opacity:
                      uploading ||
                      !uploadSectionId ||
                      !uploadFile
                        ? 0.6
                        : 1,
                  }}
                  disabled={
                    uploading ||
                    !uploadSectionId ||
                    !uploadFile
                  }
                >
                  {uploading
                    ? t("enroll.uploading")
                    : t("enroll.upload_students")}
                </button>
              </div>
            </div>
          </form>

          {uploadResult && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                background:
                  (uploadResult.skipped || 0) > 0
                    ? "#fffbeb"
                    : "#f0fdf4",
                border: `1px solid ${
                  (uploadResult.skipped || 0) > 0
                    ? "#fde68a"
                    : "#bbf7d0"
                }`,
                fontSize: "13px",
                color: "#334155",
              }}
            >
              <div>
                {t("enroll.upload_created").replace(
                  "{n}",
                  uploadResult.created ?? 0
                )}
                {" · "}
                {t("enroll.upload_enrolled").replace(
                  "{n}",
                  uploadResult.enrolled ?? 0
                )}
                {" · "}
                {t("enroll.upload_skipped").replace(
                  "{n}",
                  uploadResult.skipped ?? 0
                )}
              </div>

              {Array.isArray(uploadResult.errors) &&
                uploadResult.errors.length > 0 && (
                  <ul
                    style={{
                      margin: "8px 0 0",
                      paddingInlineStart: "18px",
                      color: "#991b1b",
                    }}
                  >
                    {uploadResult.errors
                      .slice(0, 8)
                      .map((rowError, index) => (
                        <li key={index}>
                          {t("enroll.row").replace(
                            "{n}",
                            rowError.line ?? "?"
                          )}
                          : {rowError.message}
                        </li>
                      ))}
                  </ul>
                )}
            </div>
          )}
        </section>

        <section style={styles.content}>
          {/* ALERTS */}

          {error && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "13px 16px",
                borderRadius: "11px",
                marginBottom: "18px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
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

          <div style={styles.stats}>
            <div style={styles.stat}>
              <div
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {t("enroll.total_students")}
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
                {t("enroll.active")}
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
                {t("enroll.inactive")}
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
                {t("enroll.selected_enrollments")}
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

          <div style={styles.grid}>
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
                    {t("enroll.students")}
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
                    {t("enroll.student_2")}
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
                placeholder={t("enroll.search_by_name_id_email_or_phone")}
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
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "#64748b",
                    }}
                  >
                    {t("enroll.loading_students")}
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
                    {t("enroll.no_students_found")}
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
                    {t("enroll.select_a_student")}
                  </h3>

                  <p style={{ margin: 0 }}>
                    {t("enroll.select_a_student_to_view_details_and_man")}
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
                          {t("enroll.email")}
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
                          {t("enroll.phone")}
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
                          {t("enroll.status")}
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
                          {t("enroll.enrollments")}
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
                      {t("enroll.edit_student_2")}
                    </button>

                    <button
                      style={styles.dangerButton}
                      onClick={() =>
                        handleDeleteStudent(
                          selectedStudent
                        )
                      }
                    >
                      {t("enroll.delete")}
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
                      {t("enroll.add_enrollment")}
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
                      {t("enroll.assign_this_student_to_a_course_section")}
                    </p>

                    <input
                      style={{
                        ...styles.input,
                        marginBottom:
                          "10px",
                      }}
                      placeholder={t("enroll.search_course_section_or_lecturer")}
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
                          {t("enroll.select_section")}
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
                          ? t("enroll.processing")
                          : t("enroll.enroll_student")}
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
                  {t("enroll.student_enrollments")}
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
                    : t("enroll.select_a_student_to_view_enrollments")}
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
                {t("enroll.select_a_student_first")}
              </div>
            ) : detailsLoading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "#64748b",
                }}
              >
                {t("enroll.loading_enrollments")}
              </div>
            ) : enrollments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px",
                  color: "#64748b",
                }}
              >
                {t("enroll.no_enrollments_found")}
              </div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        {t("enroll.course")}
                      </th>

                      <th style={styles.th}>
                        {t("enroll.section")}
                      </th>

                      <th style={styles.th}>{t("role.lecturer")}</th>

                      <th style={styles.th}>
                        {t("enroll.semester")}
                      </th>

                      <th style={styles.th}>
                        {t("enroll.status")}
                      </th>

                      <th style={styles.th}>
                        {t("enroll.action")}
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
                                {t("enroll.remove")}
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
          <div style={styles.modal}>
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
                    ? t("enroll.edit_student")
                    : t("enroll.add_new_student")}
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
                    ? t("enroll.update_student_account_information")
                    : t("enroll.create_a_new_student_account")}
                </p>
              </div>

              <button
                type="button"
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

            <form
              onSubmit={
                handleStudentSubmit
              }
            >
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>
                    {t("enroll.first_name_2")}
                  </label>

                  <input
                    style={styles.input}
                    name="firstName"
                    value={
                      studentForm.firstName
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder={t("enroll.first_name")}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>
                    {t("enroll.last_name_2")}
                  </label>

                  <input
                    style={styles.input}
                    name="lastName"
                    value={
                      studentForm.lastName
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder={t("enroll.last_name")}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>
                    {t("enroll.student_code")}
                  </label>

                  <input
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
                  <label>
                    {t("enroll.phone")}
                  </label>

                  <input
                    style={styles.input}
                    name="phone"
                    value={
                      studentForm.phone
                    }
                    onChange={
                      handleStudentChange
                    }
                    placeholder={t("enroll.phone_number")}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>
                  {t("enroll.email_2")}
                </label>

                <input
                  type="email"
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
                <label>
                  {editingStudent
                    ? t("enroll.new_password_optional")
                    : t("enroll.password")}
                </label>

                <input
                  type="password"
                  style={styles.input}
                  name="password"
                  value={
                    studentForm.password
                  }
                  onChange={
                    handleStudentChange
                  }
                  placeholder={editingStudent ? t("enroll.leaveEmptyPassword") : t("enroll.studentPassword")}
                />
              </div>

              {editingStudent && (
                <div style={styles.formGroup}>
                  <label>
                    {t("enroll.account_status")}
                  </label>

                  <select
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
                      {t("enroll.active_2")}
                    </option>

                    <option value="inactive">
                      {t("enroll.inactive_2")}
                    </option>

                    <option value="suspended">
                      {t("enroll.suspended")}
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
                  {t("enroll.cancel")}
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
                    ? t("enroll.saving")
                    : editingStudent
                    ? t("enroll.save_changes")
                    : t("enroll.create_student")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}