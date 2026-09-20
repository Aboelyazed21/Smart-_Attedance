const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// ==========================================
// Login
// Student: student_code
// Staff: email / staff_code
// ==========================================
const login = (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({
            success: false,
            message: "Identifier and password are required"
        });
    }

    const sql = `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.password_hash,
            u.status,

            r.name AS role,

            sp.student_code,
            sp.department AS student_department,
            sp.level,
            sp.academic_year,

            sf.staff_code,
            sf.department AS staff_department,
            sf.job_title

        FROM users u

        INNER JOIN roles r
            ON r.id = u.role_id

        LEFT JOIN student_profiles sp
            ON sp.user_id = u.id

        LEFT JOIN staff_profiles sf
            ON sf.user_id = u.id

        WHERE
            sp.student_code = ?
            OR u.email = ?
            OR sf.staff_code = ?

        LIMIT 1
    `;

    db.query(
        sql,
        [identifier, identifier, identifier],
        async (err, results) => {
            if (err) {
                console.error(
                    "Login database error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid ID/email or password"
                });
            }

            const user = results[0];

            // ==========================================
            // Check Account Status
            // ==========================================
            if (user.status !== "active") {
                return res.status(403).json({
                    success: false,
                    message: "Account is not active"
                });
            }

            // ==========================================
            // Check Password
            // ==========================================
            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password_hash
                );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid ID/email or password"
                });
            }

            // ==========================================
            // Create JWT
            // ==========================================
            const token = jwt.sign(
                {
                    userId: user.id,

                    studentId:
                        user.student_code || null,

                    employeeCode:
                        user.staff_code || null,

                    role: user.role
                },
                process.env.JWT_SECRET ||
                    "smart_attendance_secret_2026",
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN ||
                        "1d"
                }
            );

            // ==========================================
            // Update Last Login
            // ==========================================
            db.query(
                `
                UPDATE users
                SET last_login_at = NOW()
                WHERE id = ?
                `,
                [user.id]
            );

            // ==========================================
            // Student Response
            // ==========================================
            if (user.role === "student") {
                return res.json({
                    success: true,
                    message: "Login successful",
                    token,

                    user: {
                        id: user.id,

                        studentId:
                            user.student_code,

                        firstName:
                            user.first_name,

                        lastName:
                            user.last_name,

                        email:
                            user.email,

                        role:
                            user.role,

                        department:
                            user.student_department,

                        level:
                            user.level,

                        academicYear:
                            user.academic_year
                    }
                });
            }

            // ==========================================
            // Staff Response
            // ==========================================
            return res.json({
                success: true,
                message: "Login successful",
                token,

                user: {
                    id: user.id,

                    employeeCode:
                        user.staff_code,

                    firstName:
                        user.first_name,

                    lastName:
                        user.last_name,

                    email:
                        user.email,

                    role:
                        user.role,

                    department:
                        user.staff_department,

                    jobTitle:
                        user.job_title
                }
            });
        }
    );
};

module.exports = {
    login
};