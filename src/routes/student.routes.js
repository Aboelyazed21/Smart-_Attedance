const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const { getProfile } = require("../controllers/student.controller");
const { getSchedule } = require("../controllers/studentSchedule.controller");
const { getAttendance } = require("../controllers/studentAttendance.controller");

const router = express.Router();

// Student profile
router.get("/profile", authMiddleware, getProfile);

// Student schedule
router.get("/schedule", authMiddleware, getSchedule);

// Student attendance
router.get("/attendance", authMiddleware, getAttendance);

module.exports = router;