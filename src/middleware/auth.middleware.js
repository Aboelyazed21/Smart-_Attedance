const jwt = require("jsonwebtoken");

// ==========================================
// Authentication Middleware
// ==========================================
const authMiddleware = (req, res, next) => {
    try {
        // ==========================================
        // Get Authorization Header
        // ==========================================
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message:
                    "Authorization token is required"
            });
        }

        // ==========================================
        // Validate Bearer Format
        // ==========================================
        if (
            !authHeader.startsWith(
                "Bearer "
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authorization format"
            });
        }

        const token =
            authHeader.substring(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Authorization token is missing"
            });
        }

        // ==========================================
        // Verify JWT
        // ==========================================
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET ||
                "smart_attendance_secret_2026"
        );

        // ==========================================
        // Attach User To Request
        // ==========================================
        req.user = decoded;

        next();

    } catch (error) {

        // ==========================================
        // Token Expired
        // ==========================================
        if (
            error.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Token has expired"
            });
        }

        // ==========================================
        // Invalid Token
        // ==========================================
        if (
            error.name ===
            "JsonWebTokenError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid token"
            });
        }

        // ==========================================
        // General Authentication Error
        // ==========================================
        console.error(
            "Authentication error:",
            error
        );

        return res.status(401).json({
            success: false,
            message:
                "Authentication failed"
        });
    }
};

module.exports = authMiddleware;