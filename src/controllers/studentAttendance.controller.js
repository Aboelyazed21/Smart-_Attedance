const db = require("../config/db");

// ==========================================
// Student - Get Attendance History
// ==========================================
const getAttendance = (req, res) => {
    const userId = req.user.userId;

    const sql = `
        SELECT
            ae.id AS attendance_id,

            ae.status AS attendance_status,
            ae.source,
            ae.validation_status,
            ae.scanned_at,
            ae.qr_version,
            ae.notes,

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
            c.course_name,

            r.id AS room_id,
            r.building,
            r.room_name,
            r.room_type

        FROM users u

        INNER JOIN student_profiles sp
            ON sp.user_id = u.id

        INNER JOIN attendance_events ae
            ON ae.student_id = sp.id

        INNER JOIN attendance_sessions a
            ON a.id = ae.session_id

        INNER JOIN sections s
            ON s.id = a.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        LEFT JOIN rooms r
            ON r.id = a.room_id

        WHERE u.id = ?

        ORDER BY
            a.session_date DESC,
            a.scheduled_start DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(
                "Get student attendance error:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        return res.json({
            success: true,
            attendance: results
        });
    });
};

module.exports = {
    getAttendance
};