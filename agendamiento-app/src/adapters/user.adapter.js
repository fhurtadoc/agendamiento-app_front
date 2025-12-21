import { supabase } from '../services/supabaseClient';

export const userAdapter = {
  /**
   * Obtiene el perfil público del usuario.
   * Normaliza los datos: DB (full_name) -> App (fullName)
   */
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone') // Ajustamos a las columnas que usas en tu vista
      .eq('id', userId)
      .single();

    if (error) {
      // Ignoramos error si es "no rows found" (usuario nuevo)
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    // MAPEO DE DATOS (Vital para desacoplar)
    return {
      id: userId,
      fullName: data.full_name, // Convertimos a camelCase
      phone: data.phone
    };
  },

  /**
   * Actualiza el perfil.
   * Des-normaliza: App (fullName) -> DB (full_name)
   */
  updateProfile: async (userId, data) => {
    // Convertimos de vuelta al formato de la base de datos
    const dbPayload = {
      id: userId,
      full_name: data.fullName,
      phone: data.phone,
      updated_at: new Date()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(dbPayload);

    if (error) throw new Error(error.message);
    
    return true;
  }, 
  /**
   * ADMIN: Fetches all profiles/employees.
   */
  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, email')
      // Assuming you fixed the column name in previous steps, 
      // otherwise change 'first_name' to the actual column
      .order('created_at', { ascending: false }); 

    if (error) throw new Error(error.message);

    // Map all results to camelCase
    return data.map(user => ({
      id: user.id,
      firstName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active
    }));
  },

   getAllEmployees: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, email')
      .eq('role', 'employee')  
      .order('created_at', { ascending: false }); 

    if (error) throw new Error(error.message);

    // Map all results to camelCase
    return data.map(user => ({
      id: user.id,
      firstName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active
    }));
  },

  /**
   * ADMIN: Updates the status (active/inactive) of a user.
   */
  updateUserStatus: async (userId, isActive) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);

    if (error) throw new Error(error.message);
    return true;
  }
};