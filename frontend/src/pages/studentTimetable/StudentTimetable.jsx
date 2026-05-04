// src/pages/StudentTimetable.jsx
import { useState, useEffect } from 'react';
import API from '../api/axios';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function StudentTimetable() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await API.get('http://localhost:3000/api/subjects/student-subjects');
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  // Build timetable grid
  const timetable = DAYS.reduce((acc, day) => {
    acc[day] = subjects.filter(s =>
      s.schedule?.some(sc => sc.day === day)
    ).map(s => ({
      ...s,
      slot: s.schedule.find(sc => sc.day === day)
    }));
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Timetable</h1>
          <p className="text-gray-400 text-sm mt-1">
            Today is <span className="text-blue-600 font-medium">{today}</span>
          </p>
        </div>

        {/* Subject Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {subjects.map((subject, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">
                    {subject.code?.slice(0,2)}
                  </span>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">
                  Sem {subject.semester}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{subject.name}</h3>
              <p className="text-xs text-gray-400 mb-3">
                {subject.code} • {subject.creditHours} Credits
              </p>
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Teacher</p>
                <p className="text-sm text-gray-700">{subject.teacher?.name}</p>
                <p className="text-xs text-gray-400">{subject.teacher?.designation}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Weekly Schedule</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3 w-32">
                    Day
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">
                    Classes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {DAYS.map((day, i) => (
                  <tr
                    key={i}
                    className={`${day === today ? 'bg-blue-50' : 'hover:bg-gray-50'} transition`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {day === today && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"/>
                        )}
                        <span className={`text-sm font-medium
                          ${day === today ? 'text-blue-600' : 'text-gray-700'}`}
                        >
                          {day}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {timetable[day].length === 0 ? (
                        <p className="text-gray-300 text-sm">No classes</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {timetable[day].map((subject, j) => (
                            <div
                              key={j}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                                ${day === today
                                  ? 'bg-blue-100 border border-blue-200'
                                  : 'bg-gray-100 border border-gray-200'}`}
                            >
                              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">
                                  {subject.code?.slice(0,2)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-xs">
                                  {subject.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {subject.slot?.startTime} — {subject.slot?.endTime}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}