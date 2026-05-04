// src/pages/teacher/tabs/TimetableTab.jsx
import { useState } from 'react';
import API from '../../../../api/axios';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function TimetableTab({ subjects, onRefresh }) {
  const [editingSubject, setEditingSubject] = useState(null);
  const [schedule,       setSchedule]       = useState([]);
  const [loading,        setLoading]        = useState(false);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // Build timetable
  const timetable = DAYS.reduce((acc, day) => {
    acc[day] = subjects.filter(s =>
      s.schedule?.some(sc => sc.day === day)
    ).map(s => ({
      ...s,
      slot: s.schedule.find(sc => sc.day === day)
    }));
    return acc;
  }, {});

  const handleEditSchedule = (subject) => {
    setEditingSubject(subject);
    setSchedule(subject.schedule || []);
  };

  const addSlot = () => {
    setSchedule([...schedule, { day: 'Monday', startTime: '09:00', endTime: '10:30' }]);
  };

  const removeSlot = (index) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    setSchedule(updated);
  };

  const handleSaveSchedule = async () => {
    setLoading(true);
    try {
      await API.post('http://localhost:3000/api/teacher/subjects/schedule', {
        subjectId: editingSubject._id,
        schedule
      });
      alert('Schedule saved!');
      setEditingSubject(null);
      onRefresh();
    } catch (err) {
      alert('Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Weekly Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">My Weekly Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3 w-32">
                  Day
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                  Classes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {DAYS.map((day, i) => (
                <tr
                  key={i}
                  className={`${day === today ? 'bg-green-50' : 'hover:bg-gray-50'} transition`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {day === today && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"/>
                      )}
                      <span className={`text-sm font-medium
                        ${day === today ? 'text-green-600' : 'text-gray-700'}`}
                      >
                        {day}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {timetable[day].length === 0 ? (
                      <p className="text-gray-300 text-sm">No classes</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {timetable[day].map((subject, j) => (
                          <div
                            key={j}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl
                              ${day === today
                                ? 'bg-green-100 border border-green-200'
                                : 'bg-gray-100 border border-gray-200'}`}
                          >
                            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-green-600">
                                {subject.code?.slice(0,2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-xs">{subject.name}</p>
                              <p className="text-xs text-gray-400">
                                {subject.slot?.startTime} — {subject.slot?.endTime}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Schedule Per Subject */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Edit Subject Schedules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{subject.name}</p>
                  <p className="text-xs text-gray-400">{subject.code} • Sem {subject.semester}</p>
                </div>
                <button
                  onClick={() => handleEditSchedule(subject)}
                  className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-lg border border-green-200 hover:bg-green-100 transition"
                >
                  Edit Schedule
                </button>
              </div>
              {subject.schedule?.length > 0 ? (
                <div className="space-y-1 mt-2">
                  {subject.schedule.map((slot, j) => (
                    <div key={j} className="flex justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                      <span className="font-medium text-gray-600">{slot.day}</span>
                      <span className="text-gray-400">{slot.startTime} — {slot.endTime}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-300 mt-2">No schedule set</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Schedule Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-800">Edit Schedule</h3>
                <p className="text-xs text-gray-400">{editingSubject.name}</p>
              </div>
              <button
                onClick={() => setEditingSubject(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {schedule.map((slot, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={slot.day}
                    onChange={e => updateSlot(i, 'day', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={e => updateSlot(i, 'startTime', e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={e => updateSlot(i, 'endTime', e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => removeSlot(i)}
                    className="text-red-400 hover:text-red-600 text-lg px-1"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addSlot}
                className="w-full border border-dashed border-gray-300 text-gray-400 py-2 rounded-xl text-sm hover:border-green-400 hover:text-green-500 transition"
              >
                ➕ Add Time Slot
              </button>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setEditingSubject(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}