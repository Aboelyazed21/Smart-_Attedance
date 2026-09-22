"""
Generates rows for `attendance_sessions` from the existing `timetable_slots`
table. Run this BEFORE run_insert.py — run_insert.py populates
attendance_events by joining against attendance_sessions, so if this table
is empty, attendance_events ends up empty too (which is exactly the bug
you were chasing: total_sessions always came back 0).

For each timetable_slot, this creates `SESSIONS_PER_SECTION` weekly
sessions on that slot's day_of_week, starting from the slot's start_date,
all marked as 'closed' (so they're treated as completed classes that
already have attendance recorded against them).
"""

import hashlib
from datetime import timedelta

import mysql.connector

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0000",
    "database": "smart_attendance_db",
}

SESSIONS_PER_SECTION = 10  # how many past class sessions to generate per section

DAY_NAME_TO_WEEKDAY = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def next_occurrence(start_date, target_weekday):
    """First date on/after start_date that falls on target_weekday (0=Mon..6=Sun)."""
    days_ahead = (target_weekday - start_date.weekday()) % 7
    return start_date + timedelta(days=days_ahead)


def main():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT COUNT(*) AS c FROM attendance_sessions"
    )
    existing = cursor.fetchone()["c"]
    if existing > 0:
        print(
            f"attendance_sessions already has {existing} rows — "
            "skipping to avoid duplicates. Truncate the table first if you "
            "want to regenerate."
        )
        cursor.close()
        conn.close()
        return

    cursor.execute(
        "SELECT id, section_id, room_id, day_of_week, start_time, end_time, start_date "
        "FROM timetable_slots"
    )
    slots = cursor.fetchall()

    if not slots:
        print("No rows in timetable_slots — nothing to generate sessions from.")
        cursor.close()
        conn.close()
        return

    # pick any staff user as the session opener (first lecturer found for the section's course)
    cursor.execute(
        "SELECT s.id AS section_id, sec_lect.lecturer_id "
        "FROM sections s "
        "JOIN sections sec_lect ON sec_lect.id = s.id"
    )
    lecturer_by_section = {
        row["section_id"]: row["lecturer_id"] for row in cursor.fetchall()
    }

    insert_sql = """
        INSERT INTO attendance_sessions
        (section_id, room_id, opened_by, session_date, scheduled_start, scheduled_end,
         actual_start, actual_end, status, qr_secret_hash, qr_version,
         qr_expires_at, qr_rotation_seconds, allow_late_minutes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'closed', %s, 1, %s, 10, 15)
    """

    rows_to_insert = []

    for slot in slots:
        weekday = DAY_NAME_TO_WEEKDAY[slot["day_of_week"]]
        first_date = next_occurrence(slot["start_date"], weekday)

        for i in range(SESSIONS_PER_SECTION):
            session_date = first_date + timedelta(weeks=i)

            scheduled_start = slot["start_time"]
            scheduled_end = slot["end_time"]

            actual_start = f"{session_date} {scheduled_start}"
            actual_end = f"{session_date} {scheduled_end}"

            qr_secret_hash = hashlib.sha256(
                f"qr-secret-{slot['section_id']}-{i}".encode()
            ).hexdigest()

            qr_expires_at = actual_end
            opened_by = lecturer_by_section.get(slot["section_id"])

            rows_to_insert.append((
                slot["section_id"],
                slot["room_id"],
                opened_by,
                session_date,
                scheduled_start,
                scheduled_end,
                actual_start,
                actual_end,
                qr_secret_hash,
                qr_expires_at,
            ))

    cursor.executemany(insert_sql, rows_to_insert)
    conn.commit()

    print(f"Inserted {cursor.rowcount} rows into attendance_sessions.")
    print("Now run run_insert.py to populate attendance_events from these sessions.")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
