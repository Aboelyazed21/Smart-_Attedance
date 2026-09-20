const db = require("../config/db");

// ==========================================
// Student - Get Schedule
// ==========================================
const getSchedule = (req, res) => {
    const userId = req.user.userId;

    const sql = `
        SELECT
            ts.id AS timetable_id,

            c.id AS course_id,
            c.course_code,
            c.course_name,

            s.id AS section_id,
            s.section_name,
            s.academic_year,
            s.semester,

            ts.day_of_week,
            ts.start_time,
            ts.end_time,
            ts.start_date,
            ts.end_date,

            r.id AS room_id,
            r.building,
            r.room_name,
            r.room_type

        FROM users u

        INNER JOIN student_profiles sp
            ON sp.user_id = u.id

        INNER JOIN enrollments e
            ON e.student_id = sp.id
            AND e.status = 'active'

        INNER JOIN sections s
            ON s.id = e.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        INNER JOIN timetable_slots ts
            ON ts.section_id = s.id

        LEFT JOIN rooms r
            ON r.id = ts.room_id

        WHERE u.id = ?

        ORDER BY
            FIELD(
                ts.day_of_week,
                'saturday',
                'sunday',
                'monday',
                'tuesday',
                'wednesday',
                'thursday',
                'friday'
            ),
            ts.start_time
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(
                "Get student schedule error:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        return res.json({
            success: true,
            schedule: results
        });
    });
};

module.exports = {
    getSchedule
};