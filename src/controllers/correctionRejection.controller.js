const db = require("../config/db");

// ==========================================
// Reject Correction Request
// ==========================================
const rejectCorrectionRequest = (req, res) => {
    const reviewerId = req.user.userId;
    const requestId = req.params.id;

    const {
        reviewerComment
    } = req.body;

    // ==========================================
    // Validate Request ID
    // ==========================================
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

            ae.session_id,

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
            // Reviewer Comment
            // ==========================================
            const comment =
                reviewerComment ||
                "Correction request rejected";

            // ==========================================
            // Before Data For Audit
            // ==========================================
            const beforeData =
                JSON.stringify({
                    requestId:
                        request.id,

                    attendanceEventId:
                        request.attendance_event_id,

                    studentId:
                        request.student_id,

                    requestedStatus:
                        request.requested_status,

                    requestStatus:
                        request.status
                });

            // ==========================================
            // Update Correction Request
            // ==========================================
            const updateSql = `
                UPDATE correction_requests
                SET
                    status = 'rejected',
                    reviewed_by = ?,
                    reviewed_at = NOW(),
                    reviewer_comment = ?
                WHERE id = ?
                  AND status = 'pending'
            `;

            db.query(
                updateSql,
                [
                    reviewerId,
                    comment,
                    requestId
                ],
                (err, result) => {
                    if (err) {
                        console.error(
                            "Reject correction request error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Could not reject correction request"
                        });
                    }

                    if (
                        result.affectedRows ===
                        0
                    ) {
                        return res.status(400).json({
                            success: false,
                            message:
                                "Correction request could not be rejected"
                        });
                    }

                    // ==========================================
                    // After Data For Audit
                    // ==========================================
                    const afterData =
                        JSON.stringify({
                            requestId:
                                request.id,

                            attendanceEventId:
                                request.attendance_event_id,

                            studentId:
                                request.student_id,

                            requestedStatus:
                                request.requested_status,

                            requestStatus:
                                "rejected",

                            reviewerId,

                            reviewerComment:
                                comment
                        });

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
                        ] || null;

                    db.query(
                        auditSql,
                        [
                            reviewerId,

                            "correction_request_rejected",

                            "correction_requests",

                            requestId,

                            beforeData,

                            afterData,

                            ipAddress,

                            userAgent
                        ],
                        (err) => {
                            if (err) {
                                console.error(
                                    "Audit event error:",
                                    err
                                );

                                // الطلب نفسه اترفض بالفعل،
                                // لذلك لا نرجع 500 بسبب الـ Audit فقط.
                            }

                            return res.json({
                                success:
                                    true,

                                message:
                                    "Correction request rejected successfully",

                                request: {
                                    id:
                                        Number(
                                            requestId
                                        ),

                                    attendanceEventId:
                                        request.attendance_event_id,

                                    studentId:
                                        request.student_id,

                                    studentCode:
                                        request.student_code,

                                    requestedStatus:
                                        request.requested_status,

                                    status:
                                        "rejected",

                                    reviewedBy:
                                        reviewerId,

                                    reviewerComment:
                                        comment
                                }
                            });
                        }
                    );
                }
            );
        }
    );
};

module.exports = {
    rejectCorrectionRequest
};