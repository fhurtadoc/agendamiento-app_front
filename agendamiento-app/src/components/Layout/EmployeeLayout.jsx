import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { authService } from '../../services/auth.service'; 
import { Home, Calendar, User, LogOut } from 'lucide-react';
import styles from './EmployeeLayout.module.css';

export default function EmployeeLayout() {
  const { t } = useTranslation(); // <--- Init hook
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      // Use service. If it fails, it hits the catch block.
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out", error);
      // Optional: Show a toast/alert to the user if it fails
    }
  };

  // Helper to check if link is active
  const isActive = (path) => location.pathname === path;

  // Navigation Items Config
  // Defined inside component to access 't'
  const navItems = [
    { label: t('navigation.home'), path: '/empleado/home', icon: Home },
    { label: t('navigation.agenda'), path: '/empleado/agenda', icon: Calendar },
    { label: t('navigation.profile'), path: '/empleado/perfil', icon: User },
  ];

  return (
    <div className={styles.layoutContainer}>
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.brandTitle}>WorkPanel</h3>
        </div>
        
        <nav className={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive(item.path) ? styles.navItemActive : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.logoutSection}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>{t('auth.logout_button')}</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE HEADER (Top Bar) --- */}
      <header className={styles.mobileHeader}>
        <span className={styles.brandTitle}>WorkPanel</span>
        <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
          <LogOut size={22} />
        </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* --- MOBILE BOTTOM NAV (App Style) --- */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.bottomNavItem} ${isActive(item.path) ? styles.bottomNavItemActive : ''}`}
          >
            <item.icon size={isActive(item.path) ? 24 : 22} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

    </div>
  );
}