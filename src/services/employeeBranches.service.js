import { supabase } from '../../agendamiento-app/src/services/supabaseClient';
import { toAssignmentPayload } from '../../agendamiento-app/src/adapters/employeeBranches.adapter';

const AUTH_REQUEST_TIMEOUT_MS = 10000;

const getErrorMessage = (error) => {
  if (error !== null && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return String(error ?? 'Unknown error');
};

const withTimeout = (promise, message, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) => {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(message));
    }, timeoutMs);
    
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export const employeeBranchesService = {
  /**
   * Fetches all active branches for the current tenant.
   */
  async getActiveBranches(tenantId) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('branches')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
        'Failed to fetch branches'
      );
      
      if (error) throw new Error(getErrorMessage(error));
      return data || [];
    } catch (error) {
      console.error('Service: Error fetching branches', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Fetches all employees (profiles with role='employee') for the tenant.
   */
  async getEmployees(tenantId) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('role', 'employee'),
        'Failed to fetch employees'
      );
      
      if (error) throw new Error(getErrorMessage(error));
      return data || [];
    } catch (error) {
      console.error('Service: Error fetching employees', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Fetches current employee-branch assignments.
   */
  async getEmployeeBranches(tenantId) {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('employee_branches')
          .select('*')
          .eq('tenant_id', tenantId),
        'Failed to fetch assignments'
      );
      
      if (error) throw new Error(getErrorMessage(error));
      return data || [];
    } catch (error) {
      console.error('Service: Error fetching assignments', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Assigns an employee to a branch.
   * Handles exclusive assignment: removes previous assignment if exists.
   */
  async assignEmployeeToBranch(employeeId, branchId, tenantId) {
    try {
      // Check for existing assignment
      const { data: existingAssignment, error: fetchError } = await supabase
        .from('employee_branches')
        .select('*')
        .eq('employee_id', employeeId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(getErrorMessage(fetchError));
      }

      const payload = toAssignmentPayload(
        employeeId, 
        branchId, 
        existingAssignment?.branch_id || null
      );

      // Remove old assignment if exists
      if (existingAssignment) {
        const { error: deleteError } = await supabase
          .from('employee_branches')
          .delete()
          .eq('id', existingAssignment.id);
          
        if (deleteError) throw new Error(getErrorMessage(deleteError));
      }

      const { data, error } = await supabase
        .from('employee_branches')
        .insert({
          ...payload,
          tenant_id: tenantId
        })
        .select()
        .single();

      if (error) throw new Error(getErrorMessage(error));
      return data;
    } catch (error) {
      console.error('Service: Error assigning employee', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Unassigns an employee from their current branch.
   */
  async unassignEmployee(employeeId) {
    try {
      const { error } = await supabase
        .from('employee_branches')
        .delete()
        .eq('employee_id', employeeId);
        
      if (error) throw new Error(getErrorMessage(error));
      return true;
    } catch (error) {
      console.error('Service: Error unassigning employee', getErrorMessage(error));
      throw error;
    }
  }
};
