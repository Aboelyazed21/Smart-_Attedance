import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  import {
    getAttendanceReport,
    getStudents,
    getCourses,
    getSections,
    exportAttendanceReport,
  } from "../../services/api";
  
  import "./Reports.css";
  
  
  /* =========================================================
     HELPERS
  ========================================================= */
  
  function getSavedUser() {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
          "null"
      );
    } catch {
      return null;
    }
  }
  
  
  function formatDate(value) {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }
  
    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }
  
  
  function formatTime(value) {
    if (!value) {
      return "—";
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }
  
    return date.toLocaleTimeString(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }
  
  
  function getStudentName(record) {
    return (
      record.student_name ||
      `${record.first_name || ""} ${
        record.last_name || ""
      }`.trim() ||
      "Unknown Student"
    );
  }
  
  
  function getStatus(record) {
    return String(
      record.attendance_status ||
        record.status ||
        "recorded"
    ).toLowerCase();
  }
  
  
  /* =========================================================
     MAIN COMPONENT
  ========================================================= */
  
  export default function Reports() {
    const user =
      getSavedUser();
  
  
    /* =======================================================
       STATE
    ======================================================= */
  
    const [
      records,
      setRecords,
    ] = useState([]);
  
    const [
      students,
      setStudents,
    ] = useState([]);
  
    const [
      courses,
      setCourses,
    ] = useState([]);
  
    const [
      sections,
      setSections,
    ] = useState([]);
  
    const [
      loading,
      setLoading,
    ] = useState(true);
  
    const [
      error,
      setError,
    ] = useState("");
  
  
    const [
      courseId,
      setCourseId,
    ] = useState("");
  
    const [
      sectionId,
      setSectionId,
    ] = useState("");
  
    const [
      startDate,
      setStartDate,
    ] = useState("");
  
    const [
      endDate,
      setEndDate,
    ] = useState("");
  
  
    /* =======================================================
       LOAD REPORT
    ======================================================= */
  
    async function loadReport() {
  
      try {
  
        setLoading(true);
  
        setError("");
  
  
        const [
          reportResponse,
          studentsResponse,
          coursesResponse,
          sectionsResponse,
        ] = await Promise.all([
  
          getAttendanceReport({
            courseId,
            sectionId,
            startDate,
            endDate,
          }),
  
          getStudents(),
  
          getCourses(),
  
          getSections(),
  
        ]);
  
  
        const reportRecords =
          Array.isArray(
            reportResponse?.records
          )
            ? reportResponse.records
            : [];
  
  
        const studentList =
          Array.isArray(
            studentsResponse
          )
            ? studentsResponse
            : Array.isArray(
                studentsResponse?.students
              )
            ? studentsResponse.students
            : Array.isArray(
                studentsResponse?.data
              )
            ? studentsResponse.data
            : [];
  
  
        const courseList =
          Array.isArray(
            coursesResponse
          )
            ? coursesResponse
            : Array.isArray(
                coursesResponse?.courses
              )
            ? coursesResponse.courses
            : Array.isArray(
                coursesResponse?.data
              )
            ? coursesResponse.data
            : [];
  
  
        const sectionList =
          Array.isArray(
            sectionsResponse
          )
            ? sectionsResponse
            : Array.isArray(
                sectionsResponse?.sections
              )
            ? sectionsResponse.sections
            : Array.isArray(
                sectionsResponse?.data
              )
            ? sectionsResponse.data
            : [];
  
  
        setRecords(
          reportRecords
        );
  
        setStudents(
          studentList
        );
  
        setCourses(
          courseList
        );
  
        setSections(
          sectionList
        );
  
      } catch (err) {
  
        console.error(
          "Reports error:",
          err
        );
  
        setError(
          err.message ||
            "Failed to load reports."
        );
  
      } finally {
  
        setLoading(false);
  
      }
  
    }
  
  
    useEffect(() => {
  
      loadReport();
  
    }, [
      courseId,
      sectionId,
      startDate,
      endDate,
    ]);
  
  
    /* =======================================================
       SUMMARY
    ======================================================= */
  
    const summary =
      useMemo(() => {
  
        const totalRecords =
          records.length;
  
  
        const present =
          records.filter(
            (item) =>
              getStatus(item) ===
              "present"
          ).length;
  
  
        const late =
          records.filter(
            (item) =>
              getStatus(item) ===
              "late"
          ).length;
  
  
        const absent =
          records.filter(
            (item) =>
              getStatus(item) ===
              "absent"
          ).length;
  
  
        const excused =
          records.filter(
            (item) =>
              getStatus(item) ===
              "excused"
          ).length;
  
  
        const total =
          present +
          late +
          absent +
          excused;
  
  
        const attendanceRate =
          total > 0
            ? (
                ((present + late) /
                  total) *
                100
              ).toFixed(1)
            : "0.0";
  
  
        return {
          totalStudents:
            students.length,
  
          totalRecords,
  
          present,
  
          late,
  
          absent,
  
          excused,
  
          attendanceRate,
        };
  
      }, [
        records,
        students,
      ]);
  
  
    /* =======================================================
       TREND
    ======================================================= */
  
    const trend =
      useMemo(() => {
  
        const map =
          new Map();
  
  
        records.forEach(
          (record) => {
  
            const date =
              record.session_date;
  
            if (!date) {
              return;
            }
  
  
            if (
              !map.has(date)
            ) {
  
              map.set(
                date,
                {
                  date,
                  present: 0,
                  absent: 0,
                  late: 0,
                }
              );
  
            }
  
  
            const item =
              map.get(date);
  
  
            const status =
              getStatus(record);
  
  
            if (
              status ===
              "present"
            ) {
  
              item.present++;
  
            } else if (
              status ===
              "absent"
            ) {
  
              item.absent++;
  
            } else if (
              status ===
              "late"
            ) {
  
              item.late++;
  
            }
  
          }
        );
  
  
        return Array.from(
          map.values()
        )
          .sort(
            (a, b) =>
              new Date(a.date) -
              new Date(b.date)
          )
          .slice(-10);
  
      }, [
        records,
      ]);
  
  
    /* =======================================================
       COURSE ANALYSIS
    ======================================================= */
  
    const courseStats =
      useMemo(() => {
  
        const map =
          new Map();
  
  
        records.forEach(
          (record) => {
  
            const code =
              record.course_code ||
              record.course_name ||
              "Unknown";
  
  
            if (
              !map.has(code)
            ) {
  
              map.set(
                code,
                {
                  code,
                  present: 0,
                  late: 0,
                  absent: 0,
                }
              );
  
            }
  
  
            const item =
              map.get(code);
  
  
            const status =
              getStatus(record);
  
  
            if (
              status ===
              "present"
            ) {
  
              item.present++;
  
            }
  
            if (
              status ===
              "late"
            ) {
  
              item.late++;
  
            }
  
            if (
              status ===
              "absent"
            ) {
  
              item.absent++;
  
            }
  
          }
        );
  
  
        return Array.from(
          map.values()
        )
          .map(
            (item) => {
  
              const total =
                item.present +
                item.late +
                item.absent;
  
  
              return {
                ...item,
  
                percentage:
                  total > 0
                    ? Math.round(
                        ((item.present +
                          item.late) /
                          total) *
                          100
                      )
                    : 0,
              };
  
            }
          )
          .sort(
            (a, b) =>
              b.percentage -
              a.percentage
          )
          .slice(0, 5);
  
      }, [
        records,
      ]);
  
  
    /* =======================================================
       TOP ABSENT STUDENTS
    ======================================================= */
  
    const topAbsent =
      useMemo(() => {
  
        const map =
          new Map();
  
  
        records.forEach(
          (record) => {
  
            const status =
              getStatus(record);
  
  
            const studentId =
              record.student_id ||
              record.student_code ||
              getStudentName(
                record
              );
  
  
            if (
              !map.has(studentId)
            ) {
  
              map.set(
                studentId,
                {
                  id: studentId,
  
                  name:
                    getStudentName(
                      record
                    ),
  
                  absent: 0,
  
                  total: 0,
  
                  attended: 0,
                }
              );
  
            }
  
  
            const item =
              map.get(studentId);
  
  
            item.total++;
  
  
            if (
              status ===
              "absent"
            ) {
  
              item.absent++;
  
            }
  
  
            if (
              status === "present" ||
              status === "late"
            ) {
  
              item.attended++;
  
            }
  
          }
        );
  
  
        return Array.from(
          map.values()
        )
          .map(
            (item) => ({
  
              ...item,
  
              attendanceRate:
                item.total > 0
                  ? Math.round(
                      (item.attended /
                        item.total) *
                        100
                    )
                  : 0,
  
            })
          )
          .filter(
            (item) =>
              item.absent > 0
          )
          .sort(
            (a, b) =>
              b.absent -
              a.absent
          )
          .slice(0, 5);
  
      }, [
        records,
      ]);
  
  
    /* =======================================================
       RECENT
    ======================================================= */
  
    const recentRecords =
      useMemo(() => {
  
        return [
          ...records,
        ]
          .sort(
            (a, b) =>
              new Date(
                b.scanned_at ||
                  b.session_date ||
                  0
              ) -
              new Date(
                a.scanned_at ||
                  a.session_date ||
                  0
              )
          )
          .slice(0, 5);
  
      }, [
        records,
      ]);
  
  
    /* =======================================================
       MAX TREND VALUE
    ======================================================= */
  
    const trendMax =
      Math.max(
        1,
        ...trend.map(
          (item) =>
            Math.max(
              item.present,
              item.absent,
              item.late
            )
        )
      );
  
  
    /* =======================================================
       CLEAR FILTERS
    ======================================================= */
  
    function clearFilters() {
  
      setCourseId("");
  
      setSectionId("");
  
      setStartDate("");
  
      setEndDate("");
  
    }
  
  
    /* =======================================================
       EXPORT
    ======================================================= */
  
    async function handleExport() {
  
      try {
  
        await exportAttendanceReport({
  
          courseId,
  
          sectionId,
  
          startDate,
  
          endDate,
  
        });
  
      } catch (err) {
  
        setError(
          err.message ||
            "Could not export report."
        );
  
      }
  
    }
    /* =======================================================
       RENDER
    ======================================================= */
  
    return (
  
      <div className="reports-page">
        {/* =================================================
            MAIN
        ================================================= */}
  
        <main className="reports-main">
  
          {/* HEADER */}
  
          <header className="reports-topbar">
  
            <div className="reports-search">
              🔎
              <input
                placeholder="Search students, courses, sections..."
              />
            </div>
  
  
            <div className="reports-user">
  
              <span className="reports-bell">
                🔔
                <b>3</b>
              </span>
  
              <div className="reports-avatar">
                {
                  (
                    user?.first_name ||
                    "S"
                  )
                    .charAt(0)
                    .toUpperCase()
                }
              </div>
  
              <div>
  
                <strong>
                  {
                    user
                      ? `${user.first_name || ""} ${
                          user.last_name || ""
                        }`.trim()
                      : "System Admin"
                  }
                </strong>
  
                <span>
                  Administrator
                </span>
  
              </div>
  
            </div>
  
          </header>
  
  
          {/* CONTENT */}
  
          <section className="reports-content">
  
            <div className="reports-heading">
  
              <div>
  
                <div className="reports-title-icon">
                  ▥
                </div>
  
                <div>
  
                  <h1>
                    Reports
                  </h1>
  
                  <p>
                    View attendance analytics
                    and reports
                  </p>
  
                </div>
  
              </div>
  
  
              <div className="reports-heading-actions">
  
                <span>
                  / Reports
                </span>
  
                <button
                  className="reports-export-btn"
                  onClick={
                    handleExport
                  }
                >
                  ↓ Export Report
                </button>
  
              </div>
  
            </div>
  
  
            {/* ERROR */}
  
            {error && (
  
              <div className="reports-error">
  
                {error}
  
              </div>
  
            )}
  
  
            {/* FILTERS */}
  
            <section className="reports-filters">
  
              <div>
  
                <label>
                  Course
                </label>
  
                <select
                  value={courseId}
                  onChange={(e) =>
                    setCourseId(
                      e.target.value
                    )
                  }
                >
  
                  <option value="">
                    All Courses
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
                        {
                          course.course_code ||
                          course.course_name
                        }
                      </option>
  
                    )
                  )}
  
                </select>
  
              </div>
  
  
              <div>
  
                <label>
                  Section
                </label>
  
                <select
                  value={sectionId}
                  onChange={(e) =>
                    setSectionId(
                      e.target.value
                    )
                  }
                >
  
                  <option value="">
                    All Sections
                  </option>
  
                  {sections.map(
                    (section) => (
  
                      <option
                        key={
                          section.id
                        }
                        value={
                          section.id
                        }
                      >
                        {
                          section.section_name ||
                          `Section ${section.id}`
                        }
                      </option>
  
                    )
                  )}
  
                </select>
  
              </div>
  
  
              <div>
  
                <label>
                  From Date
                </label>
  
                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={(e) =>
                    setStartDate(
                      e.target.value
                    )
                  }
                />
  
              </div>
  
  
              <div>
  
                <label>
                  To Date
                </label>
  
                <input
                  type="date"
                  value={
                    endDate
                  }
                  onChange={(e) =>
                    setEndDate(
                      e.target.value
                    )
                  }
                />
  
              </div>
  
  
              <button
                className="reports-clear-btn"
                onClick={
                  clearFilters
                }
              >
                ↻ Clear
              </button>
  
            </section>
  
  
            {/* STAT CARDS */}
  
            <div className="reports-stats">
  
              <StatCard
                icon="👥"
                title="Total Students"
                value={
                  summary.totalStudents
                }
                type="green"
                subtitle="Registered students"
              />
  
              <StatCard
                icon="✓"
                title="Present"
                value={
                  summary.present
                }
                type="blue"
                subtitle={`Attendance rate: ${summary.attendanceRate}%`}
              />
  
              <StatCard
                icon="×"
                title="Absent"
                value={
                  summary.absent
                }
                type="red"
                subtitle={
                  "Students absent"
                }
              />
  
              <StatCard
                icon="◷"
                title="Late"
                value={
                  summary.late
                }
                type="purple"
                subtitle={
                  "Students late"
                }
              />
  
            </div>
  
  
            {/* MAIN CHART GRID */}
  
            <div className="reports-grid-top">
  
              {/* TREND */}
  
              <section className="reports-card reports-trend-card">
  
                <CardTitle
                  icon="▥"
                  title="Attendance Trend"
                />
  
                {loading ? (
  
                  <Loading />
  
                ) : trend.length === 0 ? (
  
                  <EmptyState
                    text="No attendance trend data available."
                  />
  
                ) : (
  
                  <div className="trend-chart">
  
                    <div className="trend-legend">
  
                      <span>
                        <i className="dot present" />
                        Present
                      </span>
  
                      <span>
                        <i className="dot absent" />
                        Absent
                      </span>
  
                      <span>
                        <i className="dot late" />
                        Late
                      </span>
  
                    </div>
  
  
                    <div className="trend-bars">
  
                      {trend.map(
                        (item) => (
  
                          <div
                            className="trend-column"
                            key={
                              item.date
                            }
                          >
  
                            <div className="trend-values">
  
                              <span
                                style={{
                                  height:
                                    `${
                                      (item.present /
                                        trendMax) *
                                      100
                                    }%`,
                                }}
                                className="trend-bar present"
                              />
  
                              <span
                                style={{
                                  height:
                                    `${
                                      (item.absent /
                                        trendMax) *
                                      100
                                    }%`,
                                }}
                                className="trend-bar absent"
                              />
  
                              <span
                                style={{
                                  height:
                                    `${
                                      (item.late /
                                        trendMax) *
                                      100
                                    }%`,
                                }}
                                className="trend-bar late"
                              />
  
                            </div>
  
                            <small>
                              {
                                formatDate(
                                  item.date
                                )
                              }
                            </small>
  
                          </div>
  
                        )
                      )}
  
                    </div>
  
                  </div>
  
                )}
  
              </section>
  
  
              {/* OVERALL */}
  
              <section className="reports-card overall-card">
  
                <CardTitle
                  icon="◔"
                  title="Overall Attendance"
                />
  
                <div
                  className="donut"
                  style={{
                    "--rate":
                      `${summary.attendanceRate}%`,
                  }}
                >
  
                  <div>
  
                    <strong>
                      {
                        summary.attendanceRate
                      }%
                    </strong>
  
                    <span>
                      Attendance Rate
                    </span>
  
                  </div>
  
                </div>
  
  
                <div className="overall-list">
  
                  <ReportLegend
                    type="present"
                    label="Present"
                    value={
                      summary.present
                    }
                    total={
                      summary.present +
                      summary.absent +
                      summary.late
                    }
                  />
  
                  <ReportLegend
                    type="absent"
                    label="Absent"
                    value={
                      summary.absent
                    }
                    total={
                      summary.present +
                      summary.absent +
                      summary.late
                    }
                  />
  
                  <ReportLegend
                    type="late"
                    label="Late"
                    value={
                      summary.late
                    }
                    total={
                      summary.present +
                      summary.absent +
                      summary.late
                    }
                  />
  
                </div>
  
              </section>
  
            </div>
  
  
            {/* COURSE + ABSENT */}
  
            <div className="reports-grid-middle">
  
              <section className="reports-card">
  
                <CardTitle
                  icon="▣"
                  title="Attendance by Course"
                />
  
                {courseStats.length ===
                0 ? (
  
                  <EmptyState
                    text="No course attendance data available."
                  />
  
                ) : (
  
                  <div className="course-chart">
  
                    {courseStats.map(
                      (course) => (
  
                        <div
                          className="course-row"
                          key={
                            course.code
                          }
                        >
  
                          <div className="course-label">
  
                            <strong>
                              {
                                course.percentage
                              }%
                            </strong>
  
                            <span>
                              {
                                course.code
                              }
                            </span>
  
                          </div>
  
  
                          <div className="course-track">
  
                            <div
                              className="course-fill"
                              style={{
                                width:
                                  `${course.percentage}%`,
                              }}
                            />
  
                          </div>
  
                        </div>
  
                      )
                    )}
  
                  </div>
  
                )}
  
              </section>
  
  
              <section className="reports-card">
  
                <CardTitle
                  icon="♙"
                  title="Top Absent Students"
                  action="View All"
                />
  
                {topAbsent.length ===
                0 ? (
  
                  <EmptyState
                    text="No absent student records."
                  />
  
                ) : (
  
                  <div className="absent-table">
  
                    <div className="absent-header">
                      <span>#</span>
                      <span>Student</span>
                      <span>Absences</span>
                      <span>Rate</span>
                    </div>
  
  
                    {topAbsent.map(
                      (
                        student,
                        index
                      ) => (
  
                        <div
                          className="absent-row"
                          key={
                            student.id
                          }
                        >
  
                          <span>
                            {index + 1}
                          </span>
  
                          <strong>
                            {
                              student.name
                            }
                          </strong>
  
                          <span>
                            {
                              student.absent
                            }
                          </span>
  
                          <b
                            className={
                              student.attendanceRate <
                              60
                                ? "rate-danger"
                                : student.attendanceRate <
                                  75
                                ? "rate-warning"
                                : "rate-normal"
                            }
                          >
                            {
                              student.attendanceRate
                            }%
                          </b>
  
                        </div>
  
                      )
                    )}
  
                  </div>
  
                )}
  
              </section>
  
            </div>
  
  
            {/* RECENT RECORDS */}
  
            <section className="reports-card reports-recent">
  
              <CardTitle
                icon="▤"
                title="Recent Attendance Records"
                action="View All"
              />
  
  
              {loading ? (
  
                <Loading />
  
              ) : recentRecords.length ===
                0 ? (
  
                <EmptyState
                  text="No attendance records found."
                />
  
              ) : (
  
                <div className="recent-table-wrapper">
  
                  <table className="recent-table">
  
                    <thead>
  
                      <tr>
  
                        <th>#</th>
  
                        <th>
                          Student
                        </th>
  
                        <th>
                          Course
                        </th>
  
                        <th>
                          Section
                        </th>
  
                        <th>
                          Date
                        </th>
  
                        <th>
                          Status
                        </th>
  
                        <th>
                          Check-in Time
                        </th>
  
                        <th>
                          Marked By
                        </th>
  
                      </tr>
  
                    </thead>
  
  
                    <tbody>
  
                      {recentRecords.map(
                        (
                          record,
                          index
                        ) => {
  
                          const status =
                            getStatus(
                              record
                            );
  
                          return (
  
                            <tr
                              key={
                                record.attendance_id ||
                                index
                              }
                            >
  
                              <td>
                                {index + 1}
                              </td>
  
                              <td>
  
                                <strong>
                                  {
                                    getStudentName(
                                      record
                                    )
                                  }
                                </strong>
  
                                <small>
                                  {
                                    record.student_code ||
                                    record.university_id ||
                                    ""
                                  }
                                </small>
  
                              </td>
  
                              <td>
  
                                <strong>
                                  {
                                    record.course_code ||
                                    "—"
                                  }
                                </strong>
  
                                <small>
                                  {
                                    record.course_name ||
                                    ""
                                  }
                                </small>
  
                              </td>
  
                              <td>
                                {
                                  record.section_name ||
                                  "—"
                                }
                              </td>
  
                              <td>
                                {
                                  formatDate(
                                    record.session_date
                                  )
                                }
                              </td>
  
                              <td>
  
                                <span
                                  className={
                                    `status-badge ${status}`
                                  }
                                >
                                  {
                                    status
                                      .charAt(0)
                                      .toUpperCase() +
                                    status.slice(1)
                                  }
                                </span>
  
                              </td>
  
                              <td>
                                {
                                  formatTime(
                                    record.scanned_at
                                  )
                                }
                              </td>
  
                              <td>
                                {
                                  record.lecturer_name ||
                                  "System Admin"
                                }
                              </td>
  
                            </tr>
  
                          );
  
                        }
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
  
  
  /* =========================================================
     COMPONENTS
  ========================================================= */
  
  function StatCard({
    icon,
    title,
    value,
    type,
    subtitle,
  }) {
  
    return (
  
      <div className="reports-stat-card">
  
        <div
          className={
            `stat-icon ${type}`
          }
        >
          {icon}
        </div>
  
        <div>
  
          <span>
            {title}
          </span>
  
          <strong>
            {value}
          </strong>
  
          <small>
            {subtitle}
          </small>
  
        </div>
  
      </div>
  
    );
  
  }
  
  
  function CardTitle({
    icon,
    title,
    action,
  }) {
  
    return (
  
      <div className="reports-card-title">
  
        <div>
  
          <span>
            {icon}
          </span>
  
          <h2>
            {title}
          </h2>
  
        </div>
  
  
        {action && (
  
          <button>
            {action}
          </button>
  
        )}
  
      </div>
  
    );
  
  }
  
  
  function ReportLegend({
    type,
    label,
    value,
    total,
  }) {
  
    const percentage =
      total > 0
        ? (
            (value /
              total) *
            100
          ).toFixed(1)
        : "0.0";
  
  
    return (
  
      <div className="report-legend">
  
        <span>
  
          <i
            className={
              `dot ${type}`
            }
          />
  
          {label}
  
        </span>
  
        <strong>
          {value}
          <small>
            {" "}
            ({percentage}%)
          </small>
        </strong>
  
      </div>
  
    );
  
  }
  
  
  function Loading() {
  
    return (
  
      <div className="reports-loading">
        Loading report data...
      </div>
  
    );
  
  }
  
  
  function EmptyState({
    text,
  }) {
  
    return (
  
      <div className="reports-empty">
  
        <div>
          ▤
        </div>
  
        <p>
          {text}
        </p>
  
      </div>
  
    );
  
  }