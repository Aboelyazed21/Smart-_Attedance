const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
    requirePermission
} = require("../middleware/permission.middleware");

const {
    getAuditLogs,
    getAuditLogById,
    getAuditSummary
} = require("../controllers/audit.controller");


// Get audit logs
router.get(
    "/",
    authMiddleware,
    requirePermission("audit.view"),
    getAuditLogs
);


// Get audit summary
router.get(
    "/summary",
    authMiddleware,
    requirePermission("audit.view"),
    getAuditSummary
);


// Get single audit log
router.get(
    "/:id",
    authMiddleware,
    requirePermission("audit.view"),
    getAuditLogById
);


module.exports = router;