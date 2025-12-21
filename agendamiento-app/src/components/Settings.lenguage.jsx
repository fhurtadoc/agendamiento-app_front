import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserLanguage } from '../hooks/useUserLanguage'; // The hook we created in step 2

const LanguageSettings = ({ userId }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useUserLanguage(userId);

  return (
    <div className="p-4 border rounded shadow-sm">
      <h3 className="text-lg font-bold mb-4">{t('settings.language_label')}</h3>
      
      <div className="flex gap-4">
        {/* Button for English */}
        <button
          onClick={() => changeLanguage('en')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'en' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          🇺🇸 English
        </button>

        {/* Button for Spanish */}
        <button
          onClick={() => changeLanguage('es')}
          className={`px-4 py-2 rounded ${
            currentLanguage === 'es' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          🇪🇸 Español
        </button>
      </div>
    </div>
  );
};

export default LanguageSettings;