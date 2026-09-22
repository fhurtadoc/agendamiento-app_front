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

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await authService.signInWithGoogle(
        window.location.origin
      );

      if (!result?.success || result?.error) {
        setError(
          result?.error ||
            t('auth.google_sign_in_failed', {
              defaultValue: 'Unable to start Google sign-in.',
            })
        );
      }
    } catch (err) {
      console.error('Error starting Google sign-in:', err);

      const message =
        err !== null &&
        typeof err === 'object' &&
        'message' in err
          ? err.message
          : 'No se pudo completar el inicio de sesión con Google.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              margin: '1rem 0',
            }}
          >
            <span
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#e5e7eb',
              }}
            />
            <span
              style={{
                fontSize: '0.85rem',
                color: '#6b7280',
              }}
            >
              {t('common.or', { defaultValue: 'or' })}
            </span>
            <span
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: '#e5e7eb',
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className={styles.button}
            aria-label={t('auth.google_button', {
              defaultValue: 'Continue with Google',
            })}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: '#ffffff',
              color: '#111827',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.507.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              />
            </svg>
            <span>
              {t('auth.google_button', {
                defaultValue: 'Continue with Google',
              })}
            </span>
          </button>

          <p
            style={{
              fontSize: '0.8rem',
              color: '#6b7280',
              textAlign: 'center',
              margin: '0.75rem 0 1.5rem',
            }}
          >
            {t('auth.google_auth_note', {
              defaultValue:
                'This will sign you in or create an account automatically.',
            })}
          </p>

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
