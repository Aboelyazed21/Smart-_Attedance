const db = require("../config/db");


// ============================================================
// GET ATTENDANCE REPORT
// ============================================================

const getAttendanceReport = (req, res) => {

    const {
        courseId,
        sectionId,
        studentId,
        lecturerId,
        startDate,
        endDate,
        status
    } = req.query;


    const conditions = [];
    const values = [];


    // ========================================================
    // FILTERS
    // ========================================================

    if (courseId) {

        conditions.push(
            "c.id = ?"
        );

        values.push(courseId);

    }


    if (sectionId) {

        conditions.push(
            "s.id = ?"
        );

        values.push(sectionId);

    }


    if (studentId) {

        conditions.push(
            "sp.id = ?"
        );

        values.push(studentId);

    }


    if (lecturerId) {

        conditions.push(
            "s.lecturer_id = ?"
        );

        values.push(lecturerId);

    }


    if (startDate) {

        conditions.push(
            "ses.session_date >= ?"
        );

        values.push(startDate);

    }


    if (endDate) {

        conditions.push(
            "ses.session_date <= ?"
        );

        values.push(endDate);

    }


    if (status) {

        conditions.push(
            "ae.status = ?"
        );

        values.push(status);

    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    // ========================================================
    // REPORT QUERY
    // ========================================================

    const sql = `
        SELECT

            ae.id AS attendance_id,

            ae.status AS attendance_status,

            ae.source,

            ae.validation_status,

            ae.scanned_at,

            ae.qr_version,

            ae.notes,

            ses.id AS session_id,

            ses.session_date,

            ses.scheduled_start,

            ses.scheduled_end,

            ses.actual_start,

            ses.actual_end,

            ses.status AS session_status,

            c.id AS course_id,

            c.course_code,

            c.course_name,

            s.id AS section_id,

            s.section_name,

            s.academic_year,

            s.semester,

            s.lecturer_id,

            CONCAT(
                lecturer.first_name,
                ' ',
                lecturer.last_name
            ) AS lecturer_name,

            sp.id AS student_id,

            sp.student_code,

            sp.university_id,

            CONCAT(
                student.first_name,
                ' ',
                student.last_name
            ) AS student_name,

            sp.department,

            sp.level,

            r.id AS room_id,

            r.building,

            r.room_name

        FROM attendance_events ae

        INNER JOIN attendance_sessions ses
            ON ses.id = ae.session_id

        INNER JOIN sections s
            ON s.id = ses.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        INNER JOIN student_profiles sp
            ON sp.id = ae.student_id

        INNER JOIN users student
            ON student.id = sp.user_id

        LEFT JOIN users lecturer
            ON lecturer.id = s.lecturer_id

        LEFT JOIN rooms r
            ON r.id = ses.room_id

        ${whereClause}

        ORDER BY
            ses.session_date DESC,
            ses.scheduled_start DESC,
            student.student_code ASC
    `;


    db.query(
        sql,
        values,
        (err, results) => {

            if (err) {

                console.error(
                    "Attendance report error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not generate attendance report",
                    error:
                        err.message
                });

            }


            // =================================================
            // CALCULATE SUMMARY
            // =================================================

            const summary = {

                totalRecords:
                    results.length,

                present:
                    results.filter(
                        row =>
                            row.attendance_status ===
                            "present"
                    ).length,

                late:
                    results.filter(
                        row =>
                            row.attendance_status ===
                            "late"
                    ).length,

                absent:
                    results.filter(
                        row =>
                            row.attendance_status ===
                            "absent"
                    ).length,

                excused:
                    results.filter(
                        row =>
                            row.attendance_status ===
                            "excused"
                    ).length

            };


            const validAttendance =
                summary.present +
                summary.late +
                summary.absent +
                summary.excused;


            summary.attendancePercentage =
                validAttendance > 0
                    ? Number(
                        (
                            (
                                summary.present +
                                summary.late
                            ) /
                            validAttendance
                        ) * 100
                    ).toFixed(2)
                    : 0;


            return res.json({

                success: true,

                filters: {
                    courseId:
                        courseId || null,

                    sectionId:
                        sectionId || null,

                    studentId:
                        studentId || null,

                    lecturerId:
                        lecturerId || null,

                    startDate:
                        startDate || null,

                    endDate:
                        endDate || null,

                    status:
                        status || null
                },

                summary,

                count:
                    results.length,

                records:
                    results

            });

        }
    );
};


