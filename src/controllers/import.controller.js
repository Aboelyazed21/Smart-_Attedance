const db = require("../config/db");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const csv = require("csv-parser");

// ============================================================
// Helper
// ============================================================

const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(results);
        });
    });
};

// ============================================================
// Read CSV
// ============================================================

const readCSV = (filePath) => {
    return new Promise((resolve, reject) => {

        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                results.push(row);
            })
            .on("end", () => {
                resolve(results);
            })
            .on("error", (error) => {
                reject(error);
            });
    });
};

// ============================================================
// Delete Uploaded File
// ============================================================

const deleteUploadedFile = (filePath) => {

    try {

        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

    } catch (error) {

        console.log(
            "⚠️ Could not delete uploaded file:",
            error.message
        );
    }
};

// ============================================================
// IMPORT COURSES
// ============================================================

const importCourses = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required"
        });
    }

    const rejectedRows = [];

    try {

        const results = await readCSV(req.file.path);

        if (results.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < results.length; i++) {

            const row = results[i];

            const courseCode =
                String(row.course_code || "").trim();

            const courseName =
                String(row.course_name || "").trim();

            const description =
                String(row.description || "").trim();

            const creditHours =
                Number(row.credit_hours);

            if (!courseCode || !courseName) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "course_code and course_name are required"
                });

                skipped++;
                continue;
            }

            if (
                !Number.isInteger(creditHours) ||
                creditHours <= 0
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "credit_hours must be a positive integer"
                });

                skipped++;
                continue;
            }

            const existing = await queryAsync(
                `
                SELECT id
                FROM courses
                WHERE course_code = ?
                LIMIT 1
                `,
                [courseCode]
            );

            if (existing.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Course already exists",
                    data: {
                        course_code: courseCode
                    }
                });

                skipped++;
                continue;
            }

            await queryAsync(
                `
                INSERT INTO courses (
                    course_code,
                    course_name,
                    description,
                    credit_hours
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    courseCode,
                    courseName,
                    description || null,
                    creditHours
                ]
            );

            imported++;
        }

        deleteUploadedFile(req.file.path);

        return res.status(201).json({
            success: true,
            message: "Courses imported successfully",
            summary: {
                totalRows: results.length,
                imported,
                skipped
            },
            rejectedRows
        });

    } catch (error) {

        console.error(
            "❌ Import courses error:",
            error
        );

        deleteUploadedFile(req.file.path);

        return res.status(500).json({
            success: false,
            message: "Failed to import courses",
            error: error.message
        });
    }
};

// ============================================================
// IMPORT STUDENTS
// ============================================================

const importStudents = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required"
        });
    }

    const rejectedRows = [];

    try {

        const results = await readCSV(req.file.path);

        if (results.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        const roleResults = await queryAsync(
            `
            SELECT id
            FROM roles
            WHERE name = 'student'
            LIMIT 1
            `
        );

        if (roleResults.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(500).json({
                success: false,
                message: "Student role not found"
            });
        }

        const studentRoleId = roleResults[0].id;

        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < results.length; i++) {

            const row = results[i];

            const firstName =
                String(row.first_name || "").trim();

            const lastName =
                String(row.last_name || "").trim();

            const email =
                String(row.email || "").trim();

            const password =
                String(row.password || "");

            const studentCode =
                String(row.student_code || "").trim();

            const universityId =
                String(row.university_id || "").trim();

            const department =
                String(row.department || "").trim();

            const level =
                String(row.level || "").trim();

            const academicYear =
                String(row.academic_year || "").trim();

            const phone =
                String(row.phone || "").trim();

            if (
                !firstName ||
                !lastName ||
                !email ||
                !password ||
                !studentCode
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Missing required student fields",
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        email,
                        student_code: studentCode
                    }
                });

                skipped++;
                continue;
            }

            if (password.length < 6) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Password must be at least 6 characters",
                    data: {
                        email,
                        student_code: studentCode
                    }
                });

                skipped++;
                continue;
            }

            const existingEmail = await queryAsync(
                `
                SELECT id
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [email]
            );

            if (existingEmail.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Email already exists",
                    data: {
                        email
                    }
                });

                skipped++;
                continue;
            }

            const existingStudent = await queryAsync(
                `
                SELECT id
                FROM student_profiles
                WHERE student_code = ?
                LIMIT 1
                `,
                [studentCode]
            );

            if (existingStudent.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Student code already exists",
                    data: {
                        student_code: studentCode
                    }
                });

                skipped++;
                continue;
            }

            const passwordHash =
                await bcrypt.hash(password, 10);

            const userResult = await queryAsync(
                `
                INSERT INTO users (
                    role_id,
                    first_name,
                    last_name,
                    email,
                    password_hash,
                    phone,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, 'active')
                `,
                [
                    studentRoleId,
                    firstName,
                    lastName,
                    email,
                    passwordHash,
                    phone || null
                ]
            );

            const userId = userResult.insertId;

            try {

                await queryAsync(
                    `
                    INSERT INTO student_profiles (
                        user_id,
                        student_code,
                        university_id,
                        department,
                        level,
                        academic_year
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                    `,
                    [
                        userId,
                        studentCode,
                        universityId || null,
                        department || null,
                        level || null,
                        academicYear || null
                    ]
                );

                imported++;

            } catch (profileError) {

                await queryAsync(
                    `
                    DELETE FROM users
                    WHERE id = ?
                    `,
                    [userId]
                );

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Failed to create student profile",
                    data: {
                        email,
                        student_code: studentCode
                    }
                });

                skipped++;
            }
        }

        deleteUploadedFile(req.file.path);

        return res.status(201).json({
            success: true,
            message: "Students imported successfully",
            summary: {
                totalRows: results.length,
                imported,
                skipped
            },
            rejectedRows
        });

    } catch (error) {

        console.error(
            "❌ Import students error:",
            error
        );

        deleteUploadedFile(req.file.path);

        return res.status(500).json({
            success: false,
            message: "Failed to import students",
            error: error.message
        });
    }
};

