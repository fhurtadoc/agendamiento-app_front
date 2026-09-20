import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../services/booking.service';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import styles from './css/TimeSelection.module.css';

const TimeSelection = ({
  selectedService,
  selectedEmployeeId,
  onBack,
  onSelectSlot,
}) => {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      setSlots([]);

      try {
        const availableSlots = await bookingService.getSlots(
          currentDate,
          selectedEmployeeId
        );
        setSlots(availableSlots);
      } catch (err) {
        console.error(err);
        setError(t('booking.error_loading_slots'));
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentDate, selectedEmployeeId, t]);

  const changeDay = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isToday = currentDate >= today;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          onClick={onBack}
          className={styles.navBtn}
          aria-label={t('booking.back', { defaultValue: 'Volver' })}
        >
          <ChevronLeft size={20} />
        </button>

        <div className={styles.serviceInfo}>
          <span>{t('booking.label')}</span>
          <strong>{selectedService?.title}</strong>
        </div>
      </div>

      <div className={styles.dateSelector}>
        <button
          type="button"
          onClick={() => changeDay(-1)}
          className={styles.navBtn}
          disabled={isToday}
          aria-label={t('booking.previous_day', {
            defaultValue: 'Día anterior',
          })}
        >
          <ChevronLeft size={20} />
        </button>

        <div className={styles.dateDisplay}>
          <span className={styles.dayName}>
            {currentDate.toLocaleDateString(i18n.language, {
              weekday: 'long',
            })}
          </span>
          <span className={styles.fullDate}>
            {currentDate.toLocaleDateString(i18n.language, {
              day: 'numeric',
              month: 'long',
            })}
          </span>
        </div>

        <button
          type="button"
          onClick={() => changeDay(1)}
          className={styles.navBtn}
          aria-label={t('booking.next_day', {
            defaultValue: 'Día siguiente',
          })}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.slotsContainer}>
        {loading ? (
          <div className={styles.loading}>
            {t('booking.loading_slots')}
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : slots.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('booking.no_availability')}</p>
            <small>{t('booking.try_next_day')}</small>
          </div>
        ) : (
          <div className={styles.grid}>
            {slots.map((timeSlot) => (
              <button
                type="button"
                key={timeSlot}
                className={styles.slotBtn}
                onClick={() => onSelectSlot(currentDate, timeSlot)}
              >
                <Clock size={16} />
                {timeSlot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSelection;
