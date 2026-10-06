import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '../../../agendamiento-app/src/context/TenantContext';
import { employeeBranchesService } from '../../../agendamiento-app/src/services/employeeBranches.service';
import { groupEmployeesByBranch } from '../../../agendamiento-app/src/adapters/employeeBranches.adapter';
import styles from '../../../agendamiento-app/src/views/admin/css/EmployeeBranches.module.css';

export const EmployeeBranchesView = () => {
  const { t } = useTranslation();
  const { tenant } = useTenant();
  
  // State
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);

  // Load data
  useEffect(() => {
    if (tenant?.id) {
      loadData(tenant.id);
    }
  }, [tenant]);

  const loadData = async (tenantId) => {
    try {
      setLoading(true);
      setError(null);
      
      const [branchesData, employeesData, assignmentsData] = await Promise.all([
        employeeBranchesService.getActiveBranches(tenantId),
        employeeBranchesService.getEmployees(tenantId),
        employeeBranchesService.getEmployeeBranches(tenantId)
      ]);
      
      setBranches(branchesData);
      setEmployees(employeesData);
      setAssignments(assignmentsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag start
  const handleDragStart = useCallback((e, employee) => {
    setDraggedItem(employee);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', employee.id);
    e.target.classList.add(styles.dragging);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((e) => {
    setDraggedItem(null);
    e.target.classList.remove(styles.dragging);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add(styles.dragOver);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove(styles.dragOver);
  }, []);

  // Handle drop on branch
  const handleDrop = useCallback(async (e, targetBranchId) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);
    
    if (!draggedItem || !tenant?.id) return;

    const employeeId = draggedItem.id;
    const previousAssignment = assignments.find(a => a.employee_id === employeeId);

    // Optimistic UI update
    setAssignments(prev => prev.map(a => 
      a.employee_id === employeeId 
        ? { ...a, branch_id: targetBranchId }
        : a
    ));

    try {
      await employeeBranchesService.assignEmployeeToBranch(
        employeeId, 
        targetBranchId,
        tenant.id
      );
      
      // Refresh assignments from server
      const newAssignments = await employeeBranchesService.getEmployeeBranches(tenant.id);
      setAssignments(newAssignments);
    } catch (err) {
      // Rollback on error
      setAssignments(prev => {
        const previousAssignments = [...prev];
        if (previousAssignment) {
          const idx = previousAssignments.findIndex(a => a.employee_id === employeeId);
          if (idx >= 0) {
            previousAssignments[idx] = previousAssignment;
          }
        }
        return previousAssignments;
      });
      setError(err.message);
    } finally {
      setDraggedItem(null);
    }
  }, [draggedItem, assignments, tenant]);

  // Handle drop on "Unassigned"
  const handleUnassignDrop = useCallback(async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragOver);
    
    if (!draggedItem || !tenant?.id) return;

    const employeeId = draggedItem.id;
    const previousAssignment = assignments.find(a => a.employee_id === employeeId);

    // Optimistic UI update
    setAssignments(prev => prev.filter(a => a.employee_id !== employeeId));

    try {
      await employeeBranchesService.unassignEmployee(employeeId);
      
      // Refresh
      const newAssignments = await employeeBranchesService.getEmployeeBranches(tenant.id);
      setAssignments(newAssignments);
    } catch (err) {
      // Rollback
      if (previousAssignment) {
        setAssignments(prev => [...prev, previousAssignment]);
      }
      setError(err.message);
    } finally {
      setDraggedItem(null);
    }
  }, [draggedItem, assignments, tenant]);

  // Group employees for display
  const { unassigned, branches: branchesWithEmployees } = groupEmployeesByBranch(
    employees, 
    assignments, 
    branches
  );

  if (loading) {
    return <div className={styles.loading}>{t('common.loading')}</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{t('errors.load_failed', { message: error })}</p>
        <button onClick={() => tenant?.id && loadData(tenant.id)}>{t('common.retry')}</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('admin.employee_branches_title')}</h1>
      
      <div className={styles.board}>
        {/* Unassigned Column */}
        <div 
          className={styles.column}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleUnassignDrop}
        >
          <div className={styles.columnHeader}>
            <h2 className={styles.columnTitle}>
              {t('admin.unassigned_employees')}
            </h2>
            <span className={styles.count}>{unassigned.length}</span>
          </div>
          
          <div className={styles.cardList}>
            {unassigned.map(employee => (
              <div
                key={employee.id}
                draggable
                onDragStart={(e) => handleDragStart(e, employee)}
                onDragEnd={handleDragEnd}
                className={styles.card}
              >
                <div className={styles.cardContent}>
                  <div className={styles.avatar}>
                    {employee.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.employeeName}>{employee.fullName}</h3>
                    <p className={styles.employeeEmail}>{employee.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Columns */}
        {branchesWithEmployees.map(branch => (
          <div
            key={branch.id}
            className={styles.column}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, branch.id)}
          >
            <div className={styles.columnHeader}>
              <h2 className={styles.columnTitle}>{branch.name}</h2>
              <span className={styles.count}>{branch.employees.length}</span>
            </div>
            
            <div className={styles.cardList}>
              {branch.employees.map(employee => (
                <div
                  key={employee.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, employee)}
                  onDragEnd={handleDragEnd}
                  className={styles.card}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.avatar}>
                      {employee.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.info}>
                      <h3 className={styles.employeeName}>{employee.fullName}</h3>
                      <p className={styles.employeeEmail}>{employee.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
