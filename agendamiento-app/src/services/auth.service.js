import { authAdapter } from '../adapters/auth.adapter';

export const authService = {

    /**
   * Maneja el login y retorna error si falla.
   * Return: { success: boolean, error: string|null }
   */
    login: async (email, password) => {
    try {
      await authAdapter.login(email, password);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
    },

    /**
   * Maneja el proceso de cierre de sesión.
   */
    logout: async () => {
    try {
      await authAdapter.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Aquí podrías decidir si lanzar el error a la vista o manejarlo silenciosamente
      throw error; 
    }
    },
  /**
   * Obtiene el usuario actual Y su rol en un solo objeto unificado.
   * Return: { user: Object|null, role: String|null }
   */
  getCurrentUserWithRole: async () => {
    try {
      const session = await authAdapter.getSession();
      
      if (!session?.user) {
        return { user: null, role: null };
      }

      // Si hay usuario, buscamos su rol
      const role = await authAdapter.getUserRole(session.user.id);
      
      return { 
        user: session.user, 
        role: role || 'client' // Lógica de negocio: Default a 'client'
      };

    } catch (error) {
      console.error("Auth Service Error:", error);
      return { user: null, role: null };
    }
  },

  /**
   * Inicia la escucha de eventos.
   * Cuando Supabase avisa un cambio, este servicio busca el rol (si es login)
   * y avisa al Frontend con los datos completos.
   */
  subscribeToChanges: (onStateChange) => {
    // Llamamos al adaptador pasando un callback que procesa la data
    const unsubscribe = authAdapter.onAuthStateChange(async (event, session) => {
      
      if (session?.user) {
        // Hubo login o cambio de sesión: buscamos el rol de nuevo
        const role = await authAdapter.getUserRole(session.user.id);
        onStateChange({ 
          user: session.user, 
          role: role || 'client' 
        });
      } else {
        // Logout
        onStateChange({ user: null, role: null });
      }
    });

    return unsubscribe;
  },
  /**
   * Validates and updates the password.
   * @param {string} password 
   */
  changePassword: async (password) => {
    // Business Logic: Validation
    if (!password || password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    try {
      await authAdapter.updatePassword(password);
      return true;
    } catch (error) {
      console.error("Service Error - Change Password:", error);
      throw error;
    }
  }, 
  // Reutilizamos getSession o getCurrentUser para obtener el email actual
  getCurrentSession: async () => {
    return await authAdapter.getSession();
  },
  /**
   * Maneja la lógica de actualización de seguridad.
   * Filtra campos vacíos.
   */

  updateAccountSecurity: async ({ email, password }) => {
    const updates = {};
    if (password && password.trim() !== '') updates.password = password;
    if (email && email.trim() !== '') updates.email = email;

    if (Object.keys(updates).length === 0) {
      return { updated: false, message: 'No hay cambios para guardar.' };
    }

    await authAdapter.updateUser(updates);
    
    let msg = 'Seguridad actualizada.';
    if (updates.email) msg += ' Revisa tu nuevo correo para confirmar.';
    
    return { updated: true, message: msg };
  }
};