// backend/controllers/attendanceController.js
const axios      = require('axios');
const Attendance = require('../../model/attendanceModel/attendanceSchema.js');
const Geofence   = require('../../model/geofenceModel/geofenceSchema.js');

const markAttendance = async (req, res) => {
  try {
    const { frames, image, lat, lng, subjectId, teacherId } = req.body;
    const studentId = req.user.id;
    

    console.log('\n=== MARK ATTENDANCE ===');
    console.log('Student:', studentId);

    // ── CHECK DUPLICATE ───────────────────────────────
    const today = new Date().toISOString().split('T')[0];

    const alreadyMarked = await Attendance.findOne({
      student: studentId,
      subject: subjectId,
      date: today
    });

    if (alreadyMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for today'
      });
    }

    // ── STEP 1: LIVENESS ─────────────────────────────
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

    if (!livenessResult.is_live) {
      return res.status(400).json({
        success: false,
        message: livenessResult.reason,
        step: 'liveness'
      });
    }

    // ── STEP 2: FACE RECOGNITION ─────────────────────
    console.log('Step 2: Recognizing face...');

    try {
      const recognizeRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/recognize`,
        { image }
      );
      const recognizeResult = recognizeRes.data;
      console.log('Recognition result:', recognizeResult);
  //      if (!recognizeResult.success) {
  //     return res.status(401).json({
  //       success: false,
  //       message: recognizeResult.message,
  //       step: 'recognition'
  //     });
  //   }
  //  const { userId, confidence, success } = recognizeResult.data;
  //   if (userId !== studentId) {
  //     return res.status(401).json({
  //       success: false,
  //       message: 'Face does not match your enrolled profile',
  //       step: 'recognition'
  //     });
  //   }
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'AI service is not running on port 8000'
        });
      }
      throw err;
    }

    

    // ── STEP 3: GEOFENCE ─────────────────────────────
    console.log('Step 3: Validating geofence...');

    const geofences = await Geofence.find({ isActive: true });

    let geofenceResult;
    try {
      const geofenceRes = await axios.post(
        `${process.env.AI_SERVICE_URL}/geofence`,
        {
          userLat: lat,
          userLng: lng,
          geofences
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

    if (!geofenceResult.valid) {
      return res.status(403).json({
        success: false,
        message: geofenceResult.reason,
        step: 'geofence'
      });
    }

    // ── SAVE ATTENDANCE ──────────────────────────────
    console.log('All checks passed. Saving attendance...');

    const attendance = await Attendance.create({
      student: studentId,
      subject: subjectId,
      date: today,
      // faceConfidence: recognizeResult.confidence,
      livenessPass: livenessResult.is_live,
      geofencePass: true,
      location: { lat, lng },
      status: 'present',
      teacher: teacherId
    });

    console.log('✅ Attendance saved:', attendance._id);

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attendanceId: attendance._id,
        confidence: recognizeResult.confidence
      }
    });

  } catch (error) {
    console.error('❌ Attendance error:', error.message);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { markAttendance };