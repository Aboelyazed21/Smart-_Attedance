const bcrypt = require("bcryptjs");
const db = require("../config/db");

const studentId = "20260001";
const password = "123456";

const firstName = "Ahmed";
const lastName = "Student";
const email = "20260001@student.edu";

const department = "Computer Science";
const level = 3;
const academicYear = "2026/2027";

async function createStudent() {
    try {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Get student role
        db.query(
            "SELECT id FROM roles WHERE name = 'student' LIMIT 1",
            (err, roleResults) => {
                if (err) {
                    console.error("❌ Role query error:", err.message);
                    process.exit(1);
                }

                if (roleResults.length === 0) {
                    console.error("❌ Student role not found");
                    process.exit(1);
                }

                const roleId = roleResults[0].id;

                // Create user
                const userSql = `
                    INSERT INTO users
                    (
                        role_id,
                        first_name,
                        last_name,
                        email,
                        password_hash,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, 'active')
                `;

                db.query(
                    userSql,
                    [
                        roleId,
                        firstName,
                        lastName,
                        email,
                        passwordHash
                    ],
                    (err, userResult) => {
                        if (err) {
                            console.error(
                                "❌ User creation error:",
                                err.message
                            );
                            process.exit(1);
                        }

                        const userId = userResult.insertId;

                        // Create student profile
                        const profileSql = `
                            INSERT INTO student_profiles
                            (
                                user_id,
                                student_code,
                                department,
                                level,
                                academic_year
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `;

                        db.query(
                            profileSql,
                            [
                                userId,
                                studentId,
                                department,
                                level,
                                academicYear
                            ],
                            (err) => {
                                if (err) {
                                    console.error(
                                        "❌ Student profile error:",
                                        err.message
                                    );
                                    process.exit(1);
                                }

                                console.log("");
                                console.log(
                                    "✅ Student created successfully!"
                                );
                                console.log(
                                    "Student ID:",
                                    studentId
                                );
                                console.log(
                                    "Password:",
                                    password
                                );
                                console.log("");

                                process.exit(0);
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

createStudent();