const adminController = require('../../controller/admin/adminController.js')
const express = require('express');
const router = express.Router();

const {
        getAllUsers,
        getUserById,
        getSystemOverview,
        rejectEnrollment,
        approveEnrollment,
        createUser,
        updateUser,
        deleteUser,
        approveUser,
        toggleUserStatus,
        importStudents,
        createAndInviteStudent,
        createSubject,
        assignSubjectToTeacher,
        getSubject
} = adminController;

router.get('/users', getAllUsers);
router.get('/user/:id',getUserById);
router.get('/overview', getSystemOverview);
router.post('/user',createUser);
router.put('/user/:id',updateUser);
router.delete('/user/:id',deleteUser);
router.post('/approve',approveUser);
router.post('/reject',rejectEnrollment);
router.post('/enroll',approveEnrollment);
router.post('/toggle-status/:id', toggleUserStatus);
router.post('/import-students', importStudents);
router.post('/invite-student', createAndInviteStudent);
router.post('/create-subject', createSubject);
router.post('/assign', assignSubjectToTeacher);
router.get('/subjects', getSubject);
module.exports = router;