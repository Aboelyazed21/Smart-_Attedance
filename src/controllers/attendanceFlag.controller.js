const db = require("../config/db");


// ============================================================
// CONFIGURATION
// ============================================================

const LOW_ATTENDANCE_THRESHOLD = 75;
const HIGH_RISK_THRESHOLD = 50;
const MIN_SESSIONS_FOR_FLAG = 3;


// ============================================================
// GET ATTENDANCE FLAGS
// ============================================================

const getFlags = (req, res) => {

    const {
        studentId,
        sessionId,
        severity,
        flagType,
        resolved
    } = req.query;


    const conditions = [];
    const values = [];


    if (studentId) {

        conditions.push(
            "af.student_id = ?"
        );

        values.push(studentId);

    }


    if (sessionId) {

        conditions.push(
            "af.session_id = ?"
        );

        values.push(sessionId);

    }


    if (severity) {

        conditions.push(
            "af.severity = ?"
        );

        values.push(severity);

    }


    if (flagType) {

        conditions.push(
            "af.flag_type = ?"
        );

        values.push(flagType);

    }


    if (resolved !== undefined) {

        conditions.push(
            "af.is_resolved = ?"
        );

        values.push(
            resolved === "true" ||
            resolved === "1"
                ? 1
                : 0
        );

    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    const sql = `
        SELECT

            af.id AS flag_id,

            af.student_id,

            af.session_id,

            af.flag_type,

            af.severity,

            af.reason,

            af.score,

            af.is_resolved,

            af.reviewed_by,

            af.reviewed_at,

            af.created_at,

            sp.student_code,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS student_name,

            sp.department,

            sp.level,

            ses.session_date,

            c.course_code,

            c.course_name,

            sec.section_name

        FROM attendance_flags af

        LEFT JOIN student_profiles sp
            ON sp.id = af.student_id

        LEFT JOIN users u
            ON u.id = sp.user_id

        LEFT JOIN attendance_sessions ses
            ON ses.id = af.session_id

        LEFT JOIN sections sec
            ON sec.id = ses.section_id

        LEFT JOIN courses c
            ON c.id = sec.course_id

        ${whereClause}

        ORDER BY
            af.is_resolved ASC,
            CASE af.severity
                WHEN 'high' THEN 1
                WHEN 'medium' THEN 2
                WHEN 'low' THEN 3
                ELSE 4
            END,
            af.created_at DESC
    `;


    db.query(
        sql,
        values,
        (err, results) => {

            if (err) {

                console.error(
                    "Get attendance flags error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load attendance flags",
                    error:
                        err.message
                });

            }


            return res.json({

                success: true,

                count:
                    results.length,

                flags:
                    results

            });

        }
    );
};


// ============================================================
// GENERATE LOW ATTENDANCE FLAGS
// ============================================================

