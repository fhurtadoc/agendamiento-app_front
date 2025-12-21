import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { bookingService } from '../services/booking.service';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import styles from './css/TimeSelection.module.css'; 

const TimeSelection = ({ selectedService, onBack, onSelectSlot }) => {
  const { t, i18n } = useTranslation(); // <--- Init hook
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState([]); // List of strings: ['09:00', '10:00']
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load slots when the date changes
  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      setSlots([]);
      
      try {
        // The service returns clean strings ("09:00")
        const availableSlots = await bookingService.getSlots(currentDate);
        setSlots(availableSlots);
      } catch (err) {
        console.error(err);
        setError(t('booking.error_loading_slots'));
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [currentDate, t]); // Added 't' as dependency

  // Handle day change
  const changeDay = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    
    // Prevent going to the past (resets to today if earlier)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with Service Info */}
      <div className={styles.header}>        
        <div className={styles.serviceInfo}>
          <span>{t('booking.label')}</span>
          <strong>{selectedService?.title}</strong>
        </div>
      </div>

      {/* Date Selector */}
      <div className={styles.dateSelector}>
        <button onClick={() => changeDay(-1)} className={styles.navBtn}>
          <ChevronLeft size={20} />
        </button>
        
        <div className={styles.dateDisplay}>
          {/* We use i18n.language to format the date in the correct locale */}
          <span className={styles.dayName}>
            {currentDate.toLocaleDateString(i18n.language, { weekday: 'long' })}
          </span>
          <span className={styles.fullDate}>
            {currentDate.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })}
          </span>
        </div>
        
        <button onClick={() => changeDay(1)} className={styles.navBtn}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Slots Grid */}
      <div className={styles.slotsContainer}>
        {loading ? (
          <div className={styles.loading}>{t('booking.loading_slots')}</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : slots.length === 0 ? (
          <div className={styles.empty}>
            <p>{t('booking.no_availability')}</p>
            <small>{t('booking.try_next_day')}</small>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* 'timeSlot' is already a clean string "09:00".
               No slices or transformations needed here.
            */}
            {slots.map((timeSlot, index) => (
              <button 
                key={index} 
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