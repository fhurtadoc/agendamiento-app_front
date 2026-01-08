import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react'; // Importamos icono para logout móvil
import { authService } from '../../services/authService'; 
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => { 
    const TIMEOUT_MS = 1000;
    try {      
      const logoutPromise = authService.logout();      
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve("timeout");
        }, TIMEOUT_MS);
      });      
      await Promise.race([logoutPromise, timeoutPromise]);

    } catch (error) {
      console.warn("Logout error:", error);
    } finally {      
      window.location.href = '/login';
    }
  };

  // Helper to apply classes to NavLinks
  const navClass = ({ isActive }) => 
    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;

  const mobileNavClass = ({ isActive }) => 
    isActive ? `${styles.mobileNavItem} ${styles.mobileActive}` : styles.mobileNavItem;

  return (
    <div className={styles.container}>
      
      {/* --- MOBILE TOP BAR (Logo + Logout) --- */}
      <header className={styles.mobileTopBar}>
          <span className={styles.mobileTitle}>{t('admin.sidebar_title')}</span>
          <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
            <LogOut size={20} />
          </button>
      </header>

      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>{t('admin.sidebar_title')}</h3>
        </div>
        
        <nav className={styles.nav}>
          <NavLink to="/admin/dashboard" className={navClass}>
            <span>📊</span> {t('admin.menu_dashboard')}
          </NavLink>

          <NavLink to="/admin/calendar" className={navClass}>
            <span>📅</span> {t('admin.menu_calendar')}
          </NavLink>

          <NavLink to="/admin/services/new" className={navClass}>
             <span>✂️</span> {t('admin.menu_services')}
          </NavLink>
          
          <NavLink to="/admin/schedule" className={navClass}>
            <span>🕒</span> {t('schedule.schedule')} 
          </NavLink>

          <NavLink to="/admin/settings" className={navClass}>
            <span>⚙️</span> {t('admin.menu_settings')}
          </NavLink>
        </nav>

        <div className={styles.logoutContainer}>
            <button onClick={handleLogout} className={styles.logoutButton}>
                {t('admin.logout_system')}
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* --- MOBILE BOTTOM NAV (Hidden on Desktop) --- */}
      <nav className={styles.bottomNav}>
          <NavLink to="/admin/dashboard" className={mobileNavClass}>
            <span className={styles.icon}>📊</span>
            <span className={styles.label}>Dash</span>
          </NavLink>

          <NavLink to="/admin/calendar" className={mobileNavClass}>
            <span className={styles.icon}>📅</span>
            <span className={styles.label}>Calendar</span>
          </NavLink>

          {/* Special Center Button Style for Services usually looks cool */}
          <NavLink to="/admin/services/new" className={mobileNavClass}>
             <span className={styles.icon}>✂️</span>
             <span className={styles.label}>Services</span>
          </NavLink>
          
          <NavLink to="/admin/schedule" className={mobileNavClass}>
            <span className={styles.icon}>🕒</span>
            <span className={styles.label}>Hours</span>
          </NavLink>

          <NavLink to="/admin/settings" className={mobileNavClass}>
            <span className={styles.icon}>⚙️</span>
            <span className={styles.label}>Settings</span>
          </NavLink>
      </nav>

    </div>
  );
}