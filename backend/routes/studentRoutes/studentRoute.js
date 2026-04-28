const studentController = require('../../controller/student/studentController.js')
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authenticateToken.js')
const {
    getProfile,
    updateProfile,
    enrollFace,
    getEnrollmentStatus,
    getMyAttendance,
    getMyAttendanceSummary,
    getTodayAttendance
} = studentController;

router.use(authenticateToken)
router.get('/profile',getProfile);
router.put('/profile',updateProfile);
router.post('/enroll',enrollFace);
router.get('/status',getEnrollmentStatus);
router.get('/attendance',getMyAttendance);
router.get('/summary',getMyAttendanceSummary);
router.get('/today',getTodayAttendance);

module.exports = router;