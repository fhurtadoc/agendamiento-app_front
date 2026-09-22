import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useAlert } from '../../context/AlertContext';
import ServiceCard from '../../components/cards/ServiceCard';
import { adminBookingService } from '../../services/adminBooking.service';
import bookingStyles from '../css/BookingWizard.module.css';
import styles from './AdminBookingWizard.module.css';

const FALLBACK_LOCALE = 'en';
const TOTAL_STEPS = 5;

const normalizeSearchValue = (value, locale = FALLBACK_LOCALE) =>
  String(value ?? '')
    .toLocaleLowerCase(locale)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getLocalDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateValue = (value, locale = FALLBACK_LOCALE) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')
    ? new Date(`${value}T12:00:00`)
    : new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    return '';
  }
};

const LoadingState = ({ label }) => (
  <div className={styles.statePanel} role="status">
    <LoaderCircle
      className={styles.stateIcon}
      size={24}
      aria-hidden="true"
    />
    <p className={styles.stateText}>{label}</p>
  </div>
);

const ErrorState = ({ message, retryLabel, onRetry }) => (
  <div className={styles.statePanel} role="alert">
    <CircleAlert
      className={styles.stateIcon}
      size={24}
      aria-hidden="true"
    />
    <p className={styles.stateText}>{message}</p>
    {onRetry && (
      <button
        className={styles.stateAction}
        type="button"
        onClick={onRetry}
      >
        {retryLabel}
      </button>
    )}
  </div>
);

const EmptyState = ({ message }) => (
  <div className={styles.emptyState}>{message}</div>
);

const PersonOption = ({
  icon: Icon,
  primary,
  secondary,
  metadata,
  selected,
  onClick,
  ariaLabel,
}) => (
  <div className={styles.optionItem} role="listitem">
    <button
      className={`${styles.optionButton} ${
        selected ? styles.selectedOption : ''
      }`}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className={styles.personIcon} aria-hidden="true">
        <Icon size={20} strokeWidth={1.8} />
      </span>

      <span className={styles.optionContent}>
        <span className={styles.primaryText}>{primary}</span>

        {secondary && (
          <span className={styles.secondaryText}>{secondary}</span>
        )}

        {metadata && (
          <span className={styles.secondaryText}>{metadata}</span>
        )}
      </span>

      {selected && (
        <BadgeCheck
          className={styles.selectedIcon}
          size={22}
          aria-hidden="true"
        />
      )}
    </button>
  </div>
);

