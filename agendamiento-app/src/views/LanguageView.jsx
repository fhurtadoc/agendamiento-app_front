import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSettings from '../components/Settings.lenguage'; // Import your component
import styles from './css/Profile.module.css'; // Reusing your profile styles

const LanguageView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        {t('settings.language_label')}
      </h2>

      {/* Render the Language Component */}
      <LanguageSettings userId={user?.id} />

      {/* Back Button */}
      <button 
        type="button" 
        onClick={() => navigate(-1)} // Go back to previous screen
        style={{ 
          background: 'none', 
          border: 'none', 
          color: '#666', 
          marginTop: '20px', 
          width: '100%',
          cursor: 'pointer' 
        }}
      >
        {t('common.cancel')}
      </button>
    </div>
  );
};

export default LanguageView;