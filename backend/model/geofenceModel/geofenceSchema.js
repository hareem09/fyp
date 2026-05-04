// models/Geofence.js
// backend/models/Geofence.js
const mongoose = require('mongoose');

const geofenceSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  radius:    { type: Number, required: true, default: 100 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',
    required: true
  },
  applicableSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Subject'
  }],
  isActive: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.model('Geofence', geofenceSchema);