// src/pages/admin/tabs/DashboardTab.jsx
export default function DashboardTab({
  overview, students, pendingEnroll, todayAttend, onTabChange
}) {
  return (
    <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',      value: overview.totalStudents,      icon: '👨‍🎓', color: 'bg-blue-50 text-blue-600',     border: 'border-blue-100'   },
          { label: 'Total Teachers',      value: overview.totalTeachers,      icon: '👨‍🏫', color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
          { label: "Today's Attendance",  value: overview.todayAttendance,    icon: '✅',  color: 'bg-green-50 text-green-600',   border: 'border-green-100'  },
          { label: 'Pending Enrollments', value: overview.pendingEnrollments, icon: '⏳',  color: 'bg-yellow-50 text-yellow-600', border: 'border-yellow-100' }
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

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Add Student',      icon: '➕', tab: 'students'    },
            { label: 'Enrollments',      icon: '📷', tab: 'enrollments' },
            { label: 'View Attendance',  icon: '📋', tab: 'attendance'  },
            { label: 'Set Geofence',     icon: '📍', tab: 'geofence'    }
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => onTabChange(action.tab)}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-xl transition"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-xs font-medium text-gray-600">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pending Enrollments Alert */}
      {pendingEnroll.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-yellow-800">
                  {pendingEnroll.length} Pending Enrollment(s)
                </p>
                <p className="text-yellow-600 text-sm">
                  Students waiting for face enrollment approval
                </p>
              </div>
            </div>
            <button
              onClick={() => onTabChange('enrollments')}
              className="bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 transition"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Recent Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Recent Students</h2>
          <button
            onClick={() => onTabChange('students')}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            View all →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Name', 'Roll No', 'Department', 'Enrollment', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.slice(0, 5).map((student, i) => (
                <tr key={i} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">
                          {student.name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{student.rollNo || '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{student.department || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize
                      ${student.enrollmentStatus === 'approved' ? 'bg-green-100 text-green-700'   :
                        student.enrollmentStatus === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                        student.enrollmentStatus === 'rejected' ? 'bg-red-100 text-red-700'       :
                        'bg-gray-100 text-gray-600'}`}
                    >
                      {student.enrollmentStatus || 'not enrolled'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                      ${student.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}