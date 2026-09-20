require("dotenv").config();

const express = require("express");
const db = require("./config/db");

// ==========================================
// Routes
// ==========================================

const authRoutes =
    require("./routes/auth.routes");

const studentRoutes =
    require("./routes/student.routes");

const studentDashboardRoutes =
    require("./routes/studentDashboard.routes");

const lecturerDashboardRoutes =
    require("./routes/lecturerDashboard.routes");

const lecturerSectionRoutes =
    require("./routes/lecturerSection.routes");

const sessionRoutes =
    require("./routes/session.routes");

const attendanceRoutes =
    require("./routes/attendance.routes");

const correctionRoutes =
    require("./routes/correction.routes");

const correctionRequestRoutes =
    require("./routes/correctionRequest.routes");

const correctionReviewRoutes =
    require("./routes/correctionReview.routes");

const correctionApprovalRoutes =
    require("./routes/correctionApproval.routes");

const correctionRejectionRoutes =
    require("./routes/correctionRejection.routes");

const chatbotRoutes =
    require("./routes/chatbot.routes");

// ==========================================
// Admin Routes
// ==========================================

const adminRoutes =
    require("./routes/admin.routes");

// ==========================================
// Reports Routes
// ==========================================

const reportRoutes =
    require("./routes/report.routes");

// ==========================================
// Attendance Flags Routes
// ==========================================

const attendanceFlagRoutes =
    require("./routes/attendanceFlag.routes");

// ==========================================
// Audit Routes
// ==========================================

const auditRoutes =
    require("./routes/audit.routes");

// ==========================================
// App
// ==========================================

const app = express();

const PORT =
    process.env.PORT || 5000;

// ==========================================
// Middleware
// ==========================================

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// ==========================================
// CORS
// ==========================================

app.use((req, res, next) => {

    res.header(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

// ==========================================
// Root
// ==========================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message:
            "Smart Attendance Backend is running",
        version: "1.0.0"
    });

});

// ==========================================
// Auth
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

// ==========================================
// Student
// ==========================================

app.use(
    "/api/students",
    studentRoutes
);

app.use(
    "/api/student-dashboard",
    studentDashboardRoutes
);

// ==========================================
// Lecturer
// ==========================================

app.use(
    "/api/lecturer-dashboard",
    lecturerDashboardRoutes
);

app.use(
    "/api/lecturer",
    lecturerSectionRoutes
);

// ==========================================
// Sessions
// ==========================================

app.use(
    "/api/sessions",
    sessionRoutes
);

// ==========================================
// Attendance
// ==========================================

app.use(
    "/api/attendance",
    attendanceRoutes
);

// ==========================================
// Corrections
// ==========================================

app.use(
    "/api/corrections",
    correctionRoutes
);

app.use(
    "/api/correction-requests",
    correctionRequestRoutes
);

app.use(
    "/api/correction-review",
    correctionReviewRoutes
);

app.use(
    "/api/correction-review",
    correctionApprovalRoutes
);

app.use(
    "/api/correction-review",
    correctionRejectionRoutes
);

// ==========================================
// Chatbot
// ==========================================

app.use(
    "/api/chatbot",
    chatbotRoutes
);

// ==========================================
// Admin
// ==========================================

app.use(
    "/api/admin",
    adminRoutes
);

// ==========================================
// Reports
// ==========================================

app.use(
    "/api/reports",
    reportRoutes
);

// ==========================================
// Attendance Flags
// ==========================================

app.use(
    "/api/attendance-flags",
    attendanceFlagRoutes
);

// ==========================================
// Audit
// ==========================================

app.use(
    "/api/audit",
    auditRoutes
);

// ==========================================
// Database Test
// ==========================================

app.get(
    "/test-db",
    (req, res) => {

        db.query(
            "SELECT 1 AS test",
            (err, result) => {

                if (err) {

                    console.error(
                        "Database test error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Database connection failed",
                        error:
                            err.message
                    });

                }

                return res.json({
                    success: true,
                    message:
                        "Database connection is working",
                    result
                });

            }
        );

    }
);

// ==========================================
// 404
// ==========================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Route not found",

            path:
                req.originalUrl

        });

    }
);

// ==========================================
// Global Error Handler
// ==========================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Global server error:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error"

        });

    }
);

// ==========================================
// Start Server
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "========================================"
        );

        console.log(
            "🚀 Smart Attendance Backend"
        );

        console.log(
            `🌐 Server: http://localhost:${PORT}`
        );

        console.log(
            `🗄️ Database: ${
                process.env.DB_NAME ||
                "smart_attendance_db"
            }`
        );

        console.log(
            "========================================"
        );

    }
);