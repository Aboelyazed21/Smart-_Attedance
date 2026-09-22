import mysql.connector

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "0000",  # ضع كلمة مرور قاعدة البيانات هنا
    "database": "smart_attendance_db"
}

query = """
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
        WHEN MOD(e.student_id * 7 + ses.id * 3, 20) < 2 THEN 'absent'
        WHEN MOD(e.student_id * 7 + ses.id * 3, 20) < 5 THEN 'late'
        ELSE 'present'
    END,
    'qr',
    'accepted',
    CASE
        WHEN MOD(e.student_id * 7 + ses.id * 3, 20) < 2 THEN NULL
        WHEN MOD(e.student_id * 7 + ses.id * 3, 20) < 5 THEN TIMESTAMP(ses.session_date, ADDTIME(ses.scheduled_start, '00:10:00'))
        ELSE TIMESTAMP(ses.session_date, ADDTIME(ses.scheduled_start, '00:05:00'))
    END,
    CONCAT('192.168.1.', MOD(e.student_id, 250) + 1),
    CASE
        WHEN MOD(e.student_id, 3) = 0 THEN 'Android'
        WHEN MOD(e.student_id, 3) = 1 THEN 'iPhone'
        ELSE 'Windows'
    END,
    1,
    'Generated from valid student enrollment and session'
FROM enrollments e
JOIN attendance_sessions ses ON ses.section_id = e.section_id
WHERE e.status = 'active';
"""

try:
    print("Connecting to database and inserting events...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    cursor.execute(query)
    conn.commit()
    print("تم إدخال الـ 20,000 سجل بنجاح تام!")
except Exception as e:
    print(f"حدث خطأ: {e}")
finally:
    if 'cursor' in locals(): cursor.close()
    if 'conn' in locals(): conn.close()