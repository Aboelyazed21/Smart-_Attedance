const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
    getAssignedSections
} = require("../controllers/lecturerSection.controller");

const router = express.Router();

// ==========================================
// Get Lecturer Assigned Sections
// ==========================================
router.get(
    "/sections",
    authMiddleware,
    getAssignedSections
);

module.exports = router;