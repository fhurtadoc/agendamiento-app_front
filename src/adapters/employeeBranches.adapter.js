/**
 * Formats a Supabase profile record into a clean UI model for employees.
 */
export const toEmployeeDTO = (profile) => {
  if (!profile) return null;
  
  return {
    id: profile.id,
    fullName: profile.full_name || profile.user_metadata?.fullName || 'Unknown',
    email: profile.email || '',
    phone: profile.phone || '',
    avatarUrl: profile.avatar_url || null,
    isActive: profile.is_active !== false,
  };
};

/**
 * Formats a Supabase branch record into a clean UI model.
 */
export const toBranchDTO = (branch) => {
  if (!branch) return null;
  
  return {
    id: branch.id,
    name: branch.name || 'Unnamed Branch',
    location: branch.location || '',
    isActive: branch.is_active !== false,
  };
};

/**
 * Constructs a payload for upserting into employee_branches pivot table.
 */
export const toAssignmentPayload = (employeeId, branchId, previousBranchId = null) => {
  return {
    employee_id: employeeId,
    branch_id: branchId,
    previous_branch_id: previousBranchId,
    assigned_at: new Date().toISOString(),
  };
};

/**
 * Combines employee data with their current branch assignment for UI display.
 */
export const mapEmployeeWithBranch = (employee, assignment) => {
  return {
    ...employee,
    currentBranchId: assignment?.branch_id || null,
    assignedAt: assignment?.assigned_at || null,
  };
};

/**
 * Groups employees by branch for Kanban board columns.
 * Returns { unassigned: [...], branches: [...] }
 */
export const groupEmployeesByBranch = (employees, assignments, branches) => {
  const branchMap = new Map();
  branches.forEach(branch => {
    branchMap.set(branch.id, {
      ...branch,
      employees: []
    });
  });

  const unassigned = [];

  employees.forEach(employee => {
    const assignment = assignments.find(a => a.employee_id === employee.id);
    const employeeWithBranch = mapEmployeeWithBranch(employee, assignment);
    
    if (assignment && branchMap.has(assignment.branch_id)) {
      branchMap.get(assignment.branch_id).employees.push(employeeWithBranch);
    } else {
      unassigned.push(employeeWithBranch);
    }
  });

  return {
    unassigned,
    branches: Array.from(branchMap.values())
  };
};
