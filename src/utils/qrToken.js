const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// ============================================================
// QR CONFIG
// ============================================================

// QR rotation/expiry duration from .env
// Example: QR_ROTATION_SECONDS=60
const QR_EXPIRY_SECONDS =
    Number(process.env.QR_ROTATION_SECONDS) || 60;

const QR_MASTER_SECRET =
    process.env.QR_SECRET ||
    process.env.JWT_SECRET ||
    "smart_attendance_qr_secret_2026";


// ============================================================
// CREATE SESSION-SPECIFIC SECRET
// ============================================================

const deriveSessionKey = (sessionId) => {
    if (!sessionId) {
        throw new Error("Session ID is required");
    }

    return crypto
        .createHmac("sha256", QR_MASTER_SECRET)
        .update(`attendance-session:${Number(sessionId)}`)
        .digest("hex");
};


// ============================================================
// HASH SESSION SECRET
// Stored in attendance_sessions.qr_secret_hash
// ============================================================

const hashSessionKey = (sessionKey) => {
    return crypto
        .createHash("sha256")
        .update(sessionKey)
        .digest("hex");
};


// ============================================================
// CREATE QR TOKEN
// ============================================================

const generateQRToken = (
    sessionId,
    qrVersion = 1,
    expiresAt = null,
    rotationSeconds = QR_EXPIRY_SECONDS
) => {
    if (!sessionId) {
        throw new Error("Session ID is required");
    }

    const version = Number(qrVersion);

    if (!Number.isInteger(version) || version < 1) {
        throw new Error("Invalid QR version");
    }

    const rotation = Number(rotationSeconds);

    if (!Number.isFinite(rotation) || rotation <= 0) {
        throw new Error("Invalid QR rotation duration");
    }

    const sessionKey = deriveSessionKey(sessionId);

    let expirationTime;

    // --------------------------------------------------------
    // Use database/session expiration if provided
    // --------------------------------------------------------

    if (expiresAt) {
        const date = new Date(expiresAt);

        if (Number.isNaN(date.getTime())) {
            throw new Error("Invalid QR expiration time");
        }

        expirationTime = Math.floor(date.getTime() / 1000);
    }

    // --------------------------------------------------------
    // Otherwise calculate expiration from current time
    // --------------------------------------------------------

    else {
        expirationTime =
            Math.floor(Date.now() / 1000) + rotation;
    }

    // --------------------------------------------------------
    // Calculate issued time
    // --------------------------------------------------------

    const issuedAt =
        expirationTime - rotation;

    // --------------------------------------------------------
    // QR Payload
    // --------------------------------------------------------

    const payload = {
        type: "attendance_qr",
        sessionId: Number(sessionId),
        qrVersion: version,
        iat: issuedAt,
        exp: expirationTime
    };

    // --------------------------------------------------------
    // Sign token
    // --------------------------------------------------------

    return jwt.sign(payload, sessionKey, {
        algorithm: "HS256",
        noTimestamp: true
    });
};


// ============================================================
// VERIFY QR TOKEN
// ============================================================

const verifyQRToken = (token, session) => {
    if (!token) {
        throw new Error("QR token is required");
    }

    if (!session) {
        throw new Error("Session information is required");
    }

    if (!session.id) {
        throw new Error("Invalid session information");
    }

    // --------------------------------------------------------
    // Derive the same secret used when QR was generated
    // --------------------------------------------------------

    const sessionKey = deriveSessionKey(session.id);

    // --------------------------------------------------------
    // Verify secret fingerprint stored in database
    // --------------------------------------------------------

    const expectedHash = hashSessionKey(sessionKey);

    if (
        !session.qr_secret_hash ||
        session.qr_secret_hash !== expectedHash
    ) {
        throw new Error("Invalid QR session secret");
    }

    // --------------------------------------------------------
    // Verify JWT signature + expiration
    // --------------------------------------------------------

    const decoded = jwt.verify(token, sessionKey, {
        algorithms: ["HS256"]
    });

    // --------------------------------------------------------
    // Validate token type
    // --------------------------------------------------------

    if (decoded.type !== "attendance_qr") {
        throw new Error("Invalid QR token type");
    }

    // --------------------------------------------------------
    // Validate session ID
    // --------------------------------------------------------

    if (
        Number(decoded.sessionId) !==
        Number(session.id)
    ) {
        throw new Error("QR belongs to another session");
    }

    // --------------------------------------------------------
    // Validate QR version
    // This prevents old QR codes from being reused.
    // --------------------------------------------------------

    if (
        Number(decoded.qrVersion) !==
        Number(session.qr_version)
    ) {
        throw new Error("QR token has expired");
    }

    // --------------------------------------------------------
    // Validate database expiration
    // --------------------------------------------------------

    if (session.qr_expires_at) {
        const dbExpiry =
            new Date(session.qr_expires_at).getTime();

        if (
            Number.isNaN(dbExpiry) ||
            dbExpiry <= Date.now()
        ) {
            throw new Error("QR token has expired");
        }

        const dbExpirySeconds =
            Math.floor(dbExpiry / 1000);

        if (
            Number(decoded.exp) !==
            dbExpirySeconds
        ) {
            throw new Error("QR token is no longer active");
        }
    }

    return decoded;
};


// ============================================================
// HELPERS
// ============================================================

const getQRExpirySeconds = () => {
    return QR_EXPIRY_SECONDS;
};


const getSessionQRSecretHash = (sessionId) => {
    const sessionKey = deriveSessionKey(sessionId);

    return hashSessionKey(sessionKey);
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    generateQRToken,
    verifyQRToken,
    getQRExpirySeconds,
    getSessionQRSecretHash,
    deriveSessionKey,
    hashSessionKey
};