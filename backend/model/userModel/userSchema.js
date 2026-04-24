// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true       // stored as bcrypt hash
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },

  // Student-specific fields
  rollNo: {
    type: String,
    unique: true,
    sparse: true         // only required for students, null for others
  },
  department: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    min: 1,
    max: 8
  },
  batch: {
    type: String,        // e.g. "2021-2025"
    trim: true
  },

  // Teacher-specific fields
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  designation: {
    type: String,        // e.g. "Lecturer", "Assistant Professor"
    trim: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],

  // Face Enrollment
  faceEmbedding: {
    type: [Number],      // 128-dimensional FaceNet vector
    default: []
  },
  enrollmentStatus: {
    type: String,
    enum: ['not_enrolled', 'pending', 'approved', 'rejected'],
    default: 'not_enrolled'
  },
  enrollmentDate: {
    type: Date
  },

  // Account Status
  accountStatus: {
    type: String,
    enum: ['invited', 'active', 'deactivated'],
    default: 'invited'
  },

  // Password Reset
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  },
  refreshToken:{
   type:String,
    default:null
  },

  // Profile
  phone: {
    type: String,
    trim: true
  },
  profilePhoto: {
    type: String         // URL/path — only stored during enrollment approval window
  }

}, { timestamps: true }); // adds createdAt and updatedAt automatically

module.exports = mongoose.model('User', userSchema);