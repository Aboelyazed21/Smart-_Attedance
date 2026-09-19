const db = require("../config/db");

// ==========================================
// Get Student Profile
// ==========================================
const getProfile = (req, res) => {
    const userId = req.user.userId;

    const sql = `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.status,

            r.name AS role,

            sp.id AS student_profile_id,
            sp.student_code,
            sp.university_id,
            sp.department,
            sp.level,
            sp.academic_year

        FROM users u

        INNER JOIN roles r
            ON r.id = u.role_id

        INNER JOIN student_profiles sp
            ON sp.user_id = u.id

        WHERE u.id = ?

        LIMIT 1
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(
                "Get student profile error:",
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
                message: "Student not found"
            });
        }

        const student = results[0];

        return res.json({
            success: true,

            student: {
                id: student.id,

                studentProfileId:
                    student.student_profile_id,

                studentId:
                    student.student_code,

                universityId:
                    student.university_id,

                firstName:
                    student.first_name,

                lastName:
                    student.last_name,

                email:
                    student.email,

                role:
                    student.role,

                status:
                    student.status,

                department:
                    student.department,

                level:
                    student.level,

                academicYear:
                    student.academic_year
            }
        });
    });
};

module.exports = {
    getProfile
};