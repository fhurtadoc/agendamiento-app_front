import { supabase } from './supabaseClient';
import { authAdapter } from '../adapters/auth.adapter';

export const authService = {
  // Login básico
 login: async (email, password) => {
    try {
      // 1. Llamamos al adaptador. Si falla, saltará al catch.
      const data = await authAdapter.login(email, password);

      // 2. Si llegamos aquí, es un éxito garantizado.
      return { 
        success: true, 
        user: data.user, 
        error: null 
      };

    } catch (error) {
      // 3. Capturamos el error que lanzó el adaptador
      return { 
        success: false, 
        user: null, 
        error: error.message 
      };
    }
  },
  /**
   * MODIFICADO: Acepta un usuario opcional para evitar llamar a getSession si ya lo tenemos
   */
  getCurrentUserWithRole: async (inputUser = null) => {
    try {
      let user = inputUser;

      // Si no nos pasaron el usuario, intentamos obtener la sesión
      if (!user) {
        const session = await authAdapter.getSession();
        user = session?.user;
      }

      if (!user) return { user: null, role: null };
      
      // Buscamos el rol usando el ID del usuario
      const role = await authAdapter.getUserRole(user.id);
      
      return { user: user, role: role || 'client' };
    } catch (error) {
      console.error("AuthService Error:", error);
      return { user: null, role: null };
    }
  },

  // Registro de client (Asignado a un Tenant específico)
  async registerClient({ email, password, fullName, tenantId }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tenant_id: tenantId,
          role: 'client', // Importante para tus políticas RLS
        },
      },
    });
    return { data, error };
  },

  // Cerrar sesión
  async logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obtener usuario actual (si existe sesión persistente)
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, 

  // ... (tus otras funciones login, register, logout) ...

  // Enviar correo de recuperación
  async resetPasswordForEmail(email) {
    // Supabase enviará un link al correo del usuario.
    // redirectTo: Es la URL de TU app a donde volverán para poner la nueva clave.
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });
    return { data, error };
  },

  // (Opcional por ahora) Actualizar la clave una vez que ya volvieron del correo
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    return { data, error };
  }
};