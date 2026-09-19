const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/auth.middleware");

const {
    requirePermission,
    requireRole
} = require("../middleware/permission.middleware");

const {
    getFlags,
    generateLowAttendanceFlags,
    resolveFlag
} = require("../controllers/attendanceFlag.controller");


// ============================================================
// GET FLAGS
// ============================================================

router.get(
    "/",
    authMiddleware,
    requirePermission("report.view"),
    getFlags
);


// ============================================================
// GENERATE LOW ATTENDANCE FLAGS
// ============================================================

router.post(
    "/generate",
    authMiddleware,
    requirePermission("report.view"),
    generateLowAttendanceFlags
);


// ============================================================
// RESOLVE FLAG
// ============================================================

router.patch(
    "/:id/resolve",
    authMiddleware,
    requireRole(
        "admin",
        "lecturer",
        "ta"
    ),
    resolveFlag
);


module.exports = router;