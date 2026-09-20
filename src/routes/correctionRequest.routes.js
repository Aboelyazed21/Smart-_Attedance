const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
    createCorrectionRequest
} = require("../controllers/correctionRequest.controller");

const router = express.Router();

// ==========================================
// Create Student Correction Request
// ==========================================
router.post(
    "/",
    authMiddleware,
    createCorrectionRequest
);

module.exports = router;