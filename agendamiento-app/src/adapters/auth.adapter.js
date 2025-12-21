import { supabase } from '../services/supabaseClient';

export const authAdapter = {

 /**
   * Inicia sesión con correo y contraseña.
   */
 login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // AQUÍ es donde el adaptador normaliza la respuesta
    if (error) {
      throw new Error(error.message); // Convertimos el error de Supabase en un Error nativo JS
    }
    
    // Retornamos solo la data útil, sin envoltorios
    return data; 
  },

 logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return true;
  },

  /**
   * Obtiene la sesión actual del proveedor.
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Obtiene el rol del usuario desde la tabla personalizada 'profiles'.
   */
  getUserRole: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    // Si no encuentra perfil o hay error, retornamos null (el servicio decidirá el default)
    if (error) {
        console.warn("Error fetching role or no profile found", error);
        return null; 
    }
    return data?.role;
  },

  /**
   * Suscribe a los cambios de estado (Login/Logout/TokenRefresh).
   * Retorna la función para desuscribirse.
   */
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },

  /**
   * Updates the authenticated user's password in Supabase.
   * @param {string} newPassword 
   */
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (error) {
      // Throw a standardized error message
      throw new Error(error.message);
    }
    
    return data;
  },
  updateUser: async (attributes) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) throw new Error(error.message);
    return data;
  }
};