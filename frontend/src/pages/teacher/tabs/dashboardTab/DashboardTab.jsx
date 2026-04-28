// src/pages/teacher/tabs/DashboardTab.jsx
const DashboardTab = ({
  teacher, stats, subjects, todayRecords, onTabChange
}) => {
  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-green-600 to-green-800 rounded-2xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Welcome, {teacher.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-green-200 text-sm">
              {teacher.designation || 'Teacher'} — Smart Attendance System
            </p>
            <p className="text-green-200 text-xs mt-1">
              {subjects.length} subject(s) • {stats.totalStudents} student(s)
            </p>
          </div>
          <button
            onClick={() => onTabChange('attendance')}
            className="bg-white text-green-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 transition text-sm shadow-md"
          >
            View Attendance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Students',   value: stats.totalStudents, icon: '👨‍🎓', color: 'bg-blue-50 text-blue-600',    border: 'border-blue-100'   },
          { label: 'Present Today', value: stats.todayPresent,  icon: '✅',  color: 'bg-green-50 text-green-600',  border: 'border-green-100'  },
          { label: 'Absent Today',  value: stats.todayAbsent,   icon: '❌',  color: 'bg-red-50 text-red-600',      border: 'border-red-100'    },
          { label: 'My Subjects',   value: stats.totalSubjects, icon: '📚',  color: 'bg-purple-50 text-purple-600',border: 'border-purple-100' }
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border ${stat.border}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                {stat.label}
              </p>
              <span className={`text-2xl p-1.5 rounded-lg ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Today + Subjects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Today's Attendance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">Today's Attendance</h2>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="p-5">
            {todayRecords.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-400 text-sm">No attendance marked today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayRecords.slice(0, 5).map((record, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">
                          {record.student?.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {record.student?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {record.subject?.name} • {new Date(record.markedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize
                      ${record.status === 'present' ? 'bg-green-100 text-green-700'   :
                        record.status === 'late'    ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}`}
                    >
                      {record.status}
                    </span>
                  </div>
                ))}
                {todayRecords.length > 5 && (
                  <button
                    onClick={() => onTabChange('attendance')}
                    className="w-full text-center text-green-600 text-sm hover:underline pt-2"
                  >
                    View all {todayRecords.length} records →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* My Subjects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">My Subjects</h2>
            <button
              onClick={() => onTabChange('subjects')}
              className="text-green-600 text-sm font-medium hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="p-5 space-y-3">
            {subjects.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">📚</p>
                <p className="text-gray-400 text-sm">No subjects assigned yet</p>
              </div>
            ) : (
              subjects.map((subject, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-bold">
                        {subject.code?.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{subject.name}</p>
                      <p className="text-xs text-gray-400">
                        {subject.code} • Semester {subject.semester}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-lg">
                    {subject.students?.length || 0} students
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'View Attendance', icon: '📋', tab: 'attendance' },
            { label: 'My Students',     icon: '👨‍🎓', tab: 'students'   },
            { label: 'My Subjects',     icon: '📚', tab: 'subjects'   },
            { label: 'Reports',         icon: '📊', tab: 'reports'    }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => onTabChange(action.tab)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-green-50 hover:border-green-200 border border-gray-100 rounded-xl transition"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
export default DashboardTab;