import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';

// Configuration resources
const resources = {
  en: { translation: en },
  es: { translation: es },
};

/**
 * Custom Language Detector for Web (Vite/PWA)
 * Uses 'localStorage' to remember choice and 'navigator' to detect browser language.
 */
const languageDetector = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: (callback) => {
    try {
      // 1. Check if user has previously selected a language in the browser
      const savedLanguage = window.localStorage.getItem('app_language');
      
      if (savedLanguage) {
        return callback(savedLanguage);
      }

      // 2. If not, get the Browser's language (e.g., 'es-ES', 'en-US')
      const browserLanguage = window.navigator.language;
      
      // We take the first 2 characters (e.g., 'es' from 'es-ES')
      const shortCode = browserLanguage.split('-')[0];

      return callback(shortCode);
    } catch (error) {
      console.log('Error detecting language', error);
      callback('es'); // Fallback
    }
  },
  cacheUserLanguage: (language) => {
    try {
      // 3. Save user's choice to Browser LocalStorage
      window.localStorage.setItem('app_language', language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

i18n
  // @ts-ignore - The types for custom detectors can be tricky, ignoring for simplicity
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es', 
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;