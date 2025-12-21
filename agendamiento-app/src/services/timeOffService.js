// src/services/timeOffService.js
import { supabase } from './supabaseClient';

export const timeOffService = {
  
  // Obtener todos los bloqueos (útil para la vista de calendario admin)
  async getAllTimeOffs() {
    const { data, error } = await supabase
      .from('employee_time_off')
      .select(`
        *,
        profiles:employee_id (
          full_name,
          email
        )
      `);
    
    if (error) throw error;
    return data;
  },

  // Crear un nuevo bloqueo
  async createTimeOff(timeOffData) {
    const { data, error } = await supabase
      .from('employee_time_off')
      .insert([timeOffData])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Eliminar un bloqueo (liberar horario)
  async deleteTimeOff(id) {
    const { error } = await supabase
      .from('employee_time_off')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};