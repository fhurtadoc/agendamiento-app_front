import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- VISTAS DE AUTENTICACIÓN (Públicas) ---
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ForgotPasswordView from './views/ForgotPasswordView';
import UpdatePasswordView from './views/UpdatePasswordView';

// --- VISTA DE BLOQUEO (Seguridad) ---
import ChangePasswordView from './views/employee/ChangePasswordView';

// --- VISTAS CLIENTE ---
import HomeView from './views/HomeView';
import ProfileView from './views/ProfileView';
import EditProfileView from './views/EditProfileView';
import BookingWizard from './views/BookingWizard';
import LanguageView from './views/LanguageView';

// --- VISTAS EMPLEADO ---
import HomeEmployeeView from './views/employee/HomeEmployeeView';
import ProfileEmployeeView from './views/employee/ProfileEmployeeView';
import { EmployeeDashboard } from './views/employee/EmployeeDashboard';

// --- VISTAS ADMIN ---
import DashboardAdminView from './views/admin/DashboardAdminView';
import AdminSettings from './views/admin/AdminSettings';
import { AdminCalendarView } from './views/admin/AdminCalendarView';
import AdminScheduleView from './views/admin/AdminScheduleView';
import { CreateServiceView } from './views/admin/CreateServiceView';

// --- LAYOUTS ---
import Layout from './components/Layout/Layoutview';
import EmployeeLayout from './components/Layout/EmployeeLayout';
import AdminLayout from './components/Layout/AdminLayout';

function RequireAuth({ allowedRoles }) {
  const { user, role, requiresPasswordChange, loading, authError } = useAuth();
  const location = useLocation();
  const currentRole = role === 'empleado' ? 'employee' : role;

  if (loading) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
        Cargando sistema...
      </div>
    );
  }

  if (authError) {
    return (
      <div
        style={{ padding: '2.5rem', textAlign: 'center' }}
        role="alert"
      >
        <p>No se pudo verificar la sesión. Intente nuevamente.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!user || !currentRole) {
    return <Navigate to="/login" replace />;
  }

  if (requiresPasswordChange && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (!requiresPasswordChange && location.pathname === '/cambiar-password') {
    if (currentRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentRole === 'employee') {
      return <Navigate to="/empleado/home" replace />;
    }

    return <Navigate to="/" replace />;
  }

  if (location.pathname === '/cambiar-password') {
    return <Outlet />;
  }

  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    console.warn(
      `⛔ Acceso denegado. Rol: ${currentRole} | Requerido: ${allowedRoles}`
    );

    if (currentRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (currentRole === 'employee') {
      return <Navigate to="/empleado/home" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <div className="app-layout">
      <Routes>
        {/* --- GRUPO 1: PÚBLICAS --- */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/registro" element={<RegisterView />} />
        <Route path="/recuperar" element={<ForgotPasswordView />} />
        <Route path="/actualizar-password" element={<UpdatePasswordView />} />

        {/* --- GRUPO 2: RUTA ESPECIAL "CÁRCEL" (Bloqueo) --- */}
        <Route element={<RequireAuth allowedRoles={['admin', 'employee', 'client']} />}>
          <Route path="/cambiar-password" element={<ChangePasswordView />} />
        </Route>

        {/* --- GRUPO 3: CLIENTE (Layout Estándar) --- */}
        <Route element={<RequireAuth allowedRoles={['client']} />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomeView />} />
            <Route path="/reservar" element={<BookingWizard />} />
            <Route path="/perfil" element={<ProfileView />} />
            <Route path="/perfil/editar" element={<EditProfileView />} />
            <Route path="/settings/language" element={<LanguageView />} />
          </Route>
        </Route>

        {/* --- GRUPO 4: EMPLEADO (Employee Layout) --- */}
        <Route path="/empleado" element={<RequireAuth allowedRoles={['employee']} />}>
          <Route element={<EmployeeLayout />}>
            <Route path="home" element={<HomeEmployeeView />} />
            <Route path="agenda" element={<EmployeeDashboard />} />
            <Route path="perfil" element={<ProfileEmployeeView />} />
          </Route>
        </Route>

        {/* --- GRUPO 5: ADMIN (Admin Layout) --- */}
        <Route path="/admin" element={<RequireAuth allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<DashboardAdminView />} />
            <Route path="calendar" element={<AdminCalendarView />} />
            <Route path="schedule" element={<AdminScheduleView />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="services/new" element={<CreateServiceView />} />
          </Route>
        </Route>

        {/* 404 - Catch All */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
