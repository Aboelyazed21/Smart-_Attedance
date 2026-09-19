const db = require("../config/db");

// ==========================================
// Approve Correction Request
// ==========================================
const approveCorrectionRequest = (req, res) => {
    const reviewerId = req.user.userId;
    const requestId = req.params.id;

    const {
        reviewerComment
    } = req.body;

    if (!requestId) {
        return res.status(400).json({
            success: false,
            message: "Request ID is required"
        });
    }

    // ==========================================
    // Get Correction Request
    // ==========================================
    const requestSql = `
        SELECT
            cr.id,
            cr.attendance_event_id,
            cr.student_id,
            cr.requested_status,
            cr.reason,
            cr.status,
            cr.reviewed_by,

            ae.session_id,
            ae.status AS current_attendance_status,
            ae.source AS current_source,
            ae.validation_status AS current_validation_status,
            ae.scanned_at,
            ae.notes AS current_notes,

            a.section_id,
            a.opened_by,

            sp.student_code

        FROM correction_requests cr

        INNER JOIN attendance_events ae
            ON ae.id = cr.attendance_event_id

        INNER JOIN attendance_sessions a
            ON a.id = ae.session_id

        INNER JOIN student_profiles sp
            ON sp.id = cr.student_id

        WHERE cr.id = ?

        LIMIT 1
    `;

    db.query(
        requestSql,
        [requestId],
        (err, results) => {
            if (err) {
                console.error(
                    "Get correction request error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Correction request not found"
                });
            }

            const request = results[0];

            // ==========================================
            // Authorization
            // ==========================================
            if (
                request.opened_by !==
                reviewerId
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to review this request"
                });
            }

            // ==========================================
            // Check Request Status
            // ==========================================
            if (
                request.status !==
                "pending"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `Request has already been ${request.status}`
                });
            }

            // ==========================================
            // Prepare Audit Data
            // ==========================================
            const beforeData =
                JSON.stringify({
                    attendanceEventId:
                        request.attendance_event_id,

                    studentId:
                        request.student_id,

                    status:
                        request.current_attendance_status,

                    source:
                        request.current_source,

                    validationStatus:
                        request.current_validation_status,

                    scannedAt:
                        request.scanned_at,

                    notes:
                        request.current_notes
                });

            const afterData =
                JSON.stringify({
                    attendanceEventId:
                        request.attendance_event_id,

                    studentId:
                        request.student_id,

                    status:
                        request.requested_status,

                    source:
                        "correction",

                    validationStatus:
                        "accepted",

                    notes:
                        request.reason
                });

            // ==========================================
            // Transaction
            // ==========================================
            db.beginTransaction(
                (transactionError) => {
                    if (transactionError) {
                        console.error(
                            "Begin transaction error:",
                            transactionError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Could not start approval transaction"
                        });
                    }

                    // ==========================================
                    // Update Attendance Event
                    // ==========================================
                    const updateAttendanceSql = `
                        UPDATE attendance_events
                        SET
                            status = ?,
                            source = 'correction',
                            validation_status = 'accepted',
                            notes = ?
                        WHERE id = ?
                    `;

                    db.query(
                        updateAttendanceSql,
                        [
                            request.requested_status,
                            request.reason,
                            request.attendance_event_id
                        ],
                        (
                            err,
                            attendanceResult
                        ) => {
                            if (err) {
                                return rollback(
                                    db,
                                    res,
                                    "Could not update attendance event",
                                    err
                                );
                            }

                            if (
                                attendanceResult.affectedRows ===
                                0
                            ) {
                                return rollback(
                                    db,
                                    res,
                                    "Attendance event was not updated"
                                );
                            }

                            // ==========================================
                            // Update Correction Request
                            // ==========================================
                            const updateRequestSql = `
                                UPDATE correction_requests
                                SET
                                    status = 'approved',
                                    reviewed_by = ?,
                                    reviewed_at = NOW(),
                                    reviewer_comment = ?
                                WHERE id = ?
                                  AND status = 'pending'
                            `;

                            db.query(
                                updateRequestSql,
                                [
                                    reviewerId,
                                    reviewerComment ||
                                        null,
                                    requestId
                                ],
                                (
                                    err,
                                    requestResult
                                ) => {
                                    if (
                                        err
                                    ) {
                                        return rollback(
                                            db,
                                            res,
                                            "Could not approve correction request",
                                            err
                                        );
                                    }

                                    if (
                                        requestResult.affectedRows ===
                                        0
                                    ) {
                                        return rollback(
                                            db,
                                            res,
                                            "Correction request could not be approved"
                                        );
                                    }

                                    // ==========================================
                                    // Create Audit Event
                                    // ==========================================
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
                                        (
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            ?,
                                            ?
                                        )
                                    `;

                                    const ipAddress =
                                        req.ip ||
                                        req.headers[
                                            "x-forwarded-for"
                                        ] ||
                                        null;

                                    const userAgent =
                                        req.headers[
                                            "user-agent"
                                        ] ||
                                        null;

                                    db.query(
                                        auditSql,
                                        [
                                            reviewerId,

                                            "correction_request_approved",

                                            "correction_requests",

                                            requestId,

                                            beforeData,

                                            afterData,

                                            ipAddress,

                                            userAgent
                                        ],
                                        (
                                            err
                                        ) => {
                                            if (
                                                err
                                            ) {
                                                return rollback(
                                                    db,
                                                    res,
                                                    "Could not create audit event",
                                                    err
                                                );
                                            }

                                            // ==========================================
                                            // Commit
                                            // ==========================================
                                            db.commit(
                                                (
                                                    commitError
                                                ) => {
                                                    if (
                                                        commitError
                                                    ) {
                                                        return rollback(
                                                            db,
                                                            res,
                                                            "Could not commit approval",
                                                            commitError
                                                        );
                                                    }

                                                    return res.json(
                                                        {
                                                            success:
                                                                true,

                                                            message:
                                                                "Correction request approved successfully",

                                                            request:
                                                                {
                                                                    id:
                                                                        Number(
                                                                            requestId
                                                                        ),

                                                                    status:
                                                                        "approved",

                                                                    reviewedBy:
                                                                        reviewerId,

                                                                    requestedStatus:
                                                                        request.requested_status
                                                                },

                                                            attendance:
                                                                {
                                                                    eventId:
                                                                        request.attendance_event_id,

                                                                    studentId:
                                                                        request.student_id,

                                                                    studentCode:
                                                                        request.student_code,

                                                                    sessionId:
                                                                        request.session_id,

                                                                    status:
                                                                        request.requested_status,

                                                                    source:
                                                                        "correction",

                                                                    validationStatus:
                                                                        "accepted"
                                                                }
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
        }
    );
};

// ==========================================
// Rollback Transaction
// ==========================================
const rollback = (
    db,
    res,
    message,
    error = null
) => {
    if (error) {
        console.error(
            message,
            error
        );
    }

    db.rollback(() => {
        return res.status(500).json({
            success: false,
            message
        });
    });
};

module.exports = {
    approveCorrectionRequest
};