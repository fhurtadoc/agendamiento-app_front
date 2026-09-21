import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import i18n from '../i18n';

const AuthContext = createContext(null);

const getErrorMessage = (error) => {
  if (error !== null && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return String(error ?? 'Unknown authentication error');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLanguageSync = (userLanguage) => {
    if (!userLanguage) return;

    try {
      i18n.changeLanguage(userLanguage);
      localStorage.setItem('app_language', userLanguage);
    } catch (error) {
      console.error('Error synchronizing language:', error);
    }
  };

  const signOut = async () => {
    try {
      const result = await authService.logout();

      if (result?.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error closing session:', error);
    } finally {
      setUser(null);
      setRole(null);
      setRequiresPasswordChange(false);
      setAuthError(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const applyAuthState = (state = {}) => {
      if (!active) return;

      const errorMessage = state.error
        ? getErrorMessage(state.error)
        : null;

      setUser(state.user ?? null);
      setRole(state.role ?? null);
      setRequiresPasswordChange(Boolean(state.requiresPasswordChange));
      setAuthError(errorMessage);
      setLoading(false);

      if (state.language) {
        handleLanguageSync(state.language);
      }
    };

    const initAuth = async () => {
      try {
        const state = await authService.getCurrentUserWithRole();

        if (active) {
          applyAuthState(state);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);

        if (active) {
          setUser(null);
          setRole(null);
          setRequiresPasswordChange(false);
          setAuthError(getErrorMessage(error));
          setLoading(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initAuth();

    let unsubscribe;

    try {
      unsubscribe = authService.subscribeToChanges((state, event) => {
        if (event === 'INITIAL_SESSION') {
          return;
        }

        applyAuthState(state);
      });
    } catch (error) {
      console.error('Error subscribing to auth changes:', error);

      if (active) {
        setAuthError(getErrorMessage(error));
        setLoading(false);
      }
    }

    return () => {
      active = false;

      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        requiresPasswordChange,
        loading,
        authError,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
