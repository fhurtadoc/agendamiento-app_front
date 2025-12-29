import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// --- VISTAS DE AUTENTICACIÓN (Públicas) ---
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ForgotPasswordView from './views/ForgotPasswordView';
import UpdatePasswordView from './views/UpdatePasswordView';

// --- VISTA DE BLOQUEO (Seguridad) ---
import ChangePasswordView from './views/employee/ChangePasswordView'; // La vista que creamos para el bloqueo

// --- VISTAS CLIENTE ---
import HomeView from './views/HomeView';
import ProfileView from './views/ProfileView';
import EditProfileView from './views/EditProfileView';
import BookingWizard from './views/BookingWizard';
import LanguageView from './views/LanguageView';
// Nota: Si el cliente tiene su propia vista opcional de cambio de clave, asegúrate de que no choque el nombre
// import ClientChangePass from './views/ClientChangePass'; 

// --- VISTAS EMPLEADO ---
import HomeEmployeeView from './views/employee/HomeEmployeeView';
import ProfileEmployeeView from './views/employee/ProfileEmployeeView';
import { EmployeeDashboard } from './views/employee/EmployeeDashboard';

// --- VISTAS ADMIN ---
import DashboardAdminView from './views/admin/DashboardAdminView';
import AdminSettings from "./views/admin/AdminSettings";
import { AdminCalendarView } from './views/admin/AdminCalendarView';
import AdminScheduleView from './views/admin/AdminScheduleView';

// --- LAYOUTS ---
import Layout from './components/Layout/Layoutview';          // Client
import EmployeeLayout from './components/Layout/EmployeeLayout'; // Empleado
import AdminLayout from './components/Layout/AdminLayout';       // Admin


// ==========================================
// 1. GUARDIA DE SEGURIDAD (Refactorizado)
// ==========================================
function RequireAuth({ allowedRoles }) {
  // Asumimos que tu AuthContext ahora provee 'requiresPasswordChange'
  // Si no, asegúrate de actualizar el Provider para que lo pase.
  const { user, role, requiresPasswordChange, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-10 text-center">Cargando sistema...</div>;

  // A. Si no hay usuario -> Login
  if (!user) return <Navigate to="/login" replace />;

  // B. LÓGICA DE BLOQUEO (PROVISIONING)
  // 1. Si debe cambiar password y NO está en la pantalla de cambio -> Forzar entrada a la "cárcel"
  if (requiresPasswordChange && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  // 2. Si YA cambió password (o no lo requiere) y quiere entrar a la pantalla de cambio -> Sacarlo de ahí
  if (!requiresPasswordChange && location.pathname === '/cambiar-password') {
     if(role === 'admin') return <Navigate to="/admin/dashboard" replace />;
     if(role === 'employee') return <Navigate to="/empleado/home" replace />;
     return <Navigate to="/" replace />;
  }

  // C. LÓGICA DE ROLES
  // Si estamos en la ruta de "cambiar-password", permitimos renderizar sin chequear rol
  if (location.pathname === '/cambiar-password') {
      return <Outlet />;
  }

  // Validación estándar de roles
  if (allowedRoles && !allowedRoles.includes(role)) {
     console.warn(`⛔ Acceso denegado. Rol: ${role} | Requerido: ${allowedRoles}`);
     if(role === 'admin') return <Navigate to="/admin/dashboard" replace />;
     if(role === 'employee') return <Navigate to="/empleado/home" replace />;
     return <Navigate to="/" replace />;
  }

  return <Outlet />;
}


// ==========================================
// 2. DEFINICIÓN DE RUTAS
// ==========================================
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
        {/* Accesible para todos los logueados, sin Layout para evitar navegación */}
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
                {/* Ojo: Esta ruta '/perfil/password' sería para cambio voluntario, distinta a la obligatoria */}
                {/* <Route path="/perfil/password" element={<ClientChangePass />} /> */} 
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
            </Route>
        </Route>


        {/* 404 - Catch All */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </div>
  );
}

export default App;