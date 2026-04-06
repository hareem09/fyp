// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout'
import ProtectedRoute from './components/protectedRoutes/ProtectedRoutes';

// Auth
import StudentLogin   from './pages/studentLogin/StudentLogin';
import AdminLogin     from './pages/adminLogin/AdminLogin';
import AcceptInvite   from './pages/acceptInvite/AcceptInvite';

// Student
import EnrollFace         from './pages/enrollFace/EnrollFace';
import MarkAttendance     from './pages/markAttendence/MarkAttendence';
import StudentDashboard   from './pages/studentDashboard/StudentDashboard';
import StudentProfile     from './pages/studentProfile/StudentProfile';

// Admin
import AdminDashboard      from './pages/admin/adminDashboard/AdminDashboard';
import StudentManagement   from './pages/admin/studentManagement/StudentManagement';
import CreateInvite from './pages/admin/createInvite/CreateInvite';
// import EnrollmentApprovals from './pages/admin/enrollment/EnrollmentApprovals';
import AttendanceManagement from './pages/admin/attendenceManagement/AttendenceManagement';
import GeofenceConfig      from './pages/admin/geofenceConfig/GeofenceConfig';
import Reports             from './pages/admin/reports/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login"              element={<StudentLogin />} />
        <Route path="/login/admin"        element={<AdminLogin />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/" element={<Layout />}>
        {/* Student Routes */}
        <Route path="/enroll-face" element={
          <ProtectedRoute role="student"><EnrollFace /></ProtectedRoute>
        }/>
        <Route path="/mark-attendance" element={
          <ProtectedRoute role="student"><MarkAttendance /></ProtectedRoute>
        }/>
        <Route path="/student/dashboard" element={
          <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
        }/>
        <Route path="/profile" element={
          <ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>
        }/>

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        }/>
        <Route path="/admin/students" element={
          <ProtectedRoute role="admin"><StudentManagement /></ProtectedRoute>
        }/>
        <Route path="/admin/create-invite" element={
          <ProtectedRoute role="admin"><CreateInvite /></ProtectedRoute>
        }/>
        {/* <Route path="/admin/enrollments" element={
          <ProtectedRoute role="admin"><EnrollmentApprovals /></ProtectedRoute>
        }/> */}
        <Route path="/admin/attendance" element={
          <ProtectedRoute role="admin"><AttendanceManagement /></ProtectedRoute>
        }/>
        <Route path="/admin/geofence" element={
          <ProtectedRoute role="admin"><GeofenceConfig /></ProtectedRoute>
        }/>
        <Route path="/admin/reports" element={
          <ProtectedRoute role="admin"><Reports /></ProtectedRoute>
        }/>
       </Route>
      </Routes>
    </BrowserRouter>
  );
}