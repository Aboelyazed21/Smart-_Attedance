def calculate_attendance_percentage(
    attended, total):

    if total == 0:
        return 0

    return round(
        (attended / total) * 100,2 )


def calculate_late_percentage(
    late, total ):

    if total == 0:
        return 0

    return round(
        (late / total) * 100, 2 )


def calculate_absence_percentage(absent,total):

    if total == 0:
        return 0

    return round(
        (absent / total) * 100, 2 )


def generate_attendance_analytics(data):
    total = data.get( "total_sessions", 0 )
    attended = data.get("attended_sessions", 0)

    late = data.get(
        "late_sessions",0 )

    absent = data.get(
        "absent_sessions", 0)

    return {
        "attendance_rate":
            calculate_attendance_percentage(
                attended,  total),

        "late_rate":
            calculate_late_percentage(
                late, total),

        "absence_rate":
            calculate_absence_percentage(
                absent, total ),

        "total_sessions":
          total,

        "attended_sessions":
            attended,

        "late_sessions":
            late,

        "absent_sessions":
            absent
    }