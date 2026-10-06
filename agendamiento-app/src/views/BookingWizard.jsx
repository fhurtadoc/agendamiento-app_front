import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/booking.service';
import { useAlert } from '../context/AlertContext';

import BranchSelection from './BranchSelection';
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

  // "branch" is the new first selection in the flow
  const [bookingData, setBookingData] = useState({
    branch: null,
    service: null,
    employee: null,
    employeeId: null,
    date: null,
    time: null,
  });

  const nextStep = () => setStep((previousStep) => previousStep + 1);
  const prevStep = () => setStep((previousStep) => previousStep - 1);

  // Step 1: Branch -> resets everything downstream (employees are branch-specific)
  const handleSelectBranch = (branch) => {
    setBookingData((previousData) => ({
      ...previousData,
      branch,
      employee: null,
      employeeId: null,
      service: null,
      date: null,
      time: null,
    }));
    nextStep();
  };

  // Step 2: Employee -> date/time depend on the employee
  const handleSelectEmployee = (employee) => {
    setBookingData((previousData) => ({
      ...previousData,
      employee,
      employeeId: employee.id,
      date: null,
      time: null,
    }));
    nextStep();
  };

  // Step 3: Service -> resets date/time so the slot is re-picked consistently
  const handleSelectService = (service) => {
    setBookingData((previousData) => ({
      ...previousData,
      service,
      date: null,
      time: null,
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

    if (!bookingData.branch?.id) {
      showAlert(
        t('booking.error_no_branch', {
          defaultValue: 'Debes seleccionar una sucursal para continuar.',
        }),
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      await bookingService.createBooking(
        user.id,
        bookingData.service,
        bookingData.date,
        bookingData.time,
        bookingData.employeeId,
        bookingData.branch.id
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

  const stepLabels = [
    t('booking.step_branch', { defaultValue: 'Sucursal' }),
    t('booking.step_employee', { defaultValue: 'Empleado' }),
    t('booking.step_service', { defaultValue: 'Servicio' }),
    t('booking.step_time', { defaultValue: 'Horario' }),
    t('booking.step_confirm', { defaultValue: 'Confirmar' }),
  ];

  return (
    <div className={styles.wizardContainer}>
      <div className={styles.progressBar}>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;

          return (
            <React.Fragment key={`step-${stepNumber}`}>
              {index > 0 && <div className={styles.line}></div>}
              <div
                className={`${styles.step} ${
                  step >= stepNumber ? styles.activeStep : ''
                }`}
              >
                {stepNumber}. {label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.stepContent}>
        {/* Step 1: Branch (NEW) */}
        {step === 1 && (
          <BranchSelection onSelectBranch={handleSelectBranch} />
        )}

        {/* Step 2: Employee (filtered by selected branch) */}
        {step === 2 && (
          <EmployeeSelection
            selectedBranch={bookingData.branch}
            onBack={prevStep}
            onSelectEmployee={handleSelectEmployee}
          />
        )}

        {/* Step 3: Service */}
        {step === 3 && (
          <ServiceSelection
            onBack={prevStep}
            onSelectService={handleSelectService}
          />
        )}

        {/* Step 4: Time */}
        {step === 4 && (
          <TimeSelection
            selectedService={bookingData.service}
            selectedEmployeeId={bookingData.employeeId}
            onBack={prevStep}
            onSelectSlot={handleSelectTime}
          />
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
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
