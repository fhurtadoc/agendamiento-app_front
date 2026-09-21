import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import styles from '../css/LoginView.module.css';

export default function ChangePasswordView() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const tenant = useTenant();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      if (typeof signOut === 'function') {
        await signOut();
      } else {
        const result = await authService.logout();

        if (result?.error) {
          throw result.error;
        }
      }

      navigate('/login', { replace: true });
    } catch (error) {
      console.warn('Error o timeout en logout:', error);
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user?.id) {
        setError(t('error.no_user_found'));
        navigate('/login', { replace: true });
        return;
      }

      const normalizedPassword = password.trim();
      const normalizedConfirmation = confirmPassword.trim();

      if (normalizedPassword !== normalizedConfirmation) {
        setError(t('auth.password_mismatch'));
        return;
      }

      if (normalizedPassword.length < 6) {
        setError(t('auth.password_min_length'));
        return;
      }

      const result = await authService.changePasswordAndUnlock(
        normalizedPassword,
        user.id
      );

      if (!result.success) {
        setError(result.error || t('auth.update_error'));
        return;
      }

      const authState = await authService.getCurrentUserWithRole(user);

      if (authState.error) {
        setError(authState.error);
        return;
      }

      if (!authState.user || !authState.role) {
        setError(t('auth.update_error'));
        return;
      }

      if (authState.requiresPasswordChange) {
        setError(t('auth.update_error'));
        return;
      }

      const role =
        authState.role === 'empleado' ? 'employee' : authState.role;

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'employee') {
        navigate('/empleado/home', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error(err);

      const message =
        err !== null &&
        typeof err === 'object' &&
        'message' in err
          ? err.message
          : t('error.generic');

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
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
            <label
              style={{
                display: 'block',
                marginBottom: '.5rem',
                fontSize: '.9rem',
              }}
            >
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
            <label
              style={{
                display: 'block',
                marginBottom: '.5rem',
                fontSize: '.9rem',
              }}
            >
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

        <div
          style={{
            marginTop: '1.5rem',
            borderTop: '1px solid #eee',
            paddingTop: '1rem',
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: loggingOut ? 'wait' : 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline',
            }}
          >
            {loggingOut
              ? t('common.loading')
              : t('auth.logout_button')}
          </button>
        </div>
      </div>
    </div>
  );
}
