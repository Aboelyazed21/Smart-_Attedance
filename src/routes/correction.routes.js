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


// ==========================================
// Controller
// ==========================================

const {
    updateAttendance
} = require("../controllers/correction.controller");


// ==========================================
// MANUAL ATTENDANCE CORRECTION
// PATCH /api/corrections/:eventId
// ==========================================

router.patch(
    "/:eventId",
    authMiddleware,
    requirePermission("attendance.update"),
    updateAttendance
);


// ==========================================
// Export
// ==========================================

module.exports = router;