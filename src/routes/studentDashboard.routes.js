const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
    getDashboardStats
} = require("../controllers/studentDashboard.controller");

const router = express.Router();

// ==========================================
// Student - Dashboard Statistics
// ==========================================
router.get(
    "/stats",
    authMiddleware,
    getDashboardStats
);

module.exports = router;