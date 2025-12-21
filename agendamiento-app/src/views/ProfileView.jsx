import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import styles from './css/Profile.module.css'; 

// Simple SVG Icons (kept inline to avoid extra libraries)
const IconUser = () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const IconLock = () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const IconLogOut = () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const IconChevron = () => <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>;

const ProfileView = () => {
  const { t } = useTranslation(); // <--- Init hook
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Function to get initials from email (e.g., "john.doe@..." -> "J")
  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // ProtectedRoute in App.js will automatically redirect to Login
    } catch (error) {
      console.error(t('profile.logout_error'), error);
    }
  };

  return (
    <div className={styles.container}>
      
      {/* 1. HEADER */}
      <header className={styles.header}>
        <div className={styles.avatar}>
          {getInitials()}
        </div>
        <h2 className={styles.userName}>
            {user?.user_metadata?.fullName || t('profile.default_user_name')}
        </h2>
        <p className={styles.userEmail}>{user?.email}</p>
      </header>

      {/* 2. MENU ACTIONS */}
      <div className={styles.menuGroup}>
        {/* BUTTON 1: Edit Data */}
        <button 
          className={styles.menuItem}
          onClick={() => navigate('/perfil/editar')} 
        >
          <IconUser /> 
          <span>{t('profile.menu_edit_data')}</span>
          <IconChevron />
        </button>
        
        {/* BUTTON 2: Change Password */}
        <button 
          className={styles.menuItem}
          onClick={() => navigate('/perfil/password')}
        >
          <IconLock />
          <span>{t('profile.menu_change_password')}</span>
          <IconChevron />
        </button>

      </div>

      {/* 3. DANGER ZONE / LOGOUT */}
      <div className={styles.menuGroup}>
        <button 
          className={`${styles.menuItem} ${styles.logoutButton}`} 
          onClick={handleLogout}
        >
          <IconLogOut />
          <span>{t('auth.logout_button')}</span>
        </button>
      </div>

      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: '2rem' }}>
        {t('profile.version')} 1.0.0
      </div>

    </div>
  );
};

export default ProfileView;