import { useState } from 'react';
import API from '../../../../api/axios';

function AssignSubject({ subjects, teachers, onRefresh }) {
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const handleAssign = async () => {
    if (!subjectId || !teacherId) {
      return alert('Please select both subject and teacher');
    }

    try {
      await API.put('/subjects/assign-teacher', {
        subjectId,
        teacherId
      });

      alert('Subject assigned successfully');
      setSubjectId('');
      setTeacherId('');
      onRefresh();

    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5 space-y-4">

      <h2 className="font-semibold text-gray-800">Assign Subject to Teacher</h2>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* Subject */}
        <select
          value={subjectId}
          onChange={e => setSubjectId(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Select Subject</option>
          {subjects.map(s => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>

        {/* Teacher */}
        <select
          value={teacherId}
          onChange={e => setTeacherId(e.target.value)}
          className="border rounded-xl px-3 py-2 text-sm"
        >
          <option value="">Select Teacher</option>
          {teachers.map(t => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>

      </div>

      {/* Button */}
      <button
        onClick={handleAssign}
        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-blue-700"
      >
        Assign
      </button>

    </div>
  );
}

export default AssignSubject