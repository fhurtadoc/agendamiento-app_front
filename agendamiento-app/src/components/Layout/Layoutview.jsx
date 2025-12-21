/* src/components/Layout/Layout.jsx */
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import styles from './Navbar.module.css'; 

// Icons
const IconHome = () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconCalendar = () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconUser = () => <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

const Layout = ({ theme }) => {
  const { t } = useTranslation(); // <--- Init hook
  
  const themeStyles = {
    '--primary-color': theme?.primaryColor || '#4F46E5', 
  };

  return (
    <div className={styles.appContainer} style={themeStyles}>
      
      {/* MAIN CONTENT AREA */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* NAVIGATION BAR (Only 3 items) */}
      <nav className={styles.navContainer}>
        <ul className={styles.navList}>
          
          {/* 1. HOME */}
          <li className={styles.navItem}>
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <IconHome />
              <span>{t('navigation.home')}</span>
            </NavLink>
          </li>

          {/* 2. APPOINTMENTS/BOOKING */}
          <li className={styles.navItem}>
            <NavLink 
              to="/reservar" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <IconCalendar />
              <span>{t('navigation.appointments')}</span>
            </NavLink>
          </li>

           {/* 3. PROFILE */}
           <li className={styles.navItem}>
            <NavLink 
              to="/perfil" 
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <IconUser />
              <span>{t('navigation.profile')}</span>
            </NavLink>
          </li>

        </ul>
      </nav>

    </div>
  );
};

export default Layout;