// ============================================================
// GET STUDENT ATTENDANCE SUMMARY
// ============================================================

const getStudentSummary = (req, res) => {

    const {
        studentId
    } = req.query;


    const conditions = [];
    const values = [];


    if (studentId) {

        conditions.push(
            "student_id = ?"
        );

        values.push(studentId);

    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    const sql = `
        SELECT
            student_id,
            student_code,
            student_name,
            total_attendance,
            present_count,
            late_count,
            absent_count,
            excused_count
        FROM attendance_summary
        ${whereClause}
        ORDER BY student_code
    `;


    db.query(
        sql,
        values,
        (err, results) => {

            if (err) {

                console.error(
                    "Student summary error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load student attendance summary"
                });

            }


            const summary =
                results.map(student => {

                    const total =
                        Number(
                            student.total_attendance
                        ) || 0;

                    const attended =
                        (
                            Number(
                                student.present_count
                            ) || 0
                        ) +
                        (
                            Number(
                                student.late_count
                            ) || 0
                        );


                    return {

                        ...student,

                        attendance_percentage:
                            total > 0
                                ? Number(
                                    (
                                        attended /
                                        total
                                    ) * 100
                                ).toFixed(2)
                                : "0.00"

                    };

                });


            return res.json({

                success: true,

                count:
                    summary.length,

                students:
                    summary

            });

        }
    );
};


// ============================================================
// GET COURSE / SECTION SUMMARY
// ============================================================

const getCourseSummary = (req, res) => {

    const {
        courseId,
        sectionId
    } = req.query;


    const conditions = [];
    const values = [];


    if (courseId) {

        conditions.push(
            "course_id = ?"
        );

        values.push(courseId);

    }


    if (sectionId) {

        conditions.push(
            "section_id = ?"
        );

        values.push(sectionId);

    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    const sql = `
        SELECT

            course_id,
            course_code,
            course_name,

            section_id,
            section_name,

            enrolled_students,
            total_sessions,

            present_records,
            late_records,
            absent_records

        FROM course_attendance_summary

        ${whereClause}

        ORDER BY
            course_code,
            section_name
    `;


    db.query(
        sql,
        values,
        (err, results) => {

            if (err) {

                console.error(
                    "Course summary error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not load course attendance summary"
                });

            }


            const summary =
                results.map(row => {

                    const totalRecords =
                        (
                            Number(
                                row.present_records
                            ) || 0
                        ) +
                        (
                            Number(
                                row.late_records
                            ) || 0
                        ) +
                        (
                            Number(
                                row.absent_records
                            ) || 0
                        );


                    const attended =
                        (
                            Number(
                                row.present_records
                            ) || 0
                        ) +
                        (
                            Number(
                                row.late_records
                            ) || 0
                        );


                    return {

                        ...row,

                        total_records:
                            totalRecords,

                        attendance_percentage:
                            totalRecords > 0
                                ? Number(
                                    (
                                        attended /
                                        totalRecords
                                    ) * 100
                                ).toFixed(2)
                                : "0.00"

                    };

                });


            return res.json({

                success: true,

                count:
                    summary.length,

                courses:
                    summary

            });

        }
    );
};


// ============================================================
// CSV HELPERS
// ============================================================

const escapeCsvValue = (value) => {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    const stringValue =
        String(value);


    return `"${stringValue.replace(
        /"/g,
        '""'
    )}"`;

};


// ============================================================
// EXPORT ATTENDANCE REPORT CSV
// ============================================================

