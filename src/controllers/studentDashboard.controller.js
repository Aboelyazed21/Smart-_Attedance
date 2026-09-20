const db = require("../config/db");

// ==========================================
// Get Student Dashboard Statistics
// ==========================================
const getDashboardStats = (req, res) => {
    const userId = req.user.userId;

    // ==========================================
    // Get Student
    // ==========================================
    const studentSql = `
        SELECT
            sp.id AS student_id,
            sp.student_code,
            u.first_name,
            u.last_name
        FROM student_profiles sp

        INNER JOIN users u
            ON u.id = sp.user_id

        WHERE u.id = ?

        LIMIT 1
    `;

    db.query(
        studentSql,
        [userId],
        (err, studentResults) => {
            if (err) {
                console.error(
                    "Get student dashboard student error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (studentResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student not found"
                });
            }

            const student =
                studentResults[0];

            // ==========================================
            // Attendance Statistics
            // ==========================================
            const attendanceSql = `
                SELECT
                    COUNT(*) AS total_events,

                    SUM(
                        CASE
                            WHEN ae.status = 'present'
                            THEN 1
                            ELSE 0
                        END
                    ) AS present_count,

                    SUM(
                        CASE
                            WHEN ae.status = 'late'
                            THEN 1
                            ELSE 0
                        END
                    ) AS late_count,

                    SUM(
                        CASE
                            WHEN ae.status = 'absent'
                            THEN 1
                            ELSE 0
                        END
                    ) AS absent_count,

                    SUM(
                        CASE
                            WHEN ae.status = 'excused'
                            THEN 1
                            ELSE 0
                        END
                    ) AS excused_count

                FROM attendance_events ae

                WHERE ae.student_id = ?
            `;

            db.query(
                attendanceSql,
                [student.student_id],
                (
                    err,
                    attendanceResults
                ) => {
                    if (err) {
                        console.error(
                            "Get attendance stats error:",
                            err
                        );

                        return res
                            .status(
                                500
                            )
                            .json({
                                success:
                                    false,
                                message:
                                    "Database error"
                            });
                    }

                    const attendance =
                        attendanceResults[0] ||
                        {};

                    const totalEvents =
                        Number(
                            attendance.total_events ||
                                0
                        );

                    const presentCount =
                        Number(
                            attendance.present_count ||
                                0
                        );

                    const lateCount =
                        Number(
                            attendance.late_count ||
                                0
                        );

                    const absentCount =
                        Number(
                            attendance.absent_count ||
                                0
                        );

                    const excusedCount =
                        Number(
                            attendance.excused_count ||
                                0
                        );

                    // ==========================================
                    // Calculate Attendance Percentage
                    // ==========================================
                    const attendancePercentage =
                        totalEvents >
                        0
                            ? Number(
                                  (
                                      (
                                          presentCount +
                                          lateCount
                                      ) /
                                      totalEvents
                                  ) *
                                      100
                              ).toFixed(2)
                            : 0;

                    // ==========================================
                    // Get Enrolled Courses
                    // ==========================================
                    const coursesSql = `
                        SELECT
                            COUNT(
                                DISTINCT e.section_id
                            ) AS enrolled_courses
                        FROM enrollments e

                        WHERE e.student_id = ?

                          AND e.status = 'active'
                    `;

                    db.query(
                        coursesSql,
                        [
                            student.student_id
                        ],
                        (
                            err,
                            courseResults
                        ) => {
                            if (err) {
                                console.error(
                                    "Get enrolled courses error:",
                                    err
                                );

                                return res
                                    .status(
                                        500
                                    )
                                    .json({
                                        success:
                                            false,
                                        message:
                                            "Database error"
                                    });
                            }

                            const enrolledCourses =
                                Number(
                                    courseResults[0]
                                        ?.enrolled_courses ||
                                        0
                                );

                            // ==========================================
                            // Get Pending Correction Requests
                            // ==========================================
                            const requestsSql = `
                                SELECT
                                    COUNT(*) AS pending_requests
                                FROM correction_requests cr

                                WHERE cr.student_id = ?

                                  AND cr.status = 'pending'
                            `;

                            db.query(
                                requestsSql,
                                [
                                    student.student_id
                                ],
                                (
                                    err,
                                    requestResults
                                ) => {
                                    if (
                                        err
                                    ) {
                                        console.error(
                                            "Get correction requests error:",
                                            err
                                        );

                                        return res
                                            .status(
                                                500
                                            )
                                            .json({
                                                success:
                                                    false,
                                                message:
                                                    "Database error"
                                            });
                                    }

                                    const pendingRequests =
                                        Number(
                                            requestResults[0]
                                                ?.pending_requests ||
                                                0
                                        );

                                    // ==========================================
                                    // Return Dashboard
                                    // ==========================================
                                    return res.json({
                                        success:
                                            true,

                                        student: {
                                            id:
                                                student.student_id,

                                            studentCode:
                                                student.student_code,

                                            firstName:
                                                student.first_name,

                                            lastName:
                                                student.last_name
                                        },

                                        stats: {
                                            enrolledCourses,

                                            totalAttendanceRecords:
                                                totalEvents,

                                            present:
                                                presentCount,

                                            late:
                                                lateCount,

                                            absent:
                                                absentCount,

                                            excused:
                                                excusedCount,

                                            attendancePercentage,

                                            pendingCorrectionRequests:
                                                pendingRequests
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

module.exports = {
    getDashboardStats
};