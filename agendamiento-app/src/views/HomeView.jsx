import { useEffect, useState } from 'react'; // <--- Import hooks
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { authService } from '../services/authService';
import { appointmentService } from '../services/appointmentService'; // <--- Import service

// Import styles
import styles from './css/HomeView.module.css';

export default function HomeView() {
  const { t } = useTranslation(); 
  const { user } = useAuth();
  const tenant = useTenant();

  // State for appointments
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          const data = await appointmentService.getMyAppointments(user.id);
          setAppointments(data);
        } catch (error) {
          console.error("Error fetching my appointments", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await authService.logout();
  };

  // Helper to format date (you can use date-fns if you prefer)
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString([], { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.container}>
      
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.welcomeTitle}>
          {t('home.welcome_title', { tenantName: tenant?.name })}
        </h1>
        <p className={styles.userInfo}>
          {t('home.logged_in_as')} {user?.email}
        </p>
      </div>

      {/* Main Dashboard Panel */}
      <div className={styles.dashboardCard}>
        <h2 className={styles.cardTitle}>{t('home.dashboard_title')}</h2>
        
        {/* --- APPOINTMENTS LIST SECTION --- */}
        <div className={styles.appointmentsSection}>
          
          {loading ? (
            <p>{t('common.loading')}...</p>
          ) : appointments.length === 0 ? (
            // Empty State
            <p className={styles.emptyStateText}>
              {t('home.no_appointments')}
            </p>
          ) : (
            // List of Appointments
            <ul className={styles.appointmentList}>
              {appointments.map((appt) => (
                <li key={appt.id} className={styles.appointmentItem}>
                  <div className={styles.apptInfo}>
                    <span className={styles.serviceName}>
                      {appt.service?.name || 'Service'}
                    </span>
                    <span className={styles.apptDate}>
                      {formatDate(appt.start_time)}
                    </span>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[appt.status]}`}>
                    {appt.status} {/* You can wrap this in t() if needed */}
                  </span>
                </li>
              ))}
            </ul>
          )}

        </div>
        {/* -------------------------------- */}

        <div className={styles.actions}>
          <Link to="/reservar" className={styles.primaryButton}>
            {t('home.new_reservation_button')}
          </Link>

          <button onClick={handleLogout} className={styles.secondaryButton}>
            {t('auth.logout_button')}
          </button>
        </div>
      </div>
    </div>
  );
}