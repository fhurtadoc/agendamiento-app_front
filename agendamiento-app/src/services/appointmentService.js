import { supabase } from './supabaseClient';

export const appointmentService = {
  // 1. Llamar a la función RPC SQL para ver disponibilidad
  async getAvailableSlots({ date, employeeId, tenantId }) {
    // Nota: Los parámetros deben coincidir EXACTAMENTE con tu función SQL
    const { data, error } = await supabase.rpc('get_available_slots', {
      query_date: date,          // ej: '2025-01-20'
      query_employee_id: employeeId,
      tenant_filter: tenantId
    });
    return { data, error };
  },

  // 2. Crear la cita
  async createAppointment(appointmentData) {
    // appointmentData espera: { tenant_id, client_id, employee_id, service_id, start_time, ... }
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentData])
      .select()
      .single();
      
    return { data, error };
  },

  // 3. Obtener mis citas (para el client)
  async getMyAppointments(clientId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        services ( name, duration_min, price ),
        employee:employee_id ( full_name ) 
      `) // Este select con joins coincide con tu documentación punto 3.2
      .eq('client_id', clientId)
      .order('start_time', { ascending: true });

    return { data, error };
  },


   ///------------------------------ Employee ----------------------------------------------/////

   getMyAssignedAppointments: async () => {
    // Supabase infiere el usuario actual por el token, 
    // y el RLS filtra automáticamente por employee_id = auth.uid()
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        service:service_id ( name ), 
        client:client_id ( full_name ) 
      `)
      .in('status', ['confirmed']) // Solo nos interesan las activas, no las ya terminadas
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  },

  // 2. Marcar cita como terminada
  completeAppointment: async (appointmentId) => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'completed' }) // Único campo permitido por la RLS
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAppointment(id, updates) {
  // updates debe ser un objeto: { start_time: '...', end_time: '...' }
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
  },

  async getAllAppointments() {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, start_time, end_time, status,
      service:service_id ( name ), 
      client:client_id ( full_name )
    `)
    // Filtramos por tenant automáticamente gracias a RLS, pero no por empleado ID
  
  if (error) throw error;
  return data;
},
getMyAppointments: async (userId) => {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, 
        start_time, 
        end_time, 
        status,
        service:service_id ( name )
      `)
      .eq('client_id', userId) // <--- FILTER: Only this user's data
      .order('start_time', { ascending: true }); // Upcoming first

    if (error) throw new Error(error.message);
    return data;
  }


};
