# Smart Attendance & Classroom Verification System

> A full-stack, secure attendance platform featuring QR-based tracking, session validation, auditability, comprehensive analytics, and an AI-assisted risk and anomaly detection layer.

---

##  System Architecture & Services

The platform is decoupled into four major components that can run independently across local or private/cloud networks:

1. **Frontend:** React (Single Page Application for students, lecturers, admins, and auditors).
2. **Backend:** Node.js (Main API gateway handling authentication, session validation, QR verification, and data flow).
3. **Database:** MySQL 8.0+ (Persistent source of truth for operational and AI data).
4. **AI Service:** Python FastAPI (Independent service handling machine learning risk models, anomaly detection, rule-based red flags, and explanations).

> **Note on Communication:** The Node.js backend acts as the gateway between React and the FastAPI AI service. React should not call FastAPI directly.

---

##  Project Directory Structure

```text
├── analytics/         # Data analysis and attendance reporting modules
├── database/          # Database connection, schemas, and SQL scripts (`data.sql`)[cite: 2]
├── explanation/       # Human-readable explanation generator for model/rule results[cite: 2]
├── models/            # AI data models (Attendance Risk & Anomaly models)[cite: 2]
├── rules/             # Rule-based deterministic red flags[cite: 2]
├── src/               # Frontend or core application source files
├── .env               # Environment configuration variables[cite: 2]
├── main.py            # FastAPI application entry point
├── package.json       # Node.js dependencies and scripts[cite: 2]
└── package-lock.json  # Locked dependency versions
