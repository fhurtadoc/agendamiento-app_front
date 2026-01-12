import { createClient } from '@supabase/supabase-js'; 
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient'; 
import { authAdapter } from '../adapters/auth.adapter';

export const authService = {
  // Basic Login
  login: async (email, password) => {
    try {
      const data = await authAdapter.login(email, password);
      return { 
        success: true, 
        user: data.user, 
        error: null 
      };
    } catch (error) {
      return { 
        success: false, 
        user: null, 
        error: error.message 
      };
    }
  },

  /**
   * Obtiene usuario + rol + bandera de cambio de password
   */
  getCurrentUserWithRole: async (inputUser = null) => {
    try {
      let user = inputUser;

      // 1. CAMBIO IMPORTANTE: Usamos getUser() en vez de getSession()
      // Esto fuerza a verificar que el token sea válido en el servidor.
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
           console.log("⚠️ No hay sesión válida o token expirado.");
           return { user: null, role: null, requiresPasswordChange: false };
        }
        user = authData.user;
      }

      console.log("🔍 Buscando perfil para ID:", user.id);

      // 2. CAMBIO IMPORTANTE: Usamos 'perfile' (según tu historial)
      // Si tu tabla en Supabase se llama 'profiles', cambia esto de nuevo.
      const { data, error } = await supabase
        .from('perfile')  // <--- ¡VERIFICA ESTE NOMBRE EN TU SUPABASE!
        .select('role, requires_password_change') 
        .eq('id', user.id) // Ojo: Verifica si la columna es 'id' o 'user_id' en la tabla perfile
        .single();

      if (error) {
          console.error("❌ Error leyendo base de datos:", error.message);
          // Si falla la lectura, no podemos dejarlo pasar como cliente por seguridad,
          // o retornamos un rol seguro por defecto.
          return { user: user, role: 'client', requiresPasswordChange: false };
      }

      if (!data) {
          console.warn("⚠️ Usuario autenticado pero sin perfil en tabla 'perfile'");
          return { user: user, role: 'client', requiresPasswordChange: false };
      }

      console.log("✅ Perfil encontrado:", data);

      return { 
        user: user, 
        role: data.role || 'client',
        requiresPasswordChange: data.requires_password_change || false 
      };

    } catch (error) {
      console.error("🔥 Error Crítico en AuthService:", error);
      return { user: null, role: null, requiresPasswordChange: false };
    }
  },


  // Client Registration
  async registerClient({ email, password, fullName, tenantId }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          tenant_id: tenantId,
          role: 'client', 
        },
      },
    });
    return { data, error };
  },

/**
   * Ghost Client Implementation for Employees
   * FIX: Ahora configuramos el cliente para NO PERSISTIR la sesión.
   */
  async registerEmployee({ email, password, firstName, lastName, tenantId }) {
    // 1. Configuración especial: persistSession = false
    // Esto evita que sobrescriba el localStorage del Admin
    const ghostClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // <--- LA CLAVE DEL ARREGLO
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    // 2. Crear el usuario
    const { data, error } = await ghostClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          tenant_id: tenantId,
          role: 'employee', 
        },
      },
    }); 

    // 3. Importante: Como no persistimos sesión, no necesitamos hacer signOut del ghostClient.
    // Simplemente dejamos que la variable muera al terminar la función.

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data };
  },

  async logout() {
    try {      
      localStorage.clear(); 
      sessionStorage.clear();
      const { error } = await supabase.auth.signOut();
      
      return { error };
    } catch (err) {
      console.error("Error forzando logout:", err);
      return { error: err };
    }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, 

  // --- AQUÍ ESTÁ LA FUNCIÓN QUE FALTABA ---
  /**
   * Escucha cambios en la sesión (Login, Logout, Auto-refresh)
   * y devuelve los datos completos al Context.
   */
  subscribeToChanges: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 1. Cada vez que cambia el estado, buscamos la info completa (Rol + RequiresPass)
      // Usamos 'authService' explícitamente para asegurar la referencia
      const fullData = await authService.getCurrentUserWithRole(session?.user);
      
      // 2. Enviamos la data fresca al Context
      callback(fullData);
    });

    // Devolvemos la función de limpieza
    return () => subscription.unsubscribe();
  },
  // ----------------------------------------

  async resetPasswordForEmail(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });
    return { data, error };
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    return { data, error };
  },

  // Función compuesta: Cambia password Y desbloquea perfil
  async changePasswordAndUnlock(newPassword, userId) {
    // 1. Auth update
    const { error: authError } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (authError) return { success: false, error: authError.message };

    // 2. Profile update (Unlock)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ requires_password_change: false })
      .eq('id', userId);

    if (profileError) {
      console.error("Error desbloqueando perfil:", profileError);
      return { success: false, error: "Contraseña cambiada, pero error actualizando perfil." };
    }

    return { success: true };
  }
};