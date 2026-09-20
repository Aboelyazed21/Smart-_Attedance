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
    approveCorrectionRequest
} = require("../controllers/correctionApproval.controller");


// ==========================================
// APPROVE
// PATCH /api/correction-review/:id/approve
// ==========================================

router.patch(
    "/:id/approve",
    authMiddleware,
    requirePermission("correction.review"),
    approveCorrectionRequest
);


// ==========================================
// Export
// ==========================================

module.exports = router;