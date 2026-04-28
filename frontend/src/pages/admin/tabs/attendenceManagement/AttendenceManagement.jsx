import { useState } from 'react';
import API from '../../../../api/axios';

function AttendenceManagement({ records, onRefresh }) {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter,   setDateFilter]   = useState('');

  const filtered = records.filter(r => {
    const matchSearch = (
      r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student?.rollNo?.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchDate   = !dateFilter ||
      new Date(r.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    return matchSearch && matchStatus && matchDate;
  });

  const handleExport = () => {
    const rows = [['Student', 'Roll No', 'Subject', 'Date', 'Time', 'Status', 'Confidence']];
    filtered.forEach(r => {
      rows.push([
        r.student?.name,
        r.student?.rollNo,
        r.subject?.name,
        new Date(r.date).toLocaleDateString(),
        new Date(r.markedAt).toLocaleTimeString(),
        r.status,
        r.faceConfidence ? `${(r.faceConfidence * 100).toFixed(0)}%` : 'Manual'
      ]);
    });
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `attendance_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const handleOverride = async (id) => {
    const status = prompt('Enter new status (present/absent/late):');
    if (!['present', 'absent', 'late'].includes(status)) {
      alert('Invalid status. Enter: present, absent, or late');
      return;
    }
    const reason = prompt('Enter override reason:');
    try {
      await API.put(`/admin/attendance/${id}`, { status, overrideReason: reason });
      alert('Attendance updated');
      onRefresh();
    } catch (err) {
      alert('Failed to update');
    }
  };

  return (
    <div className="space-y-4">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search student..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="manual">Manual</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none"
        />
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition whitespace-nowrap"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Records ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Student', 'Subject', 'Date', 'Time', 'Status', 'Confidence', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 text-sm py-8">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((record, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800">{record.student?.name}</p>
                      <p className="text-xs text-gray-400">{record.student?.rollNo}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{record.subject?.name}</td>
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
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize
                        ${record.status === 'present' ? 'bg-green-100 text-green-700'   :
                          record.status === 'absent'  ? 'bg-red-100 text-red-700'       :
                          record.status === 'late'    ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {record.faceConfidence
                        ? `${(record.faceConfidence * 100).toFixed(0)}%`
                        : 'Manual'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleOverride(record._id)}
                        className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-2.5 py-1 rounded-lg border border-yellow-200 transition"
                      >
                        Override
                      </button>
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

export default AttendenceManagement