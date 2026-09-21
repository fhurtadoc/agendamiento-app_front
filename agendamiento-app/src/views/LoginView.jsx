import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { useTenant } from '../context/TenantContext';
import styles from './css/LoginView.module.css';

export default function LoginView() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const tenant = useTenant();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginResult = await authService.login(email, password);

      if (loginResult.error) {
        console.log(loginResult.error);
      }

      if (!loginResult.success || loginResult.error) {
        setError(t('auth.invalid_credentials'));
        return;
      }

      const authState = await authService.getCurrentUserWithRole(
        loginResult.user
      );

      if (authState.error) {
        setError(authState.error);
        return;
      }

      if (!authState.user || !authState.role) {
        setError(t('auth.invalid_credentials'));
        return;
      }

      const { role, requiresPasswordChange } = authState;

      if (requiresPasswordChange === true) {
        navigate('/cambiar-password', { replace: true });
        return;
      }

      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'employee') {
        navigate('/empleado/home', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Error in post-login redirection:', err);

      const message =
        err !== null &&
        typeof err === 'object' &&
        'message' in err
          ? err.message
          : 'No se pudo completar el inicio de sesión.';

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
          <h2 className={styles.title}>{tenant?.name || t('common.welcome')}</h2>
          <p className={styles.subtitle}>{t('auth.login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <input
              type="email"
              required
              className={styles.input}
              placeholder={t('auth.email_label')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <input
              type="password"
              required
              className={styles.input}
              placeholder={t('auth.password_label')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <Link
              to="/recuperar"
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
                textDecoration: 'none',
              }}
            >
              {t('auth.forgot_password')}
            </Link>
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? t('common.loading') : t('auth.login_button')}
          </button>
        </form>

        <div className={styles.footer}>
          {t('auth.no_account')}{' '}
          <Link to="/registro" className={styles.link}>
            {t('auth.register_link_text')}
          </Link>
        </div>
      </div>
    </div>
  );
}
