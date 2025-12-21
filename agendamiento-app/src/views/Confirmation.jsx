import React from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { Calendar, Clock, Scissors, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './css/Confirmation.module.css';

const Confirmation = ({ bookingData, onBack, onConfirm, loading }) => {
  const { t, i18n } = useTranslation(); // <--- Init hook
  const { service, date, time } = bookingData;

  // Readable date format based on current language
  const dateString = date.toLocaleDateString(i18n.language, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('booking.review_title')}</h2>
      
      <div className={styles.summaryCard}>
        {/* SERVICE DETAILS */}
        <div className={styles.row}>
          <div className={styles.iconBox}><Scissors size={20} /></div>
          <div className={styles.details}>
            <span className={styles.label}>{t('booking.service_label')}</span>
            <strong className={styles.value}>{service.title}</strong>
            <span className={styles.subtext}>{service.duration} • {service.price}</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* DATE AND TIME */}
        <div className={styles.row}>
          <div className={styles.iconBox}><Calendar size={20} /></div>
          <div className={styles.details}>
            <span className={styles.label}>{t('booking.date_time_label')}</span>
            <strong className={styles.value}>{dateString}</strong>
            <div className={styles.timeTag}>
              <Clock size={14} />
              <span>{time}</span>
            </div>
          </div>
        </div>

        {/* IMPORTANT NOTE */}
        <div className={styles.note}>
          <AlertCircle size={16} />
          <p>
            {t('booking.auto_assign_note')}
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className={styles.actions}>
        <button 
          className={styles.backBtn} 
          onClick={onBack}
          disabled={loading}
        >
          {t('common.back')}
        </button>
        
        <button 
          className={styles.confirmBtn} 
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? t('booking.confirming') : t('booking.confirm_button')}
          {!loading && <CheckCircle size={18} />}
        </button>
      </div>
    </div>
  );
};

export default Confirmation;