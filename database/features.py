# # import mysql.connector
# # import pandas as pd


# # DB_CONFIG = {
# #     "host": "localhost",
# #     "user": "root",
# #     "password": "0000",
# #     "database": " smart_attendance_db"
# # }


# # def get_connection():
# #     return mysql.connector.connect(**DB_CONFIG)


# # def get_student_features():
# #     connection = get_connection()

# #     query = """
# #     SELECT
# #         sp.id AS student_id,
# #         sp.student_code,

# #         COUNT(DISTINCT e.section_id) AS course_load,

# #         COUNT(DISTINCT ses.id) AS total_sessions,

# #         COUNT(
# #             DISTINCT CASE
# #                 WHEN ae.status IN ('present', 'late')
# #                 THEN ses.id
# #             END
# #         ) AS attended_sessions,

# #         COUNT(
# #             DISTINCT CASE
# #                 WHEN ae.status = 'late'
# #                 THEN ses.id
# #             END
# #         ) AS late_sessions,

# #         COUNT(
# #             DISTINCT CASE
# #                 WHEN ae.status = 'absent'
# #                 THEN ses.id
# #             END
# #         ) AS absent_sessions,

# #         COUNT(
# #             DISTINCT CASE
# #                 WHEN q.result != 'accepted'
# #                 THEN q.id
# #             END
# #         ) AS failed_qr_attempts,

# #         COUNT(
# #             DISTINCT CASE
# #                 WHEN cr.status IN ('approved', 'rejected')
# #                 THEN cr.id
# #             END
# #         ) AS correction_count

# #     FROM student_profiles sp

# #     LEFT JOIN enrollments e
# #         ON e.student_id = sp.id
# #         AND e.status = 'active'

# #     LEFT JOIN attendance_sessions ses
# #         ON ses.section_id = e.section_id
# #         AND ses.status = 'closed'

# #     LEFT JOIN attendance_events ae
# #         ON ae.student_id = sp.id
# #         AND ae.session_id = ses.id

# #     LEFT JOIN qr_scan_attempts q
# #         ON q.student_id = sp.id
# #         AND q.session_id = ses.id

# #     LEFT JOIN correction_requests cr
# #         ON cr.student_id = sp.id

# #     GROUP BY
# #         sp.id,
# #         sp.student_code
# #     """

# #     df = pd.read_sql(query, connection)

# #     connection.close()

# #     return df


# # def prepare_features(df):

# #     df = df.copy()

# #     df["total_sessions"] = df["total_sessions"].fillna(0)
# #     df["attended_sessions"] = df["attended_sessions"].fillna(0)
# #     df["late_sessions"] = df["late_sessions"].fillna(0)
# #     df["absent_sessions"] = df["absent_sessions"].fillna(0)
# #     df["failed_qr_attempts"] = df["failed_qr_attempts"].fillna(0)
# #     df["correction_count"] = df["correction_count"].fillna(0)
# #     df["course_load"] = df["course_load"].fillna(0)

# #     denominator = df["total_sessions"].replace(0, 1)

# #     df["attendance_rate"] = (
# #         df["attended_sessions"] / denominator
# #     )

# #     df["late_rate"] = (
# #         df["late_sessions"] / denominator
# #     )

# #     df["absence_rate"] = (
# #         df["absent_sessions"] / denominator
# #     )

# #     return df


# # def get_student_features_by_id(student_id):

# #     df = get_student_features()

# #     df = prepare_features(df)

# #     student = df[
# #         df["student_id"] == student_id
# #     ]

# #     return student
# import mysql.connector
# import pandas as pd


# DB_CONFIG = {
#     "host": "localhost",
#     "user": "root",
#     "password": "0000",
#     "database": "smart_attendance_db"  # تم إزالة المسافة الزائدة هنا
# }


# def get_connection():
#     return mysql.connector.connect(**DB_CONFIG)


# def get_student_features():
#     connection = get_connection()

#     query = """
#     SELECT
#         sp.id AS student_id,
#         sp.student_code,

#         COUNT(DISTINCT e.section_id) AS course_load,

#         COUNT(DISTINCT ses.id) AS total_sessions,

#         COUNT(
#             DISTINCT CASE
#                 WHEN ae.status IN ('present', 'late')
#                 THEN ses.id
#             END
#         ) AS attended_sessions,

