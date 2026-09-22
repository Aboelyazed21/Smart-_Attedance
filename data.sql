-- USE smart_attendance_db;

-- SET FOREIGN_KEY_CHECKS = 0;

-- DROP TEMPORARY TABLE IF EXISTS numbers;

-- CREATE TEMPORARY TABLE numbers (
--     n INT PRIMARY KEY
-- );

-- INSERT INTO numbers (n)
-- VALUES
-- (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
-- (11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
-- (21),(22),(23),(24),(25),(26),(27),(28),(29),(30),
-- (31),(32),(33),(34),(35),(36),(37),(38),(39),(40),
-- (41),(42),(43),(44),(45),(46),(47),(48),(49),(50),
-- (51),(52),(53),(54),(55),(56),(57),(58),(59),(60),
-- (61),(62),(63),(64),(65),(66),(67),(68),(69),(70),
-- (71),(72),(73),(74),(75),(76),(77),(78),(79),(80),
-- (81),(82),(83),(84),(85),(86),(87),(88),(89),(90),
-- (91),(92),(93),(94),(95),(96),(97),(98),(99),(100);

-- -- ============================================================
-- -- 1. CREATE 100 STUDENT USERS
-- -- ============================================================

-- INSERT INTO users
-- (
--     role_id,
--     first_name,
--     last_name,
--     email,
--     password_hash,
--     phone,
--     status
-- )
-- SELECT
--     (SELECT id FROM roles WHERE name = 'student'),
--     CONCAT('Student', n),
--     CONCAT('User', n),
--     CONCAT('student', n, '@university.edu'),
--     '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
--     CONCAT('0100000', LPAD(n, 3, '0')),
--     'active'
-- FROM numbers;

-- -- ============================================================
-- -- 2. CREATE 100 STUDENT PROFILES
-- -- ============================================================

-- INSERT INTO student_profiles
-- (
--     user_id,
--     student_code,
--     university_id,
--     department,
--     level,
--     academic_year
-- )
-- SELECT
--     u.id,
--     CONCAT('STU', LPAD(n.n, 5, '0')),
--     CONCAT('UNI2026', LPAD(n.n, 4, '0')),
--     CASE
--         WHEN MOD(n.n, 4) = 0 THEN 'Computer Science'
--         WHEN MOD(n.n, 4) = 1 THEN 'Artificial Intelligence'
--         WHEN MOD(n.n, 4) = 2 THEN 'Information Technology'
--         ELSE 'Data Science'
--     END,
--     MOD(n.n, 4) + 1,
--     '2025/2026'
-- FROM numbers n
-- JOIN users u
--     ON u.email = CONCAT('student', n.n, '@university.edu');

-- -- ============================================================
-- -- 3. CREATE 100 STAFF USERS
-- -- ============================================================

-- INSERT INTO users
-- (
--     role_id,
--     first_name,
--     last_name,
--     email,
--     password_hash,
--     phone,
--     status
-- )
-- SELECT
--     CASE
--         WHEN MOD(n, 2) = 0
--         THEN (SELECT id FROM roles WHERE name = 'lecturer')
--         ELSE (SELECT id FROM roles WHERE name = 'ta')
--     END,
--     CONCAT('Staff', n),
--     CONCAT('Member', n),
--     CONCAT('staff', n, '@university.edu'),
--     '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
--     CONCAT('0110000', LPAD(n, 3, '0')),
--     'active'
-- FROM numbers;

-- -- ============================================================
-- -- 4. CREATE 100 STAFF PROFILES
-- -- ============================================================

-- INSERT INTO staff_profiles
-- (
--     user_id,
--     staff_code,
--     department,
--     job_title
-- )
-- SELECT
--     u.id,
--     CONCAT('STAFF', LPAD(n.n, 5, '0')),
--     CASE
--         WHEN MOD(n.n, 4) = 0 THEN 'Computer Science'
--         WHEN MOD(n.n, 4) = 1 THEN 'Artificial Intelligence'
--         WHEN MOD(n.n, 4) = 2 THEN 'Information Technology'
--         ELSE 'Data Science'
--     END,
--     CASE
--         WHEN MOD(n.n, 2) = 0 THEN 'Lecturer'
--         ELSE 'Teaching Assistant'
--     END
-- FROM numbers n
-- JOIN users u
--     ON u.email = CONCAT('staff', n.n, '@university.edu');

-- -- ============================================================
-- -- 5. CREATE 100 SECTIONS
-- -- ============================================================

-- INSERT INTO sections
-- (
--     course_id,
--     section_name,
--     academic_year,
--     semester,
--     lecturer_id,
--     capacity
-- )
-- SELECT
--     ((n - 1) MOD 5) + 1,
--     CONCAT('SEC-', LPAD(n, 3, '0')),
--     '2025/2026',
--     'first',
--     (
--         SELECT id
--         FROM users
--         WHERE email = CONCAT('staff', ((n - 1) MOD 100) + 1, '@university.edu')
--     ),
--     CASE
--         WHEN MOD(n, 3) = 0 THEN 40
--         WHEN MOD(n, 3) = 1 THEN 60
--         ELSE 100
--     END
-- FROM numbers;

-- -- ============================================================
-- -- 6. CREATE 100 ENROLLMENTS
-- -- ============================================================

-- INSERT INTO enrollments
-- (
--     student_id,
--     section_id,
--     status
-- )
-- SELECT
--     sp.id,
--     sec.id,
--     'active'
-- FROM
-- (
--     SELECT
--         n,
--         ROW_NUMBER() OVER (ORDER BY n) AS rn
--     FROM numbers
-- ) x
-- JOIN student_profiles sp
--     ON sp.student_code = CONCAT('STU', LPAD(x.n, 5, '0'))
-- JOIN sections sec
--     ON sec.section_name = CONCAT('SEC-', LPAD(x.n, 3, '0'));

-- -- ============================================================
-- -- 7. CREATE 100 TIMETABLE SLOTS
-- -- ============================================================

-- INSERT INTO timetable_slots
-- (
--     section_id,
--     room_id,
--     day_of_week,
--     start_time,
--     end_time,
--     start_date,
--     end_date
-- )
-- SELECT
--     id,
--     ((id - 1) MOD 3) + 1,
--     CASE MOD(id, 7)
--         WHEN 0 THEN 'saturday'
--         WHEN 1 THEN 'sunday'
--         WHEN 2 THEN 'monday'
--         WHEN 3 THEN 'tuesday'
--         WHEN 4 THEN 'wednesday'
--         WHEN 5 THEN 'thursday'
--         ELSE 'friday'
--     END,
--     CASE
--         WHEN MOD(id, 3) = 0 THEN '08:00:00'
--         WHEN MOD(id, 3) = 1 THEN '10:00:00'
--         ELSE '12:00:00'
--     END,
--     CASE
--         WHEN MOD(id, 3) = 0 THEN '10:00:00'
--         WHEN MOD(id, 3) = 1 THEN '12:00:00'
--         ELSE '14:00:00'
--     END,
--     '2025-09-01',
--     '2026-01-31'
-- FROM sections
-- ORDER BY id
-- LIMIT 100;

-- -- ============================================================
-- -- 8. CREATE 100 ATTENDANCE SESSIONS
-- -- ============================================================

-- INSERT INTO attendance_sessions
-- (
--     section_id,
--     room_id,
--     opened_by,
--     session_date,
--     scheduled_start,
--     scheduled_end,
--     actual_start,
--     actual_end,
--     status,
--     qr_secret_hash,
--     qr_version,
--     qr_expires_at,
--     qr_rotation_seconds,
--     allow_late_minutes
-- )
-- SELECT
--     sec.id,
--     ((sec.id - 1) MOD 3) + 1,
--     sec.lecturer_id,
--     DATE_ADD('2025-09-01', INTERVAL sec.id DAY),
--     '09:00:00',
--     ' 11:00:00',
--     CONCAT(
--         DATE_ADD('2025-09-01', INTERVAL sec.id DAY),
--         ' 09:00:00'
--     ),
--     CONCAT(
--         DATE_ADD('2025-09-01', INTERVAL sec.id DAY),
--         ' 11:00:00'
--     ),
--     'closed',
--     SHA2(CONCAT('qr-secret-', sec.id), 256),
--     1,
--    CONCAT(
--     DATE_ADD('2025-09-01', INTERVAL sec.id DAY),
--     ' 11:00:00'
-- ),
--     10,
--     15
-- FROM sections sec
-- ORDER BY sec.id
-- LIMIT 100;

-- -- ============================================================
-- -- 9. CREATE 100 ATTENDANCE EVENTS
-- -- ============================================================

-- INSERT IGNORE INTO attendance_events
-- (
--     student_id,
--     session_id,
--     status,
--     source,
--     validation_status,
--     scanned_at,
--     ip_address,
--     device_info,
--     qr_version,
--     notes
-- )
-- SELECT
--     sp.id,
--     ses.id,

--     CASE
--         WHEN MOD(sp.id, 10) IN (0, 1) THEN 'absent'
--         WHEN MOD(sp.id, 10) IN (2, 3) THEN 'late'
--         ELSE 'present'
--     END,

--     'qr',

--     'accepted',

--     CONCAT(
--         DATE_ADD('2025-09-01', INTERVAL ses.id DAY),
--         ' 09:0',
--         MOD(sp.id, 9),
--         ':00'
--     ),

--     CONCAT(
--         '192.168.1.',
--         MOD(sp.id, 250) + 1
--     ),

--     CASE
--         WHEN MOD(sp.id, 3) = 0 THEN 'Android'
--         WHEN MOD(sp.id, 3) = 1 THEN 'iPhone'
--         ELSE 'Windows'
--     END,

--     1,

--     'Generated test attendance record'

-- FROM student_profiles sp
-- JOIN attendance_sessions ses
--     ON ses.id = sp.id
-- LIMIT 100;

-- -- ============================================================
-- -- 10. CREATE MORE ATTENDANCE EVENTS
-- -- This gives the AI more historical data.
-- -- ============================================================

-- INSERT IGNORE INTO attendance_events
-- (
--     student_id,
--     session_id,
--     status,
--     source,
--     validation_status,
--     scanned_at,
--     ip_address,
--     device_info,
--     qr_version,
--     notes
-- )
-- SELECT
--     sp.id,
--     ses.id,

--     CASE
--         WHEN MOD(sp.id + ses.id, 12) IN (0,1,2) THEN 'absent'
--         WHEN MOD(sp.id + ses.id, 7) = 0 THEN 'late'
--         ELSE 'present'
--     END,

--     'qr',
--     'accepted',

--     DATE_ADD(
--         CONCAT(
--             DATE_ADD('2025-09-01', INTERVAL ses.id DAY),
--             ' 09:00:00'
--         ),
--         INTERVAL MOD(sp.id, 20) MINUTE
--     ),

--     CONCAT('10.0.0.', MOD(sp.id + ses.id, 250) + 1),

--     CASE
--         WHEN MOD(sp.id, 3) = 0 THEN 'Android'
--         WHEN MOD(sp.id, 3) = 1 THEN 'iPhone'
--         ELSE 'Windows'
--     END,

--     1,

--     'Historical attendance record'

-- FROM student_profiles sp
-- JOIN attendance_sessions ses
--     ON ses.id BETWEEN 1 AND 100
-- WHERE MOD(sp.id + ses.id, 100) = 0
-- LIMIT 100;

-- -- ============================================================
-- -- 11. QR SCAN ATTEMPTS
-- -- ============================================================

-- INSERT INTO qr_scan_attempts
-- (
--     student_id,
--     session_id,
--     qr_version,
--     result,
--     scanned_at,
--     ip_address,
--     device_info
-- )
-- SELECT
--     sp.id,
--     ses.id,
--     CASE
--         WHEN MOD(sp.id, 5) = 0 THEN 2
--         ELSE 1
--     END,

--     CASE
--         WHEN MOD(sp.id, 10) = 0 THEN 'expired'
--         WHEN MOD(sp.id, 10) = 1 THEN 'duplicate'
--         WHEN MOD(sp.id, 10) = 2 THEN 'invalid'
--         WHEN MOD(sp.id, 10) = 3 THEN 'too_late'
--         ELSE 'accepted'
--     END,

--     CONCAT(
--         DATE_ADD('2025-09-01', INTERVAL ses.id DAY),
--         ' 09:0',
--         MOD(sp.id, 9),
--         ':00'
--     ),

--     CONCAT('192.168.10.', MOD(sp.id, 250) + 1),

--     CASE
--         WHEN MOD(sp.id, 2) = 0 THEN 'Android'
--         ELSE 'iPhone'
--     END

-- FROM student_profiles sp
-- JOIN attendance_sessions ses
--     ON ses.id = sp.id
-- LIMIT 100;

-- -- ============================================================
-- -- 12. CORRECTION REQUESTS
-- -- ============================================================

-- INSERT INTO correction_requests
-- (
--     attendance_event_id,
--     student_id,
--     requested_status,
--     reason,
--     evidence_url,
--     status,
--     reviewed_by,
--     reviewed_at,
--     reviewer_comment
-- )
-- SELECT
--     ae.id,
--     ae.student_id,

--     CASE
--         WHEN MOD(ae.id, 2) = 0 THEN 'present'
--         ELSE 'late'
--     END,

--     CASE
--         WHEN MOD(ae.id, 3) = 0
--         THEN 'Student reported a technical issue during scanning'
--         WHEN MOD(ae.id, 3) = 1
--         THEN 'QR scanner was not responding'
--         ELSE 'Attendance record requires correction'
--     END,

--     CONCAT(
--         'https://university.edu/evidence/',
--         ae.id
--     ),

--     CASE
--         WHEN MOD(ae.id, 3) = 0 THEN 'approved'
--         WHEN MOD(ae.id, 3) = 1 THEN 'pending'
--         ELSE 'rejected'
--     END,

--     CASE
--         WHEN MOD(ae.id, 3) = 1
--         THEN NULL
--         ELSE (
--             SELECT id
--             FROM users
--             WHERE email = CONCAT(
--                 'staff',
--                 MOD(ae.id, 100) + 1,
--                 '@university.edu'
--             )
--             LIMIT 1
--         )
--     END,

--     CASE
--         WHEN MOD(ae.id, 3) = 1
--         THEN NULL
--         ELSE NOW()
--     END,

--     CASE
--         WHEN MOD(ae.id, 3) = 0
--         THEN 'Correction approved'
--         WHEN MOD(ae.id, 3) = 1
--         THEN NULL
--         ELSE 'Correction rejected'
--     END

-- FROM attendance_events ae
-- ORDER BY ae.id
-- LIMIT 100;

-- -- ============================================================
-- -- 13. ATTENDANCE FLAGS
-- -- ============================================================

-- INSERT INTO attendance_flags
-- (
--     student_id,
--     session_id,
--     flag_type,
--     severity,
--     reason,
--     score,
--     is_resolved
-- )
-- SELECT
--     sp.id,
--     ses.id,

--     CASE
--         WHEN MOD(sp.id, 4) = 0
--         THEN 'low_attendance'

--         WHEN MOD(sp.id, 4) = 1
--         THEN 'repeated_failed_scans'

--         WHEN MOD(sp.id, 4) = 2
--         THEN 'high_correction_activity'

--         ELSE 'unusual_scan_pattern'
--     END,

--     CASE
--         WHEN MOD(sp.id, 10) IN (0,1)
--         THEN 'high'

--         WHEN MOD(sp.id, 3) = 0
--         THEN 'medium'

--         ELSE 'low'
--     END,

--     CASE
--         WHEN MOD(sp.id, 4) = 0
--         THEN 'Attendance rate is below the configured threshold'

--         WHEN MOD(sp.id, 4) = 1
--         THEN 'Multiple failed QR scan attempts detected'

--         WHEN MOD(sp.id, 4) = 2
--         THEN 'Student has an unusual number of correction requests'

--         ELSE 'Unusual attendance scanning pattern detected'
--     END,

--     ROUND(
--         30 + MOD(sp.id * 7, 70),
--         2
--     ),

--     CASE
--         WHEN MOD(sp.id, 3) = 0 THEN TRUE
--         ELSE FALSE
--     END

-- FROM student_profiles sp
-- JOIN attendance_sessions ses
--     ON ses.id = sp.id
-- LIMIT 100;

-- -- ============================================================
-- -- 14. AI MODEL VERSIONS
-- -- ============================================================

-- INSERT IGNORE INTO ai_model_versions
-- (
--     model_name,
--     version,
--     precision_score,
--     recall_score,
--     f1_score,
--     training_samples,
--     trained_at,
--     status
-- )
-- VALUES
-- (
--     'attendance_risk',
--     '1.0.0',
--     0.84000,
--     0.79000,
--     0.81400,
--     100,
--     '2025-09-10 10:00:00',
--     'active'
-- ),
-- (
--     'attendance_risk',
--     '1.1.0',
--     0.86000,
--     0.81000,
--     0.83400,
--     150,
--     '2025-09-20 10:00:00',
--     'active'
-- ),
-- (
--     'attendance_risk',
--     '1.2.0',
--     0.88000,
--     0.83000,
--     0.85400,
--     200,
--     '2025-10-01 10:00:00',
--     'active'
-- );

-- -- Add additional model versions
-- INSERT IGNORE INTO ai_model_versions
-- (
--     model_name,
--     version,
--     precision_score,
--     recall_score,
--     f1_score,
--     training_samples,
--     trained_at,
--     status
-- )
-- SELECT
--     'attendance_risk',
--     CONCAT('1.', n, '.0'),
--     ROUND(0.80 + MOD(n, 15) / 100, 5),
--     ROUND(0.75 + MOD(n, 20) / 100, 5),
--     ROUND(0.77 + MOD(n, 18) / 100, 5),
--     100 + n * 10,
--     DATE_ADD('2025-10-01 10:00:00', INTERVAL n DAY),
--     CASE
--         WHEN n = 100 THEN 'active'
--         WHEN MOD(n, 5) = 0 THEN 'archived'
--         ELSE 'training'
--     END
-- FROM numbers
-- WHERE n <= 97;

-- -- ============================================================
-- -- 15. AI RISK PREDICTIONS
-- -- ============================================================

-- INSERT INTO ai_risk_predictions
-- (
--     student_id,
--     risk_probability,
--     risk_level,
--     model_version
-- )
-- SELECT
--     sp.id,

--     ROUND(
--         CASE
--             WHEN MOD(sp.id, 10) IN (0,1,2)
--                 THEN 0.75 + MOD(sp.id, 20) / 100

--             WHEN MOD(sp.id, 10) IN (3,4,5)
--                 THEN 0.45 + MOD(sp.id, 20) / 100

--             ELSE
--                 0.10 + MOD(sp.id, 20) / 100
--         END,
--         5
--     ),

--     CASE
--         WHEN MOD(sp.id, 10) IN (0,1,2)
--             THEN 'high'

--         WHEN MOD(sp.id, 10) IN (3,4,5)
--             THEN 'medium'

--         ELSE 'low'
--     END,

--     '1.2.0'

-- FROM student_profiles sp
-- LIMIT 100;

-- -- ============================================================
-- -- 16. AI ANOMALIES
-- -- ============================================================

-- INSERT INTO ai_anomalies
-- (
--     student_id,
--     anomaly_score,
--     is_anomaly,
--     model_version,
--     reason
-- )
-- SELECT
--     sp.id,

--     ROUND(
--         CASE
--             WHEN MOD(sp.id, 5) = 0
--                 THEN 0.85 + MOD(sp.id, 10) / 100

--             WHEN MOD(sp.id, 3) = 0
--                 THEN 0.60 + MOD(sp.id, 15) / 100

--             ELSE
--                 0.10 + MOD(sp.id, 30) / 100
--         END,
--         6
--     ),

--     CASE
--         WHEN MOD(sp.id, 5) = 0 THEN TRUE
--         WHEN MOD(sp.id, 3) = 0 THEN TRUE
--         ELSE FALSE
--     END,

--     '1.0.0',

--     CASE
--         WHEN MOD(sp.id, 5) = 0
--             THEN 'Unusual attendance and QR scan behavior'

--         WHEN MOD(sp.id, 3) = 0
--             THEN 'Abnormal attendance pattern detected'

--         ELSE
--             'Normal attendance pattern'
--     END

-- FROM student_profiles sp
-- LIMIT 100;

-- -- ============================================================
-- -- 17. NOTIFICATIONS
-- -- ============================================================

-- INSERT INTO notifications
-- (
--     user_id,
--     title,
--     message,
--     type,
--     is_read
-- )
-- SELECT
--     u.id,

--     CASE
--         WHEN MOD(u.id, 3) = 0
--             THEN 'Attendance Warning'

--         WHEN MOD(u.id, 3) = 1
--             THEN 'Attendance Update'

--         ELSE
--             'AI Attendance Alert'
--     END,

--     CASE
--         WHEN MOD(u.id, 3) = 0
--             THEN 'Your attendance rate is below the configured threshold.'

--         WHEN MOD(u.id, 3) = 1
--             THEN 'Your attendance record has been updated.'

--        ELSE
--         'An attendance pattern requires review.'
--        END,
--     CASE
--         WHEN MOD(u.id, 3) = 0
--             THEN 'warning'

--         WHEN MOD(u.id, 3) = 1
--             THEN 'attendance'

--         ELSE
--             'ai_alert'
--     END,

--     MOD(u.id, 2) = 0

-- FROM users u
-- WHERE u.email LIKE 'student%@university.edu'
-- LIMIT 100;

-- -- ============================================================
-- -- 18. AUDIT EVENTS
-- -- ============================================================

-- INSERT INTO audit_events
-- (
--     actor_id,
--     action,
--     entity_type,
--     entity_id,
--     before_data,
--     after_data,
--     ip_address,
--     user_agent
-- )
-- SELECT
--     (
--         SELECT id
--         FROM users
--         WHERE email = CONCAT(
--             'staff',
--             MOD(n, 100) + 1,
--             '@university.edu'
--         )
--         LIMIT 1
--     ),

--     CASE
--         WHEN MOD(n, 4) = 0 THEN 'CREATE_ATTENDANCE'
--         WHEN MOD(n, 4) = 1 THEN 'UPDATE_ATTENDANCE'
--         WHEN MOD(n, 4) = 2 THEN 'REVIEW_CORRECTION'
--         ELSE 'AI_FLAG_REVIEW'
--     END,

--     CASE
--         WHEN MOD(n, 4) = 0 THEN 'attendance_event'
--         WHEN MOD(n, 4) = 1 THEN 'attendance_event'
--         WHEN MOD(n, 4) = 2 THEN 'correction_request'
--         ELSE 'attendance_flag'
--     END,

--     n,

--     JSON_OBJECT(
--         'status', 'old'
--     ),

--     JSON_OBJECT(
--         'status', 'new',
--         'source', 'system'
--     ),

--     CONCAT(
--         '192.168.20.',
--         MOD(n, 250) + 1
--     ),

--     'Mozilla/5.0 SmartAttendance'

-- FROM numbers;

-- -- ============================================================
-- -- 19. ADD SOME REJECTED QR ATTEMPTS
-- -- ============================================================

-- INSERT INTO qr_scan_attempts
-- (
--     student_id,
--     session_id,
--     qr_version,
--     result,
--     scanned_at,
--     ip_address,
--     device_info
-- )
-- SELECT
--     sp.id,
--     ses.id,
--     99,

--     CASE
--         WHEN MOD(sp.id, 4) = 0 THEN 'expired'
--         WHEN MOD(sp.id, 4) = 1 THEN 'invalid'
--         WHEN MOD(sp.id, 4) = 2 THEN 'wrong_session'
--         ELSE 'too_late'
--     END,

--     CONCAT(
--         DATE_ADD('2025-09-01', INTERVAL ses.id DAY),
--         ' 09:30:00'
--     ),

--     CONCAT(
--         '172.16.0.',
--         MOD(sp.id, 250) + 1
--     ),

--     'Unknown Device'

-- FROM student_profiles sp
-- JOIN attendance_sessions ses
--     ON ses.id = sp.id
-- LIMIT 100;

-- SET FOREIGN_KEY_CHECKS = 1;

-- -- ============================================================
-- -- CHECK COUNTS
-- -- ============================================================

-- SELECT 'users' AS table_name, COUNT(*) AS total FROM users
-- UNION ALL
-- SELECT 'student_profiles', COUNT(*) FROM student_profiles
-- UNION ALL
-- SELECT 'staff_profiles', COUNT(*) FROM staff_profiles
-- UNION ALL
-- SELECT 'sections', COUNT(*) FROM sections
-- UNION ALL
-- SELECT 'enrollments', COUNT(*) FROM enrollments
-- UNION ALL
-- SELECT 'timetable_slots', COUNT(*) FROM timetable_slots
-- UNION ALL
-- SELECT 'attendance_sessions', COUNT(*) FROM attendance_sessions
-- UNION ALL
-- SELECT 'attendance_events', COUNT(*) FROM attendance_events
-- UNION ALL
-- SELECT 'qr_scan_attempts', COUNT(*) FROM qr_scan_attempts
-- UNION ALL
-- SELECT 'correction_requests', COUNT(*) FROM correction_requests
-- UNION ALL
-- SELECT 'attendance_flags', COUNT(*) FROM attendance_flags
-- UNION ALL
-- SELECT 'ai_model_versions', COUNT(*) FROM ai_model_versions
-- UNION ALL
-- SELECT 'ai_risk_predictions', COUNT(*) FROM ai_risk_predictions
-- UNION ALL
-- SELECT 'ai_anomalies', COUNT(*) FROM ai_anomalies
-- UNION ALL
-- SELECT 'notifications', COUNT(*) FROM notifications
-- UNION ALL
-- SELECT 'audit_events', COUNT(*) FROM audit_events;
USE smart_attendance_db;

SET FOREIGN_KEY_CHECKS = 0;

-- تنظيف البيانات القديمة اختيارياً أو إبقاء التداخل (يُفضل تفريغ أو تشغيل على قاعدة نظيفة، أو يمكنك إزالة الـ TRUNCATE لو أردت الإضافة)
-- TRUNCATE TABLE audit_events;
-- TRUNCATE TABLE notifications;
-- TRUNCATE TABLE ai_anomalies;
-- TRUNCATE TABLE ai_risk_predictions;
-- TRUNCATE TABLE attendance_flags;
-- TRUNCATE TABLE correction_requests;
-- TRUNCATE TABLE qr_scan_attempts;
-- TRUNCATE TABLE attendance_events;
-- TRUNCATE TABLE attendance_sessions;
-- TRUNCATE TABLE timetable_slots;
-- TRUNCATE TABLE enrollments;
-- TRUNCATE TABLE sections;
-- TRUNCATE TABLE staff_profiles;
-- TRUNCATE TABLE student_profiles;

DROP TEMPORARY TABLE IF EXISTS numbers;

-- إنشاء جدول مؤقت بـ 2000 صف لتوليد بيانات ضخمة
CREATE TEMPORARY TABLE numbers (
    n INT PRIMARY KEY
);

-- دالة سريعة لإدخال 2000 رقم باستخدام تكرار متصل
INSERT INTO numbers (n)
SELECT @row := @row + 1 AS n
FROM (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t1,
     (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t2,
     (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t3,
     (SELECT 0 UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) t4,
     (SELECT @row := 0) r;

-- تقليص الجدول المؤقت ليكون بالضبط 2000 صف
DELETE FROM numbers WHERE n > 2000;

-- ============================================================
-- 1. CREATE 2000 STUDENT USERS
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
    (SELECT id FROM roles WHERE name = 'student'),
    CONCAT('Student', n),
    CONCAT('User', n),
    CONCAT('student', n, '@university.edu'),
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    CONCAT('010', LPAD(n, 8, '0')),
    'active'
FROM numbers;

-- ============================================================
-- 2. CREATE 2000 STUDENT PROFILES
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
    CONCAT('STU', LPAD(n.n, 5, '0')),
    CONCAT('UNI2026', LPAD(n.n, 5, '0')),
    CASE
        WHEN MOD(n.n, 4) = 0 THEN 'Computer Science'
        WHEN MOD(n.n, 4) = 1 THEN 'Artificial Intelligence'
        WHEN MOD(n.n, 4) = 2 THEN 'Information Technology'
        ELSE 'Data Science'
    END,
    MOD(n.n, 4) + 1,
    '2025/2026'
FROM numbers n
JOIN users u
    ON u.email = CONCAT('student', n.n, '@university.edu');

-- ============================================================
-- 3. CREATE 200 STAFF USERS (Lecturers & TAs)
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
        THEN (SELECT id FROM roles WHERE name = 'lecturer')
        ELSE (SELECT id FROM roles WHERE name = 'ta')
    END,
    CONCAT('Staff', n.n),
    CONCAT('Member', n.n),
    CONCAT('staff', n.n, '@university.edu'),
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456',
    CONCAT('011', LPAD(n.n, 8, '0')),
    'active'
FROM numbers n
WHERE n.n <= 200;

-- ============================================================
-- 4. CREATE 200 STAFF PROFILES
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
    CONCAT('STAFF', LPAD(n.n, 5, '0')),
    CASE
        WHEN MOD(n.n, 4) = 0 THEN 'Computer Science'
        WHEN MOD(n.n, 4) = 1 THEN 'Artificial Intelligence'
        WHEN MOD(n.n, 4) = 2 THEN 'Information Technology'
        ELSE 'Data Science'
    END,
    CASE
        WHEN MOD(n.n, 2) = 0 THEN 'Lecturer'
        ELSE 'Teaching Assistant'
    END
FROM numbers n
JOIN users u
    ON u.email = CONCAT('staff', n.n, '@university.edu')
WHERE n.n <= 200;

-- ============================================================
-- 5. CREATE 200 SECTIONS
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
    CONCAT('SEC-', LPAD(n.n, 3, '0')),
    '2025/2026',
    'first',
    (
        SELECT id
        FROM users
        WHERE email = CONCAT('staff', ((n.n - 1) MOD 200) + 1, '@university.edu')
    ),
    60
FROM numbers n
WHERE n.n <= 200;

-- ============================================================
-- 6. CREATE 2000 ENROLLMENTS (Distributing students to sections)
-- ============================================================
INSERT INTO enrollments
(
    student_id,
    section_id,
    status
)
SELECT
    sp.id,
    sec.id,
    'active'
FROM student_profiles sp
JOIN sections sec 
    ON sec.id = ((sp.id - 1) MOD 200) + 1;

-- ============================================================
-- 7. CREATE 2000 ATTENDANCE SESSIONS
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
    DATE_ADD('2025-09-01', INTERVAL (n.n MOD 120) DAY),
    '09:00:00',
    '11:00:00',
    CONCAT(DATE_ADD('2025-09-01', INTERVAL (n.n MOD 120) DAY), ' 09:00:00'),
    CONCAT(DATE_ADD('2025-09-01', INTERVAL (n.n MOD 120) DAY), ' 11:00:00'),
    'closed',
    SHA2(CONCAT('qr-secret-', n.n), 256),
    1,
    CONCAT(DATE_ADD('2025-09-01', INTERVAL (n.n MOD 120) DAY), ' 11:00:00'),
    10,
    15
FROM numbers n
JOIN sections sec ON sec.id = ((n.n - 1) MOD 200) + 1;

-- ============================================================
-- 8. CREATE 2000 ATTENDANCE EVENTS (Real-world pattern)
-- ============================================================
INSERT IGNORE INTO attendance_events
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
    sp.id,
    ses.id,
    CASE
        WHEN MOD(sp.id * 3 + ses.id, 10) < 2 THEN 'absent'
        WHEN MOD(sp.id * 7 + ses.id, 10) = 2 THEN 'late'
        ELSE 'present'
    END,
    'qr',
    'accepted',
    CONCAT(ses.session_date, ' 09:05:00'),
    CONCAT('192.168.1.', MOD(sp.id, 250) + 1),
    CASE
        WHEN MOD(sp.id, 3) = 0 THEN 'Android'
        WHEN MOD(sp.id, 3) = 1 THEN 'iPhone'
        ELSE 'Windows'
    END,
    1,
    'Real-world training attendance record'
FROM student_profiles sp
JOIN attendance_sessions ses ON ses.id = ((sp.id + ses.id) MOD 2000) + 1;

-- ============================================================
-- 9. CREATE 2000 AI RISK PREDICTIONS
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
            WHEN MOD(sp.id, 10) < 2 THEN 0.75 + (MOD(sp.id, 20) / 100.0) -- High Risk
            WHEN MOD(sp.id, 10) < 5 THEN 0.45 + (MOD(sp.id, 20) / 100.0) -- Medium Risk
            ELSE 0.10 + (MOD(sp.id, 20) / 100.0)                         -- Low Risk
        END, 5
    ),
    CASE
        WHEN MOD(sp.id, 10) < 2 THEN 'high'
        WHEN MOD(sp.id, 10) < 5 THEN 'medium'
        ELSE 'low'
    END,
    '1.2.0'
FROM student_profiles sp;

-- ============================================================
-- 10. CREATE 2000 AI ANOMALIES
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
            WHEN MOD(sp.id, 7) = 0 THEN 0.85 + (MOD(sp.id, 10) / 100.0)
            ELSE 0.15 + (MOD(sp.id, 50) / 100.0)
        END, 6
    ),
    CASE
        WHEN MOD(sp.id, 7) = 0 THEN TRUE
        ELSE FALSE
    END,
    '1.2.0',
    CASE
        WHEN MOD(sp.id, 7) = 0 THEN 'Unusual scanning location and rapid succession pattern'
        ELSE 'Normal behavioral pattern'
    END
FROM student_profiles sp;

-- ============================================================
-- 11. CREATE 2000 ATTENDANCE FLAGS (Red Flags)
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
    ((sp.id - 1) MOD 2000) + 1,
    CASE
        WHEN MOD(sp.id, 4) = 0 THEN 'low_attendance'
        WHEN MOD(sp.id, 4) = 1 THEN 'repeated_failed_scans'
        WHEN MOD(sp.id, 4) = 2 THEN 'high_correction_activity'
        ELSE 'unusual_scan_pattern'
    END,
    CASE
        WHEN MOD(sp.id, 5) = 0 THEN 'high'
        WHEN MOD(sp.id, 2) = 0 THEN 'medium'
        ELSE 'low'
    END,
    'Automated Red Flag generated based on student behavior metrics.',
    ROUND(40 + MOD(sp.id * 3, 60), 2),
    CASE WHEN MOD(sp.id, 3) = 0 THEN TRUE ELSE FALSE END
FROM student_profiles sp;

SET FOREIGN_KEY_CHECKS = 1;

-- التحقق من عدد السطور المُولدة في الجداول الأساسية
SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL
SELECT 'student_profiles', COUNT(*) FROM student_profiles
UNION ALL
SELECT 'attendance_events', COUNT(*) FROM attendance_events
UNION ALL
SELECT 'ai_risk_predictions', COUNT(*) FROM ai_risk_predictions
UNION ALL
SELECT 'ai_anomalies', COUNT(*) FROM ai_anomalies
UNION ALL
SELECT 'attendance_flags', COUNT(*) FROM attendance_flags;