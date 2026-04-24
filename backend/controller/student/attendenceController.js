// backend/controllers/attendanceController.js
const axios      = require('axios');
const Attendance = require('../../model/attendanceModel/attendanceSchema.js');
const Geofence   = require('../../model/geofenceModel/geofenceSchema.js');

const markAttendance = async (req, res) => {
  try {
    const { frames, image, lat, lng, subjectId } = req.body;
    const studentId = req.user.id;

    console.log('\n=== MARK ATTENDANCE ===');
    console.log('Student:', studentId);

    // ── CHECK DUPLICATE ────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const alreadyMarked = await Attendance.findOne({
      student: studentId,
      subject: subjectId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today'
      });
    }

    // ── STEP 1: CALL PYTHON FOR LIVENESS ──────────────────
    console.log('Step 1: Checking liveness...');
    let livenessResult;

    try {
      const livenessRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/liveness`,
        { frames }
      );
      livenessResult = livenessRes.data;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'AI service is not running on port 8000'
        });
      }
      throw err;
    }

    console.log('Liveness result:', livenessResult.is_live);

    if (!livenessResult.is_live) {
      return res.status(400).json({
        success: false,
        message:  livenessResult.reason,
        step:    'liveness'
      });
    }

    // ── STEP 2: CALL PYTHON FOR FACE RECOGNITION ──────────
    console.log('Step 2: Recognizing face...');
    let recognizeResult;

    try {
      const recognizeRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/recognize`,
        { image }
      );
      recognizeResult = recognizeRes.data;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'AI service is not running on port 8000'
        });
      }
      throw err;
    }

    console.log('Recognition result:', recognizeResult.success);
    console.log('Recognized userId:', recognizeResult.userId);
    console.log('Confidence:', recognizeResult.confidence);

    if (!recognizeResult.success) {
      return res.status(401).json({
        success: false,
        message:  recognizeResult.message,
        step:    'recognition'
      });
    }

    // Make sure recognized face matches logged in student
    if (recognizeResult.userId !== studentId.toString()) {
      return res.status(401).json({
        success: false,
        message: 'Face does not match your enrolled profile',
        step:    'recognition'
      });
    }

    // ── STEP 3: CALL PYTHON FOR GEOFENCE ──────────────────
    console.log('Step 3: Validating geofence...');

    // Get all active geofences from MongoDB
    const geofences = await Geofence.find({ isActive: true });

    let geofenceResult;
    try {
      const geofenceRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/geofence`,
        {
          userLat:   lat,
          userLng:   lng,
          geofences: geofences
        }
      );
      geofenceResult = geofenceRes.data;
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'AI service is not running on port 8000'
        });
      }
      throw err;
    }

    console.log('Geofence result:', geofenceResult.valid);

    if (!geofenceResult.valid) {
      return res.status(403).json({
        success: false,
        message:  geofenceResult.reason,
        step:    'geofence'
      });
    }

    // ── ALL 3 CHECKS PASSED — SAVE TO MONGODB ─────────────
    console.log('All checks passed. Saving attendance...');

    const attendance = await Attendance.create({
      student:        studentId,
      subject:        subjectId,
      date:           new Date(),
      markedAt:       new Date(),
      faceConfidence: recognizeResult.confidence,
      livenessPass:   true,
      geofencePass:   true,
      location:       { lat, lng },
      status:         'present'
    });

    console.log('✅ Attendance saved:', attendance._id);

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendanceId: attendance._id,
        markedAt:     attendance.markedAt,
        confidence:   recognizeResult.confidence
      }
    });

  } catch (error) {
    console.error('❌ Attendance error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { markAttendance };