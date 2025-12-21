import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { useAuth } from '../context/AuthContext'; 
import { bookingService } from '../services/booking.service'; 
import { useAlert } from '../context/AlertContext';

// Steps Components
import ServiceSelection from './ServiceSelection';
import TimeSelection from './TimeSelection';
import Confirmation from './Confirmation'; 

import styles from './css/BookingWizard.module.css';

const BookingWizard = () => {
  const { t } = useTranslation(); // <--- Init hook
  const [step, setStep] = useState(1);
  const { user } = useAuth(); 
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  // Loading state for the confirmation button
  const [loading, setLoading] = useState(false);

  const [bookingData, setBookingData] = useState({
    service: null,
    date: null,
    time: null, 
    employee: null 
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  // Selection Handlers
  const handleSelectService = (service) => {
    setBookingData({ ...bookingData, service });
    nextStep();
  };

  const handleSelectTime = (date, timeSlot) => {
    setBookingData({ ...bookingData, date, time: timeSlot });
    nextStep();
  };

  // --- FINAL CONFIRMATION LOGIC ---
  const handleConfirmBooking = async () => {
    if (!user) {
      // Reusing the error key we defined earlier
      showAlert(t('error.no_user_found'), 'error');
      return;
    }

    setLoading(true);
    try {
      // Call service to create appointment
      // createBooking(userId, serviceObject, timeString)
      await bookingService.createBooking(
        user.id, 
        bookingData.service, 
        bookingData.date, // Date Object
        bookingData.time  // String "09:00"
      );

      // Success! Redirect or show message
      showAlert(t('success.reservation_created'));
      navigate('/'); // Return home or to "My Appointments"

    } catch (error) {
      console.error("Error creating booking:", error);
      showAlert(t('error.reservation_creation') + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wizardContainer}>
      
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={`${styles.step} ${step >= 1 ? styles.activeStep : ''}`}>
          1. {t('booking.step_service')}
        </div>
        <div className={styles.line}></div>
        <div className={`${styles.step} ${step >= 2 ? styles.activeStep : ''}`}>
          2. {t('booking.step_time')}
        </div>
        <div className={styles.line}></div>
        <div className={`${styles.step} ${step >= 3 ? styles.activeStep : ''}`}>
          3. {t('booking.step_confirm')}
        </div>
      </div>

      {/* Dynamic Content */}
      <div className={styles.stepContent}>
        {step === 1 && (
          <ServiceSelection onSelectService={handleSelectService} />
        )}

        {step === 2 && (
          <TimeSelection 
            selectedService={bookingData.service}
            onBack={prevStep}
            onSelectSlot={handleSelectTime}
          />
        )}

        {step === 3 && (
          <Confirmation 
            bookingData={bookingData}
            onBack={prevStep}
            onConfirm={handleConfirmBooking}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default BookingWizard;