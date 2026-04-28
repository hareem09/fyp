
import { useState } from 'react';
import API from '../../../../api/axios';

function StudentManagement({ students, onRefresh }) {
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({
    name: '', email: '', rollNo: '',
    department: '', semester: '', batch: ''
  });

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())  ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('http://localhost:3000/api/admin/invite-student', { ...form, role: 'student' });
      alert('Student created successfully');
      setShowModal(false);
      setForm({ name:'', email:'', rollNo:'', department:'', semester:'', batch:'' });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create student');
    }
  };

  const handleToggle = async (id) => {
    try {
      await API.put(`http://localhost:3000/api/admin/users/${id}/toggle-status`);
      onRefresh();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await API.delete(`http://localhost:3000/api/admin/users/${id}`);
      onRefresh();
    } catch (err) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="space-y-4">

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name, email, roll no..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          ➕ Add Student
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Students ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                {['Student', 'Roll No', 'Department', 'Semester', 'Enrollment', 'Status', 'Actions'].map(h => (
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
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">
                            {student.name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{student.rollNo     || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{student.department || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{student.semester   || '—'}</td>
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
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggle(student._id)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-lg transition"
                        >
                          {student.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Add New Student</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              {[
                { label: 'Full Name',  name: 'name',       type: 'text',     placeholder: 'Ahmed Raza'           },
                { label: 'Email',      name: 'email',      type: 'email',    placeholder: 'ahmed@university.edu' },
                { label: 'Roll No',    name: 'rollNo',     type: 'text',     placeholder: 'CS-2021-045'          },
                { label: 'Department', name: 'department', type: 'text',     placeholder: 'Computer Science'     },
                { label: 'Batch',      name: 'batch',      type: 'text',     placeholder: '2021-2025'            },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={e => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Semester</label>
                <select
                  value={form.semester}
                  onChange={e => setForm({ ...form, semester: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default StudentManagement