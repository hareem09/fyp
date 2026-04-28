import { useState,useEffect } from 'react';
import API from '../../../../api/axios';

export default function SubjectManagement({ onRefresh }) {
  const [form,     setForm]     = useState({
    name:        '',
    code:        '',
    creditHours: '3',
    department:  '',
    semester:    '',
    teacher:     ''
  });
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  // ── FETCH TEACHERS FOR DROPDOWN ────────────────────────────
  const fetchTeachers = async () => {
    try {
      const res = await API.get('http://localhost:3000/api/admin/users?role=teacher');
      setTeachers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch teachers');
    }
  };

  // ── FETCH ALL SUBJECTS ─────────────────────────────────────
  const fetchSubjects = async () => {
    try {
      const res = await API.get('http://localhost:3000/api/admin/subjects');
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects');
    }
  };

  // ── HANDLE INPUT CHANGE ────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── CREATE SUBJECT ─────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.post('http://localhost:3000/api/admin/create-subject', {
        name:        form.name,
        code:        form.code,
        creditHours: parseInt(form.creditHours),
        department:  form.department,
        semester:    parseInt(form.semester),
        teacher:     form.teacher
      });

      alert('Subject created successfully');

      // Reset form
      setForm({
        name: '', code: '', creditHours: '3',
        department: '', semester: '', teacher: ''
      });

      setShowForm(false);
      fetchSubjects();

      // Call parent refresh if provided
      if (onRefresh) onRefresh();

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  // ── DELETE SUBJECT ─────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await API.delete(`http://localhost:3000/api/admin/subjects/${id}`);
      fetchSubjects();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-sm">
          Manage subjects and assign teachers
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          ➕ Add Subject
        </button>
      </div>

      {/* Add Subject Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">New Subject</h3>

          <form onSubmit={handleCreate} className="space-y-3">

            {/* Name and Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Database Systems"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="CS-401"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Department and Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  placeholder="Computer Science"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Semester
                </label>
                <select
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Credit Hours and Teacher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Credit Hours
                </label>
                <select
                  name="creditHours"
                  value={form.creditHours}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {[1,2,3,4].map(c => (
                    <option key={c} value={c}>{c} Credit Hours</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assign Teacher
                </label>
                <select
                  name="teacher"
                  value={form.teacher}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} — {t.designation || 'Teacher'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Creating...' : 'Create Subject'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subjects List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            All Subjects ({subjects.length})
          </h2>
        </div>

        {subjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-500 font-medium">No subjects yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Click Add Subject to create one
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Subject', 'Code', 'Department', 'Semester', 'Credits', 'Teacher', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subjects.map((subject, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 text-xs font-bold">
                            {subject.code?.slice(0, 2)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">
                          {subject.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {subject.code}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {subject.department || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {subject.semester || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {subject.creditHours || 3}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {subject.teacher?.name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(subject._id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-2.5 py-1 rounded-lg border border-red-200 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}