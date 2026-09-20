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
   * También determina si el usuario debe cambiar su contraseña.
   * Return: { user: Object|null, role: String|null, requiresPasswordChange: boolean }
   */
  getCurrentUserWithRole: async () => {
    try {
      const session = await authAdapter.getSession();
      
      if (!session?.user) {
        return { user: null, role: null, requiresPasswordChange: false };
      }

      // Fetch role and password change requirement from profiles table
      const profile = await authAdapter.getProfile(session.user.id);
      
      const role = profile?.role || 'client';
      
      // FORCED PASSWORD CHANGE ONLY FOR EMPLOYEES WITH TEMPORARY PASSWORD
      const requiresPasswordChange = role === 'employee' && profile?.requires_password_change === true;

      return { 
        user: session.user, 
        role: role,
        requiresPasswordChange: requiresPasswordChange
      };

    } catch (error) {
      console.error("Auth Service Error:", error);
      return { user: null, role: null, requiresPasswordChange: false };
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
        // Hubo login o cambio de sesión: buscamos el rol y password requirement
        const profile = await authAdapter.getProfile(session.user.id);
        const role = profile?.role || 'client';
        
        // FORCED PASSWORD CHANGE ONLY FOR EMPLOYEES WITH TEMPORARY PASSWORD
        const requiresPasswordChange = role === 'employee' && profile?.requires_password_change === true;

        onStateChange({ 
          user: session.user, 
          role: role,
          requiresPasswordChange: requiresPasswordChange
        });
      } else {
        // Logout
        onStateChange({ user: null, role: null, requiresPasswordChange: false });
      }
    });

    return unsubscribe;
  },
  /**
   * Validates and updates the password.
   * @param {string} password 
   * Return: { success: boolean, error: string|null }
   */
  changePassword: async (password) => {
    // Business Logic: Validation
    if (!password || password.trim().length === 0) {
      return { success: false, error: 'La contraseña es obligatoria.' };
    }

    if (password.trim().length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    try {
      await authAdapter.updatePassword(password);
      
      // Reset the requires_password_change flag after successful change
      const { data: { user } } = await authAdapter.getUser();
      if (user) {
        await authAdapter.updateProfile(user.id, { requires_password_change: false });
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error("Service Error - Change Password:", error);
      return { success: false, error: error.message };
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
