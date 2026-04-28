import { useState } from 'react';
import API from '../../../../api/axios';
function SubjectTab({ subjects }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length === 0 ? (
          <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-500 font-medium">No subjects assigned</p>
            <p className="text-gray-400 text-sm mt-1">Contact admin to assign subjects</p>
          </div>
        ) : (
          subjects.map((subject, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

              {/* Subject Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-sm">
                    {subject.code?.slice(0, 2)}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                  ${subject.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                >
                  {subject.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="font-semibold text-gray-800 mb-1">{subject.name}</h3>
              <p className="text-xs text-gray-400 mb-3">
                {subject.code} • {subject.creditHours || 3} Credit Hours
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Students',  value: subject.students?.length || 0 },
                  { label: 'Semester',  value: subject.semester || '—'       },
                  { label: 'Department',value: subject.department || '—'     },
                  { label: 'Credits',   value: subject.creditHours || 3      }
                ].map((item, j) => (
                  <div key={j} className="bg-gray-50 rounded-xl p-2.5">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Schedule */}
              {subject.schedule && subject.schedule.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Schedule</p>
                  <div className="space-y-1">
                    {subject.schedule.map((s, j) => (
                      <div key={j} className="flex justify-between text-xs bg-blue-50 rounded-lg px-3 py-1.5">
                        <span className="text-blue-600 font-medium">{s.day}</span>
                        <span className="text-blue-500">{s.startTime} — {s.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SubjectTab;