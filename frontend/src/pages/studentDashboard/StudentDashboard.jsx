// frontend/src/pages/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('user') || '{}');

  const [todayRecords,  setTodayRecords]  = useState([]);
  const [summary,       setSummary]       = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [todayRes, summaryRes, recentRes] = await Promise.all([
        API.get('http://localhost:3000/api/student/today'),
        API.get('http://localhost:3000/api/student/summary'),
        API.get('http://localhost:3000/api/student/attendance')
      ]);
      setTodayRecords(todayRes.data.data   || []);
      setSummary(summaryRes.data.data      || []);
      setRecentRecords(recentRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── CALCULATE OVERALL PERCENTAGE ──────────────────────────
  const overallPercentage = summary.length > 0
    ? Math.round(
        summary.reduce((sum, s) => sum + s.percentage, 0) / summary.length
      )
    : 0;

  const totalPresent = summary.reduce((sum, s) => sum + s.presentCount,  0);
  const totalClasses = summary.reduce((sum, s) => sum + s.totalClasses,  0);

  // ── STATUS COLOR ──────────────────────────────────────────
  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'bg-green-100 text-green-700';
      case 'absent':  return 'bg-red-100 text-red-700';
      case 'late':    return 'bg-yellow-100 text-yellow-700';
      case 'manual':  return 'bg-blue-100 text-blue-700';
      default:        return 'bg-gray-100 text-gray-700';
    }
  };

  // ── PERCENTAGE COLOR ──────────────────────────────────────
  const getPercentageColor = (pct) => {
    if (pct >= 75) return 'text-green-600';
    if (pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (pct) => {
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">SA</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">
                Smart Attendance
              </span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-blue-600 font-medium text-sm border-b-2 border-blue-600 pb-1"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/mark-attendance')}
                className="text-gray-500 hover:text-gray-800 text-sm font-medium"
              >
                Mark Attendance
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="text-gray-500 hover:text-gray-800 text-sm font-medium"
              >
                Profile
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-500">{user.enrollment?.rollNo}</p>
              </div>
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-700 font-medium ml-2"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome Banner */}
        <div className=" from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Welcome back, {user.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-blue-200 text-sm">
                {user.enrollment?.department} — Semester {user.enrollment?.semester}
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric',
                  month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={() => navigate('/mark-attendance')}
              className="bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition text-sm shadow-md"
            >
              Mark Attendance
            </button>
          </div>
        </div>

        {/* ── STATS CARDS ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          {/* Overall Attendance */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Overall
              </p>
              <span className="text-2xl">📊</span>
            </div>
            <p className={`text-3xl font-bold ${getPercentageColor(overallPercentage)}`}>
              {overallPercentage}%
            </p>
            <p className="text-gray-400 text-xs mt-1">Attendance rate</p>
          </div>

          {/* Classes Attended */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Attended
              </p>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalPresent}</p>
            <p className="text-gray-400 text-xs mt-1">of {totalClasses} classes</p>
          </div>

          {/* Today Status */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Today
              </p>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {todayRecords.length}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {todayRecords.length > 0 ? 'Classes marked' : 'Not marked yet'}
            </p>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                Subjects
              </p>
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{summary.length}</p>
            <p className="text-gray-400 text-xs mt-1">Enrolled subjects</p>
          </div>
        </div>

        {/* ── MAIN GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Subject Attendance — Left (2 cols) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Subject Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">
                  Subject-wise Attendance
                </h2>
              </div>

              <div className="p-5 space-y-4">
                {summary.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No attendance records yet
                  </p>
                ) : (
                  summary.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {item.subject?.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.subject?.code} • {item.presentCount}/{item.totalClasses} classes
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${getPercentageColor(Math.round(item.percentage))}`}>
                            {Math.round(item.percentage)}%
                          </span>
                          {item.percentage < 75 && (
                            <p className="text-xs text-red-400">⚠️ Low</p>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(Math.round(item.percentage))}`}
                          style={{ width: `${Math.round(item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Attendance Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-semibold text-gray-800">Recent Attendance</h2>
                <span className="text-xs text-gray-400">Last 10 records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                        Subject
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                        Time
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentRecords.slice(0, 10).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-gray-400 text-sm py-8">
                          No attendance records yet
                        </td>
                      </tr>
                    ) : (
                      recentRecords.slice(0, 10).map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-gray-800">
                              {record.subject?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {record.subject?.code}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {new Date(record.markedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {record.faceConfidence
                              ? `${(record.faceConfidence * 100).toFixed(0)}%`
                              : 'Manual'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">

            {/* Today's Attendance */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Today</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long', month: 'short', day: 'numeric'
                  })}
                </p>
              </div>

              <div className="p-5 space-y-3">
                {todayRecords.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-4xl mb-2">📋</p>
                    <p className="text-gray-400 text-sm">No attendance marked today</p>
                    <button
                      onClick={() => navigate('/mark-attendance')}
                      className="mt-3 text-blue-600 text-sm font-medium hover:underline"
                    >
                      Mark now →
                    </button>
                  </div>
                ) : (
                  todayRecords.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {record.subject?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.markedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="text-green-600 text-lg">✅</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">My Profile</h2>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Roll No',     value: user.enrollment?.rollNo },
                    { label: 'Department',  value: user.enrollment?.department },
                    { label: 'Semester',    value: user.enrollment?.semester },
                    { label: 'Batch',       value: user.enrollment?.batch }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-gray-700 font-medium">
                        {item.value || '—'}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/profile')}
                  className="w-full mt-4 border border-gray-200 text-gray-600 text-sm py-2 rounded-xl hover:bg-gray-50 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Low Attendance Warning */}
            {summary.some(s => s.percentage < 75) && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-semibold text-red-700 text-sm">
                      Low Attendance Warning
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                      You have low attendance in:
                    </p>
                    {summary
                      .filter(s => s.percentage < 75)
                      .map((s, i) => (
                        <p key={i} className="text-red-500 text-xs font-medium mt-1">
                          • {s.subject?.name} ({Math.round(s.percentage)}%)
                        </p>
                      ))
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Quick Actions</h2>
              </div>
              <div className="p-5 space-y-2">
                {[
                  {
                    label: '📷 Mark Attendance',
                    action: () => navigate('/mark-attendance'),
                    style: 'bg-blue-600 text-white hover:bg-blue-700'
                  },
                  {
                    label: '👤 View Profile',
                    action: () => navigate('/profile'),
                    style: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  },
                  {
                    label: '🔄 Refresh Data',
                    action: fetchAllData,
                    style: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                ].map((btn, i) => (
                  <button
                    key={i}
                    onClick={btn.action}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition ${btn.style}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;