const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");

const {
    chat
} = require("../controllers/chatbot.controller");

const router = express.Router();

// ==========================================
// Student Chatbot
// ==========================================
router.post(
    "/",
    authMiddleware,
    chat
);

module.exports = router;