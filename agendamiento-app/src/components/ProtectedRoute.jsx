import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Recibe "allowedRoles" que es un array, ej: ['admin', 'empleado']
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div>Cargando...</div>; // O tu componente Spinner

  // 1. Si no está logueado -> Al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si tiene usuario pero NO el rol correcto -> Al Home general o página 403
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Si un client intenta entrar a /admin, lo mandamos a su home
    return <Navigate to="/app/home" replace />;
  }

  // 3. Si todo está bien, muestra el contenido (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;