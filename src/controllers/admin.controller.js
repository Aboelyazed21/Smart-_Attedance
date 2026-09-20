const bcrypt = require("bcryptjs");
const db = require("../config/db");

// ============================================================
// GET ALL USERS
// ============================================================

const getUsers = (req, res) => {

    const sql = `
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone,
            u.status,
            u.last_login_at,
            u.created_at,
            r.id AS role_id,
            r.name AS role_name
        FROM users u
        INNER JOIN roles r
            ON r.id = u.role_id
        ORDER BY u.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error("Get users error:", err);

            return res.status(500).json({
                success: false,
                message: "Could not load users"
            });

        }

        return res.json({
            success: true,
            count: results.length,
            users: results
        });

    });
};


// ============================================================
// CREATE USER
// ============================================================

const createUser = async (req, res) => {

    const {
        roleId,
        firstName,
        lastName,
        email,
        password,
        phone,
        status = "active"
    } = req.body;


    if (
        !roleId ||
        !firstName ||
        !lastName ||
        !email ||
        !password
    ) {

        return res.status(400).json({
            success: false,
            message:
                "roleId, firstName, lastName, email and password are required"
        });

    }


    try {

        const passwordHash =
            await bcrypt.hash(password, 10);


        const sql = `
            INSERT INTO users
            (
                role_id,
                first_name,
                last_name,
                email,
                password_hash,
                phone,
                status
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?)
        `;


        db.query(
            sql,
            [
                roleId,
                firstName,
                lastName,
                email,
                passwordHash,
                phone || null,
                status
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "Create user error:",
                        err
                    );


                    if (err.code === "ER_DUP_ENTRY") {

                        return res.status(409).json({
                            success: false,
                            message:
                                "Email already exists"
                        });

                    }


                    return res.status(500).json({
                        success: false,
                        message: "Could not create user"
                    });

                }


                return res.status(201).json({
                    success: true,
                    message: "User created successfully",
                    userId: result.insertId
                });

            }
        );

    } catch (error) {

        console.error(
            "Password hashing error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not create user"
        });

    }

};


// ============================================================
// UPDATE USER
// ============================================================

const updateUser = async (req, res) => {

    const userId =
        Number(req.params.id);


    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });

    }


    const {
        roleId,
        firstName,
        lastName,
        email,
        password,
        phone,
        status
    } = req.body;


    const fields = [];
    const values = [];


    if (roleId !== undefined) {
        fields.push("role_id = ?");
        values.push(roleId);
    }

    if (firstName !== undefined) {
        fields.push("first_name = ?");
        values.push(firstName);
    }

    if (lastName !== undefined) {
        fields.push("last_name = ?");
        values.push(lastName);
    }

    if (email !== undefined) {
        fields.push("email = ?");
        values.push(email);
    }

    if (phone !== undefined) {
        fields.push("phone = ?");
        values.push(phone);
    }

    if (status !== undefined) {
        fields.push("status = ?");
        values.push(status);
    }


    if (password) {

        try {

            const passwordHash =
                await bcrypt.hash(password, 10);

            fields.push("password_hash = ?");
            values.push(passwordHash);

        } catch (error) {

            return res.status(500).json({
                success: false,
                message:
                    "Could not update password"
            });

        }

    }


    if (fields.length === 0) {

        return res.status(400).json({
            success: false,
            message: "No fields to update"
        });

    }


    fields.push("updated_at = NOW()");

    values.push(userId);


    const sql = `
        UPDATE users
        SET ${fields.join(", ")}
        WHERE id = ?
    `;


    db.query(
        sql,
        values,
        (err, result) => {

            if (err) {

                console.error(
                    "Update user error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Could not update user"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            return res.json({
                success: true,
                message:
                    "User updated successfully"
            });

        }
    );

};


// ============================================================
// DELETE USER
// ============================================================

const deleteUser = (req, res) => {

    const userId =
        Number(req.params.id);


    if (!userId) {

        return res.status(400).json({
            success: false,
            message: "Invalid user ID"
        });

    }


    // Soft delete is safer because many tables
    // reference users.

    const sql = `
        UPDATE users
        SET
            status = 'inactive',
            updated_at = NOW()
        WHERE id = ?
    `;


    db.query(
        sql,
        [userId],
        (err, result) => {

            if (err) {

                console.error(
                    "Delete user error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Could not deactivate user"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });

            }


            return res.json({
                success: true,
                message:
                    "User deactivated successfully"
            });

        }
    );

};


// ============================================================
// GET ROLES
// ============================================================

const getRoles = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            description
        FROM roles
        ORDER BY id
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "Get roles error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Could not load roles"
                });

            }


            return res.json({
                success: true,
                roles: results
            });

        }
    );

};


// ============================================================
// GET COURSES
// ============================================================

const getCourses = (req, res) => {

    const sql = `
        SELECT
            id,
            course_code,
            course_name,
            description,
            credit_hours,
            created_at
        FROM courses
        ORDER BY course_code
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "Get courses error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Could not load courses"
                });

            }


            return res.json({
                success: true,
                count: results.length,
                courses: results
            });

        }
    );

};


// ============================================================
// CREATE COURSE
// ============================================================

