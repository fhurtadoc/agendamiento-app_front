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

    // 1. CORRECCIÓN: Extraemos el 'user' directamente de la respuesta del login
    const { success, user, error: loginError } = await authService.login(email, password);  
    
    if (loginError) console.log(loginError);

    if (!success) {
      setError(t('auth.invalid_credentials'));
      setLoading(false);
    } else {
      try {
        // 2. CORRECCIÓN: Le pasamos el 'user' a la función para que no tenga que buscarlo
        const { role, requiresPasswordChange } = await authService.getCurrentUserWithRole(user);

        console.log('User role:', role);
        console.log('Requires Password Change:', requiresPasswordChange);

        if (requiresPasswordChange===true) {
          console.log('hola desde Requires Password Change');
          
           navigate('/cambiar-password'); 
           return; 
        }

        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'employee' || role === 'empleado') { 
          navigate('/empleado/home');
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error("Error in post-login redirection:", err);
        navigate('/');
      }
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

          <div style={{textAlign: 'right', marginBottom: '1.5rem'}}>
            <Link to="/recuperar" style={{fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none'}}>
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