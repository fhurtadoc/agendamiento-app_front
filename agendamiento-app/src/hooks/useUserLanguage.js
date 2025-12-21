import { useState, useEffect } from 'react';
import i18n from '../i18n'; // Import your i18n instance
import { supabase } from '../services/supabaseClient'; // Import your supabase client

export const useUserLanguage = (userId) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Function to change language (UI + Database)
  const changeLanguage = async (newLanguage) => {
    try {
      // 1. Change the language in the App immediately
      await i18n.changeLanguage(newLanguage);
      setCurrentLanguage(newLanguage);
      
      // 2. Persist preference to LocalStorage (for next open before login)
      localStorage.setItem('app_language', newLanguage);

      // 3. Update the profile in Supabase
      if (userId) {
        const { error } = await supabase
          .from('perfile')
          .update({ language: newLanguage })
          .eq('id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating language:', error.message);
      // Optional: Show alert using your global alert system
    }
  };

  return { currentLanguage, changeLanguage };
};