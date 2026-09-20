const db = require("../config/db");

// ==========================================
// Get Lecturer Assigned Sections
// ==========================================
const getAssignedSections = (req, res) => {
    const userId = req.user.userId;

    const sql = `
        SELECT
            s.id AS section_id,
            s.section_name,
            s.academic_year,
            s.semester,

            c.id AS course_id,
            c.course_code,
            c.course_name,

            COUNT(
                DISTINCT e.id
            ) AS enrolled_students

        FROM sections s

        INNER JOIN courses c
            ON c.id = s.course_id

        LEFT JOIN enrollments e
            ON e.section_id = s.id
            AND e.status = 'active'

        WHERE s.lecturer_id = ?

        GROUP BY
            s.id,
            s.section_name,
            s.academic_year,
            s.semester,
            c.id,
            c.course_code,
            c.course_name

        ORDER BY
            c.course_code ASC,
            s.section_name ASC
    `;

    db.query(
        sql,
        [userId],
        (err, results) => {
            if (err) {
                console.error(
                    "Get assigned sections error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load lecturer sections",
                    error: err.message
                });
            }

            return res.json({
                success: true,
                count: results.length,
                sections: results
            });
        }
    );
};

module.exports = {
    getAssignedSections
};