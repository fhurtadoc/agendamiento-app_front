import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { authService } from '../services/authService';
import styles from './css/ForgotPasswordView.module.css';

export default function ForgotPasswordView() {
  const { t } = useTranslation(); // <--- Init hook
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await authService.resetPasswordForEmail(email);

    if (error) {
      setMessage({ 
        type: 'error', 
        text: t('auth.recover_error') 
      });
    } else {
      setMessage({ 
        type: 'success', 
        text: t('auth.recover_success') 
      });
      setEmail(''); // Clear the field
    }
    
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t('auth.recover_password_title')}</h2>
        <p className={styles.subtitle}>
          {t('auth.recover_password_subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            required
            className={styles.input}
            // Reusing the placeholder defined in Register/Login views
            placeholder={t('auth.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? t('auth.sending') : t('auth.send_link_button')}
          </button>
        </form>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <Link to="/login" className={styles.backLink}>
          {t('auth.back_to_login')}
        </Link>
      </div>
    </div>
  );
}