
const express    = require('express');
const router     = express.Router();
// const verifyToken = require('../../middleware/authenticateToken');
// const {authorizeRoles} = require('../../middleware/authorizeRoles')
const {
  createSubject, getAllSubjects, enrollStudent,
  removeStudent, addSchedule, getTeacherSubjects,
  getStudentSubjects, deleteSubject
} = require('../../controller/subject/subjectController.js');

// router.use(verifyToken)

router.post('/',createSubject);
router.get('/',   getAllSubjects);
router.delete('/:id',deleteSubject);
router.post('/enroll', enrollStudent);
router.post('/remove-student', removeStudent);
router.post('/schedule',  addSchedule);
router.get('/teacher-subjects',            getTeacherSubjects);
router.get('/student-subjects',             getStudentSubjects);

module.exports = router;