const createCourse = (req, res) => {

    const {
        courseCode,
        courseName,
        description,
        creditHours
    } = req.body;


    if (
        !courseCode ||
        !courseName
    ) {

        return res.status(400).json({
            success: false,
            message:
                "courseCode and courseName are required"
        });

    }


    const sql = `
        INSERT INTO courses
        (
            course_code,
            course_name,
            description,
            credit_hours
        )
        VALUES
        (?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            courseCode,
            courseName,
            description || null,
            creditHours || null
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "Create course error:",
                    err
                );


                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(409).json({
                        success: false,
                        message:
                            "Course code already exists"
                    });

                }


                return res.status(500).json({
                    success: false,
                    message:
                        "Could not create course"
                });

            }


            return res.status(201).json({
                success: true,
                message:
                    "Course created successfully",
                courseId:
                    result.insertId
            });

        }
    );

};


// ============================================================
// UPDATE COURSE
// ============================================================

const updateCourse = (req, res) => {

    const courseId =
        Number(req.params.id);


    if (!courseId) {

        return res.status(400).json({
            success: false,
            message: "Invalid course ID"
        });

    }


    const {
        courseCode,
        courseName,
        description,
        creditHours
    } = req.body;


    const fields = [];
    const values = [];


    if (courseCode !== undefined) {
        fields.push("course_code = ?");
        values.push(courseCode);
    }

    if (courseName !== undefined) {
        fields.push("course_name = ?");
        values.push(courseName);
    }

    if (description !== undefined) {
        fields.push("description = ?");
        values.push(description);
    }

    if (creditHours !== undefined) {
        fields.push("credit_hours = ?");
        values.push(creditHours);
    }


    if (fields.length === 0) {

        return res.status(400).json({
            success: false,
            message: "No fields to update"
        });

    }


    values.push(courseId);


    const sql = `
        UPDATE courses
        SET ${fields.join(", ")}
        WHERE id = ?
    `;


    db.query(
        sql,
        values,
        (err, result) => {

            if (err) {

                console.error(
                    "Update course error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not update course"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });

            }


            return res.json({
                success: true,
                message:
                    "Course updated successfully"
            });

        }
    );

};


// ============================================================
// DELETE COURSE
// ============================================================

const deleteCourse = (req, res) => {

    const courseId =
        Number(req.params.id);


    if (!courseId) {

        return res.status(400).json({
            success: false,
            message: "Invalid course ID"
        });

    }


    const sql = `
        DELETE FROM courses
        WHERE id = ?
    `;


    db.query(
        sql,
        [courseId],
        (err, result) => {

            if (err) {

                console.error(
                    "Delete course error:",
                    err
                );


                if (
                    err.code ===
                    "ER_ROW_IS_REFERENCED_2"
                ) {

                    return res.status(409).json({
                        success: false,
                        message:
                            "Course cannot be deleted because it is referenced by sections or other records"
                    });

                }


                return res.status(500).json({
                    success: false,
                    message:
                        "Could not delete course"
                });

            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Course not found"
                });

            }


            return res.json({
                success: true,
                message:
                    "Course deleted successfully"
            });

        }
    );

};


// ============================================================
// GET SECTIONS
// ============================================================

const getSections = (req, res) => {

    const sql = `
        SELECT
            s.id AS section_id,
            s.section_name,
            s.academic_year,
            s.semester,
            s.capacity,

            c.id AS course_id,
            c.course_code,
            c.course_name,

            s.lecturer_id,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS lecturer_name,

            COUNT(
                DISTINCT CASE
                    WHEN e.status = 'active'
                    THEN e.id
                END
            ) AS enrolled_students

        FROM sections s

        INNER JOIN courses c
            ON c.id = s.course_id

        LEFT JOIN users u
            ON u.id = s.lecturer_id

        LEFT JOIN enrollments e
            ON e.section_id = s.id

        GROUP BY
            s.id,
            s.section_name,
            s.academic_year,
            s.semester,
            s.capacity,
            c.id,
            c.course_code,
            c.course_name,
            s.lecturer_id,
            u.first_name,
            u.last_name

        ORDER BY
            c.course_code,
            s.section_name
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "Get sections error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load sections"
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


// ============================================================
// GET ROOMS
// ============================================================

const getRooms = (req, res) => {

    const sql = `
        SELECT
            id,
            building,
            room_name,
            room_type,
            capacity,
            latitude,
            longitude
        FROM rooms
        ORDER BY building, room_name
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "Get rooms error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load rooms"
                });

            }


            return res.json({
                success: true,
                count: results.length,
                rooms: results
            });

        }
    );

};


// ============================================================
// GET ENROLLMENTS
// ============================================================

const getEnrollments = (req, res) => {

    const sql = `
        SELECT
            e.id AS enrollment_id,
            e.status,
            e.enrolled_at,

            sp.id AS student_id,
            sp.student_code,
            sp.university_id,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS student_name,

            s.id AS section_id,
            s.section_name,

            c.course_code,
            c.course_name

        FROM enrollments e

        INNER JOIN student_profiles sp
            ON sp.id = e.student_id

        INNER JOIN users u
            ON u.id = sp.user_id

        INNER JOIN sections s
            ON s.id = e.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        ORDER BY
            e.id DESC
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "Get enrollments error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load enrollments"
                });

            }


            return res.json({
                success: true,
                count: results.length,
                enrollments: results
            });

        }
    );

};


// ============================================================
// GET TIMETABLE
// ============================================================

const getTimetable = (req, res) => {

    const sql = `
        SELECT
            ts.id AS timetable_id,

            ts.section_id,
            s.section_name,

            c.id AS course_id,
            c.course_code,
            c.course_name,

            ts.room_id,
            r.building,
            r.room_name,

            ts.day_of_week,
            ts.start_time,
            ts.end_time,
            ts.start_date,
            ts.end_date

        FROM timetable_slots ts

        INNER JOIN sections s
            ON s.id = ts.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        LEFT JOIN rooms r
            ON r.id = ts.room_id

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


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "Get timetable error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load timetable"
                });

            }


            return res.json({
                success: true,
                count: results.length,
                timetable: results
            });

        }
    );

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getUsers,
    createUser,
    updateUser,
    deleteUser,

    getRoles,

    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,

    getSections,
    getRooms,
    getEnrollments,
    getTimetable

};