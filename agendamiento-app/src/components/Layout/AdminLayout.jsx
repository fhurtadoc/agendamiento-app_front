import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { authService } from '../../services/auth.service'; 
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { t } = useTranslation(); // <--- Init hook
  const navigate = useNavigate();

 // En ChangePasswordView.jsx

  const handleLogout = async () => { 
    const TIMEOUT_MS = 1000;
    try {      
      const logoutPromise = authService.logout();      
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve("tiempo_agotado");
        }, TIMEOUT_MS);
      });      
      await Promise.race([logoutPromise, timeoutPromise]);

    } catch (error) {
      console.warn("Error o timeout en logout:", error);
    } finally {      
      window.location.href = '/login';
    }
  };

  return (
    <div className={styles.container}>
      
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>{t('admin.sidebar_title')}</h3>
        </div>
        
        <nav className={styles.nav}>
          
          <Link to="/admin/dashboard" className={styles.navLink}>
            <span>📊</span> {t('admin.menu_dashboard')}
          </Link>

          {/* --- NEW LINK: MASTER CALENDAR --- */}
          <Link to="/admin/calendar" className={styles.navLink}>
            <span>📅</span> {t('admin.menu_calendar')}
          </Link>
          {/* ------------------------------------ */}
          
          <Link to="/admin/settings" className={styles.navLink}>
            <span>⚙️</span> {t('admin.menu_settings')}
          </Link>

          <Link to="/admin/schedule" className={styles.navLink}><span>🕒</span>  {t('schedule.schedule')} </Link>

          

        </nav>

        <div className={styles.logoutContainer}>
            <button onClick={handleLogout} className={styles.logoutButton}>
                {t('admin.logout_system')}
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}