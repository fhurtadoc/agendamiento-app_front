import { supabase } from '../services/supabaseClient';

export const bookingAdapter = {
  /**
   * Obtiene solo los servicios ACTIVOS para mostrar al cliente.
   */
  getActiveServices: async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, duration_min, price')
      .eq('is_active', true)
      .order('price', { ascending: true }); // O order by 'name'

    if (error) throw new Error(error.message);

    // Mapeo limpio para el frontend
    return data.map(svc => ({
      id: svc.id,
      title: svc.name,
      duration: `${svc.duration_min} min`, // Formato leíble
      price: `$${svc.price}`, // Formato moneda
      rawDuration: svc.duration_minutes, // Dato numérico para cálculos
      rawPrice: svc.price
    }));
  }, 

  getAvailableSlots: async (date, employeeId = null) => {
    // 1. Obtener tenant_id actual (Si tu app es multi-tenant)
    // Opción A: Si lo tienes en el localStorage o Contexto, úsalo.
    // Opción B: Si la RPC lo deduce del auth.uid(), no hace falta enviarlo.
    // Aquí asumiré que debemos enviarlo explícitamente como pediste.
    
    // NOTA: Ajusta esto según cómo guardes tu tenantId en el frontend
    const tenantId = '40764130-8de4-4408-80bc-a8af3b002c7e'; // <--- OJO: Reemplazar con lógica real o Context

    const { data, error } = await supabase.rpc('get_available_slots', {
      query_date: date,          // '2025-01-20'
      tenant_filter: tenantId
    });

    if (error) throw new Error(error.message);

    // Asumiendo que la RPC devuelve un array de objetos o strings: 
    // ej: [{ start_time: '10:00', ... }] o ['10:00', '10:30']
    // Normalizamos a un array simple de horas para la vista
    return data; 
  }, 

createAppointment: async (appointmentPayload) => {
    // 1. Obtenemos el usuario actual para asegurar que el client_id es legítimo
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Usuario no autenticado");

    const { data, error } = await supabase
      .from('appointments')
      .insert({        
        tenant_id: '40764130-8de4-4408-80bc-a8af3b002c7e', 
        client_id: user.id, 
        service_id: appointmentPayload.serviceId,
        start_time: appointmentPayload.startTime,
        end_time: appointmentPayload.endTime,   
        employee_id: null,         
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
}
};