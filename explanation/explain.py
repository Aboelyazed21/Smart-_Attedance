def explain_risk(data):

    reasons = []

    attendance_rate = data.get(
        "attendance_rate",
        0
    )

    late_rate = data.get(
        "late_rate",
        0
    )

    absence_rate = data.get(
        "absence_rate",
        0
    )

    failed_qr_attempts = data.get(
        "failed_qr_attempts",
        0
    )

    correction_count = data.get(
        "correction_count",
        0
    )

    if attendance_rate < 0.70:

        reasons.append(
            "Attendance rate is below 70%"
        )

    if late_rate >= 0.20:

        reasons.append(
            "Recent late attendance is high"
        )

    if absence_rate >= 0.30:

        reasons.append(
            "Absence rate is high"
        )

    if failed_qr_attempts >= 5:

        reasons.append(
            "Multiple failed QR attempts were detected"
        )

    if correction_count >= 3:

        reasons.append(
            "There are multiple correction requests"
        )

    if not reasons:

        reasons.append(
            "No major attendance risk indicators detected"
        )

    return reasons


def explain_anomaly(is_anomaly):

    if is_anomaly:

        return (
            "The student's attendance behavior "
            "is unusual compared with the learned "
            "attendance patterns."
        )

    return (
        "No unusual attendance behavior was detected."
    )


def build_explanation(
    data,
    risk,
    anomaly
):

    return {

        "risk_level":
            risk["risk_level"],

        "risk_probability":
            risk["probability"],

        "risk_reasons":
            explain_risk(data),

        "anomaly_detected":
            anomaly["is_anomaly"],

        "anomaly_explanation":
            explain_anomaly(
                anomaly["is_anomaly"]
            )
    }