const exportAttendanceCSV = (req, res) => {

    const {
        courseId,
        sectionId,
        studentId,
        lecturerId,
        startDate,
        endDate,
        status
    } = req.query;


    const conditions = [];
    const values = [];


    if (courseId) {

        conditions.push(
            "c.id = ?"
        );

        values.push(courseId);

    }


    if (sectionId) {

        conditions.push(
            "s.id = ?"
        );

        values.push(sectionId);

    }


    if (studentId) {

        conditions.push(
            "sp.id = ?"
        );

        values.push(studentId);

    }


    if (lecturerId) {

        conditions.push(
            "s.lecturer_id = ?"
        );

        values.push(lecturerId);

    }


    if (startDate) {

        conditions.push(
            "ses.session_date >= ?"
        );

        values.push(startDate);

    }


    if (endDate) {

        conditions.push(
            "ses.session_date <= ?"
        );

        values.push(endDate);

    }


    if (status) {

        conditions.push(
            "ae.status = ?"
        );

        values.push(status);

    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    const sql = `
        SELECT

            ae.id AS attendance_id,

            sp.student_code,

            CONCAT(
                student.first_name,
                ' ',
                student.last_name
            ) AS student_name,

            c.course_code,

            c.course_name,

            s.section_name,

            ses.session_date,

            ses.scheduled_start,

            ses.scheduled_end,

            ae.status AS attendance_status,

            ae.source,

            ae.validation_status,

            ae.scanned_at,

            ae.qr_version,

            CONCAT(
                lecturer.first_name,
                ' ',
                lecturer.last_name
            ) AS lecturer_name,

            r.building,

            r.room_name,

            ae.notes

        FROM attendance_events ae

        INNER JOIN attendance_sessions ses
            ON ses.id = ae.session_id

        INNER JOIN sections s
            ON s.id = ses.section_id

        INNER JOIN courses c
            ON c.id = s.course_id

        INNER JOIN student_profiles sp
            ON sp.id = ae.student_id

        INNER JOIN users student
            ON student.id = sp.user_id

        LEFT JOIN users lecturer
            ON lecturer.id = s.lecturer_id

        LEFT JOIN rooms r
            ON r.id = ses.room_id

        ${whereClause}

        ORDER BY
            ses.session_date DESC,
            sp.student_code ASC
    `;


    db.query(
        sql,
        values,
        (err, results) => {

            if (err) {

                console.error(
                    "CSV export error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Could not export attendance report"
                });

            }


            const headers = [
                "Attendance ID",
                "Student Code",
                "Student Name",
                "Course Code",
                "Course Name",
                "Section",
                "Session Date",
                "Scheduled Start",
                "Scheduled End",
                "Attendance Status",
                "Source",
                "Validation Status",
                "Scanned At",
                "QR Version",
                "Lecturer",
                "Building",
                "Room",
                "Notes"
            ];


            const csvRows = [];


            csvRows.push(
                headers
                    .map(escapeCsvValue)
                    .join(",")
            );


            results.forEach(row => {

                const values = [

                    row.attendance_id,

                    row.student_code,

                    row.student_name,

                    row.course_code,

                    row.course_name,

                    row.section_name,

                    row.session_date,

                    row.scheduled_start,

                    row.scheduled_end,

                    row.attendance_status,

                    row.source,

                    row.validation_status,

                    row.scanned_at,

                    row.qr_version,

                    row.lecturer_name,

                    row.building,

                    row.room_name,

                    row.notes

                ];


                csvRows.push(
                    values
                        .map(escapeCsvValue)
                        .join(",")
                );

            });


            const csv =
                "\uFEFF" +
                csvRows.join("\r\n");


            const filename =
                `attendance-report-${Date.now()}.csv`;


            res.setHeader(
                "Content-Type",
                "text/csv; charset=utf-8"
            );


            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );


            return res.send(csv);

        }
    );
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getAttendanceReport,

    getStudentSummary,

    getCourseSummary,

    exportAttendanceCSV

};