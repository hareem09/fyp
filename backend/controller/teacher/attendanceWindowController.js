// backend/controllers/attendanceWindowController.js
const AttendanceWindow = require('../../model/attendanceModel/attendanceWindowSchema.js');
const Subject          = require('../../model/subjectModel/subjectSchema.js');

// ── TEACHER OPENS ATTENDANCE WINDOW ───────────────────────────
const openWindow = async (req, res) => {
  try {
    const { subjectId, duration = 20 } = req.body;
    const teacherId = req.user.id;

    // Verify teacher owns this subject
    const subject = await Subject.findOne({
      _id:     subjectId,
      teacher: teacherId
    });

    if (!subject) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this subject'
      });
    }

    // Check if window already open for this subject today
    const existingWindow = await AttendanceWindow.findOne({
      subject:  subjectId,
      isOpen:   true,
      expiresAt: { $gt: new Date() }
    });

    if (existingWindow) {
      return res.status(400).json({
        success: false,
        message: 'Attendance window is already open for this subject',
        data:    existingWindow
      });
    }

    // Create new window
    const openedAt  = new Date();
    const expiresAt = new Date(openedAt.getTime() + duration * 60 * 1000);

    const window = await AttendanceWindow.create({
      subject:  subjectId,
      teacher:  teacherId,
      openedAt,
      expiresAt,
      duration,
      isOpen:   true
    });

    await window.populate('subject', 'name code');

    console.log(`Attendance window opened for ${subject.name} — expires at ${expiresAt}`);

    res.status(201).json({
      success: true,
      message: `Attendance window opened for ${duration} minutes`,
      data:    window
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TEACHER CLOSES WINDOW MANUALLY ────────────────────────────
const closeWindow = async (req, res) => {
  try {
    const window = await AttendanceWindow.findOne({
      _id:     req.params.id,
      teacher: req.user.id
    });

    if (!window) {
      return res.status(404).json({
        success: false,
        message: 'Window not found'
      });
    }

    window.isOpen = false;
    await window.save();

    res.status(200).json({
      success: true,
      message: 'Attendance window closed'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET ACTIVE WINDOW FOR SUBJECT ──────────────────────────────
const getActiveWindow = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const window = await AttendanceWindow.findOne({
      subject:   subjectId,
      isOpen:    true,
      expiresAt: { $gt: new Date() }
    }).populate('subject', 'name code')
      .populate('teacher', 'name');

    // Auto close expired windows
    await AttendanceWindow.updateMany(
      { isOpen: true, expiresAt: { $lte: new Date() } },
      { isOpen: false }
    );

    if (!window) {
      return res.status(200).json({
        success: true,
        isOpen:  false,
        message: 'No active attendance window',
        data:    null
      });
    }

    // Calculate remaining time
    const remainingMs      = window.expiresAt - new Date();
    const remainingMinutes = Math.floor(remainingMs / 60000);
    const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

    res.status(200).json({
      success:          true,
      isOpen:           true,
      data:             window,
      remainingMinutes,
      remainingSeconds,
      remainingMs
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET TEACHER'S WINDOWS HISTORY ─────────────────────────────
const getTeacherWindows = async (req, res) => {
  try {
    const windows = await AttendanceWindow.find({ teacher: req.user.id })
      .populate('subject',        'name code')
      .populate('markedStudents', 'name rollNo')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: windows });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports ={
    openWindow,
    closeWindow,
    getActiveWindow,
    getTeacherWindows
}