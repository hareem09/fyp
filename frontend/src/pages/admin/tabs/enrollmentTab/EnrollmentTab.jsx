
import { useState,useEffect } from 'react';
import API from '../../../../api/axios';
function EnrollmentTab({students,onReject, onApprove}) {
  const [search, setSearch] = useState('');
const [loadingApprove, setLoadingApprove] = useState(null);
  const [loadingReject,  setLoadingReject]  = useState(null);
  const [localStudents,  setLocalStudents]  = useState([]);

  // Initialize local students from props
  useEffect(() => {
    // Only show students with pending enrollment
    const pending = (students || []).filter(
      s => s.enrollmentStatus === 'pending'
    );
    setLocalStudents(pending);
  }, [students]);

  const filtered = localStudents.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase())  ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  );
 const handleApprove = async (id) => {
    try {
      await API.put(`http://localhost:3000/api/admin/enroll/${id}`);
      alert('Student enrolled successfully');
      setLocalStudents(prev => prev.filter(s => s._id !== id));

      onApprove(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setLoadingApprove(null);
    }
  };
//   const fetchEnrollStudents = async () =>{
//     try{
//         const res=await API.get('http://localhost:3000/api/admin/users?role=student&enrollmentStatus=approved')
//         setApproved(res.data.data);

//     }catch(err){
//         alert('Failed to fetch students');
//     }
//   }
//   const handleToggle = async (id) => {
//     try {
//       await API.put(`http://localhost:3000/api/admin/users/toggle-status/${id}`);
//       onRefresh();
//     } catch (err) {
//       alert('Failed to update status');
//     }
//   };

 const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await API.put(`/admin/reject/${id}`, { reason });
      alert('Enrollment rejected');
      if (onReject) onReject(id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject enrollment');
    }
  };

  return (
     <div className="space-y-4">

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-blue-700 text-sm">
          <strong>ℹ️ Instructions:</strong> Review each student's face
          enrollment request. Approve if valid. Reject with a reason if not.
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, email, roll no..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 font-medium">No pending enrollments</p>
          <p className="text-gray-400 text-sm mt-1">
            All enrollments have been reviewed
          </p>
        </div>
      ) : (
        <>
          {/* Count */}
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-800">
              {filtered.length}
            </span> pending enrollment(s)
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student, i) => (
              <div
                key={student._id || i}
                className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-5"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold text-lg">
                      {student.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {student.email}
                    </p>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'Roll No',    value: student.rollNo    },
                    { label: 'Department', value: student.department },
                    {
                      label: 'Semester',
                      value: student.semester
                        ? `Semester ${student.semester}`
                        : null
                    },
                    { label: 'Batch',      value: student.batch     },
                    {
                      label: 'Enrolled',
                      value: student.enrollmentDate
                        ? new Date(student.enrollmentDate).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : null
                    }
                  ].map((item, j) =>
                    item.value ? (
                      <div key={j} className="flex justify-between text-sm">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-gray-700 font-medium">
                          {item.value}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>

                {/* Pending Badge — always shown since all students here are pending */}
                <div className="flex items-center gap-2 mb-4 bg-yellow-50 rounded-xl px-3 py-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"/>
                  <span className="text-xs text-yellow-600 font-medium">
                    Pending Review
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(student._id)}
                    disabled={
                      loadingApprove === student._id ||
                      loadingReject  === student._id
                    }
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-medium transition"
                  >
                    {loadingApprove === student._id
                      ? '⏳ Approving...'
                      : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(student._id)}
                    disabled={
                      loadingReject  === student._id ||
                      loadingApprove === student._id
                    }
                    className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-500 py-2 rounded-xl text-sm font-medium border border-red-200 transition"
                  >
                    {loadingReject === student._id
                      ? '⏳ Rejecting...'
                      : '❌ Reject'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


export default EnrollmentTab