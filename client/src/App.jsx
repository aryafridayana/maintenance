import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import MobileNav from './components/Layout/MobileNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiftManagement from './pages/LiftManagement';
import Schedule from './pages/Schedule';
import MaintenanceForm from './pages/MaintenanceForm';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import TechnicianDashboard from './pages/TechnicianDashboard';
import TechSchedules from './pages/TechSchedules';
import TechHistory from './pages/TechHistory';
import TechProfile from './pages/TechProfile';

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'teknisi' ? '/tech' : '/dashboard'} replace />;
  }
  return children || <Outlet />;
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pageTitles = {
    '/dashboard': 'Dashboard',
    '/lifts': 'Kelola Lift',
    '/schedules': 'Jadwal Maintenance',
    '/maintenance-form': 'Form Maintenance',
    '/reports': 'Laporan',
    '/users': 'Manajemen User',
  };
  const currentPath = window.location.pathname;
  const title = pageTitles[currentPath] || 'LiftCare';

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header title={title} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Outlet />
      </div>
    </div>
  );
}

function TechLayout() {
  return (
    <div className="app-layout tech-mobile">
      <div className="main-content" style={{ marginLeft: 0 }}>
        <Outlet />
        <MobileNav />
      </div>
    </div>
  );
}

function MaintenanceFormWrapper() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (user?.role === 'teknisi') {
    return (
      <div className="app-layout tech-mobile">
        <div className="main-content" style={{ marginLeft: 0 }}>
          <MaintenanceForm />
          <MobileNav />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header title="Form Maintenance" onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <MaintenanceForm />
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'teknisi' ? '/tech' : '/dashboard'} /> : <Login />} />

      {/* Maintenance Form - accessible by ALL authenticated users */}
      <Route path="/maintenance-form" element={
        <ProtectedRoute allowedRoles={['superadmin', 'admin', 'teknisi']}>
          <MaintenanceFormWrapper />
        </ProtectedRoute>
      } />

      {/* Admin/SuperAdmin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lifts" element={<LiftManagement />} />
          <Route path="/schedules" element={<Schedule />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
      </Route>

      {/* Technician Routes */}
      <Route element={<ProtectedRoute allowedRoles={['teknisi']} />}>
        <Route element={<TechLayout />}>
          <Route path="/tech" element={<TechnicianDashboard />} />
          <Route path="/tech/schedules" element={<TechSchedules />} />
          <Route path="/tech/history" element={<TechHistory />} />
          <Route path="/tech/profile" element={<TechProfile />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user?.role === 'teknisi' ? '/tech' : user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
