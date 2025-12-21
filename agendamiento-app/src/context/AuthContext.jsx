import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/auth.service';
import i18n from '../i18n'; // Import your i18n configuration

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: Syncs the app language with the user's preference
  const handleLanguageSync = (userLanguage) => {
    if (userLanguage) {
      i18n.changeLanguage(userLanguage);
      // Persist to localStorage to keep it if the user refreshes
      localStorage.setItem('app_language', userLanguage);
    }
  };

  useEffect(() => {
    // 1. Initial Load
    const initAuth = async () => {
      try {
        // We assume authService now retrieves { user, role, language }
        const { user, role, language } = await authService.getCurrentUserWithRole();
        
        setUser(user);
        setRole(role);
        
        // Apply the language from the database
        handleLanguageSync(language);
        
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Subscription to events (Dynamic Login/Logout)
    // The service returns the 'unsubscribe' function
    const unsubscribe = authService.subscribeToChanges((data) => {
      setUser(data.user);
      setRole(data.role);
      
      // If we receive language data on login/change, apply it
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
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);