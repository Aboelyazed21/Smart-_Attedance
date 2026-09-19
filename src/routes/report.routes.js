const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const {
    requirePermission
} = require("../middleware/permission.middleware");

const {
    getAttendanceReport,
    getStudentSummary,
    getCourseSummary,
    exportAttendanceCSV
} = require("../controllers/report.controller");


// ============================================================
// ATTENDANCE REPORT
// ============================================================

router.get(
    "/attendance",
    authMiddleware,
    requirePermission("report.view"),
    getAttendanceReport
);


// ============================================================
// STUDENT SUMMARY
// ============================================================

router.get(
    "/students",
    authMiddleware,
    requirePermission("report.view"),
    getStudentSummary
);


// ============================================================
// COURSE SUMMARY
// ============================================================

router.get(
    "/courses",
    authMiddleware,
    requirePermission("report.view"),
    getCourseSummary
);


// ============================================================
// CSV EXPORT
// ============================================================

router.get(
    "/attendance/export",
    authMiddleware,
    requirePermission("report.export"),
    exportAttendanceCSV
);


module.exports = router;