const db = require("../config/db");


// ==========================================
// Student Attendance Scan Middleware
// ==========================================

const requireStudentForScan = (req, res, next) => {

    // ------------------------------------------
    // Authentication check
    // ------------------------------------------

    if (!req.user || !req.user.userId) {

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });

    }


    // ------------------------------------------
    // Get active student profile
    // ------------------------------------------

    const sql = `
        SELECT
            sp.id AS student_id,
            sp.user_id,
            sp.student_code,
            sp.university_id,
            sp.department,
            sp.level,
            sp.academic_year

        FROM student_profiles sp

        INNER JOIN users u
            ON u.id = sp.user_id

        INNER JOIN roles r
            ON r.id = u.role_id

        WHERE sp.user_id = ?
          AND u.status = 'active'
          AND r.name = 'student'

        LIMIT 1
    `;


    db.query(
        sql,
        [req.user.userId],
        (err, results) => {

            if (err) {

                console.error(
                    "Student scan middleware error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }


            // ------------------------------------------
            // Student profile not found
            // ------------------------------------------

            if (results.length === 0) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Only active students can scan attendance QR codes"
                });

            }


            // ------------------------------------------
            // Attach student information to request
            // ------------------------------------------

            req.student = results[0];

            next();

        }
    );

};


// ==========================================
// Export
// ==========================================

module.exports = {
    requireStudentForScan
};