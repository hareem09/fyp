// controllers/teacherController.js
const User = require('../../model/userModel/userSchema.js');
const Attendance = require('../../model/attendanceModel/attendanceSchema.js');
const Subject = require('../../model/subjectModel/subjectSchema.js');

// ─── GET PROFILE ──────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id)
      .select('-password -faceEmbedding')
      .populate('subjects', 'name code semester');

    res.status(200).json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET MY STUDENTS ──────────────────────────────────────────
const getMyStudents = async (req, res) => {
  try {
    // Get all subjects assigned to this teacher
    const subjects = await Subject.find({ teacher: req.user.id })
      .populate('students', 'name email rollNo department semester enrollmentStatus');

    // Flatten all students across all subjects
    const studentMap = {};
    subjects.forEach(subject => {
      subject.students.forEach(student => {
        studentMap[student._id] = student;
      });
    });

    const students = Object.values(studentMap);

    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET ALL ATTENDANCE ───────────────────────────────────────
const getAllAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, startDate, endDate, status } = req.query;

    // Teacher can only see attendance for their subjects
    const mySubjects = await Subject.find({ teacher: req.user.id }).select('_id');
    const subjectIds = mySubjects.map(s => s._id);

    let filter = { subject: { $in: subjectIds } };

    if (studentId) filter.student = studentId;
    if (subjectId) filter.subject = subjectId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name rollNo email')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mySubjects = await Subject.find({ teacher: req.user.id }).select('_id');
    const subjectIds = mySubjects.map(s => s._id);

    const records = await Attendance.find({
      subject: { $in: subjectIds },
      date: { $gte: today, $lt: tomorrow }
    })
      .populate('student', 'name rollNo')
      .populate('subject', 'name code');

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── MANUALLY OVERRIDE ATTENDANCE ────────────────────────────
const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, overrideReason } = req.body;

    const record = await Attendance.findById(id).populate('subject');

    // Make sure this attendance belongs to teacher's subject
    if (record.subject.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this record' });
    }

    record.status = status;
    record.overrideReason = overrideReason;
    record.isManual = true;
    record.markedBy = req.user.id;
    await record.save();

    res.status(200).json({ success: true, message: 'Attendance updated', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET LOW ATTENDANCE STUDENTS ─────────────────────────────
const getLowAttendanceStudents = async (req, res) => {
  try {
    const { threshold = 75, subjectId } = req.query;

    const mySubjects = await Subject.find({ teacher: req.user.id }).select('_id');
    const subjectIds = subjectId ? [subjectId] : mySubjects.map(s => s._id);

    const summary = await Attendance.aggregate([
      { $match: { subject: { $in: subjectIds } } },
      {
        $group: {
          _id: { student: '$student', subject: '$subject' },
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [{ $divide: ['$presentCount', '$totalClasses'] }, 100]
          }
        }
      },
      { $match: { percentage: { $lt: Number(threshold) } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id.student',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id.subject',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' }
    ]);

    res.status(200).json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── EXPORT ATTENDANCE AS CSV ─────────────────────────────────
const exportAttendance = async (req, res) => {
  try {
    const { subjectId, startDate, endDate } = req.query;

    const mySubjects = await Subject.find({ teacher: req.user.id }).select('_id');
    const subjectIds = mySubjects.map(s => s._id);

    let filter = { subject: { $in: subjectIds } };
    if (subjectId) filter.subject = subjectId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name rollNo email')
      .populate('subject', 'name code')
      .sort({ date: -1 });

    // Build CSV string
    const csvRows = [
      ['Student Name', 'Roll No', 'Subject', 'Date', 'Status', 'Confidence', 'Marked At']
    ];

    records.forEach(r => {
      csvRows.push([
        r.student.name,
        r.student.rollNo,
        r.subject.name,
        new Date(r.date).toLocaleDateString(),
        r.status,
        r.faceConfidence ? (r.faceConfidence * 100).toFixed(1) + '%' : 'Manual',
        new Date(r.markedAt).toLocaleTimeString()
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance.csv');
    res.status(200).send(csvContent);

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
    getProfile,
    getMyStudents,
    getAllAttendance,
    getTodayAttendance,
    updateAttendance,
    getLowAttendanceStudents,
    exportAttendance
}