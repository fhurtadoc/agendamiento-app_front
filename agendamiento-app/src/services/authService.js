import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import { authAdapter } from '../adapters/auth.adapter';

const AUTH_REQUEST_TIMEOUT_MS = 10000;

const getErrorMessage = (error) => {
  if (error !== null && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return String(error ?? 'Unknown error');
};

const withTimeout = (promise, message, timeoutMs = AUTH_REQUEST_TIMEOUT_MS) => {
  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;

      settled = true;
      reject(new Error(message));
    }, timeoutMs);

    Promise.resolve(promise).then(
      (value) => {
        if (settled) return;

        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;

        settled = true;
        clearTimeout(timer);
        reject(error);
      }
    );
  });
};

const normalizeRole = (role) => {
  const normalizedRole = String(role ?? 'client').trim().toLowerCase();

  return normalizedRole === 'empleado' ? 'employee' : normalizedRole;
};

export const authService = {
  login: async (email, password) => {
    try {
      const data = await withTimeout(
        authAdapter.login(email, password),
        'El inicio de sesión excedió el tiempo de espera.'
      );

      if (data?.error) {
        throw data.error;
      }

      return {
        success: true,
        user: data?.user ?? data?.session?.user ?? null,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        user: null,
        error: getErrorMessage(error),
      };
    }
  },

  getCurrentUserWithRole: async (inputUser = null) => {
    try {
      let user = inputUser;

      if (!user) {
        const authResult = await withTimeout(
          supabase.auth.getUser(),
          'La validación de la sesión excedió el tiempo de espera.'
        );

        if (authResult.error || !authResult.data?.user) {
          if (authResult.error) {
            console.warn(
              'No hay sesión válida o token expirado:',
              getErrorMessage(authResult.error)
            );
          }

          return {
            user: null,
            role: null,
            requiresPasswordChange: false,
          };
        }

        user = authResult.data.user;
      }

      const userId = typeof user === 'string' ? user : user?.id;

      if (!userId) {
        return {
          user: null,
          role: null,
          requiresPasswordChange: false,
        };
      }

      console.log('🔍 Buscando perfil para ID:', userId);

      const profileResult = await withTimeout(
        supabase
          .from('profiles')
          .select('role, requires_password_change')
          .eq('id', userId)
          .single(),
        'La consulta del perfil excedió el tiempo de espera.'
      );

      const currentUser = typeof user === 'object' ? user : null;

      if (profileResult.error) {
        console.error(
          '❌ Error leyendo base de datos:',
          getErrorMessage(profileResult.error)
        );

        if (profileResult.error.code === 'PGRST116') {
          return {
            user: currentUser,
            role: 'client',
            requiresPasswordChange: false,
          };
        }

        return {
          user: currentUser,
          role: null,
          requiresPasswordChange: false,
          error: getErrorMessage(profileResult.error),
        };
      }

      if (!profileResult.data) {
        console.warn("⚠️ Usuario autenticado pero sin perfil en tabla 'profiles'");

        return {
          user: currentUser,
          role: 'client',
          requiresPasswordChange: false,
        };
      }

      const role = normalizeRole(profileResult.data.role || 'client');

      console.log('✅ Perfil encontrado:', profileResult.data);

      return {
        user: currentUser,
        role,
        requiresPasswordChange:
          role === 'employee' && Boolean(profileResult.data.requires_password_change),
      };
    } catch (error) {
      console.error('🔥 Error Crítico en AuthService:', getErrorMessage(error));

      return {
        user: typeof inputUser === 'object' ? inputUser : null,
        role: null,
        requiresPasswordChange: false,
        error: getErrorMessage(error),
      };
    }
  },

  async registerClient({ email, password, fullName, tenantId }) {
    try {
      return await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              tenant_id: tenantId,
              role: 'client',
            },
          },
        }),
        'El registro excedió el tiempo de espera.'
      );
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  },

  async registerEmployee({ email, password, firstName, lastName, tenantId }) {
    try {
      const ghostClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const result = await withTimeout(
        ghostClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`,
              tenant_id: tenantId,
              role: 'employee',
            },
          },
        }),
        'El registro del empleado excedió el tiempo de espera.'
      );

      if (result.error) {
        return {
          success: false,
          error: getErrorMessage(result.error),
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  },

  async logout() {
    let signOutError = null;

    try {
      const result = await withTimeout(
        supabase.auth.signOut(),
        'El cierre de sesión excedió el tiempo de espera.'
      );

      signOutError = result?.error ?? null;
    } catch (error) {
      signOutError = error;
      console.error('Error forzando logout:', error);
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.error('Error limpiando almacenamiento:', storageError);
      }
    }

    return {
      error: signOutError,
    };
  },

  async getCurrentUser() {
    try {
      const result = await withTimeout(
        supabase.auth.getUser(),
        'La obtención del usuario excedió el tiempo de espera.'
      );

      if (result.error || !result.data?.user) {
        if (result.error) {
          console.warn(
            'No hay sesión válida o token expirado:',
            getErrorMessage(result.error)
          );
        }

        return null;
      }

      return result.data.user;
    } catch (error) {
      console.error('Error obteniendo usuario:', getErrorMessage(error));
      return null;
    }
  },

  subscribeToChanges: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    const result = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'TOKEN_REFRESHED') {
            return;
          }

          const fullData = session?.user
            ? await authService.getCurrentUserWithRole(session.user)
            : {
                user: null,
                role: null,
                requiresPasswordChange: false,
              };

          callback(fullData, event);
        } catch (error) {
          console.error(
            'Error procesando cambio de sesión:',
            getErrorMessage(error)
          );

          const fallbackData = {
            user: null,
            role: null,
            requiresPasswordChange: false,
            error: getErrorMessage(error),
          };

          try {
            callback(fallbackData, event);
          } catch (callbackError) {
            console.error(
              'Error notificando cambio de sesión:',
              getErrorMessage(callbackError)
            );
          }
        }
      }
    );

    const subscription = result?.data?.subscription;

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  },

  async resetPasswordForEmail(email) {
    try {
      return await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/actualizar-password`,
        }),
        'La solicitud de recuperación excedió el tiempo de espera.'
      );
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  },

  async updatePassword(newPassword) {
    try {
      return await withTimeout(
        supabase.auth.updateUser({
          password: newPassword,
        }),
        'La actualización de contraseña excedió el tiempo de espera.'
      );
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  },

  async changePassword(password) {
    if (!password || password.trim().length === 0) {
      return {
        success: false,
        error: 'La contraseña es obligatoria.',
      };
    }

    if (password.trim().length < 6) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    try {
      const authResult = await withTimeout(
        supabase.auth.updateUser({
          password: password.trim(),
        }),
        'La actualización de contraseña excedió el tiempo de espera.'
      );

      if (authResult.error) {
        return {
          success: false,
          error: getErrorMessage(authResult.error),
        };
      }

      const userResult = await withTimeout(
        supabase.auth.getUser(),
        'La verificación del usuario excedió el tiempo de espera.'
      );

      if (userResult.error || !userResult.data?.user) {
        return {
          success: false,
          error: 'No se pudo verificar el usuario después del cambio.',
        };
      }

      const profileResult = await withTimeout(
        supabase
          .from('profiles')
          .update({ requires_password_change: false })
          .eq('id', userResult.data.user.id),
        'La actualización del perfil excedió el tiempo de espera.'
      );

      if (profileResult.error) {
        return {
          success: false,
          error: getErrorMessage(profileResult.error),
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('Service Error - Change Password:', getErrorMessage(error));

      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  },

  async getCurrentSession() {
    try {
      const result = await withTimeout(
        supabase.auth.getSession(),
        'La obtención de la sesión excedió el tiempo de espera.'
      );

      return result.data?.session ?? null;
    } catch (error) {
      console.error('Error obteniendo sesión:', getErrorMessage(error));
      return null;
    }
  },

  async updateAccountSecurity({ email, password } = {}) {
    const updates = {};

    if (password && password.trim() !== '') {
      updates.password = password;
    }

    if (email && email.trim() !== '') {
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) {
      return {
        updated: false,
        message: 'No hay cambios para guardar.',
      };
    }

    try {
      const result = await withTimeout(
        supabase.auth.updateUser(updates),
        'La actualización de seguridad excedió el tiempo de espera.'
      );

      if (result.error) {
        return {
          updated: false,
          message: getErrorMessage(result.error),
        };
      }

      let message = 'Seguridad actualizada.';

      if (updates.email) {
        message += ' Revisa tu nuevo correo para confirmar.';
      }

      return {
        updated: true,
        message,
      };
    } catch (error) {
      return {
        updated: false,
        message: getErrorMessage(error),
      };
    }
  },

  async changePasswordAndUnlock(newPassword, userId) {
    const profileUserId = typeof userId === 'object' ? userId?.id : userId;

    if (!newPassword || !newPassword.trim()) {
      return {
        success: false,
        error: 'La contraseña es obligatoria.',
      };
    }

    if (!profileUserId) {
      return {
        success: false,
        error: 'No se encontró el identificador del usuario.',
      };
    }

    try {
      const authResult = await withTimeout(
        supabase.auth.updateUser({
          password: newPassword.trim(),
        }),
        'La actualización de contraseña excedió el tiempo de espera.'
      );

      if (authResult.error) {
        return {
          success: false,
          error: getErrorMessage(authResult.error),
        };
      }

      const profileResult = await withTimeout(
        supabase
          .from('profiles')
          .update({ requires_password_change: false })
          .eq('id', profileUserId),
        'La actualización del perfil excedió el tiempo de espera.'
      );

      if (profileResult.error) {
        console.error('Error desbloqueando perfil:', profileResult.error);

        return {
          success: false,
          error: 'Contraseña cambiada, pero error actualizando perfil.',
        };
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error(
        'Error cambiando contraseña y desbloqueando perfil:',
        getErrorMessage(error)
      );

      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  },
};