const generateLowAttendanceFlags = (req, res) => {

    const {
        sectionId,
        studentId
    } = req.body;


    const conditions = [
        "e.status = 'active'"
    ];

    const values = [];


    if (sectionId) {

        conditions.push(
            "e.section_id = ?"
        );

        values.push(sectionId);

    }


    if (studentId) {

        conditions.push(
            "e.student_id = ?"
        );

        values.push(studentId);

    }


    const whereClause =
        conditions.join(" AND ");


    // ========================================================
    // Calculate attendance from sessions + events
    // ========================================================

    const sql = `
        SELECT

            e.student_id,

            e.section_id,

            sp.student_code,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS student_name,

            c.course_code,

            c.course_name,

            sec.section_name,

            COUNT(
                DISTINCT CASE
                    WHEN ses.status IN ('active', 'closed')
                    THEN ses.id
                END
            ) AS total_sessions,

            COUNT(
                DISTINCT CASE
                    WHEN ses.status IN ('active', 'closed')
                     AND ae.status IN ('present', 'late')
                    THEN ses.id
                END
            ) AS attended_sessions

        FROM enrollments e

        INNER JOIN student_profiles sp
            ON sp.id = e.student_id

        INNER JOIN users u
            ON u.id = sp.user_id

        INNER JOIN sections sec
            ON sec.id = e.section_id

        INNER JOIN courses c
            ON c.id = sec.course_id

        LEFT JOIN attendance_sessions ses
            ON ses.section_id = sec.id

        LEFT JOIN attendance_events ae
            ON ae.session_id = ses.id
           AND ae.student_id = e.student_id

        WHERE ${whereClause}

        GROUP BY

            e.student_id,
            e.section_id,

            sp.student_code,

            u.first_name,
            u.last_name,

            c.course_code,
            c.course_name,

            sec.section_name

        HAVING
            total_sessions >= ?

        ORDER BY
            (
                attended_sessions /
                NULLIF(total_sessions, 0)
            ) ASC
    `;


    db.query(
        sql,
        [
            ...values,
            MIN_SESSIONS_FOR_FLAG
        ],
        (err, students) => {

            if (err) {

                console.error(
                    "Generate attendance flags error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not calculate attendance flags",
                    error:
                        err.message
                });

            }


            if (students.length === 0) {

                return res.json({

                    success: true,

                    message:
                        "No students met the minimum sessions required for low-attendance analysis",

                    threshold:
                        LOW_ATTENDANCE_THRESHOLD,

                    minimumSessions:
                        MIN_SESSIONS_FOR_FLAG,

                    generated:
                        0

                });

            }


            let completed = 0;
            let generated = 0;
            let updated = 0;


            const processNext = (index) => {

                if (index >= students.length) {

                    return res.json({

                        success: true,

                        message:
                            "Low-attendance analysis completed",

                        threshold:
                            LOW_ATTENDANCE_THRESHOLD,

                        minimumSessions:
                            MIN_SESSIONS_FOR_FLAG,

                        analyzed:
                            students.length,

                        generated,

                        updated

                    });

                }


                const student =
                    students[index];


                const totalSessions =
                    Number(
                        student.total_sessions
                    ) || 0;


                const attendedSessions =
                    Number(
                        student.attended_sessions
                    ) || 0;


                const percentage =
                    totalSessions > 0
                        ? (
                            attendedSessions /
                            totalSessions
                        ) * 100
                        : 0;


                // ------------------------------------------------
                // Student is not low attendance
                // ------------------------------------------------

                if (
                    percentage >=
                    LOW_ATTENDANCE_THRESHOLD
                ) {

                    completed++;

                    return processNext(
                        index + 1
                    );

                }


                // ------------------------------------------------
                // Determine severity
                // ------------------------------------------------

                const severity =
                    percentage <
                    HIGH_RISK_THRESHOLD
                        ? "high"
                        : "medium";


                const reason =
                    `Low attendance detected: ${attendedSessions} of ${totalSessions} sessions attended (${percentage.toFixed(2)}%). Threshold is ${LOW_ATTENDANCE_THRESHOLD}%.`;


                // ------------------------------------------------
                // Check existing unresolved flag
                // ------------------------------------------------

                const checkSql = `
                    SELECT
                        id
                    FROM attendance_flags
                    WHERE student_id = ?
                      AND session_id IS NULL
                      AND flag_type = 'low_attendance'
                      AND is_resolved = FALSE
                    ORDER BY created_at DESC
                    LIMIT 1
                `;


                db.query(
                    checkSql,
                    [student.student_id],
                    (checkError, existingFlags) => {

                        if (checkError) {

                            console.error(
                                "Check existing flag error:",
                                checkError
                            );

                            return res.status(500).json({

                                success: false,

                                message:
                                    "Could not check existing attendance flag",

                                error:
                                    checkError.message

                            });

                        }


                        // ------------------------------------------------
                        // Update existing flag
                        // ------------------------------------------------

                        if (
                            existingFlags.length > 0
                        ) {

                            const flagId =
                                existingFlags[0].id;


                            const updateSql = `
                                UPDATE attendance_flags
                                SET
                                    severity = ?,
                                    reason = ?,
                                    score = ?,
                                    created_at = NOW()
                                WHERE id = ?
                            `;


                            db.query(
                                updateSql,
                                [
                                    severity,
                                    reason,
                                    Number(
                                        percentage.toFixed(2)
                                    ),
                                    flagId
                                ],
                                (updateError) => {

                                    if (updateError) {

                                        console.error(
                                            "Update attendance flag error:",
                                            updateError
                                        );

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Could not update attendance flag"

                                        });

                                    }


                                    updated++;

                                    completed++;

                                    processNext(
                                        index + 1
                                    );

                                }
                            );


                            return;
                        }


                        // ------------------------------------------------
                        // Create new flag
                        // ------------------------------------------------

                        const insertSql = `
                            INSERT INTO attendance_flags
                            (
                                student_id,
                                session_id,
                                flag_type,
                                severity,
                                reason,
                                score,
                                is_resolved
                            )
                            VALUES
                            (
                                ?,
                                NULL,
                                'low_attendance',
                                ?,
                                ?,
                                ?,
                                FALSE
                            )
                        `;


                        db.query(
                            insertSql,
                            [
                                student.student_id,
                                severity,
                                reason,
                                Number(
                                    percentage.toFixed(2)
                                )
                            ],
                            (insertError) => {

                                if (insertError) {

                                    console.error(
                                        "Insert attendance flag error:",
                                        insertError
                                    );

                                    return res.status(500).json({

                                        success: false,

                                        message:
                                            "Could not create attendance flag",

                                        error:
                                            insertError.message

                                    });

                                }


                                generated++;

                                completed++;

                                processNext(
                                    index + 1
                                );

                            }
                        );

                    }
                );

            };


            processNext(0);

        }
    );
};


// ============================================================
// RESOLVE FLAG
// ============================================================

const resolveFlag = (req, res) => {

    const flagId =
        Number(req.params.id);


    const reviewerId =
        Number(req.user.userId);


    if (!flagId) {

        return res.status(400).json({
            success: false,
            message: "Invalid flag ID"
        });

    }


    const sql = `
        UPDATE attendance_flags
        SET
            is_resolved = TRUE,
            reviewed_by = ?,
            reviewed_at = NOW()
        WHERE id = ?
          AND is_resolved = FALSE
    `;


    db.query(
        sql,
        [
            reviewerId,
            flagId
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "Resolve attendance flag error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not resolve attendance flag"
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Flag not found or already resolved"
                });

            }


            return res.json({

                success: true,

                message:
                    "Attendance flag resolved successfully",

                flagId

            });

        }
    );
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getFlags,

    generateLowAttendanceFlags,

    resolveFlag

};