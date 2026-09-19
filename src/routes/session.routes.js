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
// Controllers
// ==========================================

const {
    createSession,
    getSessionQR,
    closeSession
} = require("../controllers/session.controller");

const {
    getSessionRoster
} = require("../controllers/sessionRoster.controller");


// ==========================================
// CREATE SESSION
// POST /api/sessions
// ==========================================

router.post(
    "/",
    authMiddleware,
    requirePermission("session.create"),
    createSession
);


// ==========================================
// GET SESSION QR
// GET /api/sessions/:id/qr
// ==========================================

router.get(
    "/:id/qr",
    authMiddleware,
    requirePermission("session.view"),
    getSessionQR
);


// ==========================================
// CLOSE SESSION
// PATCH /api/sessions/:id/close
// ==========================================

router.patch(
    "/:id/close",
    authMiddleware,
    requirePermission("session.close"),
    closeSession
);


// ==========================================
// SESSION ROSTER
// GET /api/sessions/:id/roster
// ==========================================

router.get(
    "/:id/roster",
    authMiddleware,
    requirePermission("attendance.view"),
    getSessionRoster
);


// ==========================================
// Export
// ==========================================

module.exports = router;