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
    rejectCorrectionRequest
} = require("../controllers/correctionRejection.controller");


// ==========================================
// REJECT
// PATCH /api/correction-review/:id/reject
// ==========================================

router.patch(
    "/:id/reject",
    authMiddleware,
    requirePermission("correction.review"),
    rejectCorrectionRequest
);


// ==========================================
// Export
// ==========================================

module.exports = router;