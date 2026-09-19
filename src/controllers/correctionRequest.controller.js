const db = require("../config/db");

// ==========================================
// Create Correction Request
// ==========================================
const createCorrectionRequest = (req, res) => {
    const userId = req.user.userId;

    const {
        attendanceEventId,
        requestedStatus,
        reason,
        evidenceUrl
    } = req.body;

    // ==========================================
    // Validate Input
    // ==========================================
    if (
        !attendanceEventId ||
        !requestedStatus ||
        !reason
    ) {
        return res.status(400).json({
            success: false,
            message:
                "attendanceEventId, requestedStatus and reason are required"
        });
    }

    const allowedStatuses = [
        "present",
        "absent",
        "late",
        "excused"
    ];

    if (
        !allowedStatuses.includes(
            requestedStatus
        )
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid requested status"
        });
    }

    // ==========================================
    // Get Student
    // ==========================================
    const studentSql = `
        SELECT
            sp.id AS student_id,
            sp.student_code,
            sp.user_id,
            u.first_name,
            u.last_name,
            u.email
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
                    "Get student error:",
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

            // ==========================================
            // Get Attendance Event
            // ==========================================
            const eventSql = `
                SELECT
                    ae.id,
                    ae.student_id,
                    ae.session_id,
                    ae.status,
                    ae.source,
                    ae.validation_status,
                    ae.scanned_at,
                    ae.notes,

                    a.section_id,
                    a.session_date,
                    a.scheduled_start,
                    a.scheduled_end,
                    a.status AS session_status,

                    s.section_name,

                    c.course_code,
                    c.course_name

                FROM attendance_events ae

                INNER JOIN attendance_sessions a
                    ON a.id = ae.session_id

                INNER JOIN sections s
                    ON s.id = a.section_id

                INNER JOIN courses c
                    ON c.id = s.course_id

                WHERE ae.id = ?
                LIMIT 1
            `;

            db.query(
                eventSql,
                [attendanceEventId],
                (err, eventResults) => {
                    if (err) {
                        console.error(
                            "Get attendance event error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Database error"
                        });
                    }

                    if (
                        eventResults.length ===
                        0
                    ) {
                        return res.status(404).json({
                            success: false,
                            message:
                                "Attendance event not found"
                        });
                    }

                    const event =
                        eventResults[0];

                    // ==========================================
                    // Verify Event Belongs To Student
                    // ==========================================
                    if (
                        event.student_id !==
                        student.student_id
                    ) {
                        return res.status(403).json({
                            success: false,
                            message:
                                "You are not allowed to request correction for this attendance record"
                        });
                    }

                    // ==========================================
                    // Check Requested Status
                    // ==========================================
                    if (
                        event.status ===
                        requestedStatus
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Requested status is the same as current attendance status"
                        });
                    }

                    // ==========================================
                    // Check Existing Pending Request
                    // ==========================================
                    const pendingSql = `
                        SELECT
                            id,
                            status,
                            requested_status,
                            reason,
                            evidence_url,
                            created_at
                        FROM correction_requests
                        WHERE attendance_event_id = ?
                          AND student_id = ?
                          AND status = 'pending'
                        LIMIT 1
                    `;

                    db.query(
                        pendingSql,
                        [
                            attendanceEventId,
                            student.student_id
                        ],
                        (
                            err,
                            pendingResults
                        ) => {
                            if (err) {
                                console.error(
                                    "Check pending correction error:",
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

                            if (
                                pendingResults.length >
                                0
                            ) {
                                return res
                                    .status(
                                        409
                                    )
                                    .json({
                                        success:
                                            false,
                                        message:
                                            "You already have a pending correction request for this attendance",
                                        request:
                                            pendingResults[0]
                                    });
                            }

                            // ==========================================
                            // Create Correction Request
                            // ==========================================
                            const insertSql = `
                                INSERT INTO correction_requests
                                (
                                    attendance_event_id,
                                    student_id,
                                    requested_status,
                                    reason,
                                    evidence_url,
                                    status
                                )
                                VALUES
                                (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    'pending'
                                )
                            `;

                            db.query(
                                insertSql,
                                [
                                    attendanceEventId,
                                    student.student_id,
                                    requestedStatus,
                                    reason,
                                    evidenceUrl ||
                                        null
                                ],
                                (
                                    err,
                                    result
                                ) => {
                                    if (
                                        err
                                    ) {
                                        console.error(
                                            "Create correction request error:",
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
                                                    "Could not create correction request"
                                            });
                                    }

                                    return res
                                        .status(
                                            201
                                        )
                                        .json({
                                            success:
                                                true,

                                            message:
                                                "Correction request submitted successfully",

                                            request:
                                                {
                                                    id:
                                                        result.insertId,

                                                    attendanceEventId:
                                                        Number(
                                                            attendanceEventId
                                                        ),

                                                    studentId:
                                                        student.student_id,

                                                    studentCode:
                                                        student.student_code,

                                                    requestedStatus,

                                                    currentStatus:
                                                        event.status,

                                                    reason,

                                                    evidenceUrl:
                                                        evidenceUrl ||
                                                        null,

                                                    status:
                                                        "pending"
                                                },

                                            attendance:
                                                {
                                                    sessionId:
                                                        event.session_id,

                                                    courseCode:
                                                        event.course_code,

                                                    courseName:
                                                        event.course_name,

                                                    sectionName:
                                                        event.section_name,

                                                    sessionDate:
                                                        event.session_date,

                                                    currentStatus:
                                                        event.status
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
    createCorrectionRequest
};