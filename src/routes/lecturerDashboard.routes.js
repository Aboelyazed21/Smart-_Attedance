const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
    getDashboardStats
} = require("../controllers/lecturerDashboard.controller");

const router = express.Router();

// ==========================================
// Lecturer - Dashboard Statistics
// ==========================================
router.get(
    "/stats",
    authMiddleware,
    getDashboardStats
);

module.exports = router;