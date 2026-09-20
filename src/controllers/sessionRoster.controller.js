const db = require("../config/db");

// ==========================================
// Get Session Roster
// ==========================================
const getSessionRoster = (req, res) => {
    const userId = req.user.userId;
    const sessionId = req.params.id;

    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session ID is required"
        });
    }

    // ==========================================
    // Check Session Ownership
    // ==========================================
    const sessionSql = `
        SELECT
            a.id,
            a.section_id,
            a.room_id,
            a.opened_by,
            a.session_date,
            a.scheduled_start,
            a.scheduled_end,
            a.actual_start,
            a.actual_end,
            a.status,

            c.course_code,
            c.course_name,

            s.section_name

        FROM attendance_sessions a

        INNER JOIN sections s
            ON s.id = a.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        WHERE a.id = ?
        LIMIT 1
    `;

    db.query(
        sessionSql,
        [sessionId],
        (err, sessionResults) => {
            if (err) {
                console.error(
                    "Get session error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (sessionResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Attendance session not found"
                });
            }

            const session = sessionResults[0];

            // ==========================================
            // Check Lecturer / Session Owner
            // ==========================================
            if (session.opened_by !== userId) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to view this roster"
                });
            }

            // ==========================================
            // Get Students + Attendance
            // ==========================================
            const rosterSql = `
                SELECT
                    sp.id AS student_id,
                    sp.student_code,
                    sp.university_id,

                    u.first_name,
                    u.last_name,
                    u.email,

                    e.status AS enrollment_status,

                    ae.id AS attendance_id,
                    ae.status AS attendance_status,
                    ae.source,
                    ae.validation_status,
                    ae.scanned_at,
                    ae.qr_version,
                    ae.notes

                FROM enrollments e

                INNER JOIN student_profiles sp
                    ON sp.id = e.student_id

                INNER JOIN users u
                    ON u.id = sp.user_id

                LEFT JOIN attendance_events ae
                    ON ae.student_id = sp.id
                    AND ae.session_id = ?

                WHERE e.section_id = ?
                  AND e.status = 'active'

                ORDER BY
                    sp.student_code ASC
            `;

            db.query(
                rosterSql,
                [
                    sessionId,
                    session.section_id
                ],
                (err, students) => {
                    if (err) {
                        console.error(
                            "Get session roster error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Could not load session roster"
                        });
                    }

                    // ==========================================
                    // Calculate Summary
                    // ==========================================
                    const totalStudents =
                        students.length;

                    const presentStudents =
                        students.filter(
                            (student) =>
                                student.attendance_status ===
                                    "present" ||
                                student.attendance_status ===
                                    "late"
                        ).length;

                    const absentStudents =
                        students.filter(
                            (student) =>
                                !student.attendance_id
                        ).length;

                    const lateStudents =
                        students.filter(
                            (student) =>
                                student.attendance_status ===
                                "late"
                        ).length;

                    const excusedStudents =
                        students.filter(
                            (student) =>
                                student.attendance_status ===
                                "excused"
                        ).length;

                    // ==========================================
                    // Return Response
                    // ==========================================
                    return res.json({
                        success: true,

                        session: {
                            id: session.id,

                            sectionId:
                                session.section_id,

                            sectionName:
                                session.section_name,

                            courseCode:
                                session.course_code,

                            courseName:
                                session.course_name,

                            roomId:
                                session.room_id,

                            sessionDate:
                                session.session_date,

                            scheduledStart:
                                session.scheduled_start,

                            scheduledEnd:
                                session.scheduled_end,

                            actualStart:
                                session.actual_start,

                            actualEnd:
                                session.actual_end,

                            status:
                                session.status
                        },

                        summary: {
                            totalStudents,

                            present:
                                presentStudents,

                            absent:
                                absentStudents,

                            late:
                                lateStudents,

                            excused:
                                excusedStudents
                        },

                        roster: students.map(
                            (student) => ({
                                studentId:
                                    student.student_id,

                                studentCode:
                                    student.student_code,

                                universityId:
                                    student.university_id,

                                firstName:
                                    student.first_name,

                                lastName:
                                    student.last_name,

                                email:
                                    student.email,

                                enrollmentStatus:
                                    student.enrollment_status,

                                attendance:
                                    student.attendance_id
                                        ? {
                                              id: student.attendance_id,

                                              status:
                                                  student.attendance_status,

                                              source:
                                                  student.source,

                                              validationStatus:
                                                  student.validation_status,

                                              scannedAt:
                                                  student.scanned_at,

                                              qrVersion:
                                                  student.qr_version,

                                              notes:
                                                  student.notes
                                          }
                                        : {
                                              id: null,

                                              status:
                                                  "absent",

                                              source: null,

                                              validationStatus:
                                                  null,

                                              scannedAt: null,

                                              qrVersion: null,

                                              notes: null
                                          }
                            })
                        )
                    });
                }
            );
        }
    );
};

module.exports = {
    getSessionRoster
};