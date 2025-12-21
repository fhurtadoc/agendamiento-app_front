import React, { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Create the context
const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const { t } = useTranslation();

  /**
   * Centralized function to show alerts.
   * Acts as a middleware: receives a translation key, translates it, and shows the toast.
   * * @param {string} messageKey - The key from your JSON dictionary (e.g., 'errors.missing_field')
   * @param {string} type - 'success', 'error', 'loading', or 'custom'
   * @param {object} options - Optional parameters for the translation (variables)
   */
  const showAlert = (messageKey, type = 'success', options = {}) => {
    // 1. Translate the message immediately
    // If the key doesn't exist, it falls back to the key string itself
    const translatedMessage = t(messageKey, options);

    // 2. Trigger the UI popup based on type
    switch (type) {
      case 'success':
        toast.success(translatedMessage);
        break;
      case 'error':
        toast.error(translatedMessage);
        break;
      case 'loading':
        toast.loading(translatedMessage);
        break;
      default:
        toast(translatedMessage);
    }
  };

  /**
   * Helper to dismiss all toasts (useful on route change)
   */
  const dismissAlerts = () => toast.dismiss();

  return (
    <AlertContext.Provider value={{ showAlert, dismissAlerts }}>
      {children}
      {/* This component renders the actual popups on screen */}
      <Toaster position="top-center" reverseOrder={false} />
    </AlertContext.Provider>
  );
};

// Custom hook to use the alert system easily
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};