
const Geofence = require('../../model/geofenceModel/geofenceSchema.js')

const createGeofence = async (req, res) => {
  try {
    const { name, description, center, radius, applicableSubjects } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    if (
      !center ||
      center.lat === undefined ||
      center.lng === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Center coordinates are required'
      });
    }

    const lat = Number(center.lat);
    const lng = Number(center.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    const geofence = await Geofence.create({
      name,
      description: description || '',
      center: { lat, lng },
      radius: Number(radius) || 100,
      createdBy: req.user?.id || null,
      applicableSubjects: applicableSubjects || []
    });

    res.status(201).json({
      success: true,
      data: geofence
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// GET ALL
const getGeofences = async (req, res) => {
  try {
    const geofences = await Geofence.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: geofences
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE (used for toggle too)
const updateGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.status(200).json({
      success: true,
      data: geofence
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
const deleteGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findByIdAndDelete(req.params.id);

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deleted successfully'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
    createGeofence,
    getGeofences,
    updateGeofence,
    deleteGeofence,
}