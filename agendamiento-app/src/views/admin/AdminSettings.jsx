import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { User, Lock, Users, Plus, Trash2, Search, Save } from 'lucide-react';
import { authService } from '../../services/auth.service'; 
import { userService } from '../../services/user.service'; 
import { useAlert } from '../../context/AlertContext';
import './AdminSettings.css';

const AdminSettings = () => {
  const { t } = useTranslation(); // <--- Init hook
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="admin-container">
      <h1 className="page-title">{t('admin.settings_title')}</h1>
      
      {/* Tab Navigation */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={18} />
          {/* Reusing existing profile title */}
          <span>{t('profile.my_profile_title')}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          <Users size={18} />
          <span>{t('admin.employees_tab')}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'profile' ? <ProfileTab /> : <EmployeesTab />}
      </div>
    </div>
  );
};

// --- Sub-Component: Admin Profile Tab ---
const ProfileTab = () => {
  const { t } = useTranslation(); // <--- Init hook for sub-component
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  });

  // Fetch current user data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // 1. Get current user ID from Auth Service
        const { user } = await authService.getCurrentUserWithRole();
        
        if (user) {
          setUserId(user.id);
          // 2. Get profile data from User Service
          const profile = await userService.getProfile(user.id);

          setFormData(prev => ({
            ...prev,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: user.email // Email from auth session
          }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Update Personal Info
  const handleUpdateInfo = async () => {
    try {
      setLoading(true);
      await userService.updateProfileInfo(userId, {
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      // Reusing success key
      showAlert(t('success.data_updated'));
    } catch (error) {
      showAlert(t('error.profile_update') + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    try {
      setLoading(true);
      // Validations are now inside the service
      await authService.changePassword(formData.newPassword);
      
      showAlert(t('success.password_updated'));
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (error) {
      showAlert(t('error.generic') + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userId) return <div>{t('common.loading')}</div>;

  return (
    <div className="profile-wrapper">
      {/* Personal Info Section */}
      <section className="settings-card">
        <h3><User size={20} /> {t('profile.personal_info_title')}</h3>
        <div className="form-group">
          <label>{t('profile.first_name')}</label>
          <input 
            type="text" 
            name="firstName" 
            value={formData.firstName} 
            onChange={handleChange} 
          />
        </div>
        <div className="form-group">
          <label>{t('profile.last_name')}</label>
          <input 
            type="text" 
            name="lastName" 
            value={formData.lastName} 
            onChange={handleChange} 
          />
        </div>
        <div className="form-group">
          <label>{t('admin.email_read_only_label')}</label>
          <input 
            type="email" 
            value={formData.email} 
            disabled 
            className="input-disabled"
          />
        </div>
        <button className="btn-primary" onClick={handleUpdateInfo} disabled={loading}>
          <Save size={18} /> {loading ? t('profile.updating') : t('common.save')}
        </button>
      </section>

      {/* Security Section */}
      <section className="settings-card">
        <h3><Lock size={20} /> {t('profile.account_security_title')}</h3>
        <div className="form-group">
          <label>{t('auth.new_password_label')}</label>
          <input 
            type="password" 
            name="newPassword" 
            value={formData.newPassword}
            onChange={handleChange}
            placeholder={t('profile.new_password_placeholder')}
          />
        </div>
        <button className="btn-secondary" onClick={handleChangePassword} disabled={loading}>
          {loading ? t('profile.processing') : t('profile.menu_change_password')}
        </button>
      </section>
    </div>
  );
};

// --- Sub-Component: Employees Management Tab ---
const EmployeesTab = () => {
  const { t } = useTranslation(); // <--- Init hook for sub-component
  const { showAlert } = useAlert();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Using Service instead of Supabase directly
      const data = await userService.getAllEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Toggle Active Status
  const toggleStatus = async (id, currentStatus) => {
    try {
      // Service returns the new status
      const newStatus = await userService.toggleUserStatus(id, currentStatus);
      
      // Update local state
      setEmployees(employees.map(emp => 
        emp.id === id ? { ...emp, isActive: newStatus } : emp
      ));
    } catch (error) {
      showAlert(t('error.status_update'));
    }
  };

  // Filter for Search (Using Normalized camelCase names)
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return fullName.includes(search) || email.includes(search);
  });

  const handleAddNew = () => {
    showAlert(t('info.backend_logic'));
  };

  return (
    <div className="employees-wrapper">
      {/* Actions Header */}
      <div className="actions-header">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder={t('admin.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary btn-add" onClick={handleAddNew}>
          <Plus size={18} />
          <span className="hide-on-mobile">{t('admin.add_new_button')}</span>
        </button>
      </div>

      {/* Employees List */}
      {loading ? (
        <p>{t('admin.loading_employees')}</p>
      ) : (
        <div className="employee-list">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="employee-card">
              <div className="card-left">
                <div className="avatar-placeholder">
                  {emp.firstName ? emp.firstName.charAt(0) : '?'}
                </div>
                <div className="emp-info">
                  <h4>{emp.firstName} {emp.lastName}</h4>
                  <p>{emp.email}</p>
                  {/* Using camelCase 'isActive' */}
                  <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`}>
                    {emp.isActive ? t('admin.status_active') : t('admin.status_inactive')}
                  </span>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="icon-btn delete" 
                  title={emp.isActive ? t('admin.deactivate_tooltip') : t('admin.activate_tooltip')}
                  onClick={() => toggleStatus(emp.id, emp.isActive)}
                >
                  {emp.isActive ? <Trash2 size={18} /> : <User size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;