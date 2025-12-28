import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Lock, Users, Plus, Trash2, Search, Save } from 'lucide-react';
import { authService } from '../../services/authService'; // Check path
import { userService } from '../../services/user.service'; // Check path
import { useAlert } from '../../context/AlertContext';
import { useTenant } from '../../context/TenantContext'; // Import Tenant Context
import AddEmployeeModal from './AddEmployeeModal'; // <--- Import Modal
import './AdminSettings.css';

const AdminSettings = () => {
  const { t } = useTranslation();
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

// ... (ProfileTab component remains exactly the same as your code) ...
const ProfileTab = () => {
    // ... [Copy your existing ProfileTab code here] ...
    // Just for brevity in this answer, I assume you keep your ProfileTab code.
    // If you need it repeated, let me know.
    const { t } = useTranslation();
    return <div>{t('profile.my_profile_title')} Content...</div>; // Placeholder
};


// --- Sub-Component: Employees Management Tab ---
const EmployeesTab = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const  tenant  = useTenant(); // Get current Tenant ID
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
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

  // Filter for Search
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Handle opening modal
  const handleAddNew = () => {
    setIsModalOpen(true);
  };

  // Handle creating the user
  const handleCreateEmployee = async (employeeData) => {
    try {
      // 1. Call Auth Service
      const result = await authService.registerEmployee({
        ...employeeData,
        tenantId: tenant.id // Ensure we associate with current tenant
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // 2. Success Feedback
      showAlert(t('success.employee_created'));
      setIsModalOpen(false);
      
      // 3. Refresh list
      fetchEmployees();

    } catch (error) {
      showAlert(t('error.generic') + ': ' + error.message);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = await userService.toggleUserStatus(id, currentStatus);
      setEmployees(employees.map(emp => 
        emp.id === id ? { ...emp, isActive: newStatus } : emp
      ));
    } catch (error) {
      showAlert(t('error.status_update'));
    }
  };

  return (
    <div className="employees-wrapper">
      {/* Search and Add Header */}
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

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateEmployee}
      />
    </div>
  );
};

export default AdminSettings;