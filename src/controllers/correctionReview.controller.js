const db = require("../config/db");

// ==========================================
// Get Correction Requests
// ==========================================
const getCorrectionRequests = (req, res) => {
    const reviewerId = req.user.userId;

    const sql = `
        SELECT
            cr.id AS request_id,

            cr.attendance_event_id,
            cr.student_id,
            cr.requested_status,
            cr.reason,
            cr.evidence_url,
            cr.status AS request_status,
            cr.reviewed_by,
            cr.reviewed_at,
            cr.reviewer_comment,
            cr.created_at,
            cr.updated_at,

            sp.student_code,
            sp.university_id,

            u.first_name,
            u.last_name,
            u.email,

            ae.status AS current_attendance_status,
            ae.source AS attendance_source,
            ae.validation_status,
            ae.scanned_at,

            a.id AS session_id,
            a.session_date,
            a.scheduled_start,
            a.scheduled_end,
            a.actual_start,
            a.actual_end,
            a.status AS session_status,

            s.id AS section_id,
            s.section_name,

            c.id AS course_id,
            c.course_code,
            c.course_name

        FROM correction_requests cr

        INNER JOIN attendance_events ae
            ON ae.id = cr.attendance_event_id

        INNER JOIN attendance_sessions a
            ON a.id = ae.session_id

        INNER JOIN sections s
            ON s.id = a.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        INNER JOIN student_profiles sp
            ON sp.id = cr.student_id

        INNER JOIN users u
            ON u.id = sp.user_id

        WHERE a.opened_by = ?

        ORDER BY
            CASE
                WHEN cr.status = 'pending'
                THEN 1
                WHEN cr.status = 'approved'
                THEN 2
                WHEN cr.status = 'rejected'
                THEN 3
                ELSE 4
            END,
            cr.created_at DESC
    `;

    db.query(
        sql,
        [reviewerId],
        (err, results) => {
            if (err) {
                console.error(
                    "Get correction requests error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load correction requests",
                    error: err.message
                });
            }

            return res.json({
                success: true,

                count: results.length,

                requests: results.map(
                    (request) => ({
                        id:
                            request.request_id,

                        attendanceEventId:
                            request.attendance_event_id,

                        student: {
                            id:
                                request.student_id,

                            studentCode:
                                request.student_code,

                            universityId:
                                request.university_id,

                            firstName:
                                request.first_name,

                            lastName:
                                request.last_name,

                            email:
                                request.email
                        },

                        attendance: {
                            currentStatus:
                                request.current_attendance_status,

                            requestedStatus:
                                request.requested_status,

                            source:
                                request.attendance_source,

                            validationStatus:
                                request.validation_status,

                            scannedAt:
                                request.scanned_at
                        },

                        session: {
                            id:
                                request.session_id,

                            date:
                                request.session_date,

                            scheduledStart:
                                request.scheduled_start,

                            scheduledEnd:
                                request.scheduled_end,

                            actualStart:
                                request.actual_start,

                            actualEnd:
                                request.actual_end,

                            status:
                                request.session_status
                        },

                        course: {
                            id:
                                request.course_id,

                            code:
                                request.course_code,

                            name:
                                request.course_name
                        },

                        section: {
                            id:
                                request.section_id,

                            name:
                                request.section_name
                        },

                        reason:
                            request.reason,

                        evidenceUrl:
                            request.evidence_url,

                        status:
                            request.request_status,

                        reviewedBy:
                            request.reviewed_by,

                        reviewedAt:
                            request.reviewed_at,

                        reviewerComment:
                            request.reviewer_comment,

                        createdAt:
                            request.created_at,

                        updatedAt:
                            request.updated_at
                    })
                )
            });
        }
    );
};

module.exports = {
    getCorrectionRequests
};