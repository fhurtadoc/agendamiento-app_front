import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { authService } from '../services/authService';
import { useTenant } from '../context/TenantContext';

// Import modular styles
import styles from './css/RegisterView.module.css';

export default function RegisterView() {
  const { t } = useTranslation(); // <--- Init hook
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const tenant = useTenant();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Ensure Tenant ID exists
    if (!tenant?.id) {
      setError(t('auth.system_error'));
      return;
    }

    setLoading(true);
    setError('');

    const { error: authError } = await authService.registerClient({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      tenantId: tenant.id
    });

    if (authError) {
      // Use translation for generic error, or fallback to API message if needed
      setError(authError.message || t('auth.create_account_error'));
      setLoading(false);
    } else {
      navigate('/'); 
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        
        <div className={styles.header}>
          <h2 className={styles.title}>{t('auth.register_title')}</h2>
          <p className={styles.subtitle}>
            {/* Dynamic translation: "Register at [Tenant Name]" or "Register at our platform" */}
            {t('auth.register_subtitle', { 
              tenantName: tenant?.name || t('auth.our_platform') 
            })}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Full Name Field */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.full_name_label')}</label>
            <input
              name="fullName"
              type="text"
              required
              className={styles.input}
              placeholder={t('auth.full_name_placeholder')}
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
          
          {/* Email Field */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.email_label')}</label>
            <input
              name="email"
              type="email"
              required
              className={styles.input}
              placeholder={t('auth.email_placeholder')}
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.password_label')}</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className={styles.input}
              // We reuse the placeholder defined in the previous "Update Password" step
              placeholder={t('auth.password_placeholder')}
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? t('auth.registering') : t('auth.register_button')}
          </button>
        </form>

        <div className={styles.footer}>
          {t('auth.already_have_account')}{' '}
          <Link to="/login" className={styles.link}>
            {t('auth.login_link')}
          </Link>
        </div>

      </div>
    </div>
  );
}