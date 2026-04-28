// frontend/src/pages/admin/AdminDashboard.jsx
// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import API                     from '../../../api/axios';

import DashboardTab    from '../tabs/dashboardTab/DashboardTab';
import StudentsTab     from '../tabs/studentManagement/StudentManagement';
// import EnrollmentsTab  from './tabs/EnrollmentsTab';
import AttendanceTab   from '../tabs/attendenceManagement/AttendenceManagement';
import GeofenceTab     from '../tabs/geofenceConfig/GeofenceConfig';
import ReportsTab      from '../tabs/reports/Reports';
import SubjectsTab from '../tabs/subjectManagement/SubjectManagement';
import AssignSubjectsTab from '../tabs/assignSubject/AssignSubject';
import CreateInvite from '../tabs/createInvite/CreateInvite';
export default function AdminDashboard() {
  const navigate   = useNavigate();
  const admin      = JSON.parse(localStorage.getItem('user') || '{}');

  const [activeTab,      setActiveTab]      = useState('dashboard');
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [loading,        setLoading]        = useState(true);
  const [overview,       setOverview]       = useState({
    totalStudents: '', totalTeachers: 0,
    todayAttendance: 0, pendingEnrollments: 0
  });
  const [students,       setStudents]       = useState([]);
  const [pendingEnroll,  setPendingEnroll]  = useState([]);
  const [todayAttend,    setTodayAttend]    = useState([]);
  const [allAttendance,  setAllAttendance]  = useState([]);
  const [geofences,      setGeofences]      = useState([]);
  const [subjects,       setSubjects]       = useState([]);
  
  useEffect(() => {
    fetchAllData();
  }, []);

  // ── FETCH ALL DATA ─────────────────────────────────────────
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [overviewRes, studentsRes, enrollRes, todayRes, allAttRes, geoRes, subjectRes] =
        await Promise.all([
          API.get('http://localhost:3000/api/admin/overview'),
          API.get('http://localhost:3000/api/admin/users?role=student'),
          API.get('http://localhost:3000/api/admin/users?enrollmentStatus=pending'),
          API.get('http://localhost:3000/api/admin/attendance/today'),
          API.get('http://localhost:3000/api/admin/attendance'),
          API.get('http://localhost:3000/api/admin/geofence'),
          API.get('http://localhost:3000/api/admin/subjects'),
       
        ]);

      const ov = overviewRes.data.data || overviewRes.data;
      setOverview({
        totalStudents:      ov.totalStudents      || 0,
        totalTeachers:      ov.totalTeachers      || 0,
        todayAttendance:    ov.todayAttendance    || 0,
        pendingEnrollments: ov.pendingEnrollments || 0
      });

      setStudents(studentsRes.data.data    || []);
      setPendingEnroll(enrollRes.data.data || []);
      setTodayAttend(todayRes.data.data    || []);
      setAllAttendance(allAttRes.data.data || []);
      setGeofences(geoRes.data.data        || []);
      setSubjects(subjectRes.data.data    || []);

    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  // ── ENROLLMENT ACTIONS ─────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await API.put(`/admin/enrollments/${id}/approve`);
      fetchAllData();
    } catch (err) {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await API.put(`/admin/enrollments/${id}/reject`, { reason });
      fetchAllData();
    } catch (err) {
      alert('Failed to reject');
    }
  };

  // ── SIDEBAR ────────────────────────────────────────────────
  const sidebarLinks = [
    { id: 'dashboard',   label: 'Dashboard',         icon: '🏠' },
    {
      id: 'inviteTeacher', label: 'Invite Teacher',   icon: '✉️'
    },
    { id: 'students',    label: 'Students',           icon: '👨‍🎓' },
    { id: 'enrollments', label: 'Enrollments',        icon: '📷' },
    { id: 'attendance',  label: 'Attendance',         icon: '📋' },
    { id: 'geofence',    label: 'Geofence',           icon: '📍' },
    { id: 'reports',     label: 'Reports',            icon: '📊' },
    { id: 'subjects',    label: 'Subjects',             icon: '📚' },
    { id: 'assign',      label: 'Assign Subjects',     icon: '🧑‍🏫'}
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 min-h-screen transition-all duration-300 flex flex-col`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">SA</span>
              </div>
              <span className="text-white font-bold text-sm">Smart Attendance</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map(link => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${activeTab === link.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="text-lg">{link.icon}</span>
              {sidebarOpen && <span>{link.label}</span>}
              {link.id === 'enrollments' && pendingEnroll.length > 0 && sidebarOpen && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingEnroll.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700">
          <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {admin.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{admin.name}</p>
                <p className="text-gray-400 text-xs truncate">{admin.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full mt-2 flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-gray-800 rounded-xl text-sm transition ${!sidebarOpen && 'justify-center'}`}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <main className="flex-1 overflow-auto">

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {sidebarLinks.find(l => l.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric',
                month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={fetchAllData}
            className="text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition"
          >
            🔄 Refresh
          </button>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              overview={overview}
              students={students}
              pendingEnroll={pendingEnroll}
              todayAttend={todayAttend}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab
              students={students}
              onRefresh={fetchAllData}
            />
          )}
          {activeTab === 'enrollments' && (
            <EnrollmentsTab
              students={pendingEnroll}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTab
              records={allAttendance}
              onRefresh={fetchAllData}
            />
          )}
          {activeTab === 'geofence' && (
            <GeofenceTab
              geofences={geofences}
              onRefresh={fetchAllData}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsTab
              students={students}
              records={allAttendance}
            />
          )}
          {activeTab === 'subjects' && (
            <SubjectsTab
              subjects={subjects}
              onRefresh={fetchAllData}
            />
          )}
          {activeTab === 'assignSubjects' && (
            <AssignSubjectsTab
              students={students}
              subjects={subjects}
              onRefresh={fetchAllData}
            />
          )}
          {activeTab === 'inviteTeacher' && (
            <CreateInvite />
          )}
        </div>
      </main>
    </div>
  );
}