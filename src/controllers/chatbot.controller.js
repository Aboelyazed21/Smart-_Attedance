const db = require("../config/db");

// ==========================================
// Smart Attendance Chatbot
// ==========================================
const chat = (req, res) => {
    const userId = req.user.userId;

    const message =
        typeof req.body.message === "string"
            ? req.body.message.trim()
            : "";

    if (!message) {
        return res.status(400).json({
            success: false,
            message:
                "Message is required"
        });
    }

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
                    "Chatbot student error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (studentResults.length === 0) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Student profile not found"
                });
            }

            const student =
                studentResults[0];

            const normalizedMessage =
                message.toLowerCase();

            // ==========================================
            // Detect Intent
            // ==========================================
            const isAttendanceQuestion =
                normalizedMessage.includes(
                    "attendance"
                ) ||
                normalizedMessage.includes(
                    "حضور"
                ) ||
                normalizedMessage.includes(
                    "غياب"
                );

            const isCorrectionQuestion =
                normalizedMessage.includes(
                    "correction"
                ) ||
                normalizedMessage.includes(
                    "request"
                ) ||
                normalizedMessage.includes(
                    "تصحيح"
                ) ||
                normalizedMessage.includes(
                    "اعتراض"
                );

            const isScheduleQuestion =
                normalizedMessage.includes(
                    "schedule"
                ) ||
                normalizedMessage.includes(
                    "جدول"
                ) ||
                normalizedMessage.includes(
                    "محاضرة"
                );

            // ==========================================
            // Attendance Intent
            // ==========================================
            if (isAttendanceQuestion) {
                const attendanceSql = `
                    SELECT
                        COUNT(*) AS total,

                        SUM(
                            CASE
                                WHEN ae.status = 'present'
                                THEN 1
                                ELSE 0
                            END
                        ) AS present,

                        SUM(
                            CASE
                                WHEN ae.status = 'late'
                                THEN 1
                                ELSE 0
                            END
                        ) AS late,

                        SUM(
                            CASE
                                WHEN ae.status = 'absent'
                                THEN 1
                                ELSE 0
                            END
                        ) AS absent,

                        SUM(
                            CASE
                                WHEN ae.status = 'excused'
                                THEN 1
                                ELSE 0
                            END
                        ) AS excused

                    FROM attendance_events ae

                    WHERE ae.student_id = ?
                `;

                return db.query(
                    attendanceSql,
                    [student.student_id],
                    (err, results) => {
                        if (err) {
                            console.error(
                                "Chatbot attendance error:",
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

                        const stats =
                            results[0] ||
                            {};

                        const total =
                            Number(
                                stats.total ||
                                    0
                            );

                        const present =
                            Number(
                                stats.present ||
                                    0
                            );

                        const late =
                            Number(
                                stats.late ||
                                    0
                            );

                        const absent =
                            Number(
                                stats.absent ||
                                    0
                            );

                        const excused =
                            Number(
                                stats.excused ||
                                    0
                            );

                        const percentage =
                            total >
                            0
                                ? Number(
                                      (
                                          (
                                              present +
                                              late
                                          ) /
                                          total
                                      ) *
                                          100
                                  ).toFixed(
                                      2
                                  )
                                : 0;

                        return res.json({
                            success:
                                true,

                            intent:
                                "attendance",

                            reply:
                                `Your attendance is ${percentage}%. ` +
                                `Present: ${present}, ` +
                                `Late: ${late}, ` +
                                `Absent: ${absent}, ` +
                                `Excused: ${excused}.`,

                            data: {
                                total,
                                present,
                                late,
                                absent,
                                excused,
                                attendancePercentage:
                                    percentage
                            }
                        });
                    }
                );
            }

            // ==========================================
            // Correction Request Intent
            // ==========================================
            if (isCorrectionQuestion) {
                const requestSql = `
                    SELECT
                        COUNT(*) AS total,

                        SUM(
                            CASE
                                WHEN cr.status = 'pending'
                                THEN 1
                                ELSE 0
                            END
                        ) AS pending,

                        SUM(
                            CASE
                                WHEN cr.status = 'approved'
                                THEN 1
                                ELSE 0
                            END
                        ) AS approved,

                        SUM(
                            CASE
                                WHEN cr.status = 'rejected'
                                THEN 1
                                ELSE 0
                            END
                        ) AS rejected

                    FROM correction_requests cr

                    WHERE cr.student_id = ?
                `;

                return db.query(
                    requestSql,
                    [student.student_id],
                    (err, results) => {
                        if (err) {
                            console.error(
                                "Chatbot correction error:",
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

                        const stats =
                            results[0] ||
                            {};

                        const total =
                            Number(
                                stats.total ||
                                    0
                            );

                        const pending =
                            Number(
                                stats.pending ||
                                    0
                            );

                        const approved =
                            Number(
                                stats.approved ||
                                    0
                            );

                        const rejected =
                            Number(
                                stats.rejected ||
                                    0
                            );

                        return res.json({
                            success:
                                true,

                            intent:
                                "correction_request",

                            reply:
                                `You have ${total} correction request(s). ` +
                                `Pending: ${pending}, ` +
                                `Approved: ${approved}, ` +
                                `Rejected: ${rejected}.`,

                            data: {
                                total,
                                pending,
                                approved,
                                rejected
                            }
                        });
                    }
                );
            }

            // ==========================================
            // Schedule Intent
            // ==========================================
            if (isScheduleQuestion) {
                const scheduleSql = `
                    SELECT
                        c.course_code,
                        c.course_name,
                        s.section_name,
                        ts.day_of_week,
                        ts.start_time,
                        ts.end_time,
                        r.building,
                        r.room_name

                    FROM enrollments e

                    INNER JOIN sections s
                        ON s.id = e.section_id

                    INNER JOIN courses c
                        ON c.id = s.course_id

                    INNER JOIN timetable_slots ts
                        ON ts.section_id = s.id

                    LEFT JOIN rooms r
                        ON r.id = ts.room_id

                    WHERE e.student_id = ?

                      AND e.status = 'active'

                    ORDER BY
                        ts.start_time
                `;

                return db.query(
                    scheduleSql,
                    [student.student_id],
                    (err, results) => {
                        if (err) {
                            console.error(
                                "Chatbot schedule error:",
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

                        return res.json({
                            success:
                                true,

                            intent:
                                "schedule",

                            reply:
                                results.length >
                                0
                                    ? "Here is your current schedule."
                                    : "No schedule found.",

                            data:
                                results
                        });
                    }
                );
            }

            // ==========================================
            // Default Response
            // ==========================================
            return res.json({
                success: true,

                intent: "general",

                reply:
                    "I can help you with attendance, correction requests, and your schedule.",

                suggestions: [
                    "What is my attendance?",
                    "Show my correction requests",
                    "Show my schedule"
                ]
            });
        }
    );
};

module.exports = {
    chat
};