// ============================================================
// IMPORT SECTIONS
// ============================================================

const importSections = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required"
        });
    }

    const rejectedRows = [];

    try {

        const results = await readCSV(req.file.path);

        if (results.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < results.length; i++) {

            const row = results[i];

            const courseCode =
                String(row.course_code || "").trim();

            const sectionName =
                String(row.section_name || "").trim();

            const academicYear =
                String(row.academic_year || "").trim();

            const semester =
                String(row.semester || "").trim();

            const lecturerCode =
                String(row.lecturer_code || "").trim();

            const capacity =
                Number(row.capacity);

            if (
                !courseCode ||
                !sectionName ||
                !academicYear ||
                !semester ||
                !lecturerCode
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Missing required section fields"
                });

                skipped++;
                continue;
            }

            if (
                !Number.isInteger(capacity) ||
                capacity <= 0
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "capacity must be a positive integer"
                });

                skipped++;
                continue;
            }

            const courseResults = await queryAsync(
                `
                SELECT id
                FROM courses
                WHERE course_code = ?
                LIMIT 1
                `,
                [courseCode]
            );

            if (courseResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Course not found",
                    data: {
                        course_code: courseCode
                    }
                });

                skipped++;
                continue;
            }

            const courseId = courseResults[0].id;

            const lecturerResults = await queryAsync(
                `
                SELECT
                    u.id AS lecturer_id
                FROM users u
                INNER JOIN roles r
                    ON r.id = u.role_id
                INNER JOIN staff_profiles sp
                    ON sp.user_id = u.id
                WHERE sp.staff_code = ?
                  AND r.name = 'lecturer'
                  AND u.status = 'active'
                LIMIT 1
                `,
                [lecturerCode]
            );

            if (lecturerResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Lecturer not found or inactive",
                    data: {
                        lecturer_code: lecturerCode
                    }
                });

                skipped++;
                continue;
            }

            const lecturerId =
                lecturerResults[0].lecturer_id;

            const duplicateResults =
                await queryAsync(
                    `
                    SELECT id
                    FROM sections
                    WHERE course_id = ?
                      AND section_name = ?
                      AND academic_year = ?
                      AND semester = ?
                    LIMIT 1
                    `,
                    [
                        courseId,
                        sectionName,
                        academicYear,
                        semester
                    ]
                );

            if (duplicateResults.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Section already exists",
                    data: {
                        course_code: courseCode,
                        section_name: sectionName
                    }
                });

                skipped++;
                continue;
            }

            await queryAsync(
                `
                INSERT INTO sections (
                    course_id,
                    section_name,
                    academic_year,
                    semester,
                    lecturer_id,
                    capacity
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    courseId,
                    sectionName,
                    academicYear,
                    semester,
                    lecturerId,
                    capacity
                ]
            );

            imported++;
        }

        deleteUploadedFile(req.file.path);

        return res.status(201).json({
            success: true,
            message: "Sections imported successfully",
            summary: {
                totalRows: results.length,
                imported,
                skipped
            },
            rejectedRows
        });

    } catch (error) {

        console.error(
            "❌ Import sections error:",
            error
        );

        deleteUploadedFile(req.file.path);

        return res.status(500).json({
            success: false,
            message: "Failed to import sections",
            error: error.message
        });
    }
};

// ============================================================
// IMPORT ENROLLMENTS
// ============================================================

const importEnrollments = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required"
        });
    }

    const rejectedRows = [];

    try {

        const results = await readCSV(req.file.path);

        if (results.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < results.length; i++) {

            const row = results[i];

            const studentCode =
                String(row.student_code || "").trim();

            const courseCode =
                String(row.course_code || "").trim();

            const sectionName =
                String(row.section_name || "").trim();

            const academicYear =
                String(row.academic_year || "").trim();

            const semester =
                String(row.semester || "").trim();

            if (
                !studentCode ||
                !courseCode ||
                !sectionName ||
                !academicYear ||
                !semester
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Missing required fields"
                });

                skipped++;
                continue;
            }

            const studentResults = await queryAsync(
                `
                SELECT
                    sp.id AS student_id
                FROM student_profiles sp
                INNER JOIN users u
                    ON u.id = sp.user_id
                WHERE sp.student_code = ?
                  AND u.status = 'active'
                LIMIT 1
                `,
                [studentCode]
            );

            if (studentResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Student not found or inactive",
                    data: {
                        student_code: studentCode
                    }
                });

                skipped++;
                continue;
            }

            const studentId =
                studentResults[0].student_id;

            const sectionResults = await queryAsync(
                `
                SELECT
                    s.id AS section_id
                FROM sections s
                INNER JOIN courses c
                    ON c.id = s.course_id
                WHERE c.course_code = ?
                  AND s.section_name = ?
                  AND s.academic_year = ?
                  AND s.semester = ?
                LIMIT 1
                `,
                [
                    courseCode,
                    sectionName,
                    academicYear,
                    semester
                ]
            );

            if (sectionResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Section not found",
                    data: {
                        course_code: courseCode,
                        section_name: sectionName
                    }
                });

                skipped++;
                continue;
            }

            const sectionId =
                sectionResults[0].section_id;

            const duplicateResults =
                await queryAsync(
                    `
                    SELECT id
                    FROM enrollments
                    WHERE student_id = ?
                      AND section_id = ?
                    LIMIT 1
                    `,
                    [
                        studentId,
                        sectionId
                    ]
                );

            if (duplicateResults.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Student already enrolled in this section",
                    data: {
                        student_code: studentCode,
                        course_code: courseCode,
                        section_name: sectionName
                    }
                });

                skipped++;
                continue;
            }

            await queryAsync(
                `
                INSERT INTO enrollments (
                    student_id,
                    section_id,
                    enrolled_at,
                    status
                )
                VALUES (?, ?, NOW(), 'active')
                `,
                [
                    studentId,
                    sectionId
                ]
            );

            imported++;
        }

        deleteUploadedFile(req.file.path);

        return res.status(201).json({
            success: true,
            message:
                "Enrollments imported successfully",
            summary: {
                totalRows: results.length,
                imported,
                skipped
            },
            rejectedRows
        });

    } catch (error) {

        console.error(
            "❌ Import enrollments error:",
            error
        );

        deleteUploadedFile(req.file.path);

        return res.status(500).json({
            success: false,
            message:
                "Failed to import enrollments",
            error: error.message
        });
    }
};

// ============================================================
// IMPORT ROOMS
// ============================================================

const importRooms = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required"
        });
    }

    const rejectedRows = [];

    try {

        const results = await readCSV(req.file.path);

        if (results.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        let imported = 0;
        let skipped = 0;

        for (let i = 0; i < results.length; i++) {

            const row = results[i];

            const building =
                String(row.building || "").trim();

            const roomName =
                String(row.room_name || "").trim();

            const roomType =
                String(row.room_type || "").trim();

            const capacity =
                Number(row.capacity);

            const latitudeValue =
                String(row.latitude || "").trim();

            const longitudeValue =
                String(row.longitude || "").trim();

            if (
                !building ||
                !roomName ||
                !roomType
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "building, room_name and room_type are required"
                });

                skipped++;
                continue;
            }

            if (
                !Number.isInteger(capacity) ||
                capacity <= 0
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "capacity must be a positive integer"
                });

                skipped++;
                continue;
            }

            let latitude = null;
            let longitude = null;

            if (latitudeValue !== "") {

                latitude =
                    Number(latitudeValue);

                if (
                    Number.isNaN(latitude) ||
                    latitude < -90 ||
                    latitude > 90
                ) {

                    rejectedRows.push({
                        row: i + 2,
                        reason: "Invalid latitude"
                    });

                    skipped++;
                    continue;
                }
            }

            if (longitudeValue !== "") {

                longitude =
                    Number(longitudeValue);

                if (
                    Number.isNaN(longitude) ||
                    longitude < -180 ||
                    longitude > 180
                ) {

                    rejectedRows.push({
                        row: i + 2,
                        reason: "Invalid longitude"
                    });

                    skipped++;
                    continue;
                }
            }

            const existingRooms =
                await queryAsync(
                    `
                    SELECT id
                    FROM rooms
                    WHERE building = ?
                      AND room_name = ?
                    LIMIT 1
                    `,
                    [
                        building,
                        roomName
                    ]
                );

            if (existingRooms.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Room already exists",
                    data: {
                        building,
                        room_name: roomName
                    }
                });

                skipped++;
                continue;
            }

            await queryAsync(
                `
                INSERT INTO rooms (
                    building,
                    room_name,
                    room_type,
                    capacity,
                    latitude,
                    longitude
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    building,
                    roomName,
                    roomType,
                    capacity,
                    latitude,
                    longitude
                ]
            );

            imported++;
        }

        deleteUploadedFile(req.file.path);

        return res.status(201).json({
            success: true,
            message:
                "Rooms imported successfully",
            summary: {
                totalRows: results.length,
                imported,
                skipped
            },
            rejectedRows
        });

    } catch (error) {

        console.error(
            "❌ Import rooms error:",
            error
        );

        deleteUploadedFile(req.file.path);

        return res.status(500).json({
            success: false,
            message:
                "Failed to import rooms",
            error: error.message
        });
    }
};

