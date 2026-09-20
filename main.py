# from fastapi import FastAPI
# from fastapi import HTTPException

# from database.features import get_student_features
# from database.features import prepare_features
# from database.features import get_student_features_by_id

# from models.attendance_risk.predict import predict_risk

# from models.anomaly.predict import detect_anomaly

# from rules.red_flags import generate_flags

# from analytics.attendance import generate_attendance_analytics

# from explanation.explain import build_explanation


# app = FastAPI(
#     title="Smart Attendance AI",
#     version="1.0.0"
# )


# @app.get("/")
# def home():

#     return {
#         "service": "Smart Attendance AI",
#         "version": "1.0.0",
#         "status": "running"
#     }


# @app.get("/health")
# def health():

#     return {
#         "status": "healthy"
#     }


# @app.get("/ai/students")
# def analyze_all_students():

#     df = get_student_features()

#     df = prepare_features(df)

#     results = []

#     for _, row in df.iterrows():

#         data = {

#             "attendance_rate":
#                 float(row["attendance_rate"]),

#             "late_rate":
#                 float(row["late_rate"]),

#             "absence_rate":
#                 float(row["absence_rate"]),

#             "course_load":
#                 int(row["course_load"]),

#             "failed_qr_attempts":
#                 int(row["failed_qr_attempts"]),

#             "correction_count":
#                 int(row["correction_count"])
#         }

#         risk = predict_risk(data)

#         anomaly = detect_anomaly(data)

#         flags = generate_flags(data)

#         if anomaly["is_anomaly"]:

#             flags.append({
#                 "type": "AI_ANOMALY",
#                 "severity": "high",
#                 "reason":
#                     "Unusual attendance behavior detected",
#                 "score":
#                     anomaly["anomaly_score"]
#             })

#         analytics = generate_attendance_analytics({

#             "total_sessions":
#                 int(row["total_sessions"]),

#             "attended_sessions":
#                 int(row["attended_sessions"]),

#             "late_sessions":
#                 int(row["late_sessions"]),

#             "absent_sessions":
#                 int(row["absent_sessions"])
#         })

#         explanation = build_explanation(
#             data,
#             risk,
#             anomaly
#         )

#         results.append({

#             "student_id":
#                 int(row["student_id"]),

#             "student_code":
#                 row["student_code"],

#             "risk":
#                 risk,

#             "anomaly":
#                 anomaly,

#             "analytics":
#                 analytics,

#             "flags":
#                 flags,

#             "explanation":
#                 explanation
#         })

#     return {
#         "count": len(results),
#         "students": results
#     }


# @app.get("/ai/student/{student_id}")
# def analyze_student(student_id: int):

#     student = get_student_features_by_id(
#         student_id
#     )

#     if student.empty:

#         raise HTTPException(
#             status_code=404,
#             detail="Student not found"
#         )

#     row = student.iloc[0]

#     data = {

#         "attendance_rate":
#             float(row["attendance_rate"]),

#         "late_rate":
#             float(row["late_rate"]),

#         "absence_rate":
#             float(row["absence_rate"]),

#         "course_load":
#             int(row["course_load"]),

#         "failed_qr_attempts":
#             int(row["failed_qr_attempts"]),

#         "correction_count":
#             int(row["correction_count"])
#     }

#     risk = predict_risk(data)

#     anomaly = detect_anomaly(data)

#     flags = generate_flags(data)

#     if anomaly["is_anomaly"]:

#         flags.append({

#             "type": "AI_ANOMALY",

#             "severity": "high",

#             "reason":
#                 "Unusual attendance behavior detected",

#             "score":
#                 anomaly["anomaly_score"]
#         })

#     analytics = generate_attendance_analytics({

#         "total_sessions":
#             int(row["total_sessions"]),

#         "attended_sessions":
#             int(row["attended_sessions"]),

#         "late_sessions":
#             int(row["late_sessions"]),

#         "absent_sessions":
#             int(row["absent_sessions"])
#     })

#     explanation = build_explanation(
#         data,
#         risk,
#         anomaly
#     )

#     return {

#         "student_id":
#             student_id,

#         "student_code":
#             row["student_code"],

#         "risk":
#             risk,

#         "anomaly":
#             anomaly,

#         "analytics":
#             analytics,

#         "flags":
#             flags,

#         "explanation":
#             explanation
#     }
from fastapi import FastAPI, HTTPException

from database.features import get_student_features
from database.features import prepare_features
from database.features import get_student_features_by_id

from models.attendance_risk.predict import predict_risk
from models.anomaly.predict import detect_anomaly
from rules.red_flags import generate_flags
from analytics.attendance import generate_attendance_analytics
from explanation.explain import build_explanation


app = FastAPI(
    title="Smart Attendance AI",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "service": "Smart Attendance AI",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/ai/students")
def analyze_all_students():
    df = get_student_features()
    df = prepare_features(df)

    results = []

    for _, row in df.iterrows():
        data = {
            "attendance_rate": float(row["attendance_rate"]),
            "late_rate": float(row["late_rate"]),
            "absence_rate": float(row["absence_rate"]),
            "course_load": int(row["course_load"]),
            "failed_qr_attempts": int(row["failed_qr_attempts"]),
            "correction_count": int(row["correction_count"])
        }

        risk = predict_risk(data)
        anomaly = detect_anomaly(data)
        flags = generate_flags(data)

        if anomaly["is_anomaly"]:
            flags.append({
                "type": "AI_ANOMALY",
                "severity": "high",
                "reason": "Unusual attendance behavior detected",
                "score": anomaly["anomaly_score"]
            })

        analytics = generate_attendance_analytics({
            "total_sessions": int(row["total_sessions"]),
            "attended_sessions": int(row["attended_sessions"]),
            "late_sessions": int(row["late_sessions"]),
            "absent_sessions": int(row["absent_sessions"])
        })

        explanation = build_explanation(data, risk, anomaly)

        results.append({
            "student_id": int(row["student_id"]),
            "student_code": row["student_code"],
            "risk": risk,
            "anomaly": anomaly,
            "analytics": analytics,
            "flags": flags,
            "explanation": explanation
        })

    return {
        "count": len(results),
        "students": results
    }


@app.get("/ai/student/{student_id}")
def analyze_student(student_id: int):
    # الدالة تُرجع Dictionary مباشرة
    row = get_student_features_by_id(student_id)

    # التحقق مما إذا كان الطالب غير موجود
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    data = {
        "attendance_rate": float(row["attendance_rate"]),
        "late_rate": float(row["late_rate"]),
        "absence_rate": float(row["absence_rate"]),
        "course_load": int(row["course_load"]),
        "failed_qr_attempts": int(row["failed_qr_attempts"]),
        "correction_count": int(row["correction_count"])
    }

    risk = predict_risk(data)
    anomaly = detect_anomaly(data)
    flags = generate_flags(data)

    if anomaly["is_anomaly"]:
        flags.append({
            "type": "AI_ANOMALY",
            "severity": "high",
            "reason": "Unusual attendance behavior detected",
            "score": anomaly["anomaly_score"]
        })

    analytics = generate_attendance_analytics({
        "total_sessions": int(row["total_sessions"]),
        "attended_sessions": int(row["attended_sessions"]),
        "late_sessions": int(row["late_sessions"]),
        "absent_sessions": int(row["absent_sessions"])
    })

    explanation = build_explanation(data, risk, anomaly)

    return {
        "student_id": student_id,
        "student_code": row["student_code"],
        "risk": risk,
        "anomaly": anomaly,
        "analytics": analytics,
        "flags": flags,
        "explanation": explanation
    }