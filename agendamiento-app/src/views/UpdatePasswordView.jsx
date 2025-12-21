import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import translation hook
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import styles from './css/UpdatePasswordView.module.css';

export default function UpdatePasswordView() {
  const { t } = useTranslation(); // Initialize hook
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth(); // To check if session exists

  // Security validation: If user arrives here without session, handle it
  useEffect(() => {
    // Give a small time margin in case AuthContext is loading
    const timer = setTimeout(() => {
      if (!user) {
        // If no user, they didn't arrive via a valid email link
        // navigate('/login'); // Optional: uncomment if you want to force expulsion
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.password_mismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.password_min_length'));
      return;
    }

    setLoading(true);

    // Call service to update user
    const { error: updateError } = await authService.updatePassword(password);

    if (updateError) {
      setError(t('auth.update_error') + updateError.message);
      setLoading(false);
    } else {
      // Success! Redirect to Dashboard
      // Note: You could also use showAlert(t('success.password_updated')) here if you import useAlert
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t('auth.new_password_title')}</h2>
        <p className={styles.subtitle}>
          {t('auth.new_password_subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.new_password_label')}</label>
            <input
              type="password"
              required
              minLength={6}
              className={styles.input}
              placeholder={t('auth.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('auth.confirm_password_label')}</label>
            <input
              type="password"
              required
              className={styles.input}
              placeholder={t('auth.repeat_password_placeholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} className={styles.button}>
            {/* Reusing common.save for the loading state, and specific auth key for action */}
            {loading ? t('common.save') : t('auth.update_password_button')}
          </button>
        </form>
      </div>
    </div>
  );
}