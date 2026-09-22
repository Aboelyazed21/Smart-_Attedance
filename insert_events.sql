-- ============================================================
-- SMART ATTENDANCE - FIXED TRAINING DATA
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 0. TEMPORARY NUMBERS TABLE
-- ============================================================

DROP TEMPORARY TABLE IF EXISTS numbers;

CREATE TEMPORARY TABLE numbers (
    n INT PRIMARY KEY
);

INSERT INTO numbers (n)
SELECT @row := @row + 1 AS n
FROM
    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
     SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
     SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t1,

    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
     SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
     SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t2,

    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
     SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
     SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t3,

    (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL
     SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL
     SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t4,

    (SELECT @row := 0) r;

DELETE FROM numbers
WHERE n > 2000;


-- ============================================================
-- 1. CLEAN PREVIOUS GENERATED DATA
-- ============================================================

DELETE FROM attendance_flags;

DELETE FROM ai_anomalies;

DELETE FROM ai_risk_predictions;

DELETE FROM attendance_events;


-- ============================================================
-- 2. CREATE 2000 STUDENT USERS
-- ============================================================

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
SELECT
    (
        SELECT id
        FROM roles
        WHERE name = 'student'
        LIMIT 1
    ),

    CONCAT('Student', n),

    CONCAT('User', n),

    CONCAT(
        'student',
        n,
        '@university.edu'
    ),

    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',

    CONCAT(
        '010',
        LPAD(n, 8, '0')
    ),

    'active'

FROM numbers;


-- ============================================================
-- 3. CREATE 2000 STUDENT PROFILES
-- ============================================================

INSERT INTO student_profiles
(
    user_id,
    student_code,
    university_id,
    department,
    level,
    academic_year
)
SELECT
    u.id,

    CONCAT(
        'STU',
        LPAD(n.n, 5, '0')
    ),

    CONCAT(
        'UNI2026',
        LPAD(n.n, 5, '0')
    ),

    CASE
        WHEN MOD(n.n, 4) = 0
            THEN 'Computer Science'

        WHEN MOD(n.n, 4) = 1
            THEN 'Artificial Intelligence'

        WHEN MOD(n.n, 4) = 2
            THEN 'Information Technology'

        ELSE 'Data Science'
    END,

    MOD(n.n, 4) + 1,

    '2025/2026'

FROM numbers n

JOIN users u
    ON u.email =
       CONCAT(
           'student',
           n.n,
           '@university.edu'
       );


-- ============================================================
-- 4. CREATE 200 STAFF USERS
-- ============================================================

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
SELECT
    CASE
        WHEN MOD(n.n, 2) = 0
            THEN (
                SELECT id
                FROM roles
                WHERE name = 'lecturer'
                LIMIT 1
            )

        ELSE (
            SELECT id
            FROM roles
            WHERE name = 'ta'
            LIMIT 1
        )
    END,

    CONCAT('Staff', n.n),

    CONCAT('Member', n.n),

    CONCAT(
        'staff',
        n.n,
        '@university.edu'
    ),

    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',

    CONCAT(
        '011',
        LPAD(n.n, 8, '0')
    ),

    'active'

FROM numbers n

WHERE n.n <= 200;


-- ============================================================
-- 5. CREATE STAFF PROFILES
-- ============================================================

INSERT INTO staff_profiles
(
    user_id,
    staff_code,
    department,
    job_title
)
SELECT
    u.id,

    CONCAT(
        'STAFF',
        LPAD(n.n, 5, '0')
    ),

    CASE
        WHEN MOD(n.n, 4) = 0
            THEN 'Computer Science'

        WHEN MOD(n.n, 4) = 1
            THEN 'Artificial Intelligence'

        WHEN MOD(n.n, 4) = 2
            THEN 'Information Technology'

        ELSE 'Data Science'
    END,

    CASE
        WHEN MOD(n.n, 2) = 0
            THEN 'Lecturer'

        ELSE 'Teaching Assistant'
    END

FROM numbers n

JOIN users u
    ON u.email =
       CONCAT(
           'staff',
           n.n,
           '@university.edu'
       )

WHERE n.n <= 200;


-- ============================================================
-- 6. CREATE 200 SECTIONS
-- ============================================================

INSERT INTO sections
(
    course_id,
    section_name,
    academic_year,
    semester,
    lecturer_id,
    capacity
)
SELECT
    ((n.n - 1) MOD 10) + 1,

    CONCAT(
        'SEC-',
        LPAD(n.n, 3, '0')
    ),

    '2025/2026',

    'first',

    (
        SELECT id
        FROM users
        WHERE email =
              CONCAT(
                  'staff',
                  ((n.n - 1) MOD 200) + 1,
                  '@university.edu'
              )
        LIMIT 1
    ),

    60

FROM numbers n

WHERE n.n <= 200;


-- ============================================================
-- 7. CREATE 2000 ENROLLMENTS
-- Each student belongs to ONE section
-- 10 students per section
-- ============================================================

INSERT INTO enrollments
(
    student_id,
    section_id,
    status
)
SELECT
    sp.id,

    ((sp.id - 1) MOD 200) + 1,

    'active'

FROM student_profiles sp;


-- ============================================================
-- 8. CREATE 2000 SESSIONS
-- 10 sessions for each section
-- Total = 200 sections × 10 = 2000 sessions
-- ============================================================

INSERT INTO attendance_sessions
(
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
)
SELECT
    sec.id,

    ((sec.id - 1) MOD 5) + 1,

    sec.lecturer_id,

    DATE_ADD(
        '2025-09-01',
        INTERVAL (
            ((sec.id - 1) * 10) + s.session_number
        ) DAY
    ),

    '09:00:00',

    '11:00:00',

    CONCAT(
        DATE_ADD(
            '2025-09-01',
            INTERVAL (
                ((sec.id - 1) * 10) + s.session_number
            ) DAY
        ),
        ' 09:00:00'
    ),

    CONCAT(
        DATE_ADD(
            '2025-09-01',
            INTERVAL (
                ((sec.id - 1) * 10) + s.session_number
            ) DAY
        ),
        ' 11:00:00'
    ),

    'closed',

    SHA2(
        CONCAT(
            'qr-secret-',
            sec.id,
            '-',
            s.session_number
        ),
        256
    ),

    1,

    CONCAT(
        DATE_ADD(
            '2025-09-01',
            INTERVAL (
                ((sec.id - 1) * 10) + s.session_number
            ) DAY
        ),
        ' 11:00:00'
    ),

    10,

    15

FROM sections sec

CROSS JOIN
(
    SELECT 1 AS session_number
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
    UNION ALL SELECT 10
) s

WHERE sec.id <= 200;


-- ============================================================
-- 9. CREATE CORRECT ATTENDANCE EVENTS
--
-- 2000 students
-- × 10 sessions
-- = 20000 attendance events
--
-- IMPORTANT:
-- Student only gets events for sessions
-- belonging to his enrolled section.
-- ============================================================

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
SELECT
    e.student_id,

    ses.id,

    CASE

        /*
        HIGH-RISK STUDENTS
        More absence / late behavior
        */

        WHEN
            MOD(
                CRC32(
                    CONCAT(
                        e.student_id,
                        '-',
                        ses.id,
                        '-absence'
                    )
                ),
                100
            )
            <
            CASE
                WHEN MOD(e.student_id, 10) < 2
                    THEN 30

                WHEN MOD(e.student_id, 10) < 5
                    THEN 15

                ELSE 7
            END

        THEN 'absent'


        /*
        LATE STUDENTS
        */

        WHEN
            MOD(
                CRC32(
                    CONCAT(
                        e.student_id,
                        '-',
                        ses.id,
                        '-late'
                    )
                ),
                100
            )
            <
            CASE
                WHEN MOD(e.student_id, 10) < 2
                    THEN 25

                WHEN MOD(e.student_id, 10) < 5
                    THEN 15

                ELSE 8
            END

        THEN 'late'


        /*
        NORMAL
        */

        ELSE 'present'

    END,


    'qr',

    'accepted',


    CASE

        WHEN
            MOD(
                CRC32(
                    CONCAT(
                        e.student_id,
                        '-',
                        ses.id,
                        '-absence'
                    )
                ),
                100
            )
            <
            CASE
                WHEN MOD(e.student_id, 10) < 2
                    THEN 30

                WHEN MOD(e.student_id, 10) < 5
                    THEN 15

                ELSE 7
            END

        THEN NULL


        WHEN
            MOD(
                CRC32(
                    CONCAT(
                        e.student_id,
                        '-',
                        ses.id,
                        '-late'
                    )
                ),
                100
            )
            <
            CASE
                WHEN MOD(e.student_id, 10) < 2
                    THEN 25

                WHEN MOD(e.student_id, 10) < 5
                    THEN 15

                ELSE 8
            END

        THEN TIMESTAMP(
            ses.session_date,
            '09:10:00'
        )


        ELSE TIMESTAMP(
            ses.session_date,
            '09:05:00'
        )

    END,


    CONCAT(
        '192.168.1.',
        MOD(e.student_id, 250) + 1
    ),


    CASE
        WHEN MOD(e.student_id, 3) = 0
            THEN 'Android'

        WHEN MOD(e.student_id, 3) = 1
            THEN 'iPhone'

        ELSE 'Windows'
    END,


    1,

    'Synthetic training attendance generated from valid enrollment'


FROM enrollments e

JOIN attendance_sessions ses
    ON ses.section_id = e.section_id

WHERE e.status = 'active';


-- ============================================================
-- 10. CREATE AI RISK PREDICTIONS
-- Initial demo predictions
-- ============================================================

INSERT INTO ai_risk_predictions
(
    student_id,
    risk_probability,
    risk_level,
    model_version
)
SELECT
    sp.id,

    ROUND(
        CASE

            WHEN MOD(sp.id, 10) < 2
                THEN 0.75

            WHEN MOD(sp.id, 10) < 5
                THEN 0.50

            ELSE 0.20

        END
        +
        (
            MOD(sp.id, 10) / 1000.0
        ),

        5
    ),

    CASE
        WHEN MOD(sp.id, 10) < 2
            THEN 'high'

        WHEN MOD(sp.id, 10) < 5
            THEN 'medium'

        ELSE 'low'
    END,

    '1.3.0'

FROM student_profiles sp;


-- ============================================================
-- 11. CREATE AI ANOMALIES
-- ============================================================

INSERT INTO ai_anomalies
(
    student_id,
    anomaly_score,
    is_anomaly,
    model_version,
    reason
)
SELECT
    sp.id,

    ROUND(
        CASE
            WHEN MOD(sp.id, 7) = 0
                THEN 0.85

            ELSE
                0.10
                +
                (
                    MOD(sp.id, 30) / 100.0
                )
        END,

        6
    ),

    CASE
        WHEN MOD(sp.id, 7) = 0
            THEN TRUE

        ELSE FALSE
    END,

    '1.3.0',

    CASE
        WHEN MOD(sp.id, 7) = 0
            THEN 'Unusual attendance behavior detected'

        ELSE 'Normal attendance behavior'
    END

FROM student_profiles sp;


-- ============================================================
-- 12. CREATE ATTENDANCE FLAGS
-- ============================================================

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
SELECT
    sp.id,

    (
        SELECT ses.id
        FROM attendance_sessions ses
        JOIN enrollments e
            ON e.section_id = ses.section_id
           AND e.student_id = sp.id
           AND e.status = 'active'
        ORDER BY ses.session_date
        LIMIT 1
    ),

    CASE

        WHEN MOD(sp.id, 4) = 0
            THEN 'low_attendance'

        WHEN MOD(sp.id, 4) = 1
            THEN 'repeated_failed_scans'

        WHEN MOD(sp.id, 4) = 2
            THEN 'high_correction_activity'

        ELSE 'unusual_scan_pattern'

    END,


    CASE

        WHEN MOD(sp.id, 5) = 0
            THEN 'high'

        WHEN MOD(sp.id, 2) = 0
            THEN 'medium'

        ELSE 'low'

    END,


    'Automated Red Flag generated from student attendance behavior.',


    ROUND(
        40 + MOD(sp.id * 3, 60),
        2
    ),


    CASE
        WHEN MOD(sp.id, 3) = 0
            THEN TRUE

        ELSE FALSE
    END

FROM student_profiles sp;


SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 13. VALIDATION
-- ============================================================

SELECT
    'users' AS table_name,
    COUNT(*) AS total
FROM users

UNION ALL

SELECT
    'student_profiles',
    COUNT(*)
FROM student_profiles

UNION ALL

SELECT
    'sections',
    COUNT(*)
FROM sections

UNION ALL

SELECT
    'enrollments',
    COUNT(*)
FROM enrollments

UNION ALL

SELECT
    'attendance_sessions',
    COUNT(*)
FROM attendance_sessions

UNION ALL

SELECT
    'attendance_events',
    COUNT(*)
FROM attendance_events

UNION ALL

SELECT
    'ai_risk_predictions',
    COUNT(*)
FROM ai_risk_predictions

UNION ALL

SELECT
    'ai_anomalies',
    COUNT(*)
FROM ai_anomalies

UNION ALL

SELECT
    'attendance_flags',
    COUNT(*)
FROM attendance_flags;


-- ============================================================
-- 14. CHECK EVENTS PER STUDENT
-- ============================================================

SELECT
    ae.student_id,
    COUNT(*) AS attendance_events
FROM attendance_events ae
GROUP BY ae.student_id
ORDER BY ae.student_id
LIMIT 20;


-- ============================================================
-- 15. CHECK STUDENT 1999
-- ============================================================

SELECT
    ae.student_id,
    ae.session_id,
    ses.section_id,
    e.section_id AS enrolled_section,
    ae.status
FROM attendance_events ae

JOIN attendance_sessions ses
    ON ses.id = ae.session_id

JOIN enrollments e
    ON e.student_id = ae.student_id
   AND e.section_id = ses.section_id
   AND e.status = 'active'

WHERE ae.student_id = 1999

ORDER BY
    ae.session_id;


-- ============================================================
-- 16. CHECK INVALID ATTENDANCE RELATIONSHIPS
-- ============================================================

SELECT
    COUNT(*) AS invalid_attendance
FROM attendance_events ae

JOIN attendance_sessions ses
    ON ses.id = ae.session_id

LEFT JOIN enrollments e
    ON e.student_id = ae.student_id
   AND e.section_id = ses.section_id
   AND e.status = 'active'

WHERE e.id IS NULL;


-- ============================================================
-- 17. ATTENDANCE DISTRIBUTION
-- ============================================================

SELECT
    status,
    COUNT(*) AS total
FROM attendance_events
GROUP BY status;


-- ============================================================
-- 18. ATTENDANCE DISTRIBUTION PER STUDENT
-- ============================================================

SELECT
    student_id,

    SUM(status = 'present') AS present_count,

    SUM(status = 'late') AS late_count,

    SUM(status = 'absent') AS absent_count

FROM attendance_events

GROUP BY student_id

ORDER BY student_id

LIMIT 20;