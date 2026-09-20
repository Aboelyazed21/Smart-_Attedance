const db = require("../config/db");

// ==========================================
// Get Lecturer Dashboard Statistics
// ==========================================
const getDashboardStats = (req, res) => {
    const lecturerId = req.user.userId;

    // ==========================================
    // Get Lecturer
    // ==========================================
    const lecturerSql = `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            sf.staff_code,
            sf.department,
            sf.job_title
        FROM users u

        INNER JOIN staff_profiles sf
            ON sf.user_id = u.id

        WHERE u.id = ?

        LIMIT 1
    `;

    db.query(
        lecturerSql,
        [lecturerId],
        (err, lecturerResults) => {
            if (err) {
                console.error(
                    "Get lecturer error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (lecturerResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Lecturer profile not found"
                });
            }

            const lecturer =
                lecturerResults[0];

            // ==========================================
            // Get Sections Statistics
            // ==========================================
            const sectionsSql = `
                SELECT
                    COUNT(*) AS total_sections,

                    COUNT(
                        DISTINCT s.course_id
                    ) AS total_courses,

                    COALESCE(
                        SUM(
                            (
                                SELECT COUNT(*)
                                FROM enrollments e
                                WHERE e.section_id = s.id
                                  AND e.status = 'active'
                            )
                        ),
                        0
                    ) AS total_enrolled_students

                FROM sections s

                WHERE s.lecturer_id = ?
            `;

            db.query(
                sectionsSql,
                [lecturerId],
                (
                    err,
                    sectionResults
                ) => {
                    if (err) {
                        console.error(
                            "Get lecturer sections stats error:",
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

                    const sectionStats =
                        sectionResults[0] ||
                        {};

                    // ==========================================
                    // Session Statistics
                    // ==========================================
                    const sessionsSql = `
                        SELECT
                            COUNT(*) AS total_sessions,

                            SUM(
                                CASE
                                    WHEN a.status = 'active'
                                    THEN 1
                                    ELSE 0
                                END
                            ) AS active_sessions,

                            SUM(
                                CASE
                                    WHEN a.status = 'closed'
                                    THEN 1
                                    ELSE 0
                                END
                            ) AS closed_sessions

                        FROM attendance_sessions a

                        INNER JOIN sections s
                            ON s.id = a.section_id

                        WHERE s.lecturer_id = ?
                    `;

                    db.query(
                        sessionsSql,
                        [lecturerId],
                        (
                            err,
                            sessionResults
                        ) => {
                            if (err) {
                                console.error(
                                    "Get lecturer sessions stats error:",
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

                            const sessionStats =
                                sessionResults[0] ||
                                {};

                            // ==========================================
                            // Attendance Statistics
                            // ==========================================
                            const attendanceSql = `
                                SELECT
                                    COUNT(*) AS total_attendance_events,

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

                                INNER JOIN attendance_sessions a
                                    ON a.id = ae.session_id

                                INNER JOIN sections s
                                    ON s.id = a.section_id

                                WHERE s.lecturer_id = ?
                            `;

                            db.query(
                                attendanceSql,
                                [lecturerId],
                                (
                                    err,
                                    attendanceResults
                                ) => {
                                    if (
                                        err
                                    ) {
                                        console.error(
                                            "Get lecturer attendance stats error:",
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

                                    const attendanceStats =
                                        attendanceResults[0] ||
                                        {};

                                    // ==========================================
                                    // Correction Requests
                                    // ==========================================
                                    const correctionsSql = `
                                        SELECT
                                            COUNT(*) AS total_requests,

                                            SUM(
                                                CASE
                                                    WHEN cr.status = 'pending'
                                                    THEN 1
                                                    ELSE 0
                                                END
                                            ) AS pending_requests,

                                            SUM(
                                                CASE
                                                    WHEN cr.status = 'approved'
                                                    THEN 1
                                                    ELSE 0
                                                END
                                            ) AS approved_requests,

                                            SUM(
                                                CASE
                                                    WHEN cr.status = 'rejected'
                                                    THEN 1
                                                    ELSE 0
                                                END
                                            ) AS rejected_requests

                                        FROM correction_requests cr

                                        INNER JOIN attendance_events ae
                                            ON ae.id = cr.attendance_event_id

                                        INNER JOIN attendance_sessions a
                                            ON a.id = ae.session_id

                                        INNER JOIN sections s
                                            ON s.id = a.section_id

                                        WHERE a.opened_by = ?
                                    `;

                                    db.query(
                                        correctionsSql,
                                        [lecturerId],
                                        (
                                            err,
                                            correctionResults
                                        ) => {
                                            if (
                                                err
                                            ) {
                                                console.error(
                                                    "Get lecturer correction stats error:",
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

                                            const corrections =
                                                correctionResults[0] ||
                                                {};

                                            // ==========================================
                                            // Convert Numbers
                                            // ==========================================
                                            const totalAttendanceEvents =
                                                Number(
                                                    attendanceStats.total_attendance_events ||
                                                        0
                                                );

                                            const presentCount =
                                                Number(
                                                    attendanceStats.present_count ||
                                                        0
                                                );

                                            const lateCount =
                                                Number(
                                                    attendanceStats.late_count ||
                                                        0
                                                );

                                            const absentCount =
                                                Number(
                                                    attendanceStats.absent_count ||
                                                        0
                                                );

                                            const excusedCount =
                                                Number(
                                                    attendanceStats.excused_count ||
                                                        0
                                                );

                                            const attendancePercentage =
                                                totalAttendanceEvents >
                                                0
                                                    ? Number(
                                                          (
                                                              (
                                                                  presentCount +
                                                                  lateCount
                                                              ) /
                                                              totalAttendanceEvents
                                                          ) *
                                                              100
                                                      ).toFixed(
                                                          2
                                                      )
                                                    : 0;

                                            // ==========================================
                                            // Return Dashboard
                                            // ==========================================
                                            return res.json({
                                                success:
                                                    true,

                                                lecturer:
                                                    {
                                                        id:
                                                            lecturer.id,

                                                        staffCode:
                                                            lecturer.staff_code,

                                                        firstName:
                                                            lecturer.first_name,

                                                        lastName:
                                                            lecturer.last_name,

                                                        email:
                                                            lecturer.email,

                                                        department:
                                                            lecturer.department,

                                                        jobTitle:
                                                            lecturer.job_title
                                                    },

                                                stats:
                                                    {
                                                        totalSections:
                                                            Number(
                                                                sectionStats.total_sections ||
                                                                    0
                                                            ),

                                                        totalCourses:
                                                            Number(
                                                                sectionStats.total_courses ||
                                                                    0
                                                            ),

                                                        totalEnrolledStudents:
                                                            Number(
                                                                sectionStats.total_enrolled_students ||
                                                                    0
                                                            ),

                                                        totalSessions:
                                                            Number(
                                                                sessionStats.total_sessions ||
                                                                    0
                                                            ),

                                                        activeSessions:
                                                            Number(
                                                                sessionStats.active_sessions ||
                                                                    0
                                                            ),

                                                        closedSessions:
                                                            Number(
                                                                sessionStats.closed_sessions ||
                                                                    0
                                                            ),

                                                        totalAttendanceEvents,

                                                        present:
                                                            presentCount,

                                                        late:
                                                            lateCount,

                                                        absent:
                                                            absentCount,

                                                        excused:
                                                            excusedCount,

                                                        attendancePercentage,

                                                        correctionRequests:
                                                            {
                                                                total:
                                                                    Number(
                                                                        corrections.total_requests ||
                                                                            0
                                                                    ),

                                                                pending:
                                                                    Number(
                                                                        corrections.pending_requests ||
                                                                            0
                                                                    ),

                                                                approved:
                                                                    Number(
                                                                        corrections.approved_requests ||
                                                                            0
                                                                    ),

                                                                rejected:
                                                                    Number(
                                                                        corrections.rejected_requests ||
                                                                            0
                                                                    )
                                                            }
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
        }
    );
};

module.exports = {
    getDashboardStats
};