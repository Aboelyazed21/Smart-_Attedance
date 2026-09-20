const express = require("express");

const router = express.Router();


// ==========================================
// Middleware
// ==========================================

const authMiddleware =
    require("../middleware/auth.middleware");

const {
    requirePermission
} = require("../middleware/permission.middleware");

const {
    requireStudentForScan
} = require("../middleware/attendanceScan.middleware");

const {
    qrScanRateLimit
} = require("../middleware/qrRateLimit.middleware");


// ==========================================
// Controller
// ==========================================

const {
    scanAttendance
} = require("../controllers/attendance.controller");


// ==========================================
// STUDENT QR SCAN
// POST /api/attendance/scan
// ==========================================

router.post(
    "/scan",

    authMiddleware,

    requireStudentForScan,

    qrScanRateLimit,

    scanAttendance
);


// ==========================================
// Export
// ==========================================

module.exports = router;