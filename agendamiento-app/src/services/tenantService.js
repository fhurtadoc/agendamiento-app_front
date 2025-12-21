import { supabase } from './supabaseClient';

export const tenantService = {
  // Obtener configuración por el ID (o Slug si usas subdominios)
  async getTenantConfig(tenantId) {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug') // Agrega aquí tus columnas de colores si ya las tienes
      .eq('id', tenantId)
      .single();
    
    return { data, error };
  },
  
  // Obtener los servicios que ofrece ese Tenant (Corte, Barba, etc.)
  async getTenantServices(tenantId) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tenant_id', tenantId);

    return { data, error };
  }
};