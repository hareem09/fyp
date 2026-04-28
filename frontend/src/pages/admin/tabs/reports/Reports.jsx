import { useState, useEffect } from 'react';
import API from '../../../../api//axios';

function Reports
({ students, records }) {
  const [reportData, setReportData] = useState([]);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/reports/summary');
      setReportData(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const lowAttendance  = reportData.filter(r => r.percentage < 75);
  const goodAttendance = reportData.filter(r => r.percentage >= 75);

  const handleExport = () => {
    const rows = [['Student', 'Roll No', 'Subject', 'Present', 'Total', 'Percentage', 'Status']];
    reportData.forEach(r => {
      rows.push([
        r.student?.name,
        r.student?.rollNo || '—',
        r.subject?.name,
        r.presentCount,
        r.totalClasses,
        `${Math.round(r.percentage)}%`,
        r.percentage >= 75 ? 'Good' : r.percentage >= 60 ? 'Warning' : 'Critical'
      ]);
    });
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `full_report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Students',  value: students.length,       icon: '👨‍🎓', color: 'bg-blue-50 text-blue-600'   },
          { label: 'Low Attendance',  value: lowAttendance.length,  icon: '⚠️',  color: 'bg-red-50 text-red-600'     },
          { label: 'Good Attendance', value: goodAttendance.length, icon: '✅',  color: 'bg-green-50 text-green-600' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-500 text-xs font-medium uppercase">{stat.label}</p>
              <span className={`text-xl p-2 rounded-xl ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition"
        >
          📥 Export Full Report
        </button>
      </div>

      {/* Low Attendance */}
      {lowAttendance.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-red-100">
          <div className="p-5 border-b border-red-100 flex items-center gap-2">
            <span>⚠️</span>
            <h2 className="font-semibold text-gray-800">
              Low Attendance Students ({lowAttendance.length})
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {lowAttendance.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 text-sm font-bold">
                    {item.student?.name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.student?.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.presentCount}/{item.totalClasses} • {item.subject?.name}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {Math.round(item.percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.round(item.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Report Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Full Attendance Report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Student', 'Subject', 'Present', 'Total', 'Percentage', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 text-sm py-8">
                    No report data available
                  </td>
                </tr>
              ) : (
                reportData.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">{item.student?.name}</p>
                      <p className="text-xs text-gray-400">{item.student?.rollNo}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{item.subject?.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{item.presentCount}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{item.totalClasses}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full
                              ${item.percentage >= 75 ? 'bg-green-500' :
                                item.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.round(item.percentage)}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold
                          ${item.percentage >= 75 ? 'text-green-600' :
                            item.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                        >
                          {Math.round(item.percentage)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                        ${item.percentage >= 75 ? 'bg-green-100 text-green-700' :
                          item.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}
                      >
                        {item.percentage >= 75 ? 'Good' : item.percentage >= 60 ? 'Warning' : 'Critical'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

}

export default Reports