#         COUNT(
#             DISTINCT CASE
#                 WHEN ae.status = 'late'
#                 THEN ses.id
#             END
#         ) AS late_sessions,

#         COUNT(
#             DISTINCT CASE
#                 WHEN ae.status = 'absent'
#                 THEN ses.id
#             END
#         ) AS absent_sessions,

#         COUNT(
#             DISTINCT CASE
#                 WHEN q.result != 'accepted'
#                 THEN q.id
#             END
#         ) AS failed_qr_attempts,

#         COUNT(
#             DISTINCT CASE
#                 WHEN cr.status IN ('approved', 'rejected')
#                 THEN cr.id
#             END
#         ) AS correction_count

#     FROM student_profiles sp

#     LEFT JOIN enrollments e
#         ON e.student_id = sp.id
#         AND e.status = 'active'

#     LEFT JOIN attendance_sessions ses
#         ON ses.section_id = e.section_id
#         AND ses.status = 'closed'

#     LEFT JOIN attendance_events ae
#         ON ae.student_id = sp.id
#         AND ae.session_id = ses.id

#     LEFT JOIN qr_scan_attempts q
#         ON q.student_id = sp.id
#         AND q.session_id = ses.id

#     LEFT JOIN correction_requests cr
#         ON cr.student_id = sp.id

#     GROUP BY
#         sp.id,
#         sp.student_code
#     """

#     df = pd.read_sql(query, connection)
#     connection.close()

#     # تجهيز وتعديل البيانات وحساب النسب تلقائياً
#     df = prepare_features(df)
#     return df


# def prepare_features(df):
#     df = df.copy()

#     df["total_sessions"] = df["total_sessions"].fillna(0)
#     df["attended_sessions"] = df["attended_sessions"].fillna(0)
#     df["late_sessions"] = df["late_sessions"].fillna(0)
#     df["absent_sessions"] = df["absent_sessions"].fillna(0)
#     df["failed_qr_attempts"] = df["failed_qr_attempts"].fillna(0)
#     df["correction_count"] = df["correction_count"].fillna(0)
#     df["course_load"] = df["course_load"].fillna(0)

#     denominator = df["total_sessions"].replace(0, 1)

#     df["attendance_rate"] = df["attended_sessions"] / denominator
#     df["late_rate"] = df["late_sessions"] / denominator
#     df["absence_rate"] = df["absent_sessions"] / denominator

#     return df


# def get_student_features_by_id(student_id):
#     # الدالة العامة أصبحت تجهز البيانات مسبقاً
#     df = get_student_features()

#     student = df[df["student_id"] == student_id]
    
#     # إرجاع الصف كقاموس أو DataFrame فارغ إذا لم يُوجد الطالب
#     if student.empty:
#         return None
    
#     return student.to_dict(orient="records")[0]
import mysql.connector
import pandas as pd

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0000",
    "database": "smart_attendance_db"
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def get_student_features():
    """
    Returns a DataFrame with one row per student, including raw counts
    and computed rates. Note: this issues one DB connection per student
    via get_student_features_by_id — fine for small classes, but if you
    have hundreds/thousands of students, consider replacing this with a
    single batched SQL query (see the commented-out JOIN version in git
    history for a template) to avoid N+1 round trips.
    """
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id AS student_id, student_code FROM student_profiles")
    students = cursor.fetchall()
    cursor.close()
    connection.close()

    if not students:
        return pd.DataFrame()

    all_features = []
    for s in students:
        sid = s["student_id"]
        features = get_student_features_by_id(sid)
        if features:
            all_features.append(features)

    return pd.DataFrame(all_features)


def prepare_features(df):
    """
    Idempotent safety net for DataFrames that haven't already had rates
    computed (get_student_features_by_id computes them per-row already,
    so this is mainly useful if you build a DataFrame some other way).
    """
    df = df.copy()

    for col in [
        "total_sessions", "attended_sessions", "late_sessions",
        "absent_sessions", "failed_qr_attempts", "correction_count",
        "course_load",
    ]:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    if "total_sessions" in df.columns:
        denominator = df["total_sessions"].replace(0, 1)
        df["attendance_rate"] = df["attended_sessions"] / denominator
        df["late_rate"] = df["late_sessions"] / denominator
        df["absence_rate"] = df["absent_sessions"] / denominator

    return df


