// backend/controllers/subjectController.js
const Subject = require('../../model/subjectModel/subjectSchema');
const User    = require('../../model/userModel/userSchema.js');

// ── CREATE SUBJECT ─────────────────────────────────────────────
const createSubject = async (req, res) => {
  try {
    const { name, code, creditHours, department, semester, teacher, schedule } = req.body;

    // Check code is unique
    const exists = await Subject.findOne({ code });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Subject code already exists'
      });
    }

    const subject = await Subject.create({
      name, code, creditHours, department,
      semester, teacher, schedule: schedule || []
    });

    await subject.populate('teacher', 'name email designation');

    res.status(201).json({ success: true, data: subject });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ALL SUBJECTS ───────────────────────────────────────────
const getAllSubjects = async (req, res) => {
  try {
    const { semester, department, teacher } = req.query;
    const filter = {};
    if (semester)   filter.semester   = semester;
    if (department) filter.department = department;
    if (teacher)    filter.teacher    = teacher;

    const subjects = await Subject.find(filter)
      .populate('teacher',  'name email designation')
      .populate('students', 'name rollNo email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count:   subjects.length,
      data:    subjects
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ENROLL STUDENT IN SUBJECT ──────────────────────────────────
const enrollStudent = async (req, res) => {
  try {
    const { subjectId, studentId } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Check student exists
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check already enrolled
    if (subject.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student already enrolled in this subject'
      });
    }

    subject.students.push(studentId);
    await subject.save();

    res.status(200).json({
      success: true,
      message: `${student.name} enrolled in ${subject.name}`
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REMOVE STUDENT FROM SUBJECT ────────────────────────────────
const removeStudent = async (req, res) => {
  try {
    const { subjectId, studentId } = req.body;

    await Subject.findByIdAndUpdate(
      subjectId,
      { $pull: { students: studentId } }
    );

    res.status(200).json({ success: true, message: 'Student removed from subject' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD SCHEDULE TO SUBJECT ────────────────────────────────────
const addSchedule = async (req, res) => {
  try {
    const { subjectId, schedule } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      subjectId,
      { schedule },
      { new: true }
    ).populate('teacher', 'name');

    res.status(200).json({ success: true, data: subject });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET SUBJECTS FOR TEACHER ───────────────────────────────────
const getTeacherSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ teacher: req.user.id })
      .populate('students', 'name rollNo email department semester enrollmentStatus')
      .sort({ semester: 1 });

    res.status(200).json({ success: true, data: subjects });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET SUBJECTS FOR STUDENT ───────────────────────────────────
const getStudentSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ students: req.user.id })
      .populate('teacher', 'name email designation')
      .sort({ semester: 1 });

    res.status(200).json({ success: true, data: subjects });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE SUBJECT ─────────────────────────────────────────────
const deleteSubject = async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
    createSubject,
    getAllSubjects,
    enrollStudent,
    removeStudent,
    addSchedule,
    getTeacherSubjects,
    getStudentSubjects,
    deleteSubject
}