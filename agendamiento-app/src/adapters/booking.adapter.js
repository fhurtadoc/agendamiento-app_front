import { supabase } from '../services/supabaseClient';

export const bookingAdapter = {
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
   * Obtiene empleadas activas con rol de empleada.
   */
  getActiveEmployees: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'employee')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((employee) => ({
      id: employee.id,
      name: employee.full_name || employee.email || 'Empleado sin nombre',
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

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        tenant_id: '40764130-8de4-4408-80bc-a8af3b002c7e',
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
