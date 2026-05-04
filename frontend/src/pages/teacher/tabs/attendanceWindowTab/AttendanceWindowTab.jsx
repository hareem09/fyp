// src/pages/teacher/tabs/AttendanceWindowTab.jsx
import { useState, useEffect, useRef } from 'react';
import API from '../../../../api/axios';

export default function AttendanceWindowTab({ subjects }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [duration,        setDuration]        = useState(20);
  const [activeWindow,    setActiveWindow]    = useState(null);
  const [timeRemaining,   setTimeRemaining]   = useState(null);
  const [loading,         setLoading]         = useState(false);
  const timerRef = useRef(null);

  // ── CHECK FOR ACTIVE WINDOW ON MOUNT ──────────────────────
  useEffect(() => {
    if (selectedSubject) {
      checkActiveWindow(selectedSubject);
    }
  }, [selectedSubject]);

  // ── COUNTDOWN TIMER ───────────────────────────────────────
  useEffect(() => {
    if (activeWindow) {
      startCountdown();
    } else {
      clearInterval(timerRef.current);
      setTimeRemaining(null);
    }
    return () => clearInterval(timerRef.current);
  }, [activeWindow]);
   const fetchSubjects = async () => {
       try {
         const res = await API.get("http://localhost:3000/api/subjects/teacher-subjects");
         console.log("Subjects API response:", res.data.data); // 👈 ADD THIS
         setSubjects(res.data.data || []);
         setTeacherId(res.data[0]?.teacher?._id || "");
       } catch (err) {
         console.error("Failed to fetch subjects");
       }
     };
  const startCountdown = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!activeWindow) return;

      const remaining = new Date(activeWindow.expiresAt) - new Date();
      if (remaining <= 0) {
        setActiveWindow(null);
        setTimeRemaining(null);
        clearInterval(timerRef.current);
        return;
      }

      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining({ mins, secs, ms: remaining });
    }, 1000);
  };

  const checkActiveWindow = async (subjectId) => {
    try {
      const res = await API.get(`http://localhost:3000/api/teacher/attendance-window/active/${subjectId}`);
      if (res.data.isOpen) {
        setActiveWindow(res.data.data);
      } else {
        setActiveWindow(null);
      }
    } catch (err) {
      console.error('Failed to check window');
    }
  };

  // ── OPEN WINDOW ───────────────────────────────────────────
  const handleOpenWindow = async () => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }
    setLoading(true);
    try {
      const res = await API.post('http://localhost:3000/api/teacher/attendance-window/open', {
        subjectId: selectedSubject,
        duration
      });
      setActiveWindow(res.data.data);
      alert(`Attendance window opened for ${duration} minutes!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open window');
    } finally {
      setLoading(false);
    }
  };

  // ── CLOSE WINDOW ──────────────────────────────────────────
  const handleCloseWindow = async () => {
    if (!window.confirm('Close attendance window? Students will not be able to mark attendance.')) return;
    try {
      await API.put(`http://localhost:3000/api/teacher/attendance-window/close/${activeWindow._id}`);
      setActiveWindow(null);
      clearInterval(timerRef.current);
    } catch (err) {
      alert('Failed to close window');
    }
  };

  // ── PROGRESS PERCENTAGE ───────────────────────────────────
  const progressPercent = timeRemaining
    ? (timeRemaining.ms / (duration * 60 * 1000)) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* Select Subject */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Open Attendance Window</h2>

        <div className="space-y-4">
          {/* Subject Select */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choose a subject...</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} — {s.code} (Semester {s.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Duration Select */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Duration: {duration} minutes
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full"
              disabled={!!activeWindow}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 min</span>
              <span>30 min</span>
              <span>60 min</span>
            </div>
          </div>

          {/* Open Button */}
          {!activeWindow ? (
            <button
              onClick={handleOpenWindow}
              disabled={loading || !selectedSubject}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              {loading ? 'Opening...' : '🔓 Open Attendance Window'}
            </button>
          ) : (
            <button
              onClick={handleCloseWindow}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition"
            >
              🔒 Close Window Early
            </button>
          )}
        </div>
      </div>

      {/* Active Window Display */}
      {activeWindow && timeRemaining && (
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"/>
              <h2 className="font-semibold text-gray-800">Window is Open</h2>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              LIVE
            </span>
          </div>

          {/* Subject Info */}
          <div className="bg-green-50 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-gray-800">
              {activeWindow.subject?.name}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeWindow.subject?.code} • Opened at{' '}
              {new Date(activeWindow.openedAt).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          {/* Countdown */}
          <div className="text-center mb-4">
            <div className={`text-5xl font-bold mb-2 tabular-nums
              ${timeRemaining.mins < 5 ? 'text-red-600' : 'text-green-600'}`}
            >
              {String(timeRemaining.mins).padStart(2, '0')}:
              {String(timeRemaining.secs).padStart(2, '0')}
            </div>
            <p className="text-gray-400 text-sm">remaining</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-1000
                ${progressPercent > 50 ? 'bg-green-500' :
                  progressPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Marked Students */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-medium text-gray-500 mb-1">
              Students marked: {activeWindow.markedStudents?.length || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}