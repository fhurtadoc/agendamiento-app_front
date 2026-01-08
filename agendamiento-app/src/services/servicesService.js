import { supabase } from './supabaseClient';
import { serviceAdapter } from '../adapters/serviceAdapter';

export const servicesService = {
  // Crear un nuevo servicio
  createService: async (serviceData, tenantId) => {
    try {
      // 1. Usamos el adaptador para limpiar datos
      const dbPayload = serviceAdapter.toDB(serviceData, tenantId);

      // 2. Insertamos en Supabase
      const { data, error } = await supabase
        .from('services')
        .insert([dbPayload])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: serviceAdapter.toUI(data) };

    } catch (error) {
      console.error("Error creating service:", error);
      return { success: false, error: error.message };
    }
  },

  // Obtener lista (lo necesitarás pronto)
  getServices: async (tenantId) => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    if (error) return { success: false, error: error.message };
    
    // Mapeamos con el adaptador
    const services = data.map(service => serviceAdapter.toUI(service));
    return { success: true, data: services };
  }
};