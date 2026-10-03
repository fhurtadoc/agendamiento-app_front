import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { bookingService } from '../services/booking.service';
import styles from './css/EmployeeSelection.module.css';

const getInitials = (value) => {
  const initials = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  return initials || 'E';
};

const EmployeeSelection = ({
  selectedBranch,
  onBack,
  onSelectEmployee,
}) => {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const branchId = selectedBranch?.id;

  // Employees are fetched conditionally on the selected branch
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEmployees([]);

    if (!branchId) {
      setError(
        t('booking.error_no_branch', {
          defaultValue: 'Debes seleccionar una sucursal primero.',
        })
      );
      setLoading(false);
      return;
    }

    try {
      const availableEmployees = await bookingService.getAvailableEmployees(
        branchId
      );
      setEmployees(availableEmployees);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(
        t('booking.error_loading_employees', {
          defaultValue: 'No pudimos cargar los empleados disponibles.',
        })
      );
    } finally {
      setLoading(false);
    }
  }, [t, branchId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          aria-label={t('booking.back', { defaultValue: 'Volver' })}
        >
          <ChevronLeft size={20} />
        </button>

        <div className={styles.serviceInfo}>
          <span>
            {t('booking.branch_label', { defaultValue: 'Sucursal' })}
          </span>
          <strong>{selectedBranch?.name}</strong>
        </div>
      </div>

      <div className={styles.intro}>
        <h2>
          {t('booking.select_employee', {
            defaultValue: 'Seleccionar empleada',
          })}
        </h2>
        <p>
          {t('booking.select_employee_description', {
            defaultValue: 'Elige la profesional para tu servicio.',
          })}
        </p>
      </div>

      {loading ? (
        <div className={styles.statePanel} role="status">
          <span className={styles.spinner} aria-hidden="true"></span>
          <p>
            {t('booking.loading_employees', {
              defaultValue: 'Cargando empleadas disponibles...',
            })}
          </p>
        </div>
      ) : error ? (
        <div className={styles.statePanel} role="alert">
          <UserRound size={32} aria-hidden="true" />
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={loadEmployees}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {t('booking.retry', { defaultValue: 'Reintentar' })}
          </button>
        </div>
      ) : employees.length === 0 ? (
        <div className={styles.statePanel}>
          <UserRound size={32} aria-hidden="true" />
          <p>
            {t('booking.no_employees_available', {
              defaultValue: 'No hay empleadas disponibles en este momento.',
            })}
          </p>
        </div>
      ) : (
        <div className={styles.employeeList}>
          {employees.map((employee) => (
            <button
              type="button"
              key={employee.id}
              className={styles.employeeButton}
              onClick={() => onSelectEmployee(employee)}
              aria-label={`${t('booking.select_employee_action', {
                defaultValue: 'Seleccionar',
              })} ${employee.name}`}
            >
              <span
                className={styles.initials}
                aria-hidden="true"
              >
                {getInitials(employee.name)}
              </span>

              <span className={styles.employeeDetails}>
                <strong className={styles.employeeName}>
                  {employee.name}
                </strong>
                {employee.email && (
                  <small className={styles.employeeEmail}>
                    {employee.email}
                  </small>
                )}
              </span>

              <ChevronRight
                size={20}
                className={styles.selectIcon}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeSelection;
