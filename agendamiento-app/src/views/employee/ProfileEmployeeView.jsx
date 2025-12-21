import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { userService } from '../../services/user.service'; 
import { authService } from '../../services/auth.service'; 
import { User, Mail, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './ProfileEmployee.module.css';

const ProfileEmployeeView = () => {
  const { t } = useTranslation(); // <--- Init hook
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 1. Get session for Email and ID (Auth Service)
        const session = await authService.getCurrentSession();
        const currentUser = session?.user;
        
        if (currentUser) {
          setUserId(currentUser.id);
          
          // 2. Get profile data (User Service)
          const profile = await userService.getProfile(currentUser.id);

          setFormData({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: currentUser.email || '',
            password: '' // Always clean for security
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // 1. Update Personal Information
  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      // Use userService
      await userService.updatePersonalInfo(userId, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      // Reusing existing success key
      showMessage('success', t('success.data_updated'));
    } catch (error) {
      showMessage('error', t('error.data_update') + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // 2. Update Security
  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      // Use authService
      const result = await authService.updateAccountSecurity({
        email: formData.email,
        password: formData.password
      });

      if (result.updated) {
        // If result.message comes from backend, we might display it directly, 
        // or prioritize a generic success message
        showMessage('success', result.message || t('success.data_updated'));
        setFormData(prev => ({ ...prev, password: '' })); // Clear password field
      } else {
        // No changes made
        showMessage('info', result.message);
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className={styles.loading}>{t('common.loading')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('profile.my_profile_title')}</h1>

      {/* Notification Banner */}
      {message.text && (
        <div className={`${styles.alert} ${message.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className={styles.grid}>
        
        {/* CARD 1: Personal Info */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User className={styles.icon} />
            <h3>{t('profile.personal_info_title')}</h3>
          </div>
          <form onSubmit={handleUpdateInfo}>
            <div className={styles.formGroup}>
              <label>{t('profile.first_name')}</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder={t('profile.first_name_placeholder')}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t('profile.last_name')}</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder={t('profile.last_name_placeholder')}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={updating}>
              <Save size={18} />
              {/* Reusing common.save and profile.updating */}
              {updating ? t('profile.updating') : t('common.save')}
            </button>
          </form>
        </div>

        {/* CARD 2: Security */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Lock className={styles.icon} />
            <h3>{t('profile.account_security_title')}</h3>
          </div>
          <form onSubmit={handleUpdateSecurity}>
            <div className={styles.formGroup}>
              {/* Reusing auth.email_label */}
              <label>{t('auth.email_label')}</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <small className={styles.hint}>{t('profile.email_change_hint')}</small>
            </div>
            <div className={styles.formGroup}>
              {/* Reusing auth.new_password_label */}
              <label>{t('auth.new_password_label')}</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('profile.password_blank_hint')}
                />
              </div>
            </div>
            <button type="submit" className={styles.btnSecondary} disabled={updating}>
              {t('profile.update_security_button')}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ProfileEmployeeView;