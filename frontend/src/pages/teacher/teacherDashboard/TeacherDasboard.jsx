import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api/axios';

import DashboardTab  from '../tabs/dashboardTab/DashboardTab';
import AttendanceTab from '../tabs/attendanceTab/AttendanceTab';
import StudentsTab   from '../tabs/studentTab/StudentTab';
import SubjectsTab   from '../tabs/subjectTab/SubjectTab';
// import ReportsTab    from '../tabs/reportTab/ReportTab';

 function TeacherDashboard() {
  const navigate = useNavigate();
  const teacher  = JSON.parse(localStorage.getItem('user') || '{}');

  const [activeTab,    setActiveTab]    = useState('dashboard');
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [todayRecords, setTodayRecords] = useState([]);
  const [allRecords,   setAllRecords]   = useState([]);
  const [students,     setStudents]     = useState([]);
  const [subjects,     setSubjects]     = useState([]);
  const [stats,        setStats]        = useState({
    totalStudents: 0,
    todayPresent:  0,
    todayAbsent:   0,
    totalSubjects: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  // ── FETCH ALL DATA ─────────────────────────────────────────
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [todayRes, allRes, studentsRes, subjectsRes] = await Promise.all([
        API.get('http://localhost:3000/api/teacher/today'),
        API.get('http://localhost:3000/api/teacher/attendance'),
        API.get('http://localhost:3000/api/teacher/students'),
        API.get('http://localhost:3000/api/teacher/subjects')
      ]);

      const today = todayRes.data.data    || [];
      const all   = allRes.data.data      || [];
      const studs = studentsRes.data.data || [];
      const subs  = subjectsRes.data.data || [];

      setTodayRecords(today);
      setAllRecords(all);
      setStudents(studs);
      setSubjects(subs);
      setStats({
        totalStudents: studs.length,
        todayPresent:  today.filter(r => r.status === 'present').length,
        todayAbsent:   studs.length - today.filter(r => r.status === 'present').length,
        totalSubjects: subs.length
      });

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

  // ── SIDEBAR LINKS ──────────────────────────────────────────
  const sidebarLinks = [
    { id: 'dashboard',  label: 'Dashboard',   icon: '🏠' },
    { id: 'attendance', label: 'Attendance',   icon: '📋' },
    { id: 'students',   label: 'My Students',  icon: '👨‍🎓' },
    { id: 'subjects',   label: 'My Subjects',  icon: '📚' },
    { id: 'reports',    label: 'Reports',      icon: '📊' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 min-h-screen transition-all duration-300 flex flex-col`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">SA</span>
              </div>
              <span className="text-white font-bold text-sm">Smart Attendance</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 transition"
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
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span className="text-lg">{link.icon}</span>
              {sidebarOpen && <span>{link.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700">
          <div className={`flex items-center gap-3 px-3 py-2 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {teacher.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{teacher.name}</p>
                <p className="text-gray-400 text-xs truncate">{teacher.email}</p>
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

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
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
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{teacher.name}</p>
              <p className="text-xs text-gray-400">{teacher.designation || 'Teacher'}</p>
            </div>
            <button
              onClick={fetchAllData}
              className="text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab
              teacher={teacher}
              stats={stats}
              subjects={subjects}
              todayRecords={todayRecords}
              onTabChange={setActiveTab}
            />
          )}
          {activeTab === 'attendance' && (
            <AttendanceTab
              records={allRecords}
              onRefresh={fetchAllData}
            />
          )}
          {activeTab === 'students' && (
            <StudentsTab
              students={students}
            />
          )}
          {activeTab === 'subjects' && (
            <SubjectsTab
              subjects={subjects}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsTab
              students={students}
              records={allRecords}
            />
          )}
        </div>
      </main>
    </div>
  );
}
export default TeacherDashboard;