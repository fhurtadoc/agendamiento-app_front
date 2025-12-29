import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { useTenant } from '../../context/TenantContext';
import styles from '../css/LoginView.module.css';

export default function ChangePasswordView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tenant = useTenant();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Validaciones básicas
    if (password !== confirmPassword) {
      setError(t('auth.password_mismatch')); 
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.password_min_length'));
      setLoading(false);
      return;
    }

    try {
      // 2. Obtenemos el ID del usuario actual
      const user = await authService.getCurrentUser();
      
      if (!user) {
        setError(t('error.no_user_found'));
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // 3. Llamamos al servicio
      const { success, error: serviceError } = await authService.changePasswordAndUnlock(password, user.id);

      if (!success) {
        setError(serviceError || t('auth.update_error')); 
        setLoading(false);
      } else {
        // 4. ÉXITO: Redirección según rol
        const { role } = await authService.getCurrentUserWithRole(user);
        
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'employee') navigate('/empleado/home');
        else navigate('/');
      }

    } catch (err) {
      console.error(err);
      setError(t('error.generic') + (err.message || '')); 
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
           {/* Branding */}
           {tenant?.theme?.logoUrl && (
            <img src={tenant.theme.logoUrl} alt="Logo" className={styles.logo} />
          )}
          <h2 className={styles.title}>{t('auth.new_password_title')}</h2>
          <p className={styles.subtitle}>
            {t('auth.new_password_subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label style={{display:'block', marginBottom:'.5rem', fontSize:'.9rem'}}>
                {t('auth.new_password_label')}
            </label>
            <input
              type="password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.password_placeholder')}
            />
          </div>

          <div className={styles.formGroup}>
            <label style={{display:'block', marginBottom:'.5rem', fontSize:'.9rem'}}>
                {t('auth.confirm_password_label')}
            </label>
            <input
              type="password"
              required
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.repeat_password_placeholder')}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? t('profile.updating') : t('auth.update_password_button')}
          </button>
        </form>

        {/* --- NUEVO BOTÓN DE SALIDA --- */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', textAlign: 'center' }}>
            <button 
                type="button" 
                onClick={handleLogout}
                style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#ef4444', // Rojo para indicar salida
                    cursor: 'pointer', 
                    fontSize: '0.9rem',
                    textDecoration: 'underline'
                }}
            >
                {t('auth.logout_button')} {/* "Cerrar Sesión" */}
            </button>
        </div>

      </div>
    </div>
  );
}