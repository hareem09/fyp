import React from 'react'
import { useState } from 'react';
import API from '../../../../api/axios';
function GeofenceConfig
({ geofences: initialGeofences, onRefresh }) {
  const [geofences, setGeofences] = useState(initialGeofences || []);
  const [showForm,  setShowForm]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [form,      setForm]      = useState({
    name: '', lat: '', lng: '', radius: 100
  });

  const fetchGeofences = async () => {
    try {
      const res = await API.get('/admin/geofence');
      setGeofences(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch geofences');
    }
  };

  const getMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
        alert('Location captured!');
      },
      () => alert('Location access denied')
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/admin/geofence', {
        name:   form.name,
        center: { lat: parseFloat(form.lat), lng: parseFloat(form.lng) },
        radius: parseInt(form.radius)
      });
      setShowForm(false);
      setForm({ name: '', lat: '', lng: '', radius: 100 });
      fetchGeofences();
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create geofence');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await API.put(`/admin/geofence/${id}`, { isActive: !isActive });
      fetchGeofences();
    } catch (err) {
      alert('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this geofence?')) return;
    try {
      await API.delete(`/admin/geofence/${id}`);
      fetchGeofences();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">Configure campus boundaries for attendance validation</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          ➕ Add Geofence
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">New Geofence</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                placeholder="Main Campus"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="29.3956"
                  value={form.lat}
                  onChange={e => setForm({ ...form, lat: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="71.6722"
                  value={form.lng}
                  onChange={e => setForm({ ...form, lng: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={getMyLocation}
              className="w-full border border-blue-200 text-blue-600 py-2 rounded-xl text-sm hover:bg-blue-50 transition"
            >
              📍 Use My Current Location
            </button>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Radius: {form.radius} meters
              </label>
              <input
                type="range"
                min="50" max="1000" step="50"
                value={form.radius}
                onChange={e => setForm({ ...form, radius: e.target.value })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>50m</span>
                <span>500m</span>
                <span>1000m</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Geofence'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Geofences List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {geofences.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-gray-500 font-medium">No geofences configured</p>
            <p className="text-gray-400 text-sm mt-1">Add a geofence to enable location validation</p>
          </div>
        ) : (
          geofences.map((fence, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{fence.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fence.center?.lat?.toFixed(4)}, {fence.center?.lng?.toFixed(4)}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                  ${fence.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {fence.isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📍</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((fence.radius / 1000) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{fence.radius}m</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(fence._id, fence.isActive)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition border
                    ${fence.isActive
                      ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                >
                  {fence.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(fence._id)}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-2 rounded-xl text-sm font-medium border border-red-200 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

}

export default GeofenceConfig