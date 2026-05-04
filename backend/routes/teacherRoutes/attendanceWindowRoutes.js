const express = require('express');
const attendanceWindowSchema = require('../../model/attendanceModel/attendanceWindowSchema');
const router = express.Router();
const {authenticateToken} = require('../../middleware/authenticateToken.js')
const attendanceWindowController = require('../../controller/teacher/attendanceWindowController.js')

const {
    openWindow,
    closeWindow,
    getActiveWindow,
    getTeacherWindows
}=attendanceWindowController;
router.use(authenticateToken)
router.post('/open',openWindow);
router.put('/close/:id',  closeWindow);
router.get('/active/:subjectId', getActiveWindow);
router.get('/history',getTeacherWindows);

module.exports = router;