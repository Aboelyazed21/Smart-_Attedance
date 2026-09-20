const express = require("express");

const { login } = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

// Login
router.post("/login", login);

// Protected route
router.get("/me", authMiddleware, (req, res) => {
    res.json({
        success: true,
        message: "Authenticated successfully",
        user: req.user
    });
});

module.exports = router;