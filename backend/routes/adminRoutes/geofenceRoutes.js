const express = require("express");
const router = express.Router();
const {authenticateToken} = require("../../middleware/authenticateToken.js");
const geofenceController = require("../../controller/admin/geofenceController.js");

const {
  createGeofence,
  getGeofences,
  updateGeofence,
  deleteGeofence,
}=geofenceController;

router.use(authenticateToken);
router.post('/geofence',createGeofence);
router.get('/geofence',getGeofences);
router.put('/geofence/:id',updateGeofence);
router.delete('/geofence/:id',deleteGeofence);
// router.post('/geofence/toggle/:id', toggleGeofence);

module.exports=router;