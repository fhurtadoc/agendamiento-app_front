
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { authService } from '../services/auth.service';
import { useAlert } from '../context/AlertContext';
import styles from './css/Profile.module.css';

const ChangePasswordView = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(); // <--- Init hook
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Logic and validation are now handled by the service
      await authService.changePassword(password);
      
      showAlert(t('success.password_updated'));
      navigate('/perfil');

    } catch (error) {
      // Error message comes from Service or Adapter
      showAlert(t('error.generic') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Reusing title from Auth flow */}
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        {t('auth.new_password_title')}
      </h2>
      
      <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
            {t('profile.enter_new_password_label')}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            // Reusing placeholder from Auth flow
            placeholder={t('auth.password_placeholder')}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            marginTop: '1rem', 
            padding: '14px', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          {/* Reusing button text, adding specific loading state */}
          {loading ? t('profile.updating') : t('auth.update_password_button')}
        </button>

        <button 
            type="button" 
            onClick={() => navigate('/perfil')}
            style={{ background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}
        >
            {t('common.cancel')}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordView;