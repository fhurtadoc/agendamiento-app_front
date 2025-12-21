import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Vistas EXISTENTES (client)
import LoginView from './views/LoginView';
import RegisterView from './views/RegisterView';
import ForgotPasswordView from './views/ForgotPasswordView';
import UpdatePasswordView from './views/UpdatePasswordView';
import HomeView from './views/HomeView';
import ProfileView from './views/ProfileView';
import EditProfileView from './views/EditProfileView';
import ChangePasswordView from './views/ChangePasswordView';
import BookingWizard from './views/BookingWizard';
import LanguageView from './views/LanguageView'

// Vistas NUEVAS (Empleado y Admin)
import HomeEmployeeView from './views/employee/HomeEmployeeView';
import ProfileEmployeeView from './views/employee/ProfileEmployeeView'
import { EmployeeDashboard } from './views/employee/EmployeeDashboard';
//import  EmployeeDashboard from  './views/employee/EmployeeDashboard'

//views admin
import DashboardAdminView from './views/admin/DashboardAdminView';
import AdminSettings from "./views/admin/AdminSettings"
import { AdminCalendarView } from './views/admin/AdminCalendarView'; // <--- Importa tu nueva vista
import  AdminScheduleView  from  './views/admin/AdminScheduleView'

// Layouts
import Layout from './components/Layout/Layoutview'; // Layout del client (BottomBar)
import EmployeeLayout from './components/Layout/EmployeeLayout'; // Layout del Empleado (Sidebar)
import AdminLayout from './components/Layout/AdminLayout';       // Layout del Admin (Sidebar Oscuro)



// 1. Componente Guardia de Seguridad (MEJORADO CON ROLES)
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Cargando aplicación...</div>;
  
  // 1. Si no hay usuario, patada al Login
  if (!user) return <Navigate to="/login" replace />;

  // 2. Si hay usuario, pero su ROL no está en la lista permitida
  if (allowedRoles && !allowedRoles.includes(role)) {
     // Debug: ver en consola por qué falló
     console.warn(`Acceso denegado. Rol usuario: ${role}. Roles permitidos: ${allowedRoles}`);
     
     // Redirección de seguridad
     if(role === 'employee') return <Navigate to="/empleado/home" replace />;
     if(role === 'admin') return <Navigate to="/admin/dashboard" replace />;
     return <Navigate to="/" replace />; // Por defecto al home de client
  }

  // 3. Si todo está bien, permitimos ver el contenido
  return children ? children : <Outlet />;
}

function App() {
  return (
    <div className="app-layout">
      <Routes>
        
        {/* --- GRUPO 1: RUTAS PÚBLICAS (Sin Sidebar/Navbar) --- */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/registro" element={<RegisterView />} />
        <Route path="/recuperar" element={<ForgotPasswordView />} />
        <Route path="/actualizar-password" element={<UpdatePasswordView />} />


        {/* --- GRUPO 2: RUTAS client (Role: 'client') --- */}
        <Route element={<ProtectedRoute allowedRoles={['client']}><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomeView />} />
            <Route path="/reservar" element={<BookingWizard />} />
            <Route path="/perfil" element={<ProfileView />} />
            <Route path="/perfil/editar" element={<EditProfileView />} />
            <Route path="/perfil/password" element={<ChangePasswordView />} />
            <Route path="/settings/language" element={<LanguageView />} />
        </Route>


        {/* --- GRUPO 3: RUTAS EMPLEADO (Role: 'empleado') --- */}
        <Route path="/empleado" element={<ProtectedRoute allowedRoles={['employee']}><EmployeeLayout /></ProtectedRoute>}>
            {/* Aquí cargamos la vista real que creamos */}
            <Route path="home" element={<HomeEmployeeView />} />
            
            {/* Esta sigue temporal hasta que crees AgendaView.jsx */}
            <Route path="agenda" element={<EmployeeDashboard />} />
            <Route path="perfil" element={<ProfileEmployeeView />} />
        </Route>


        {/* --- GRUPO 4: RUTAS ADMIN (Role: 'admin') --- */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            {/* Aquí cargamos el dashboard real que creamos */}
            <Route path="dashboard" element={<DashboardAdminView />} />

            <Route path="calendar" element={<AdminCalendarView />} />
            
            {/* Esta sigue temporal hasta que crees UsersView.jsx */}
            <Route path="settings" element={<AdminSettings/>} />

            <Route path="schedule" element={<AdminScheduleView/>} />
            
        </Route>


        {/* Ruta para manejar 404 - Not Found */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </div>
  );
}

export default App;