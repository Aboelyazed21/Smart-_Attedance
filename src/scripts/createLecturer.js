const bcrypt = require("bcryptjs");
const db = require("../config/db");

const email = "lecturer@smartattendance.com";
const password = "123456";

const firstName = "Mohamed";
const lastName = "Lecturer";

async function createLecturer() {
    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // Get lecturer role
        db.query(
            "SELECT id FROM roles WHERE name = 'lecturer' LIMIT 1",
            (err, roleResults) => {
                if (err) {
                    console.error("❌ Role query error:", err.message);
                    process.exit(1);
                }

                if (roleResults.length === 0) {
                    console.error("❌ Lecturer role not found");
                    process.exit(1);
                }

                const roleId = roleResults[0].id;

                const sql = `
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
                    sql,
                    [
                        roleId,
                        firstName,
                        lastName,
                        email,
                        passwordHash
                    ],
                    (err, result) => {
                        if (err) {
                            console.error(
                                "❌ Lecturer creation error:",
                                err.message
                            );
                            process.exit(1);
                        }

                        console.log("");
                        console.log("✅ Lecturer created successfully!");
                        console.log("Email:", email);
                        console.log("Password:", password);
                        console.log("User ID:", result.insertId);
                        console.log("");

                        process.exit(0);
                    }
                );
            }
        );
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

createLecturer();