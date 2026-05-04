const teacherController = require('../../controller/teacher/teacherController.js')
const express = require('express');
const router = express.Router();
const {authenticateToken} = require('../../middleware/authenticateToken.js')
const {
    getProfile,
    getMyStudents,
    getAllAttendance,
    getTodayAttendance,
    updateAttendance,
    getLowAttendanceStudents,
    exportAttendance
} = teacherController;
router.use(authenticateToken);
router.get('/profile',getProfile);
router.get('/students',getMyStudents);
router.get('/all',getAllAttendance);
router.get('/today',getTodayAttendance);
router.put('/attendance/:studentId',updateAttendance);
router.get('/low-attendance',getLowAttendanceStudents);
router.get('/export',exportAttendance);

module.exports = router;