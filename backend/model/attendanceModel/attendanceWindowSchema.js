// backend/models/AttendanceWindow.js
const mongoose = require('mongoose');

const attendanceWindowSchema = new mongoose.Schema({
  // Which subject this window is for
  subject: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Subject',
    required: true
  },

  // Which teacher opened it
  teacher: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },

  // Window timing
  openedAt:  { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },   // openedAt + 20 minutes
  duration:  { type: Number, default: 20 },    // minutes

  // Status
  isOpen: { type: Boolean, default: true },

  // Which students marked during this window
  markedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User'
  }]

}, { timestamps: true });

module.exports = mongoose.model('AttendanceWindow', attendanceWindowSchema);