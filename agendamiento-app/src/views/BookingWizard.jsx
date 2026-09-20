import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/booking.service';
import { useAlert } from '../context/AlertContext';

import ServiceSelection from './ServiceSelection';
import EmployeeSelection from './EmployeeSelection';
import TimeSelection from './TimeSelection';
import Confirmation from './Confirmation';

import styles from './css/BookingWizard.module.css';

const BookingWizard = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [bookingData, setBookingData] = useState({
    service: null,
    employee: null,
    employeeId: null,
    date: null,
    time: null,
  });

  const nextStep = () => setStep((previousStep) => previousStep + 1);
  const prevStep = () => setStep((previousStep) => previousStep - 1);

  const handleSelectService = (service) => {
    setBookingData((previousData) => ({
      ...previousData,
      service,
      employee: null,
      employeeId: null,
      date: null,
      time: null,
    }));
    nextStep();
  };

  const handleSelectEmployee = (employee) => {
    setBookingData((previousData) => ({
      ...previousData,
      employee,
      employeeId: employee.id,
    }));
    nextStep();
  };

  const handleSelectTime = (date, timeSlot) => {
    setBookingData((previousData) => ({
      ...previousData,
      date,
      time: timeSlot,
    }));
    nextStep();
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      showAlert(t('error.no_user_found'), 'error');
      return;
    }

    setLoading(true);

    try {
      await bookingService.createBooking(
        user.id,
        bookingData.service,
        bookingData.date,
        bookingData.time,
        bookingData.employeeId
      );

      showAlert(t('success.reservation_created'));
      navigate('/');
    } catch (error) {
      console.error('Error creating booking:', error);
      showAlert(
        t('error.reservation_creation') + error.message,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.progressBar}>
        <div
          className={`${styles.step} ${
            step >= 1 ? styles.activeStep : ''
          }`}
        >
          1. {t('booking.step_service')}
        </div>
        <div className={styles.line}></div>
        <div
          className={`${styles.step} ${
            step >= 2 ? styles.activeStep : ''
          }`}
        >
          2. {t('booking.step_employee')}
        </div>
        <div className={styles.line}></div>
        <div
          className={`${styles.step} ${
            step >= 3 ? styles.activeStep : ''
          }`}
        >
          3. {t('booking.step_time')}
        </div>
        <div className={styles.line}></div>
        <div
          className={`${styles.step} ${
            step >= 4 ? styles.activeStep : ''
          }`}
        >
          4. {t('booking.step_confirm')}
        </div>
      </div>

      <div className={styles.stepContent}>
        {step === 1 && (
          <ServiceSelection onSelectService={handleSelectService} />
        )}

        {step === 2 && (
          <EmployeeSelection
            selectedService={bookingData.service}
            onBack={prevStep}
            onSelectEmployee={handleSelectEmployee}
          />
        )}

        {step === 3 && (
          <TimeSelection
            selectedService={bookingData.service}
            selectedEmployeeId={bookingData.employeeId}
            onBack={prevStep}
            onSelectSlot={handleSelectTime}
          />
        )}

        {step === 4 && (
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
