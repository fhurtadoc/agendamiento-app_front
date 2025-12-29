import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService'; // Asegúrate que el nombre del archivo coincida
import i18n from '../i18n'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  // 1. NUEVO ESTADO: Bandera de seguridad
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false); // <--- NUEVO
  const [loading, setLoading] = useState(true);

  // Helper: Syncs the app language with the user's preference
  const handleLanguageSync = (userLanguage) => {
    if (userLanguage) {
      i18n.changeLanguage(userLanguage);
      localStorage.setItem('app_language', userLanguage);
    }
  };

  useEffect(() => {
    // 1. Initial Load
    const initAuth = async () => {
      try {
        // 2. MODIFICADO: Recuperamos también 'requiresPasswordChange' del servicio
        const { user, role, language, requiresPasswordChange } = await authService.getCurrentUserWithRole(); // <--- UPDATE
        
        setUser(user);
        setRole(role);
        // 3. ACTUALIZAR ESTADO
        setRequiresPasswordChange(requiresPasswordChange || false); // <--- NUEVO
        
        // Apply the language from the database
        handleLanguageSync(language);
        
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Subscription to events
    const unsubscribe = authService.subscribeToChanges((data) => {
      setUser(data.user);
      setRole(data.role);
      
      // 4. ACTUALIZAR ESTADO EN CAMBIOS (Login/Logout dinámico)
      // Asegúrate que tu servicio envíe este dato en el evento
      setRequiresPasswordChange(data.requiresPasswordChange || false); // <--- NUEVO
      
      if (data.language) {
        handleLanguageSync(data.language);
      }
      
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    // 5. EXPONER LA VARIABLE AL APP
    <AuthContext.Provider value={{ user, role, requiresPasswordChange, loading }}> 
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);