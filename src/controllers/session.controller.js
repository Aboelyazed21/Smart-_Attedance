const db = require("../config/db");
const QRCode = require("qrcode");

const {
    generateQRToken,
    getSessionQRSecretHash
} = require("../utils/qrToken");


// ============================================================
// CONFIG
// ============================================================

const QR_ROTATION_SECONDS =
    Number(process.env.QR_ROTATION_SECONDS) || 60;


// ============================================================
// CREATE SESSION
// ============================================================

const createSession = (req, res) => {

    const userId = req.user.userId;
    const role = req.user.role;

    const {
        sectionId,
        roomId,
        sessionDate,
        scheduledStart,
        scheduledEnd
    } = req.body;


    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (
        !sectionId ||
        !sessionDate ||
        !scheduledStart ||
        !scheduledEnd
    ) {
        return res.status(400).json({
            success: false,
            message:
                "sectionId, sessionDate, scheduledStart and scheduledEnd are required"
        });
    }


    // --------------------------------------------------------
    // Role check
    // --------------------------------------------------------

    if (role !== "lecturer" && role !== "ta") {

        return res.status(403).json({
            success: false,
            message:
                "Only lecturer or TA can create attendance sessions"
        });
    }


    // --------------------------------------------------------
    // Validate time range
    // --------------------------------------------------------

    if (scheduledStart >= scheduledEnd) {

        return res.status(400).json({
            success: false,
            message:
                "scheduledStart must be earlier than scheduledEnd"
        });
    }


    // --------------------------------------------------------
    // Check section
    // --------------------------------------------------------

    const sectionSql = `
        SELECT
            id,
            course_id,
            section_name,
            lecturer_id,
            academic_year,
            semester
        FROM sections
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        sectionSql,
        [sectionId],
        (sectionErr, sectionResults) => {

            if (sectionErr) {

                console.error(
                    "Create session - section error:",
                    sectionErr
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }


            if (sectionResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Section not found"
                });
            }


            const section = sectionResults[0];


            // ------------------------------------------------
            // Lecturer ownership
            // ------------------------------------------------

            if (
                role === "lecturer" &&
                Number(section.lecturer_id) !== Number(userId)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not assigned to this section"
                });
            }


            // ------------------------------------------------
            // Check room
            // ------------------------------------------------

            const checkRoom = (callback) => {

                if (!roomId) {
                    return callback(null);
                }


                const roomSql = `
                    SELECT
                        id,
                        building,
                        room_name,
                        room_type,
                        capacity,
                        latitude,
                        longitude
                    FROM rooms
                    WHERE id = ?
                    LIMIT 1
                `;


                db.query(
                    roomSql,
                    [roomId],
                    (roomErr, roomResults) => {

                        if (roomErr) {
                            return callback(roomErr);
                        }


                        if (roomResults.length === 0) {

                            return res.status(404).json({
                                success: false,
                                message: "Room not found"
                            });
                        }


                        callback(null);
                    }
                );
            };


            // ------------------------------------------------
            // Check timetable
            // ------------------------------------------------

            const checkTimetable = (callback) => {

                /*
                    day_of_week can be stored as:
                    1-7
                    OR
                    Sunday, Monday, Tuesday...
                */

                const timetableSql = `
                    SELECT
                        ts.id,
                        ts.section_id,
                        ts.room_id,
                        ts.day_of_week,
                        ts.start_time,
                        ts.end_time,
                        ts.start_date,
                        ts.end_date
                    FROM timetable_slots ts
                    WHERE ts.section_id = ?

                      AND (
                            CAST(ts.day_of_week AS UNSIGNED)
                            = DAYOFWEEK(?)

                            OR

                            LOWER(CAST(ts.day_of_week AS CHAR))
                            = LOWER(DAYNAME(?))
                      )

                      AND (
                            ts.start_date IS NULL
                            OR ? >= ts.start_date
                      )

                      AND (
                            ts.end_date IS NULL
                            OR ? <= ts.end_date
                      )

                      AND ts.start_time <= ?
                      AND ts.end_time >= ?

                    ORDER BY
                        ts.start_time ASC

                    LIMIT 1
                `;


                db.query(
                    timetableSql,
                    [
                        sectionId,
                        sessionDate,
                        sessionDate,
                        sessionDate,
                        sessionDate,
                        scheduledStart,
                        scheduledEnd
                    ],
                    (timetableErr, timetableResults) => {

                        if (timetableErr) {

                            console.error(
                                "Create session - timetable error:",
                                timetableErr
                            );

                            return callback(timetableErr);
                        }


                        // ------------------------------------
                        // No matching timetable
                        // ------------------------------------

                        if (timetableResults.length === 0) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "Session does not match any timetable slot for this section, date and time"
                            });
                        }


                        const timetable =
                            timetableResults[0];


                        // ------------------------------------
                        // Room validation
                        // ------------------------------------

                        if (
                            timetable.room_id &&
                            Number(timetable.room_id) !== Number(roomId)
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "Selected room does not match the timetable room",
                                timetableRoomId:
                                    timetable.room_id,
                                requestedRoomId:
                                    roomId || null
                            });
                        }


                        // ------------------------------------
                        // If timetable requires a room
                        // ------------------------------------

                        if (
                            timetable.room_id &&
                            !roomId
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "A room is required because the timetable specifies a room",
                                timetableRoomId:
                                    timetable.room_id
                            });
                        }


                        callback(null, timetable);
                    }
                );
            };


            // ------------------------------------------------
            // Execute room check
            // ------------------------------------------------

            checkRoom((roomError) => {

                if (roomError) {

                    console.error(
                        "Create session - room error:",
                        roomError
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }


                // ------------------------------------------------
                // Execute timetable check
                // ------------------------------------------------

                checkTimetable((timetableError, timetable) => {

                    if (timetableError) {
                        return;
                    }


                    // ------------------------------------------------
                    // Create session
                    // ------------------------------------------------

                    const insertSql = `
                        INSERT INTO attendance_sessions
                        (
                            section_id,
                            room_id,
                            opened_by,
                            session_date,
                            scheduled_start,
                            scheduled_end,
                            actual_start,
                            status,
                            qr_version,
                            qr_rotation_seconds
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            NOW(),
                            'active',
                            1,
                            ?
                        )
                    `;


                    db.query(
                        insertSql,
                        [
                            sectionId,
                            roomId || null,
                            userId,
                            sessionDate,
                            scheduledStart,
                            scheduledEnd,
                            QR_ROTATION_SECONDS
                        ],
                        (insertErr, insertResult) => {

                            if (insertErr) {

                                console.error(
                                    "Create session - insert error:",
                                    insertErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Could not create session",
                                    error:
                                        insertErr.message
                                });
                            }


                            const sessionId =
                                insertResult.insertId;


                            // ------------------------------------------------
                            // Generate session-specific secret hash
                            // ------------------------------------------------

                            const qrSecretHash =
                                getSessionQRSecretHash(sessionId);


                            // ------------------------------------------------
                            // Set first QR expiration
                            // ------------------------------------------------

                            const updateSql = `
                                UPDATE attendance_sessions
                                SET
                                    qr_secret_hash = ?,
                                    qr_version = 1,
                                    qr_expires_at =
                                        DATE_ADD(
                                            NOW(),
                                            INTERVAL qr_rotation_seconds SECOND
                                        )
                                WHERE id = ?
                            `;


                            db.query(
                                updateSql,
                                [
                                    qrSecretHash,
                                    sessionId
                                ],
                                (updateError) => {

                                    if (updateError) {

                                        console.error(
                                            "Create session - QR setup error:",
                                            updateError
                                        );

                                        return res.status(500).json({
                                            success: false,
                                            message:
                                                "Session created but QR setup failed",
                                            error:
                                                updateError.message
                                        });
                                    }


                                    // ------------------------------------------------
                                    // Get created session
                                    // ------------------------------------------------

                                    getSessionById(
                                        sessionId,
                                        (sessionError, session) => {

                                            if (sessionError) {

                                                console.error(
                                                    "Create session - fetch error:",
                                                    sessionError
                                                );

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        "Session created but could not load QR"
                                                });
                                            }


                                            // ------------------------------------------------
                                            // Generate QR token
                                            // ------------------------------------------------

                                            let qrToken;

                                            try {

                                                qrToken =
                                                    generateQRToken(
                                                        session.id,
                                                        session.qr_version,
                                                        session.qr_expires_at,
                                                        session.qr_rotation_seconds
                                                    );

                                            } catch (qrError) {

                                                console.error(
                                                    "QR generation error:",
                                                    qrError
                                                );

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        "Could not generate QR token"
                                                });
                                            }


                                            // ------------------------------------------------
                                            // Convert token to QR image
                                            // ------------------------------------------------

                                            QRCode.toDataURL(
                                                qrToken,
                                                {
                                                    errorCorrectionLevel: "M",
                                                    margin: 2,
                                                    width: 400
                                                },
                                                (qrError, qrImage) => {

                                                    if (qrError) {

                                                        console.error(
                                                            "QR image generation error:",
                                                            qrError
                                                        );

                                                        return res.status(500).json({
                                                            success: false,
                                                            message:
                                                                "Could not generate QR image"
                                                        });
                                                    }


                                                    return res.status(201).json({

                                                        success: true,

                                                        message:
                                                            "Attendance session created successfully",

                                                        session: {

                                                            id:
                                                                session.id,

                                                            sectionId:
                                                                session.section_id,

                                                            roomId:
                                                                session.room_id,

                                                            openedBy:
                                                                session.opened_by,

                                                            sessionDate:
                                                                session.session_date,

                                                            scheduledStart:
                                                                session.scheduled_start,

                                                            scheduledEnd:
                                                                session.scheduled_end,

                                                            actualStart:
                                                                session.actual_start,

                                                            status:
                                                                session.status
                                                        },

                                                        timetable: {

                                                            id:
                                                                timetable.id,

                                                            dayOfWeek:
                                                                timetable.day_of_week,

                                                            startTime:
                                                                timetable.start_time,

                                                            endTime:
                                                                timetable.end_time,

                                                            roomId:
                                                                timetable.room_id
                                                        },

                                                        qr: {

                                                            token:
                                                                qrToken,

                                                            image:
                                                                qrImage,

                                                            version:
                                                                Number(
                                                                    session.qr_version
                                                                ),

                                                            expiresAt:
                                                                session.qr_expires_at,

                                                            expiresIn:
                                                                Number(
                                                                    session.qr_rotation_seconds
                                                                )
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

                });

            });

        }
    );
};


// ============================================================
// GET CURRENT QR
// ============================================================

const getSessionQR = (req, res) => {

    const userId = req.user.userId;
    const role = req.user.role;

    const sessionId =
        Number(req.params.id);


    if (!sessionId) {

        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }


    if (
        role !== "lecturer" &&
        role !== "ta"
    ) {

        return res.status(403).json({
            success: false,
            message:
                "Only lecturer or TA can access session QR"
        });
    }


    getSessionById(
        sessionId,
        (sessionError, session) => {

            if (sessionError) {

                console.error(
                    "Get session QR error:",
                    sessionError
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }


            if (!session) {

                return res.status(404).json({
                    success: false,
                    message: "Session not found"
                });
            }


            // ------------------------------------------------
            // Authorization
            // ------------------------------------------------

            if (
                Number(session.opened_by) !==
                Number(userId)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not allowed to access this session"
                });
            }


            // ------------------------------------------------
            // Session must be active
            // ------------------------------------------------

            if (session.status !== "active") {

                return res.status(400).json({
                    success: false,
                    message:
                        "Session is not active",
                    status:
                        session.status
                });
            }


            // ------------------------------------------------
            // Check QR expiration
            // ------------------------------------------------

            const expiresAt =
                new Date(
                    session.qr_expires_at
                ).getTime();


            const expired =
                !session.qr_expires_at ||
                Number.isNaN(expiresAt) ||
                expiresAt <= Date.now();


            // ------------------------------------------------
            // Rotate QR if expired
            // ------------------------------------------------

            const continueWithSession = () => {

                getSessionById(
                    sessionId,
                    (refreshError, freshSession) => {

                        if (refreshError) {

                            console.error(
                                "Refresh session QR error:",
                                refreshError
                            );

                            return res.status(500).json({
                                success: false,
                                message: "Database error"
                            });
                        }


                        if (!freshSession) {

                            return res.status(404).json({
                                success: false,
                                message: "Session not found"
                            });
                        }


                        generateAndReturnQR(
                            freshSession,
                            res
                        );

                    }
                );

            };


            if (expired) {

                const rotateSql = `
                    UPDATE attendance_sessions
                    SET
                        qr_version = qr_version + 1,
                        qr_expires_at =
                            DATE_ADD(
                                NOW(),
                                INTERVAL qr_rotation_seconds SECOND
                            )
                    WHERE
                        id = ?
                        AND status = 'active'
                        AND qr_expires_at <= NOW()
                `;


                db.query(
                    rotateSql,
                    [sessionId],
                    (rotateError) => {

                        if (rotateError) {

                            console.error(
                                "QR rotation error:",
                                rotateError
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    "Could not rotate QR"
                            });
                        }


                        continueWithSession();

                    }
                );

            } else {

                continueWithSession();

            }

        }
    );
};


// ============================================================
// GENERATE AND RETURN CURRENT QR
// ============================================================

const generateAndReturnQR = (
    session,
    res
) => {

    let qrToken;

    try {

        qrToken =
            generateQRToken(
                session.id,
                session.qr_version,
                session.qr_expires_at,
                session.qr_rotation_seconds
            );

    } catch (error) {

        console.error(
            "Generate current QR error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not generate QR token"
        });
    }


    QRCode.toDataURL(
        qrToken,
        {
            errorCorrectionLevel: "M",
            margin: 2,
            width: 400
        },
        (qrError, qrImage) => {

            if (qrError) {

                console.error(
                    "Generate QR image error:",
                    qrError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not generate QR image"
                });
            }


            const remainingSeconds =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            new Date(
                                session.qr_expires_at
                            ).getTime() -
                            Date.now()
                        ) / 1000
                    )
                );


            return res.json({

                success: true,

                session: {

                    id:
                        session.id,

                    sectionId:
                        session.section_id,

                    roomId:
                        session.room_id,

                    status:
                        session.status
                },

                qr: {

                    token:
                        qrToken,

                    image:
                        qrImage,

                    version:
                        Number(
                            session.qr_version
                        ),

                    expiresAt:
                        session.qr_expires_at,

                    expiresIn:
                        remainingSeconds
                }

            });

        }
    );
};


// ============================================================
// CLOSE SESSION
// ============================================================

const closeSession = (req, res) => {

    const userId = req.user.userId;

    const sessionId =
        Number(req.params.id);


    if (!sessionId) {

        return res.status(400).json({
            success: false,
            message: "Invalid session ID"
        });
    }


    const getSql = `
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
            status
        FROM attendance_sessions
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        getSql,
        [sessionId],
        (err, results) => {

            if (err) {

                console.error(
                    "Close session lookup error:",
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
                    message: "Session not found"
                });
            }


            const session =
                results[0];


            // ------------------------------------------------
            // Authorization
            // ------------------------------------------------

            if (
                Number(session.opened_by) !==
                Number(userId)
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not allowed to close this session"
                });
            }


            if (session.status === "closed") {

                return res.status(400).json({
                    success: false,
                    message:
                        "Session is already closed"
                });
            }


            if (session.status === "cancelled") {

                return res.status(400).json({
                    success: false,
                    message:
                        "Cancelled session cannot be closed"
                });
            }


            const updateSql = `
                UPDATE attendance_sessions
                SET
                    actual_end = NOW(),
                    status = 'closed',
                    qr_expires_at = NOW()
                WHERE id = ?
            `;


            db.query(
                updateSql,
                [sessionId],
                (updateErr, updateResult) => {

                    if (updateErr) {

                        console.error(
                            "Close session update error:",
                            updateErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Could not close session"
                        });
                    }


                    return res.json({

                        success: true,

                        message:
                            "Attendance session closed successfully",

                        session: {

                            id:
                                sessionId,

                            status:
                                "closed",

                            affectedRows:
                                updateResult.affectedRows
                        }

                    });

                }
            );

        }
    );
};


// ============================================================
// GET SESSION BY ID
// ============================================================

const getSessionById = (
    sessionId,
    callback
) => {

    const sql = `
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
            allow_late_minutes,
            created_at,
            updated_at
        FROM attendance_sessions
        WHERE id = ?
        LIMIT 1
    `;


    db.query(
        sql,
        [sessionId],
        (err, results) => {

            if (err) {
                return callback(err, null);
            }


            if (results.length === 0) {
                return callback(null, null);
            }


            return callback(
                null,
                results[0]
            );

        }
    );
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    createSession,
    getSessionQR,
    closeSession
};