export default function DashboardAdminView() {
  const { t, i18n } = useTranslation();
  const { showAlert } = useAlert();
  const locale =
    i18n.resolvedLanguage || i18n.language || FALLBACK_LOCALE;
  const today = useMemo(() => getLocalDateValue(), []);
  const activeRequests = useRef(new Map());
  const loadedServicesLocale = useRef(null);

  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [slots, setSlots] = useState([]);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(today);

  const [clientSearch, setClientSearch] = useState('');
  const [stepLoading, setStepLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [stepError, setStepError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const visibleClients = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(
      clientSearch,
      locale
    );

    if (!normalizedSearch) return clients;

    return clients.filter((client) => {
      const searchableValues = [
        client.fullName,
        client.email,
        client.phone,
      ]
        .map((value) => normalizeSearchValue(value, locale))
        .join(' ');

      return searchableValues.includes(normalizedSearch);
    });
  }, [clientSearch, clients, locale]);

  useEffect(() => {
    return () => {
      activeRequests.current.clear();
    };
  }, []);

  const runRequest = useCallback(
    async ({
      key,
      request,
      setLoading,
      onSuccess,
      errorMessageKey,
    }) => {
      const requestId = Symbol(key);

      activeRequests.current.set(key, requestId);
      setLoading?.(true);

      try {
        const result = await request();

        if (activeRequests.current.get(key) !== requestId) {
          return undefined;
        }

        onSuccess(result);
        return result;
      } catch (error) {
        if (activeRequests.current.get(key) !== requestId) {
          return undefined;
        }

        console.error(`Admin booking request failed: ${key}`, error);

        const message = t(errorMessageKey);

        setStepError(message);
        showAlert(message, 'error');

        return undefined;
      } finally {
        if (activeRequests.current.get(key) === requestId) {
          setLoading?.(false);
        }
      }
    },
    [showAlert, t]
  );

  const loadServices = useCallback(() => {
    return runRequest({
      key: 'admin-services',
      request: () => adminBookingService.getServices(locale),
      setLoading: setStepLoading,
      onSuccess: setServices,
      errorMessageKey: 'adminBooking.load_error',
    });
  }, [locale, runRequest]);

  const loadClients = useCallback(() => {
    return runRequest({
      key: 'admin-clients',
      request: () => adminBookingService.getClients(),
      setLoading: setStepLoading,
      onSuccess: setClients,
      errorMessageKey: 'adminBooking.load_error',
    });
  }, [runRequest]);

  const loadEmployees = useCallback(() => {
    return runRequest({
      key: 'admin-employees',
      request: () => adminBookingService.getEmployees(),
      setLoading: setStepLoading,
      onSuccess: setEmployees,
      errorMessageKey: 'adminBooking.load_error',
    });
  }, [runRequest]);

  const loadSlots = useCallback(() => {
    if (!selectedEmployee?.id || !selectedDate) {
      return Promise.resolve();
    }

    return runRequest({
      key: 'admin-slots',
      request: () =>
        adminBookingService.getAvailableSlots(
          selectedDate,
          selectedEmployee.id,
          locale
        ),
      setLoading: setSlotLoading,
      onSuccess: setSlots,
      errorMessageKey: 'adminBooking.load_error',
    });
  }, [
    locale,
    runRequest,
    selectedDate,
    selectedEmployee?.id,
  ]);

  useEffect(() => {
    if (loadedServicesLocale.current === locale) {
      return undefined;
    }

    loadedServicesLocale.current = locale;
    loadServices();

    return undefined;
  }, [loadServices, locale]);

  useEffect(() => {
    if (step !== 2) return undefined;

    setClientSearch('');
    loadClients();

    return undefined;
  }, [loadClients, step]);

  useEffect(() => {
    if (step !== 3) return undefined;

    loadEmployees();

    return undefined;
  }, [loadEmployees, step]);

  useEffect(() => {
    if (step !== 4 || !selectedEmployee?.id) {
      activeRequests.current.set('admin-slots', Symbol('invalid'));
      setSlots([]);
      setSlotLoading(false);
      setStepError(null);

      return undefined;
    }

    setSelectedSlot(null);
    loadSlots();

    return undefined;
  }, [
    loadSlots,
    selectedDate,
    selectedEmployee?.id,
    step,
  ]);

  useEffect(() => {
    setSubmitError(null);
  }, [step]);

  const resetWizard = useCallback(() => {
    activeRequests.current.set('admin-slots', Symbol('reset'));

    setStep(1);
    setSelectedService(null);
    setSelectedClient(null);
    setSelectedEmployee(null);
    setSelectedSlot(null);
    setSelectedDate(getLocalDateValue(new Date()));
    setSlots([]);
    setClientSearch('');
    setSlotLoading(false);
    setStepError(null);
    setSubmitError(null);
    setShowCancelConfirm(false);
  }, []);

  const handleConfirmBooking = useCallback(async () => {
    if (
      !selectedService ||
      !selectedClient ||
      !selectedEmployee ||
      !selectedSlot
    ) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await adminBookingService.createAppointment({
        service: selectedService,
        client: selectedClient,
        employee: selectedEmployee,
        date: selectedDate,
        timeSlot: selectedSlot,
      });

      showAlert(t('adminBooking.appointment_created'), 'success');
      resetWizard();
    } catch (error) {
      console.error('Error creating admin appointment:', error);

      const message = t(
        'adminBooking.appointment_create_error'
      );

      setSubmitError(message);
      showAlert(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }, [
    resetWizard,
    selectedClient,
    selectedDate,
    selectedEmployee,
    selectedService,
    selectedSlot,
    showAlert,
    t,
  ]);

  const handleSelectService = useCallback(
    (service) => {
      setSelectedService(service);
      setSelectedClient(null);
      setSelectedEmployee(null);
      setSelectedSlot(null);
      setSelectedDate(today);
      setStep(2);
    },
    [today]
  );

  const handleSelectClient = useCallback(
    (client) => {
      setSelectedClient(client);
      setSelectedEmployee(null);
      setSelectedSlot(null);
      setSelectedDate(today);
      setStep(3);
    },
    [today]
  );

  const handleSelectEmployee = useCallback((employee) => {
    setSelectedEmployee(employee);
    setSelectedSlot(null);
    setStep(4);
  }, []);

  const handleSelectSlot = useCallback((slot) => {
    setSelectedSlot(slot);
    setStep(5);
  }, []);

  const handleNext = useCallback(() => {
    if (step === TOTAL_STEPS) return;

    if (
      step === 1 &&
      !selectedService
    ) {
      return;
    }

    if (
      step === 2 &&
      !selectedClient
    ) {
      return;
    }

    if (
      step === 3 &&
      !selectedEmployee
    ) {
      return;
    }

    if (
      step === 4 &&
      (!selectedSlot || slotLoading)
    ) {
      return;
    }

    setStep((currentStep) =>
      Math.min(currentStep + 1, TOTAL_STEPS)
    );
  }, [
    selectedClient,
    selectedEmployee,
    selectedService,
    selectedSlot,
    slotLoading,
    step,
  ]);

  const handleBack = useCallback(() => {
    if (step === 1 || submitting) return;

    setStep((currentStep) => Math.max(currentStep - 1, 1));
  }, [step, submitting]);

  const requestCancel = useCallback(() => {
    if (submitting) return;

    setShowCancelConfirm(true);
  }, [submitting]);

  const confirmCancel = useCallback(() => {
    resetWizard();
  }, [resetWizard]);

  const handleRetry = useCallback(() => {
    if (step === 1) {
      loadServices();
    } else if (step === 2) {
      loadClients();
    } else if (step === 3) {
      loadEmployees();
    } else if (step === 4) {
      loadSlots();
    }
  }, [
    loadClients,
    loadEmployees,
    loadServices,
    loadSlots,
    step,
  ]);

  const handleDateChange = useCallback((event) => {
    setSelectedDate(event.target.value);
    setSelectedSlot(null);
  }, []);

  const handleClientSearch = useCallback((event) => {
    setClientSearch(event.target.value);
  }, []);

  const primaryAction =
    step === TOTAL_STEPS
      ? handleConfirmBooking
      : handleNext;

  const isPrimaryDisabled =
    step === 1
      ? !selectedService
      : step === 2
        ? !selectedClient
        : step === 3
          ? !selectedEmployee
          : step === 4
            ? !selectedSlot || slotLoading
            : submitting;

  const contactDetails = [
    selectedClient?.email,
    selectedClient?.phone,
  ]
    .filter(Boolean)
    .join(' · ');

  const progressSteps = [
    t('adminBooking.step_service'),
    t('adminBooking.step_client'),
    t('adminBooking.step_employee'),
    t('adminBooking.step_time'),
    t('adminBooking.step_confirm'),
  ];

  const primaryLabel =
    step === TOTAL_STEPS
      ? submitting
        ? t('adminBooking.confirming')
        : t('adminBooking.confirm')
      : t('adminBooking.next');

  return (
    <div>
      <h1 style={{ color: '#1e293b' }}>
        {t('admin.dashboard_title')}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        <div style={cardStyle}>
          <h3>{t('admin.total_users')}</h3>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            1,240
          </p>
        </div>

        <div style={cardStyle}>
          <h3>{t('admin.monthly_sales')}</h3>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#10b981',
            }}
          >
            $45,300
          </p>
        </div>

        <div style={cardStyle}>
          <h3>{t('admin.alerts')}</h3>
          <p
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#f59e0b',
            }}
          >
            3
          </p>
        </div>
      </div>

      <section
        className={styles.section}
        aria-labelledby="admin-booking-heading"
      >
        <h2
          id="admin-booking-heading"
          className={styles.sectionHeading}
        >
          {t('adminBooking.title')}
        </h2>

        <p className={styles.sectionDescription}>
          {t('adminBooking.description')}
        </p>

        <div className={bookingStyles.wizardContainer}>
          <div
            className={bookingStyles.progressBar}
            role="list"
            aria-label={t('adminBooking.progress')}
          >
            {progressSteps.map((label, index) => {
              const stepNumber = index + 1;

              return (
                <React.Fragment key={index}>
                  <div
                    className={`${bookingStyles.step} ${
                      step >= stepNumber
                        ? bookingStyles.activeStep
                        : ''
                    }`}
                    role="listitem"
                    aria-current={
                      step === stepNumber ? 'step' : undefined
                    }
                    aria-label={t('adminBooking.step_count', {
                      current: step,
                      total: TOTAL_STEPS,
                    })}
                  >
                    <span className={styles.stepNumber}>
                      {stepNumber}
                    </span>
                    <span className={styles.progressLabel}>
                      {label}
                    </span>
                  </div>

                  {stepNumber < progressSteps.length && (
                    <div
                      className={bookingStyles.line}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div
            className={bookingStyles.stepContent}
            aria-busy={
              stepLoading || slotLoading || submitting
            }
          >
            {step === 1 && (
              <>
                <h3 className={styles.subheading}>
                  {t('adminBooking.select_service')}
                </h3>

                {stepLoading ? (
                  <LoadingState
                    label={t('adminBooking.loading')}
                  />
                ) : stepError ? (
                  <ErrorState
                    message={stepError}
                    retryLabel={t('adminBooking.retry')}
                    onRetry={handleRetry}
                  />
                ) : services.length === 0 ? (
                  <EmptyState
                    message={t('adminBooking.no_services')}
                  />
                ) : (
                  <div className={styles.selectionGrid}>
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        title={service.title}
                        details={service.details}
                        duration={service.duration}
                        price={service.price}
                        selected={
                          selectedService?.id === service.id
                        }
                        onClick={() =>
                          handleSelectService(service)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <h3 className={styles.subheading}>
                  {t('adminBooking.select_client')}
                </h3>

                <label
                  className={styles.searchLabel}
                  htmlFor="admin-client-search"
                >
                  {t('adminBooking.search_clients')}
                </label>

                <div className={styles.searchField}>
                  <Search
                    className={styles.searchIcon}
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    id="admin-client-search"
                    className={styles.searchInput}
                    type="search"
                    value={clientSearch}
                    placeholder={t(
                      'adminBooking.search_clients_placeholder'
                    )}
                    autoComplete="off"
                    aria-label={t(
                      'adminBooking.search_clients'
                    )}
                    onChange={handleClientSearch}
                  />
                </div>

                {stepLoading ? (
                  <LoadingState
                    label={t('adminBooking.loading')}
                  />
                ) : stepError ? (
                  <ErrorState
                    message={stepError}
                    retryLabel={t('adminBooking.retry')}
                    onRetry={handleRetry}
                  />
                ) : clients.length === 0 ? (
                  <EmptyState
                    message={t('adminBooking.no_clients')}
                  />
                ) : visibleClients.length === 0 ? (
                  <EmptyState
                    message={t(
                      'adminBooking.no_clients_match'
                    )}
                  />
                ) : (
                  <div
                    className={styles.optionsList}
                    role="list"
                  >
                    {visibleClients.map((client) => {
                      const clientLabel =
                        client.fullName ||
                        t('adminBooking.unnamed_client');

                      return (
                        <PersonOption
                          key={client.id}
                          icon={UserRound}
                          primary={clientLabel}
                          secondary={client.email}
                          metadata={client.phone}
                          selected={
                            selectedClient?.id === client.id
                          }
                          ariaLabel={t(
                            'adminBooking.select_client_option',
                            { client: clientLabel }
                          )}
                          onClick={() =>
                            handleSelectClient(client)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h3 className={styles.subheading}>
                  {t('adminBooking.select_employee')}
                </h3>

                {stepLoading ? (
                  <LoadingState
                    label={t('adminBooking.loading')}
                  />
                ) : stepError ? (
                  <ErrorState
                    message={stepError}
                    retryLabel={t('adminBooking.retry')}
                    onRetry={handleRetry}
                  />
                ) : employees.length === 0 ? (
                  <EmptyState
                    message={t('adminBooking.no_employees')}
                  />
                ) : (
                  <div
                    className={styles.optionsList}
                    role="list"
                  >
                    {employees.map((employee) => {
                      const employeeLabel =
                        employee.fullName ||
                        t('adminBooking.unnamed_employee');

                      return (
                        <PersonOption
                          key={employee.id}
                          icon={UserRound}
                          primary={employeeLabel}
                          secondary={employee.email}
                          metadata={employee.phone}
                          selected={
                            selectedEmployee?.id === employee.id
                          }
                          ariaLabel={t(
                            'adminBooking.select_employee_option',
                            { employee: employeeLabel }
                          )}
                          onClick={() =>
                            handleSelectEmployee(employee)
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <h3 className={styles.subheading}>
                  {t('adminBooking.select_time')}
                </h3>

                <div className={styles.timeLayout}>
                  <div className={styles.dateControl}>
                    <label
                      className={styles.dateLabel}
                      htmlFor="admin-booking-date"
                    >
                      <CalendarDays
                        size={18}
                        aria-hidden="true"
                      />
                      <span>{t('adminBooking.date')}</span>
                    </label>

                    <input
                      id="admin-booking-date"
                      className={styles.dateInput}
                      type="date"
                      value={selectedDate}
                      min={today}
                      disabled={submitting}
                      aria-label={t('adminBooking.date')}
                      onChange={handleDateChange}
                    />
                  </div>

                  <div className={styles.slotsPanel}>
                    <h4 className={styles.slotsHeading}>
                      {t('adminBooking.available_times')}
                    </h4>

                    {!selectedEmployee ? (
                      <EmptyState
                        message={t(
                          'adminBooking.select_employee_for_slots'
                        )}
                      />
                    ) : slotLoading ? (
                      <LoadingState
                        label={t('adminBooking.loading')}
                      />
                    ) : stepError ? (
                      <ErrorState
                        message={stepError}
                        retryLabel={t('adminBooking.retry')}
                        onRetry={handleRetry}
                      />
                    ) : slots.length === 0 ? (
                      <EmptyState
                        message={t('adminBooking.no_slots')}
                      />
                    ) : (
                      <div
                        className={styles.slotGrid}
                        role="list"
                      >
                        {slots.map((slot) => {
                          const slotLabel =
                            slot.label || slot.value;

                          return (
                            <button
                              key={slot.value}
                              className={`${styles.slotButton} ${
                                selectedSlot?.value === slot.value
                                  ? styles.selectedSlot
                                  : ''
                              }`}
                              type="button"
                              disabled={
                                submitting || slotLoading
                              }
                              aria-label={t(
                                'adminBooking.select_slot_option',
                                { time: slotLabel }
                              )}
                              onClick={() =>
                                handleSelectSlot(slot)
                              }
                            >
                              <Clock3
                                size={17}
                                aria-hidden="true"
                              />
                              <span>{slotLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {slots.length === 0 &&
                      !slotLoading &&
                      !stepError &&
                      selectedEmployee && (
                        <p className={styles.helperText}>
                          {t(
                            'adminBooking.try_another_date'
                          )}
                        </p>
                      )}
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h3 className={styles.subheading}>
                  {t('adminBooking.step_confirm')}
                </h3>

                <div className={styles.summary}>
                  <p className={styles.summaryNote}>
                    {t('adminBooking.summary_note')}
                  </p>

                  <dl className={styles.summaryList}>
                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.service')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {selectedService?.title ||
                          t('adminBooking.service_unavailable')}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.client')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {selectedClient?.fullName ||
                          t('adminBooking.client_unavailable')}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.employee')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {selectedEmployee?.fullName ||
                          t('adminBooking.employee_unavailable')}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.date')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {formatDateValue(
                          selectedDate,
                          locale
                        ) || selectedDate}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.time')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {selectedSlot?.label ||
                          selectedSlot?.value}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.duration')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {selectedService?.duration}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.price')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {selectedService?.price}
                      </dd>
                    </div>

                    <div className={styles.summaryItem}>
                      <dt className={styles.summaryLabel}>
                        {t('adminBooking.contact')}
                      </dt>
                      <dd className={styles.summaryValue}>
                        {contactDetails ||
                          t('adminBooking.no_contact')}
                      </dd>
                    </div>
                  </dl>
                </div>

                {submitError && (
                  <ErrorState
                    message={submitError}
                    retryLabel={t('adminBooking.retry')}
                    onRetry={handleConfirmBooking}
                  />
                )}
              </>
            )}
          </div>

          <div className={styles.wizardFooter}>
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              type="button"
              disabled={submitting}
              onClick={requestCancel}
            >
              <X size={17} aria-hidden="true" />
              {t('adminBooking.cancel')}
            </button>

            <div className={styles.footerActions}>
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                type="button"
                disabled={step === 1 || submitting}
                onClick={handleBack}
              >
                <ChevronLeft size={17} aria-hidden="true" />
                {t('adminBooking.back')}
              </button>

              <button
                className={`${styles.button} ${styles.primaryButton}`}
                type="button"
                disabled={isPrimaryDisabled}
                aria-label={primaryLabel}
                onClick={primaryAction}
              >
                {step === TOTAL_STEPS && submitting ? (
                  <LoaderCircle
                    className={styles.iconSpin}
                    size={17}
                    aria-hidden="true"
                  />
                ) : step === TOTAL_STEPS ? (
                  <Check size={17} aria-hidden="true" />
                ) : (
                  <ChevronRight
                    size={17}
                    aria-hidden="true"
                  />
                )}
                <span>{primaryLabel}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {showCancelConfirm && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              requestCancel();
            }
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-cancel-title"
            aria-describedby="admin-cancel-message"
          >
            <div className={styles.modalHeader}>
              <h3 id="admin-cancel-title">
                {t('adminBooking.cancel_title')}
              </h3>

              <button
                className={styles.modalClose}
                type="button"
                aria-label={t('common.close')}
                onClick={requestCancel}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p
              id="admin-cancel-message"
              className={styles.modalMessage}
            >
              {t('adminBooking.cancel_message')}
            </p>

            <div className={styles.modalActions}>
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                type="button"
                onClick={requestCancel}
              >
                {t('adminBooking.keep_editing')}
              </button>

              <button
                className={`${styles.button} ${styles.dangerButton}`}
                type="button"
                onClick={confirmCancel}
              >
                {t('adminBooking.discard')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
};
