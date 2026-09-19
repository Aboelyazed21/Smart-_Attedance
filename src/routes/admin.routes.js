const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
    requirePermission
} = require("../middleware/permission.middleware");

const {
    uploadCSV
} = require("../middleware/upload.middleware");

const {
    getUsers,
    createUser,
    updateUser,
    deleteUser,

    getRoles,

    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,

    getSections,
    getRooms,
    getEnrollments,
    getTimetable

} = require("../controllers/admin.controller");

const {
    importCourses,
    importStudents,
    importSections,
    importEnrollments,
    importRooms,
    importTimetable

} = require("../controllers/import.controller");


// ============================================================
// USERS
// ============================================================

router.get(
    "/users",
    authMiddleware,
    requirePermission("user.manage"),
    getUsers
);

router.post(
    "/users",
    authMiddleware,
    requirePermission("user.manage"),
    createUser
);

router.patch(
    "/users/:id",
    authMiddleware,
    requirePermission("user.manage"),
    updateUser
);

router.delete(
    "/users/:id",
    authMiddleware,
    requirePermission("user.manage"),
    deleteUser
);


// ============================================================
// ROLES
// ============================================================

router.get(
    "/roles",
    authMiddleware,
    requirePermission("user.manage"),
    getRoles
);


// ============================================================
// COURSES
// ============================================================

router.get(
    "/courses",
    authMiddleware,
    requirePermission("course.view"),
    getCourses
);

router.post(
    "/courses",
    authMiddleware,
    requirePermission("course.create"),
    createCourse
);

router.patch(
    "/courses/:id",
    authMiddleware,
    requirePermission("course.update"),
    updateCourse
);

router.delete(
    "/courses/:id",
    authMiddleware,
    requirePermission("course.delete"),
    deleteCourse
);


// ============================================================
// IMPORT COURSES
// ============================================================

router.post(
    "/import/courses",
    authMiddleware,
    requirePermission("course.create"),
    uploadCSV.single("file"),
    importCourses
);


// ============================================================
// IMPORT STUDENTS
// ============================================================

router.post(
    "/import/students",
    authMiddleware,
    requirePermission("user.manage"),
    uploadCSV.single("file"),
    importStudents
);


// ============================================================
// IMPORT SECTIONS
// ============================================================

router.post(
    "/import/sections",
    authMiddleware,
    requirePermission("user.manage"),
    uploadCSV.single("file"),
    importSections
);


// ============================================================
// IMPORT ENROLLMENTS
// ============================================================

router.post(
    "/import/enrollments",
    authMiddleware,
    requirePermission("user.manage"),
    uploadCSV.single("file"),
    importEnrollments
);


// ============================================================
// IMPORT ROOMS
// ============================================================

router.post(
    "/import/rooms",
    authMiddleware,
    requirePermission("user.manage"),
    uploadCSV.single("file"),
    importRooms
);


// ============================================================
// IMPORT TIMETABLE
// ============================================================

router.post(
    "/import/timetable",
    authMiddleware,
    requirePermission("user.manage"),
    uploadCSV.single("file"),
    importTimetable
);


// ============================================================
// DATA VIEW
// ============================================================

router.get(
    "/sections",
    authMiddleware,
    requirePermission("user.manage"),
    getSections
);

router.get(
    "/rooms",
    authMiddleware,
    requirePermission("user.manage"),
    getRooms
);

router.get(
    "/enrollments",
    authMiddleware,
    requirePermission("user.manage"),
    getEnrollments
);

router.get(
    "/timetable",
    authMiddleware,
    requirePermission("user.manage"),
    getTimetable
);


module.exports = router;