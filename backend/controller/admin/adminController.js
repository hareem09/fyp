// controllers/adminController.js
const User = require('../../model/userModel/userSchema.js');
const Attendance = require('../../model/attendanceModel/attendanceSchema.js');
const Subject = require('../../model/subjectModel/subjectSchema.js');
const Geofence = require('../../model/geofenceModel/geofenceSchema.js');

const nodemailer = require("nodemailer");
const {transporter}= require('../../utils/sendMail.js')
const crypto = require('crypto');
const bcrypt=require('bcrypt')
// ─── GET ALL USERS ────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, isApproved } = req.query;

    let filter = {};
    if (role) filter.role = role;
    // if (isActive !== undefined) filter.isActive = isActive === 'true';
    // if (isApproved !== undefined) filter.isApproved = isApproved === 'true';

    const users = await User.find(filter)
      .select('-password -faceEmbedding -resetPasswordToken')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GET SINGLE USER ──────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -faceEmbedding')
      .populate('subjects', 'name code');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── CREATE USER (admin creates student/teacher) ──────────────
const createUser = async (req, res) => {
  try {
    const { name, email, role, employeeId, designation } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const user = await User.create({
      name, email, role: 'teacher',
      password: hashedPassword,
      employeeId, designation,
      isApproved: true,  
      isActive: true
    });

    await transporter.sendMail({
      to: email,
      subject: "Your Teacher Account Access",
      html: `
        <h3>Hello ${name},</h3>
        <p>Your Teacher account has been created.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please change your password after login.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: user._id, name, email, role, tempPassword } // remove tempPassword in production
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── UPDATE USER ──────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { name, email, department, semester, designation, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, department, semester, designation, phone },
      { new: true, runValidators: true }
    ).select('-password -faceEmbedding');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── DELETE USER ──────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Also delete their attendance records
    await Attendance.deleteMany({ student: req.params.id });

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── ACTIVATE / DEACTIVATE USER ───────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── APPROVE USER ACCOUNT ─────────────────────────────────────
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User approved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── APPROVE FACE ENROLLMENT ──────────────────────────────────
const approveEnrollment = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { enrollmentStatus: 'approved' },
      { new: true }
    ).select('-password -faceEmbedding');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'Face enrollment approved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── REJECT FACE ENROLLMENT ───────────────────────────────────
const rejectEnrollment = async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        enrollmentStatus: 'rejected',
        faceEmbedding: []   // clear the bad embedding
      },
      { new: true }
    ).select('-password -faceEmbedding');

    // In production: notify student via email with reason

    res.status(200).json({
      success: true,
      message: 'Enrollment rejected. Student will be notified.',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── BULK IMPORT STUDENTS (CSV) ───────────────────────────────
const importStudents = async (req, res) => {
  try {
    const { students } = req.body;
    // students = array of { name, email, rollNo, department, semester, batch }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);

    const createdUsers = [];
    const errors = [];

    for (const student of students) {
      try {
        const exists = await User.findOne({ email: student.email });
        if (exists) {
          errors.push({ email: student.email, reason: 'Already exists' });
          continue;
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const newUser = await User.create({
          ...student,
          role: 'student',
          password: hashedPassword,
          isApproved: true,
          isActive: true
        });

        createdUsers.push({ name: newUser.name, email: newUser.email, tempPassword });
      } catch (err) {
        errors.push({ email: student.email, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdUsers.length} students imported`,
      created: createdUsers,
      errors
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── SYSTEM OVERVIEW ──────────────────────────────────────────
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      pendingEnrollments,
      todayAttendance
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      User.countDocuments({ enrollmentStatus: 'pending' }),
      Attendance.countDocuments({
        date: {
          $gte: new Date().setHours(0, 0, 0, 0),
          $lt: new Date().setHours(23, 59, 59, 999)
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: { totalStudents, totalTeachers, pendingEnrollments, todayAttendance }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const createAndInviteStudent = async (req, res) => {
  try {
    const { name, email, rollNo, department, semester, batch } = req.body;
    const existing = await User.findOne({ email: email });
    if (existing) {
    return res.status(400).json({ message: "User already exists" });
    }
   // 1. Generate temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex");

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      name,
      email,
      rollNo,
      department,
      semester,
      batch,
      role: 'student',
      password: hashedPassword,
      isApproved: true,  
      isActive: true
    });

    // 4. Send email
   await transporter.sendMail({
      to: email,
      subject: "Your Student Account Access",
      html: `
        <h3>Hello ${name},</h3>
        <p>Your Student account has been created.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please change your password after login.</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: `Invite sent to ${email}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const {
      name,
      code,
      department,
      semester,
      creditHours,
      teacher,
      schedule
    } = req.body;

    const subject = new Subject({
      name,
      code,
      department,
       semester,
      creditHours,
      teacher
    });

    await subject.save();

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject
    });
  }catch(err){
    res.status(500).json({ success: false, error: err.message });
  }
}

const getSubject = async (req, res) => {
  try{
      const subjects = await Subject.find()
      .populate('teacher', 'name email')
      .populate('students', 'name email');

     res.json(subjects);
  }catch(err){
    res.status(500).json({ success: false, error: err.message });
  }
}

const assignSubjectToTeacher = async (req, res) => {
  try {
    const { subjectId, teacherId } = req.body;

    // 1. Check teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // 2. Update subject
    const subject = await Subject.findByIdAndUpdate(
      subjectId,
      { teacher: teacherId },
      { new: true }
    ).populate('teacher', 'name email');

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.json({
      message: "Subject assigned to teacher successfully",
      subject
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
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
}
