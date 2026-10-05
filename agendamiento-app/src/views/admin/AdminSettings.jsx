import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Lock,
  Users,
  Plus,
  Trash2,
  Search,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { userService } from '../../services/user.service';
import { useAlert } from '../../context/AlertContext';
import { useTenant } from '../../context/TenantContext';
import AddEmployeeModal from './AddEmployeeModal';
import './AdminSettings.css';

const getMetadataDisplayName = (user) => {
  const metadata = user?.user_metadata ?? {};
  const metadataName =
    metadata.full_name || metadata.fullName || '';

  if (metadataName) {
    return String(metadataName);
  }

  const firstName =
    metadata.first_name || metadata.firstName || '';
  const lastName =
    metadata.last_name || metadata.lastName || '';

  return [firstName, lastName].filter(Boolean).join(' ');
};

const getProfileDisplayName = (profile, user) => {
  const profileName =
    profile?.full_name || profile?.fullName || '';

  return profileName || getMetadataDisplayName(user);
};

const ProfileTab = () => {
  const { t } = useTranslation();
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = await authService.getCurrentUser();

      if (!currentUser) {
        throw new Error(t('error.no_user_found'));
      }

      const profileData = await userService.getProfile(
        currentUser.id
      );

      setAccount(currentUser);
      setProfile(profileData ?? {});
    } catch (requestError) {
      console.error(
        'Error loading the administrator profile:',
        requestError
      );

      setAccount(null);
      setProfile(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : t('error.generic')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div
        className="settings-card"
        role="status"
        aria-busy="true"
      >
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-card" role="alert">
        <p>{error}</p>
        <button
          className="btn-secondary"
          type="button"
          onClick={loadProfile}
        >
          {t('adminBooking.retry')}
        </button>
      </div>
    );
  }

  const displayName =
    getProfileDisplayName(profile, account) ||
    t('profile.default_user_name');
  const email = account?.email || '';
  const phone = profile?.phone || '';
  const userId = account?.id || '';

  return (
    <div>
      <div className="settings-card">
        <h3>
          <User size={18} />
          {t('profile.personal_information_title')}
        </h3>

        <div className="form-group">
          <label htmlFor="admin-profile-name">
            {t('profile.full_name')}
          </label>
          <input
            id="admin-profile-name"
            className="input-disabled"
            type="text"
            value={displayName}
            readOnly
          />
        </div>

        <div className="form-group">
          <label htmlFor="admin-profile-phone">
            {t('profile.phone')}
          </label>
          <input
            id="admin-profile-phone"
            className="input-disabled"
            type="tel"
            value={phone}
            readOnly
          />
        </div>
      </div>

      <div className="settings-card">
        <h3>
          <Lock size={18} />
          {t('profile.account_security_title')}
        </h3>

        <div className="form-group">
          <label htmlFor="admin-profile-email">
            {t('auth.email_label')}
          </label>
          <input
            id="admin-profile-email"
            className="input-disabled"
            type="email"
            value={email}
            readOnly
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="admin-profile-id">ID</label>
          <input
            id="admin-profile-id"
            className="input-disabled"
            type="text"
            value={userId}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="admin-container">
      <h1 className="page-title">
        {t('admin.settings_title')}
      </h1>

      <div className="tabs-header">
        <button
          className={`tab-btn ${
            activeTab === 'profile' ? 'active' : ''
          }`}
          type="button"
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          <span>{t('profile.my_profile_title')}</span>
        </button>

        <button
          className={`tab-btn ${
            activeTab === 'employees' ? 'active' : ''
          }`}
          type="button"
          onClick={() => setActiveTab('employees')}
        >
          <Users size={18} />
          <span>{t('admin.employees_tab')}</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'profile' ? (
          <ProfileTab />
        ) : (
          <EmployeesTab />
        )}
      </div>
    </div>
  );
};

const EmployeesTab = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const tenant = useTenant();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(
        'Error fetching employees:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const fullName =
      `${employee.firstName || ''} ${
        employee.lastName || ''
      }`.toLowerCase();
    const email = (employee.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      fullName.includes(search) ||
      email.includes(search)
    );
  });

  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  const handleCreateEmployee = async (employeeData) => {
    try {
      const result = await authService.registerEmployee({
        ...employeeData,
        tenantId: tenant?.id,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      showAlert(t('success.employee_created'));
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      showAlert(
        `${t('error.generic')}: ${error.message}`
      );
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus =
        await userService.toggleUserStatus(
          id,
          currentStatus
        );

      setEmployees((currentEmployees) =>
        currentEmployees.map((employee) =>
          employee.id === id
            ? {
                ...employee,
                isActive: newStatus,
              }
            : employee
        )
      );
    } catch (error) {
      showAlert(t('error.status_update'));
    }
  };

  return (
    <div className="employees-wrapper">
      <div className="actions-header">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('admin.search_placeholder')}
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <button
          className="btn-primary btn-add"
          type="button"
          onClick={handleAddNew}
        >
          <Plus size={18} />
          <span className="hide-on-mobile">
            {t('admin.add_new_button')}
          </span>
        </button>
      </div>

      {loading ? (
        <p>{t('admin.loading_employees')}</p>
      ) : (
        <div className="employee-list">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="employee-card"
            >
              <div className="card-left">
                <div className="avatar-placeholder">
                  {employee.firstName
                    ? employee.firstName.charAt(0)
                    : '?'}
                </div>

                <div className="emp-info">
                  <h4>
                    {employee.firstName}{' '}
                    {employee.lastName}
                  </h4>
                  <p>{employee.email}</p>
                  <span
                    className={`status-badge ${
                      employee.isActive
                        ? 'active'
                        : 'inactive'
                    }`}
                  >
                    {employee.isActive
                      ? t('admin.status_active')
                      : t('admin.status_inactive')}
                  </span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="icon-btn delete"
                  type="button"
                  title={
                    employee.isActive
                      ? t('admin.deactivate_tooltip')
                      : t('admin.activate_tooltip')
                  }
                  onClick={() =>
                    toggleStatus(
                      employee.id,
                      employee.isActive
                    )
                  }
                >
                  {employee.isActive ? (
                    <Trash2 size={18} />
                  ) : (
                    <User size={18} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateEmployee}
      />
    </div>
  );
};

export default AdminSettings;
