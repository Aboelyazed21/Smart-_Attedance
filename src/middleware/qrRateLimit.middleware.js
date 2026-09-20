const rateLimit = require("express-rate-limit");

const qrScanRateLimit = rateLimit({
    windowMs: 60 * 1000,

    // أقصى عدد محاولات Scan لكل Student في الدقيقة
    limit: 10,

    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        return `student:${req.user.userId}`;
    },

    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: "Too many attendance scan attempts. Please try again later."
        });
    }
});

module.exports = {
    qrScanRateLimit
};