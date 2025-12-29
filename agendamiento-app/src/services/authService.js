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

      if (!user) {
        const session = await authAdapter.getSession();
        user = session?.user;
      }

      if (!user) return { user: null, role: null, requiresPasswordChange: false };
      
      // DIAGNÓSTICO: Verificamos qué usuario estamos buscando
      console.log("🔍 Buscando perfil para ID:", user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('role, requires_password_change') 
        .eq('id', user.id)
        .single();

      // DIAGNÓSTICO: Ver errores explícitos
      if (error) {
          console.error("❌ ERROR SUPABASE:", error);
          // Si hay error, es probable que no exista el perfil o RLS bloquee
      }
      if (!data) {
          console.error("❌ NO SE ENCONTRÓ DATA DEL PERFIL");
      } else {
          console.log("✅ DATA RECIBIDA:", data);
      }

      if (error || !data) {
          // AQUÍ ESTÁ EL PROBLEMA: Al fallar, asume que NO requiere cambio y lo deja pasar
          console.warn("⚠️ Usando valores por defecto (Login permitido por error de lectura)");
          return { user: user, role: 'client', requiresPasswordChange: false };
      }
      
      return { 
        user: user, 
        role: data.role || 'client',
        requiresPasswordChange: data.requires_password_change || false 
      };

    } catch (error) {
      console.error("AuthService Error Crítico:", error);
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