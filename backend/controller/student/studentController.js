// controllers/studentController.js
const User = require('../../model/userModel/userSchema.js');
const Attendance = require('../../model/attendanceModel/attendanceSchema.js');
const axios = require('axios');

// ─── GET PROFILE ──────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user.id)
      .select('-password -faceEmbedding -resetPasswordToken -resetPasswordExpire')
      .populate('subjects', 'name code');

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Students can only update limited fields
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password -faceEmbedding');

    res.status(200).json({ success: true, message: 'Profile updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── ENROLL FACE ──────────────────────────────────────────────
const enrollFace = async (req, res) => {
  try {
    const { images } = req.body;
    // images = array of base64 encoded face photos from frontend

    if (!images || images.length < 5) {
      return res.status(400).json({ success: false, message: 'Minimum 5 face images required' });
    }

    // Send images to Python AI microservice
    const aiResponse = await axios.post(`${process.env.AI_SERVICE_URL}/enroll`, {
      userId: req.user.id,
      images
    });

    if (!aiResponse.data.success) {
      return res.status(400).json({ success: false, message: 'Face enrollment failed. Please try again in better lighting.' });
    }

    // Save embedding to user document
    await User.findByIdAndUpdate(req.user.id, {
      faceEmbedding: aiResponse.data.embedding,
      enrollmentStatus: 'pending',
      enrollmentDate: Date.now()
    });

    res.status(200).json({
      success: true,
      message: 'Face enrolled successfully. Awaiting admin approval.',
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET ENROLLMENT STATUS ────────────────────────────────────
const getEnrollmentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('enrollmentStatus enrollmentDate');

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET MY ATTENDANCE ────────────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const { subjectId, startDate, endDate } = req.query;

    let filter = { student: req.user.id };

    if (subjectId) filter.subject = subjectId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const records = await Attendance.find(filter)
      .populate('subject', 'name code')
      .populate('teacher', 'name')
      .sort({ date: -1 });

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET MY ATTENDANCE SUMMARY (percentage) ───────────────────
const getMyAttendanceSummary = async (req, res) => {
  try {
    const summary = await Attendance.aggregate([
      { $match: { student: req.user.id } },
      {
        $group: {
          _id: '$subject',
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
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' }
    ]);

    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── CHECK TODAY'S ATTENDANCE ─────────────────────────────────
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await Attendance.find({
      student: req.user.id,
      date: { $gte: today, $lt: tomorrow }
    }).populate('subject', 'name code');

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
    getProfile,
    updateProfile,
    enrollFace,
    getEnrollmentStatus,
    getMyAttendance,
    getMyAttendanceSummary,
    getTodayAttendance
}