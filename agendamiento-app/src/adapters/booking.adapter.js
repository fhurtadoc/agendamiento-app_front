import { supabase } from '../services/supabaseClient';

export const bookingAdapter = {
  /**
   * Branches available for the current tenant.
   */
  getBranches: async (tenantId) => {
    if (!tenantId) return [];

    const { data, error } = await supabase
      .from('branches')
      .select('id, name, address, tenant_id')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address || '',
      tenantId: branch.tenant_id,
    }));
  },

  /**
   * Obtiene solo los servicios activos para mostrar al cliente.
   */
  getActiveServices: async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, duration_min, price')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw new Error(error.message);

    return data.map((service) => ({
      id: service.id,
      title: service.name,
      duration: `${service.duration_min} min`,
      price: `$${service.price}`,
      rawDuration: service.duration_min,
      rawPrice: service.price,
    }));
  },

  /**
   * Obtiene los empleados activos.
   * Cuando llega un branchId, filtra por role = 'employee' AND branch_id.
   */
  getActiveEmployees: async (branchId = null) => {
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, branch_id')
      .eq('role', 'employee')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return (data || []).map((employee) => ({
      id: employee.id,
      name: employee.full_name || 'Empleado sin nombre',
      email: employee.email || '',
    }));
  },

  getAvailableSlots: async (date, employeeId = null) => {
    const tenantId = '40764130-8de4-4408-80bc-a8af3b002c7e';

    const { data, error } = await supabase.rpc('get_available_slots', {
      query_date: date,
      query_employee_id: employeeId || null,
      tenant_filter: tenantId,
    });

    if (error) throw new Error(error.message);

    return data || [];
  },

  createAppointment: async (appointmentPayload) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('Usuario no autenticado');

    if (!appointmentPayload.branchId) {
      throw new Error('A branch is required to create an appointment.');
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: '40764130-8de4-4408-80bc-a8af3b002c7e',
        branch_id: appointmentPayload.branchId,
        client_id: user.id,
        service_id: appointmentPayload.serviceId,
        employee_id: appointmentPayload.employeeId || null,
        start_time: appointmentPayload.startTime,
        end_time: appointmentPayload.endTime,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};
