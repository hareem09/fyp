const attendenceController = require('../../controller/student/attendenceController.js')
const express = require('express');
const router = express.Router();
const {authenticateToken} = require('../../middleware/authenticateToken.js')
const{
    markAttendance
} = attendenceController;

router.post('/mark', authenticateToken, markAttendance);

module.exports = router;