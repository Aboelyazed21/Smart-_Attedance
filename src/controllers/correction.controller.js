const db = require("../config/db");

// ==========================================
// Manual Attendance Correction
// ==========================================
const updateAttendance = (req, res) => {
    const actorId = req.user.userId;

    const {
        sessionId,
        studentId,
        status,
        reason
    } = req.body;

    // ==========================================
    // Validate Input
    // ==========================================
    if (
        !sessionId ||
        !studentId ||
        !status ||
        !reason
    ) {
        return res.status(400).json({
            success: false,
            message:
                "sessionId, studentId, status and reason are required"
        });
    }

    const allowedStatuses = [
        "present",
        "absent",
        "late",
        "excused"
    ];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid attendance status"
        });
    }

    // ==========================================
    // Check Session + Ownership
    // ==========================================
    const sessionSql = `
        SELECT
            a.id,
            a.section_id,
            a.opened_by,
            a.status,
            s.section_name,
            c.course_code,
            c.course_name
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
                    "Check session error:",
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

            const session =
                sessionResults[0];

            // ==========================================
            // Authorization
            // ==========================================
            if (session.opened_by !== actorId) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to modify this session"
                });
            }

            // ==========================================
            // Check Student
            // ==========================================
            const studentSql = `
                SELECT
                    sp.id AS student_id,
                    sp.student_code,
                    sp.university_id,
                    sp.user_id,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM student_profiles sp

                INNER JOIN users u
                    ON u.id = sp.user_id

                WHERE
                    sp.student_code = ?
                    OR sp.id = ?

                LIMIT 1
            `;

            db.query(
                studentSql,
                [studentId, studentId],
                (err, studentResults) => {
                    if (err) {
                        console.error(
                            "Get student error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Database error"
                        });
                    }

                    if (
                        studentResults.length ===
                        0
                    ) {
                        return res.status(404).json({
                            success: false,
                            message:
                                "Student not found"
                        });
                    }

                    const student =
                        studentResults[0];

                    // ==========================================
                    // Check Enrollment
                    // ==========================================
                    const enrollmentSql = `
                        SELECT
                            id,
                            status
                        FROM enrollments
                        WHERE student_id = ?
                          AND section_id = ?
                        LIMIT 1
                    `;

                    db.query(
                        enrollmentSql,
                        [
                            student.student_id,
                            session.section_id
                        ],
                        (
                            err,
                            enrollmentResults
                        ) => {
                            if (err) {
                                console.error(
                                    "Check enrollment error:",
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
                                enrollmentResults.length ===
                                0
                            ) {
                                return res
                                    .status(
                                        403
                                    )
                                    .json({
                                        success:
                                            false,
                                        message:
                                            "Student is not enrolled in this section"
                                    });
                            }

                            if (
                                enrollmentResults[0]
                                    .status !==
                                "active"
                            ) {
                                return res
                                    .status(
                                        403
                                    )
                                    .json({
                                        success:
                                            false,
                                        message:
                                            "Student enrollment is not active"
                                    });
                            }

                            // ==========================================
                            // Check Existing Attendance
                            // ==========================================
                            const existingSql = `
                                SELECT
                                    id,
                                    student_id,
                                    session_id,
                                    status,
                                    source,
                                    validation_status,
                                    scanned_at,
                                    qr_version,
                                    notes
                                FROM attendance_events
                                WHERE student_id = ?
                                  AND session_id = ?
                                LIMIT 1
                            `;

                            db.query(
                                existingSql,
                                [
                                    student.student_id,
                                    sessionId
                                ],
                                (
                                    err,
                                    existingResults
                                ) => {
                                    if (err) {
                                        console.error(
                                            "Get attendance error:",
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

                                    // ==========================================
                                    // Existing Event
                                    // ==========================================
                                    if (
                                        existingResults.length >
                                        0
                                    ) {
                                        const existing =
                                            existingResults[0];

                                        const beforeData =
                                            JSON.stringify(
                                                {
                                                    id:
                                                        existing.id,
                                                    studentId:
                                                        existing.student_id,
                                                    sessionId:
                                                        existing.session_id,
                                                    status:
                                                        existing.status,
                                                    source:
                                                        existing.source,
                                                    validationStatus:
                                                        existing.validation_status,
                                                    scannedAt:
                                                        existing.scanned_at,
                                                    qrVersion:
                                                        existing.qr_version,
                                                    notes:
                                                        existing.notes
                                                }
                                            );

                                        const updateSql = `
                                            UPDATE attendance_events
                                            SET
                                                status = ?,
                                                source = 'manual',
                                                validation_status = 'accepted',
                                                scanned_at = NOW(),
                                                notes = ?
                                            WHERE id = ?
                                        `;

                                        db.query(
                                            updateSql,
                                            [
                                                status,
                                                reason,
                                                existing.id
                                            ],
                                            (
                                                err,
                                                updateResult
                                            ) => {
                                                if (
                                                    err
                                                ) {
                                                    console.error(
                                                        "Update attendance error:",
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
                                                                "Could not update attendance"
                                                        });
                                                }

                                                const afterData =
                                                    JSON.stringify(
                                                        {
                                                            id:
                                                                existing.id,
                                                            studentId:
                                                                existing.student_id,
                                                            sessionId:
                                                                existing.session_id,
                                                            status,
                                                            source:
                                                                "manual",
                                                            validationStatus:
                                                                "accepted",
                                                            notes:
                                                                reason
                                                        }
                                                    );

                                                createAuditEvent(
                                                    actorId,
                                                    "attendance_manual_correction",
                                                    "attendance_events",
                                                    existing.id,
                                                    beforeData,
                                                    afterData,
                                                    req,
                                                    (
                                                        auditError
                                                    ) => {
                                                        if (
                                                            auditError
                                                        ) {
                                                            console.error(
                                                                "Audit error:",
                                                                auditError
                                                            );
                                                        }

                                                        return res.json(
                                                            {
                                                                success:
                                                                    true,
                                                                message:
                                                                    "Attendance updated successfully",
                                                                attendance:
                                                                    {
                                                                        id:
                                                                            existing.id,
                                                                        studentId:
                                                                            student.student_id,
                                                                        studentCode:
                                                                            student.student_code,
                                                                        sessionId:
                                                                            Number(
                                                                                sessionId
                                                                            ),
                                                                        status,
                                                                        source:
                                                                            "manual",
                                                                        validationStatus:
                                                                            "accepted",
                                                                        notes:
                                                                            reason
                                                                    }
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );

                                        return;
                                    }

                                    // ==========================================
                                    // No Existing Event → Create One
                                    // ==========================================
                                    const insertSql = `
                                        INSERT INTO attendance_events
                                        (
                                            student_id,
                                            session_id,
                                            status,
                                            source,
                                            validation_status,
                                            scanned_at,
                                            notes
                                        )
                                        VALUES
                                        (
                                            ?,
                                            ?,
                                            ?,
                                            'manual',
                                            'accepted',
                                            NOW(),
                                            ?
                                        )
                                    `;

                                    db.query(
                                        insertSql,
                                        [
                                            student.student_id,
                                            sessionId,
                                            status,
                                            reason
                                        ],
                                        (
                                            err,
                                            result
                                        ) => {
                                            if (
                                                err
                                            ) {
                                                console.error(
                                                    "Create attendance error:",
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
                                                            "Could not create attendance record"
                                                    });
                                            }

                                            const afterData =
                                                JSON.stringify(
                                                    {
                                                        id:
                                                            result.insertId,
                                                        studentId:
                                                            student.student_id,
                                                        sessionId:
                                                            Number(
                                                                sessionId
                                                            ),
                                                        status,
                                                        source:
                                                            "manual",
                                                        validationStatus:
                                                            "accepted",
                                                        notes:
                                                            reason
                                                    }
                                                );

                                            createAuditEvent(
                                                actorId,
                                                "attendance_manual_correction",
                                                "attendance_events",
                                                result.insertId,
                                                null,
                                                afterData,
                                                req,
                                                (
                                                    auditError
                                                ) => {
                                                    if (
                                                        auditError
                                                    ) {
                                                        console.error(
                                                            "Audit error:",
                                                            auditError
                                                        );
                                                    }

                                                    return res
                                                        .status(
                                                            201
                                                        )
                                                        .json({
                                                            success:
                                                                true,
                                                            message:
                                                                "Attendance created successfully",
                                                            attendance:
                                                                {
                                                                    id:
                                                                        result.insertId,
                                                                    studentId:
                                                                        student.student_id,
                                                                    studentCode:
                                                                        student.student_code,
                                                                    sessionId:
                                                                        Number(
                                                                            sessionId
                                                                        ),
                                                                    status,
                                                                    source:
                                                                        "manual",
                                                                    validationStatus:
                                                                        "accepted",
                                                                    notes:
                                                                        reason
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
        }
    );
};

// ==========================================
// Create Audit Event
// ==========================================
const createAuditEvent = (
    actorId,
    action,
    entityType,
    entityId,
    beforeData,
    afterData,
    req,
    callback
) => {
    const auditSql = `
        INSERT INTO audit_events
        (
            actor_id,
            action,
            entity_type,
            entity_id,
            before_data,
            after_data,
            ip_address,
            user_agent
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const ipAddress =
        req.ip ||
        req.headers["x-forwarded-for"] ||
        null;

    const userAgent =
        req.headers["user-agent"] ||
        null;

    db.query(
        auditSql,
        [
            actorId,
            action,
            entityType,
            entityId,
            beforeData,
            afterData,
            ipAddress,
            userAgent
        ],
        (err) => {
            callback(err);
        }
    );
};

module.exports = {
    updateAttendance
};