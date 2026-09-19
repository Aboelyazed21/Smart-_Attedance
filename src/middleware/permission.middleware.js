const db = require("../config/db");

// ============================================================
// CHECK USER PERMISSION
// ============================================================

const requirePermission = (permissionName) => {

    return (req, res, next) => {

        // ----------------------------------------------------
        // Authentication check
        // ----------------------------------------------------

        if (!req.user || !req.user.userId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        const userId =
            Number(req.user.userId);


        if (!permissionName) {

            return res.status(500).json({
                success: false,
                message: "Permission name is required"
            });

        }


        // ----------------------------------------------------
        // Get permission through user's role
        // ----------------------------------------------------

        const sql = `
            SELECT
                p.id,
                p.name,
                p.description
            FROM users u
            INNER JOIN roles r
                ON r.id = u.role_id
            INNER JOIN role_permissions rp
                ON rp.role_id = r.id
            INNER JOIN permissions p
                ON p.id = rp.permission_id
            WHERE u.id = ?
              AND u.status = 'active'
              AND p.name = ?
            LIMIT 1
        `;


        db.query(
            sql,
            [userId, permissionName],
            (err, results) => {

                if (err) {

                    console.error(
                        "Permission check error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });

                }


                // ------------------------------------------------
                // Permission not found
                // ------------------------------------------------

                if (results.length === 0) {

                    return res.status(403).json({
                        success: false,
                        message:
                            "You do not have permission to perform this action",
                        requiredPermission:
                            permissionName
                    });

                }


                // ------------------------------------------------
                // Save permission in request
                // ------------------------------------------------

                req.permission = results[0];

                next();

            }
        );

    };

};


// ============================================================
// CHECK ANY PERMISSION
// ============================================================

const requireAnyPermission = (
    permissions = []
) => {

    return (req, res, next) => {

        if (!req.user || !req.user.userId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        if (
            !Array.isArray(permissions) ||
            permissions.length === 0
        ) {

            return res.status(500).json({
                success: false,
                message: "Permissions are required"
            });

        }


        const placeholders =
            permissions.map(() => "?").join(",");


        const sql = `
            SELECT
                p.id,
                p.name,
                p.description
            FROM users u
            INNER JOIN roles r
                ON r.id = u.role_id
            INNER JOIN role_permissions rp
                ON rp.role_id = r.id
            INNER JOIN permissions p
                ON p.id = rp.permission_id
            WHERE u.id = ?
              AND u.status = 'active'
              AND p.name IN (${placeholders})
            LIMIT 1
        `;


        db.query(
            sql,
            [
                req.user.userId,
                ...permissions
            ],
            (err, results) => {

                if (err) {

                    console.error(
                        "Any permission check error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });

                }


                if (results.length === 0) {

                    return res.status(403).json({
                        success: false,
                        message:
                            "You do not have permission to perform this action"
                    });

                }


                req.permission = results[0];

                next();

            }
        );

    };

};


// ============================================================
// ROLE CHECK
// ============================================================

const requireRole = (...allowedRoles) => {

    return (req, res, next) => {

        if (!req.user || !req.user.userId) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({
                success: false,
                message: "Access denied",
                requiredRoles: allowedRoles
            });

        }


        next();

    };

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    requirePermission,
    requireAnyPermission,
    requireRole
};