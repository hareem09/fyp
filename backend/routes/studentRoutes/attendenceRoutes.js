const attendenceController = require('../../controller/student/attendenceController.js')
const express = require('express');
const router = express.Router();

const{
    markAttendance
} = attendenceController;

router.post('/mark',markAttendance);

module.exports = router;