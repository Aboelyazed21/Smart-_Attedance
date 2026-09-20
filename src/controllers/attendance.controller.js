const jwt = require("jsonwebtoken");
const db = require("../config/db");

const {
    verifyQRToken
} = require("../utils/qrToken");


// ============================================================
// SCAN ATTENDANCE QR
// ============================================================

const scanAttendance = (req, res) => {

    const userId = req.user.userId;
    const { token } = req.body;


    // ========================================================
    // 1. Validate QR token
    // ========================================================

    if (!token) {
        return res.status(400).json({
            success: false,
            message: "QR token is required"
        });
    }


    // ========================================================
    // 2. Decode token only to get session ID
    // ========================================================
    // IMPORTANT:
    // jwt.decode() does NOT verify the token.
    // Real verification happens later using verifyQRToken().
    // ========================================================

    let decodedToken;

    try {

        decodedToken = jwt.decode(token);

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: "Invalid QR token"
        });

    }


    if (
        !decodedToken ||
        decodedToken.type !== "attendance_qr" ||
        !decodedToken.sessionId
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid QR token"
        });

    }


    const sessionId =
        Number(decodedToken.sessionId);


    if (
        !Number.isInteger(sessionId) ||
        sessionId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid session ID in QR token"
        });

    }


    // ========================================================
    // 3. Get attendance session
    // ========================================================

    const sessionSql = `
        SELECT
            id,
            section_id,
            room_id,
            opened_by,
            session_date,
            scheduled_start,
            scheduled_end,
            actual_start,
            actual_end,
            status,
            qr_secret_hash,
            qr_version,
            qr_expires_at,
            qr_rotation_seconds,
            allow_late_minutes
        FROM attendance_sessions
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        sessionSql,
        [sessionId],
        (sessionError, sessionResults) => {

            if (sessionError) {

                console.error(
                    "Scan attendance - session error:",
                    sessionError
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });

            }


            if (sessionResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Attendance session not found"
                });

            }


            const session =
                sessionResults[0];


            // =================================================
            // 4. Session must be active
            // =================================================

            if (session.status !== "active") {

                return res.status(400).json({
                    success: false,
                    message: "Attendance session is not active",
                    validationStatus: "wrong_session"
                });

            }


            // =================================================
            // 5. Verify QR
            // =================================================

            let verifiedQR;

            try {

                verifiedQR =
                    verifyQRToken(
                        token,
                        session
                    );

            } catch (qrError) {

                console.error(
                    "QR verification failed:",
                    qrError.message
                );


                const isExpired =
                    qrError.message ===
                    "QR token has expired";


                return res.status(400).json({
                    success: false,
                    message: isExpired
                        ? "QR code has expired. Please scan the current QR code."
                        : "Invalid or expired QR code",
                    validationStatus:
                        isExpired
                            ? "expired"
                            : "invalid"
                });

            }


            // =================================================
            // 6. Verify QR version
            // =================================================

            if (
                Number(verifiedQR.qrVersion) !==
                Number(session.qr_version)
            ) {

                return res.status(400).json({
                    success: false,
                    message: "This QR code is no longer active",
                    validationStatus: "expired"
                });

            }


            // =================================================
            // 7. Verify DB expiration
            // =================================================

            if (session.qr_expires_at) {

                const qrExpiresAt =
                    new Date(
                        session.qr_expires_at
                    ).getTime();


                if (
                    Number.isNaN(qrExpiresAt) ||
                    qrExpiresAt <= Date.now()
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "QR code has expired. Please scan the current QR code.",
                        validationStatus: "expired"
                    });

                }

            }


            // =================================================
            // 8. Get student
            // =================================================

            const studentSql = `
                SELECT
                    sp.id AS student_id,
                    sp.student_code,
                    sp.university_id,
                    sp.department,
                    sp.level,
                    sp.academic_year
                FROM student_profiles sp
                INNER JOIN users u
                    ON u.id = sp.user_id
                WHERE u.id = ?
                  AND u.status = 'active'
                LIMIT 1
            `;


            db.query(
                studentSql,
                [userId],
                (studentError, studentResults) => {

                    if (studentError) {

                        console.error(
                            "Scan attendance - student error:",
                            studentError
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Database error"
                        });

                    }


                    if (studentResults.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message: "Student profile not found"
                        });

                    }


                    const student =
                        studentResults[0];


                    // =================================================
                    // 9. Check enrollment
                    // =================================================

                    const enrollmentSql = `
                        SELECT
                            id,
                            status
                        FROM enrollments
                        WHERE student_id = ?
                          AND section_id = ?
                        LIMIT 1
                    `;


                    db.query(
                        enrollmentSql,
                        [
                            student.student_id,
                            session.section_id
                        ],
                        (enrollmentError, enrollmentResults) => {

                            if (enrollmentError) {

                                console.error(
                                    "Scan attendance - enrollment error:",
                                    enrollmentError
                                );

                                return res.status(500).json({
                                    success: false,
                                    message: "Database error"
                                });

                            }


                            if (
                                enrollmentResults.length === 0 ||
                                enrollmentResults[0].status !== "active"
                            ) {

                                return res.status(403).json({
                                    success: false,
                                    message:
                                        "You are not enrolled in this section",
                                    validationStatus:
                                        "not_enrolled"
                                });

                            }


                            // =================================================
                            // 10. Check duplicate attendance
                            // =================================================

                            const duplicateSql = `
                                SELECT
                                    id,
                                    status,
                                    source,
                                    validation_status,
                                    scanned_at,
                                    qr_version
                                FROM attendance_events
                                WHERE student_id = ?
                                  AND session_id = ?
                                LIMIT 1
                            `;


                            db.query(
                                duplicateSql,
                                [
                                    student.student_id,
                                    session.id
                                ],
                                (
                                    duplicateError,
                                    duplicateResults
                                ) => {

                                    if (duplicateError) {

                                        console.error(
                                            "Scan attendance - duplicate check error:",
                                            duplicateError
                                        );

                                        return res.status(500).json({
                                            success: false,
                                            message: "Database error"
                                        });

                                    }


                                    if (
                                        duplicateResults.length > 0
                                    ) {

                                        const existing =
                                            duplicateResults[0];


                                        return res.status(409).json({

                                            success: false,

                                            message:
                                                "Attendance already recorded for this session",

                                            validationStatus:
                                                "duplicate",

                                            attendance: {

                                                id:
                                                    existing.id,

                                                status:
                                                    existing.status,

                                                source:
                                                    existing.source,

                                                validationStatus:
                                                    existing.validation_status,

                                                scannedAt:
                                                    existing.scanned_at,

                                                qrVersion:
                                                    existing.qr_version

                                            }

                                        });

                                    }


                                    // =================================================
                                    // 11. Determine attendance status
                                    // =================================================

                                    const attendanceStatus =
                                        calculateAttendanceStatus(
                                            session
                                        );


                                    // =================================================
                                    // 12. Request information
                                    // =================================================

                                    const ipAddress =
                                        getClientIp(req);

                                    const deviceInfo =
                                        req.headers["user-agent"] ||
                                        null;


                                    // =================================================
                                    // 13. Insert attendance
                                    // =================================================

                                    const insertSql = `
                                        INSERT INTO attendance_events
                                        (
                                            student_id,
                                            session_id,
                                            status,
                                            source,
                                            validation_status,
                                            scanned_at,
                                            ip_address,
                                            device_info,
                                            qr_version,
                                            notes
                                        )
                                        VALUES
                                        (
                                            ?,
                                            ?,
                                            ?,
                                            'qr',
                                            'accepted',
                                            NOW(),
                                            ?,
                                            ?,
                                            ?,
                                            ?
                                        )
                                    `;


                                    const notes =
                                        attendanceStatus === "late"
                                            ? "Attendance recorded as late"
                                            : "Attendance recorded by QR";


                                    db.query(
                                        insertSql,
                                        [
                                            student.student_id,
                                            session.id,
                                            attendanceStatus,
                                            ipAddress,
                                            deviceInfo,
                                            Number(
                                                verifiedQR.qrVersion
                                            ),
                                            notes
                                        ],
                                        (
                                            insertError,
                                            insertResult
                                        ) => {

                                            // -----------------------------------------
                                            // Duplicate race protection
                                            // -----------------------------------------

                                            if (
                                                insertError &&
                                                insertError.code ===
                                                    "ER_DUP_ENTRY"
                                            ) {

                                                return res.status(409).json({

                                                    success: false,

                                                    message:
                                                        "Attendance already recorded for this session",

                                                    validationStatus:
                                                        "duplicate"

                                                });

                                            }


                                            if (insertError) {

                                                console.error(
                                                    "Scan attendance - insert error:",
                                                    insertError
                                                );

                                                return res.status(500).json({

                                                    success: false,

                                                    message:
                                                        "Could not record attendance",

                                                    error:
                                                        insertError.message

                                                });

                                            }


                                            // =================================================
                                            // 14. Success
                                            // =================================================

                                            return res.status(201).json({

                                                success: true,

                                                message:
                                                    attendanceStatus === "late"
                                                        ? "Attendance recorded successfully as late"
                                                        : "Attendance recorded successfully",

                                                attendance: {

                                                    id:
                                                        insertResult.insertId,

                                                    studentId:
                                                        student.student_id,

                                                    studentCode:
                                                        student.student_code,

                                                    sessionId:
                                                        session.id,

                                                    sectionId:
                                                        session.section_id,

                                                    status:
                                                        attendanceStatus,

                                                    source:
                                                        "qr",

                                                    validationStatus:
                                                        "accepted",

                                                    qrVersion:
                                                        Number(
                                                            verifiedQR.qrVersion
                                                        ),

                                                    scannedAt:
                                                        new Date()

                                                }

                                            });

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );
};


// ============================================================
// CALCULATE ATTENDANCE STATUS
// ============================================================

const calculateAttendanceStatus = (
    session
) => {

    const now =
        new Date();


    let scheduledStart;


    try {

        scheduledStart =
            buildSessionDateTime(
                session.session_date,
                session.scheduled_start
            );

    } catch (error) {

        console.error(
            "Could not parse scheduled start:",
            error
        );

        return "present";
    }


    const allowLateMinutes =
        Number(
            session.allow_late_minutes || 0
        );


    const lateDeadline =
        scheduledStart.getTime() +
        (
            allowLateMinutes *
            60 *
            1000
        );


    if (
        allowLateMinutes > 0 &&
        now.getTime() > lateDeadline
    ) {

        return "late";

    }


    return "present";
};


// ============================================================
// BUILD SESSION DATE/TIME
// ============================================================

const buildSessionDateTime = (
    sessionDate,
    sessionTime
) => {

    const dateString =
        formatDateValue(sessionDate);

    const timeString =
        formatTimeValue(sessionTime);


    const result =
        new Date(
            `${dateString}T${timeString}`
        );


    if (
        Number.isNaN(
            result.getTime()
        )
    ) {

        throw new Error(
            "Invalid session date/time"
        );

    }


    return result;
};


// ============================================================
// FORMAT DATE
// ============================================================

const formatDateValue = (
    value
) => {

    if (value instanceof Date) {

        const year =
            value.getFullYear();

        const month =
            String(
                value.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                value.getDate()
            ).padStart(2, "0");


        return `${year}-${month}-${day}`;
    }


    return String(value)
        .slice(0, 10);
};


// ============================================================
// FORMAT TIME
// ============================================================

const formatTimeValue = (
    value
) => {

    const stringValue =
        String(value);


    if (
        /^\d{2}:\d{2}:\d{2}$/.test(
            stringValue
        )
    ) {

        return stringValue;

    }


    if (
        /^\d{2}:\d{2}$/.test(
            stringValue
        )
    ) {

        return `${stringValue}:00`;

    }


    return stringValue;
};


// ============================================================
// GET CLIENT IP
// ============================================================

const getClientIp = (
    req
) => {

    const forwarded =
        req.headers["x-forwarded-for"];


    if (forwarded) {

        return forwarded
            .split(",")[0]
            .trim();

    }


    return (
        req.socket?.remoteAddress ||
        req.ip ||
        null
    );
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    scanAttendance
};