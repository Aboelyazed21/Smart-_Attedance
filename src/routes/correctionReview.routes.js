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
    getCorrectionRequests
} = require("../controllers/correctionReview.controller");


// ==========================================
// GET CORRECTION REQUESTS
// GET /api/correction-review/pending
// ==========================================

router.get(
    "/pending",

    authMiddleware,

    requirePermission("correction.review"),

    getCorrectionRequests
);


// ==========================================
// Export
// ==========================================

module.exports = router;