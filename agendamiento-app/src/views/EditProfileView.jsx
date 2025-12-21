import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/user.service';
import { useTranslation } from 'react-i18next'; // <--- i18n hook
import { useAlert } from '../context/AlertContext'; 
import styles from './css/Profile.module.css';

const EditProfileView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  const { t } = useTranslation(); // <--- Init translation
  
  // State for form data (using camelCase)
  const [formData, setFormData] = useState({ fullName: '', phone: '' });

  // 1. Load data on entry
  useEffect(() => {
    async function getProfile() {
      if (!user) return;
      try {
        const data = await userService.getProfile(user.id);
        setFormData({ 
          fullName: data.fullName || '', 
          phone: data.phone || '' 
        });
      } catch (error) {
        console.log('Error loading profile', error);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, [user]);

  // 2. Save changes
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userService.updateProfile(user.id, formData);
      showAlert(t('success.data_updated'));
      navigate('/perfil');
    } catch (error) {
      showAlert(t('error.save') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        {t('profile.edit_title')}
      </h2>
      
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Full Name Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
            {t('profile.full_name')}
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            placeholder="Ex: Fabio Hurtado"
          />
        </div>

        {/* Phone Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
            {t('profile.phone')}
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            placeholder="+57 300 123 4567"
          />
        </div>

        {/* --- Button to go to Language Settings --- */}
        <div style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => navigate('/settings/language')}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🌐 {t('settings.language_label')}
          </button>
        </div>

        {/* Save Button */}
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
          {loading ? t('common.loading') : t('common.save')}
        </button>

        {/* Cancel Button */}
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

export default EditProfileView;