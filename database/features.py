# import mysql.connector
# import pandas as pd


# DB_CONFIG = {
#     "host": "localhost",
#     "user": "root",
#     "password": "0000",
#     "database": " smart_attendance_db"
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

#     df["attendance_rate"] = (
#         df["attended_sessions"] / denominator
#     )

#     df["late_rate"] = (
#         df["late_sessions"] / denominator
#     )

#     df["absence_rate"] = (
#         df["absent_sessions"] / denominator
#     )

#     return df


# def get_student_features_by_id(student_id):

#     df = get_student_features()

#     df = prepare_features(df)

#     student = df[
#         df["student_id"] == student_id
#     ]

#     return student
import mysql.connector
import pandas as pd


DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0000",
    "database": "smart_attendance_db"  # تم إزالة المسافة الزائدة هنا
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def get_student_features():
    connection = get_connection()

    query = """
    SELECT
        sp.id AS student_id,
        sp.student_code,

        COUNT(DISTINCT e.section_id) AS course_load,

        COUNT(DISTINCT ses.id) AS total_sessions,

        COUNT(
            DISTINCT CASE
                WHEN ae.status IN ('present', 'late')
                THEN ses.id
            END
        ) AS attended_sessions,

        COUNT(
            DISTINCT CASE
                WHEN ae.status = 'late'
                THEN ses.id
            END
        ) AS late_sessions,

        COUNT(
            DISTINCT CASE
                WHEN ae.status = 'absent'
                THEN ses.id
            END
        ) AS absent_sessions,

        COUNT(
            DISTINCT CASE
                WHEN q.result != 'accepted'
                THEN q.id
            END
        ) AS failed_qr_attempts,

        COUNT(
            DISTINCT CASE
                WHEN cr.status IN ('approved', 'rejected')
                THEN cr.id
            END
        ) AS correction_count

    FROM student_profiles sp

    LEFT JOIN enrollments e
        ON e.student_id = sp.id
        AND e.status = 'active'

    LEFT JOIN attendance_sessions ses
        ON ses.section_id = e.section_id
        AND ses.status = 'closed'

    LEFT JOIN attendance_events ae
        ON ae.student_id = sp.id
        AND ae.session_id = ses.id

    LEFT JOIN qr_scan_attempts q
        ON q.student_id = sp.id
        AND q.session_id = ses.id

    LEFT JOIN correction_requests cr
        ON cr.student_id = sp.id

    GROUP BY
        sp.id,
        sp.student_code
    """

    df = pd.read_sql(query, connection)
    connection.close()

    # تجهيز وتعديل البيانات وحساب النسب تلقائياً
    df = prepare_features(df)
    return df


def prepare_features(df):
    df = df.copy()

    df["total_sessions"] = df["total_sessions"].fillna(0)
    df["attended_sessions"] = df["attended_sessions"].fillna(0)
    df["late_sessions"] = df["late_sessions"].fillna(0)
    df["absent_sessions"] = df["absent_sessions"].fillna(0)
    df["failed_qr_attempts"] = df["failed_qr_attempts"].fillna(0)
    df["correction_count"] = df["correction_count"].fillna(0)
    df["course_load"] = df["course_load"].fillna(0)

    denominator = df["total_sessions"].replace(0, 1)

    df["attendance_rate"] = df["attended_sessions"] / denominator
    df["late_rate"] = df["late_sessions"] / denominator
    df["absence_rate"] = df["absent_sessions"] / denominator

    return df


def get_student_features_by_id(student_id):
    # الدالة العامة أصبحت تجهز البيانات مسبقاً
    df = get_student_features()

    student = df[df["student_id"] == student_id]
    
    # إرجاع الصف كقاموس أو DataFrame فارغ إذا لم يُوجد الطالب
    if student.empty:
        return None
    
    return student.to_dict(orient="records")[0]