def get_student_features_by_id(student_id):
    connection = get_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        # 1. Basic student info
        cursor.execute(
            "SELECT id AS student_id, student_code FROM student_profiles WHERE id = %s",
            (student_id,),
        )
        student = cursor.fetchone()

        if not student:
            return None

        # 2. Active course load
        cursor.execute(
            "SELECT COUNT(DISTINCT section_id) AS course_load "
            "FROM enrollments WHERE student_id = %s AND status = 'active'",
            (student_id,),
        )
        res = cursor.fetchone()
        student["course_load"] = res["course_load"] if res and res["course_load"] else 0

        # --- DIAGNOSTIC (temporary): confirm which section(s) this student
        # is actively enrolled in, before we try to join sessions to them.
        cursor.execute(
            "SELECT section_id, status FROM enrollments WHERE student_id = %s",
            (student_id,),
        )
        enrollment_rows = cursor.fetchall()
        print(f"[DEBUG] student_id={student_id} enrollments={enrollment_rows}")

        if enrollment_rows:
            active_section_ids = [
                r["section_id"] for r in enrollment_rows if r["status"] == "active"
            ]
            if active_section_ids:
                fmt_ids = ",".join(str(i) for i in active_section_ids)
                cursor.execute(
                    f"SELECT id, section_id, status FROM attendance_sessions "
                    f"WHERE section_id IN ({fmt_ids})"
                )
                session_rows = cursor.fetchall()
                print(f"[DEBUG] student_id={student_id} sessions_in_section={session_rows}")
        # --- END DIAGNOSTIC ---

        # 3. Attendance/late/absence session counts across all enrolled sections
        query_sessions = """
            SELECT
                COUNT(DISTINCT ses.id) AS total_sessions,
                COUNT(DISTINCT CASE WHEN ae.status IN ('present', 'late') THEN ses.id END) AS attended_sessions,
                COUNT(DISTINCT CASE WHEN ae.status = 'late' THEN ses.id END) AS late_sessions,
                COUNT(DISTINCT CASE WHEN ae.status = 'absent' THEN ses.id END) AS absent_sessions
            FROM enrollments e
            JOIN attendance_sessions ses ON ses.section_id = e.section_id
            LEFT JOIN attendance_events ae ON ae.session_id = ses.id AND ae.student_id = e.student_id
            WHERE e.student_id = %s AND e.status = 'active'
        """
        cursor.execute(query_sessions, (student_id,))
        session_stats = cursor.fetchone() or {}
        print(f"[DEBUG] student_id={student_id} session_stats={session_stats}")

        student["total_sessions"] = session_stats.get("total_sessions") or 0
        student["attended_sessions"] = session_stats.get("attended_sessions") or 0
        student["late_sessions"] = session_stats.get("late_sessions") or 0
        student["absent_sessions"] = session_stats.get("absent_sessions") or 0

        # 4. Failed QR scan attempts
        cursor.execute(
            "SELECT COUNT(*) AS failed_qr_attempts FROM qr_scan_attempts "
            "WHERE student_id = %s AND result != 'accepted'",
            (student_id,),
        )
        qr_res = cursor.fetchone()
        student["failed_qr_attempts"] = qr_res["failed_qr_attempts"] if qr_res and qr_res["failed_qr_attempts"] else 0

        # 5. Correction requests
        cursor.execute(
            "SELECT COUNT(*) AS correction_count FROM correction_requests "
            "WHERE student_id = %s AND status IN ('approved', 'rejected')",
            (student_id,),
        )
        cr_res = cursor.fetchone()
        student["correction_count"] = cr_res["correction_count"] if cr_res and cr_res["correction_count"] else 0

    except Exception as e:
        print(f"Database Error: {e}")
        return None

    finally:
        cursor.close()
        connection.close()

    # Rates, guarding against division by zero
    total = student["total_sessions"]
    denominator = total if total > 0 else 1

    student["attendance_rate"] = student["attended_sessions"] / denominator
    student["late_rate"] = student["late_sessions"] / denominator
    student["absence_rate"] = student["absent_sessions"] / denominator

    return student