// ============================================================
// IMPORT TIMETABLE
// ============================================================

const importTimetable = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "CSV file is required"
        });
    }

    const rejectedRows = [];

    try {

        const results = await readCSV(req.file.path);

        if (results.length === 0) {

            deleteUploadedFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "CSV file is empty"
            });
        }

        let imported = 0;
        let skipped = 0;

        // ----------------------------------------------------
        // Helper: Normalize Day
        // ----------------------------------------------------

        const normalizeDay = (value) => {

            const day = String(
                value || ""
            )
                .trim()
                .toLowerCase();

            const dayMap = {
                sunday: 1,
                monday: 2,
                tuesday: 3,
                wednesday: 4,
                thursday: 5,
                friday: 6,
                saturday: 7
            };

            if (dayMap[day]) {
                return dayMap[day];
            }

            const numericDay = Number(day);

            if (
                Number.isInteger(numericDay) &&
                numericDay >= 1 &&
                numericDay <= 7
            ) {
                return numericDay;
            }

            return null;
        };

        // ----------------------------------------------------
        // Helper: Time Validation
        // ----------------------------------------------------

        const isValidTime = (value) => {

            return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/
                .test(String(value || "").trim());
        };

        // ----------------------------------------------------
        // Helper: Date Validation
        // ----------------------------------------------------

        const isValidDate = (value) => {

            const date = String(
                value || ""
            ).trim();

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return false;
            }

            const parsed = new Date(
                `${date}T00:00:00`
            );

            return !Number.isNaN(
                parsed.getTime()
            );
        };

        for (let i = 0; i < results.length; i++) {

            const row = results[i];

            const courseCode =
                String(
                    row.course_code || ""
                ).trim();

            const sectionName =
                String(
                    row.section_name || ""
                ).trim();

            const roomName =
                String(
                    row.room_name || ""
                ).trim();

            const building =
                String(
                    row.building || ""
                ).trim();

            const dayOfWeek =
                normalizeDay(
                    row.day_of_week
                );

            const startTime =
                String(
                    row.start_time || ""
                ).trim();

            const endTime =
                String(
                    row.end_time || ""
                ).trim();

            const startDate =
                String(
                    row.start_date || ""
                ).trim();

            const endDate =
                String(
                    row.end_date || ""
                ).trim();

            // ------------------------------------------------
            // Required fields
            // ------------------------------------------------

            if (
                !courseCode ||
                !sectionName ||
                !roomName ||
                !building ||
                !dayOfWeek ||
                !startTime ||
                !endTime ||
                !startDate ||
                !endDate
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Missing required timetable fields"
                });

                skipped++;
                continue;
            }

            // ------------------------------------------------
            // Time validation
            // ------------------------------------------------

            if (
                !isValidTime(startTime) ||
                !isValidTime(endTime)
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Invalid time format. Use HH:MM:SS"
                });

                skipped++;
                continue;
            }

            // ------------------------------------------------
            // Date validation
            // ------------------------------------------------

            if (
                !isValidDate(startDate) ||
                !isValidDate(endDate)
            ) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Invalid date format. Use YYYY-MM-DD"
                });

                skipped++;
                continue;
            }

            if (startDate > endDate) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "start_date cannot be after end_date"
                });

                skipped++;
                continue;
            }

            // ------------------------------------------------
            // Check course
            // ------------------------------------------------

            const courseResults =
                await queryAsync(
                    `
                    SELECT id
                    FROM courses
                    WHERE course_code = ?
                    LIMIT 1
                    `,
                    [courseCode]
                );

            if (courseResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Course not found",
                    data: {
                        course_code: courseCode
                    }
                });

                skipped++;
                continue;
            }

            const courseId =
                courseResults[0].id;

            // ------------------------------------------------
            // Check section
            // ------------------------------------------------

            const sectionResults =
                await queryAsync(
                    `
                    SELECT id
                    FROM sections
                    WHERE course_id = ?
                      AND section_name = ?
                    LIMIT 1
                    `,
                    [
                        courseId,
                        sectionName
                    ]
                );

            if (sectionResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Section not found",
                    data: {
                        course_code: courseCode,
                        section_name: sectionName
                    }
                });

                skipped++;
                continue;
            }

            const sectionId =
                sectionResults[0].id;

            // ------------------------------------------------
            // Check room
            // ------------------------------------------------

            const roomResults =
                await queryAsync(
                    `
                    SELECT id
                    FROM rooms
                    WHERE building = ?
                      AND room_name = ?
                    LIMIT 1
                    `,
                    [
                        building,
                        roomName
                    ]
                );

            if (roomResults.length === 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason: "Room not found",
                    data: {
                        building,
                        room_name: roomName
                    }
                });

                skipped++;
                continue;
            }

            const roomId =
                roomResults[0].id;

            // ------------------------------------------------
            // Check duplicate timetable
            // ------------------------------------------------

            const duplicateResults =
                await queryAsync(
                    `
                    SELECT id
                    FROM timetable_slots
                    WHERE section_id = ?
                      AND room_id = ?
                      AND day_of_week = ?
                      AND start_time = ?
                      AND end_time = ?
                      AND start_date = ?
                      AND end_date = ?
                    LIMIT 1
                    `,
                    [
                        sectionId,
                        roomId,
                        dayOfWeek,
                        startTime,
                        endTime,
                        startDate,
                        endDate
                    ]
                );

            if (duplicateResults.length > 0) {

                rejectedRows.push({
                    row: i + 2,
                    reason:
                        "Timetable slot already exists",
                    data: {
                        course_code: courseCode,
                        section_name: sectionName,
                        room_name: roomName
                    }
                });

                skipped++;
                continue;
            }

            // ------------------------------------------------
            // Insert timetable
            // ------------------------------------------------

            await queryAsync(
                `
                INSERT INTO timetable_slots (
                    section_id,
                    room_id,
                    day_of_week,
                    start_time,
                    end_time,
                    start_date,
                    end_date
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    sectionId,
                    roomId,
                    dayOfWeek,
                    startTime,
                    endTime,
                    startDate,
                    endDate
                ]
            );

            imported++;
        }

        deleteUploadedFile(req.file.path);

        return res.status(201).json({
            success: true,
            message:
                "Timetable imported successfully",
            summary: {
                totalRows: results.length,
                imported,
                skipped
            },
            rejectedRows
        });

    } catch (error) {

        console.error(
            "❌ Import timetable error:",
            error
        );

        deleteUploadedFile(req.file.path);

        return res.status(500).json({
            success: false,
            message:
                "Failed to import timetable",
            error: error.message
        });
    }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    importCourses,
    importStudents,
    importSections,
    importEnrollments,
    importRooms,
    importTimetable
};