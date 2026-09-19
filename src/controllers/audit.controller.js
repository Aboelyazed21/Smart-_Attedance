const db = require("../config/db");

const getAuditLogs = (req, res) => {
    const {
        actorId,
        action,
        entityType,
        entityId,
        startDate,
        endDate,
        page = 1,
        limit = 50
    } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const offset = (currentPage - 1) * perPage;

    let where = [];
    let params = [];

    if (actorId) {
        where.push("ae.actor_id = ?");
        params.push(actorId);
    }

    if (action) {
        where.push("ae.action LIKE ?");
        params.push(`%${action}%`);
    }

    if (entityType) {
        where.push("ae.entity_type = ?");
        params.push(entityType);
    }

    if (entityId) {
        where.push("ae.entity_id = ?");
        params.push(entityId);
    }

    if (startDate) {
        where.push("DATE(ae.created_at) >= ?");
        params.push(startDate);
    }

    if (endDate) {
        where.push("DATE(ae.created_at) <= ?");
        params.push(endDate);
    }

    const whereClause =
        where.length > 0
            ? `WHERE ${where.join(" AND ")}`
            : "";

    const countSql = `
        SELECT COUNT(*) AS total
        FROM audit_events ae
        ${whereClause}
    `;

    db.query(countSql, params, (countErr, countResult) => {
        if (countErr) {
            console.error("Audit count error:", countErr);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        const total = countResult[0].total;

        const sql = `
            SELECT
                ae.id,
                ae.actor_id,
                CONCAT(
                    COALESCE(u.first_name, ''),
                    ' ',
                    COALESCE(u.last_name, '')
                ) AS actor_name,
                u.email AS actor_email,
                r.name AS actor_role,

                ae.action,
                ae.entity_type,
                ae.entity_id,

                ae.before_data,
                ae.after_data,

                ae.ip_address,
                ae.user_agent,
                ae.created_at

            FROM audit_events ae

            LEFT JOIN users u
                ON u.id = ae.actor_id

            LEFT JOIN roles r
                ON r.id = u.role_id

            ${whereClause}

            ORDER BY ae.created_at DESC
            LIMIT ? OFFSET ?
        `;

        db.query(
            sql,
            [...params, perPage, offset],
            (err, results) => {
                if (err) {
                    console.error("Audit logs error:", err);

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                return res.json({
                    success: true,
                    data: results,
                    pagination: {
                        page: currentPage,
                        limit: perPage,
                        total,
                        totalPages: Math.ceil(total / perPage)
                    }
                });
            }
        );
    });
};


const getAuditLogById = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            ae.id,
            ae.actor_id,

            CONCAT(
                COALESCE(u.first_name, ''),
                ' ',
                COALESCE(u.last_name, '')
            ) AS actor_name,

            u.email AS actor_email,
            r.name AS actor_role,

            ae.action,
            ae.entity_type,
            ae.entity_id,

            ae.before_data,
            ae.after_data,

            ae.ip_address,
            ae.user_agent,
            ae.created_at

        FROM audit_events ae

        LEFT JOIN users u
            ON u.id = ae.actor_id

        LEFT JOIN roles r
            ON r.id = u.role_id

        WHERE ae.id = ?

        LIMIT 1
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Audit log details error:", err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Audit log not found"
            });
        }

        return res.json({
            success: true,
            data: results[0]
        });
    });
};


const getAuditSummary = (req, res) => {
    const sql = `
        SELECT
            COUNT(*) AS total_events,

            COUNT(
                CASE
                    WHEN created_at >= NOW() - INTERVAL 24 HOUR
                    THEN 1
                END
            ) AS last_24_hours,

            COUNT(
                CASE
                    WHEN created_at >= NOW() - INTERVAL 7 DAY
                    THEN 1
                END
            ) AS last_7_days

        FROM audit_events
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Audit summary error:", err);

            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        return res.json({
            success: true,
            data: results[0]
        });
    });
};


module.exports = {
    getAuditLogs,
    getAuditLogById,
    getAuditSummary
};