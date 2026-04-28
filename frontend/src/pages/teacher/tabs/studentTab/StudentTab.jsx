import { useState } from 'react';
import API from '../../../../api/axios';

function StudentTab({ students }) {
  const [search, setSearch] = useState('');

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())  ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">

      <input
        type="text"
        placeholder="Search by name, roll no, or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            My Students ({filtered.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Student', 'Roll No', 'Department', 'Semester', 'Enrollment'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 text-sm py-8">
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-sm font-bold">
                            {student.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {student.rollNo || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {student.department || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {student.semester || '—'}
                    </td>
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
export default StudentTab;