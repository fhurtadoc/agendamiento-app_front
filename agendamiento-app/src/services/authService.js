import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import { authAdapter } from '../adapters/auth.adapter';
import {
  decodeProfile,
  encodeProfile,
} from '../tools/crypto';

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

const saveProfileToCache = (profile) => {
  try {
    localStorage.setItem(
      'app_user_profile',
      encodeProfile(profile)
    );
  } catch (error) {
    console.warn(
      'Unable to cache user profile:',
      getErrorMessage(error)
    );
  }
};

export const authService = {
  login: async (email, password) => {
    try {
      localStorage.removeItem('app_user_profile');
    } catch (error) {
      console.warn(
        'Unable to clear cached profile before login:',
        getErrorMessage(error)
      );
    }

    try {
      const data = await withTimeout(
        authAdapter.login(email, password),
        'Login timeout exceeded.'
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
          'Session validation timeout exceeded.'
        );

        if (authResult.error || !authResult.data?.user) {
          if (authResult.error) {
            console.warn(
              'No valid session or token expired:',
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

      const currentUser = typeof user === 'object' ? user : null;

      try {
        const encodedProfile = localStorage.getItem('app_user_profile');

        if (encodedProfile) {
          const cachedProfile = decodeProfile(encodedProfile);

          if (
            cachedProfile &&
            typeof cachedProfile === 'object' &&
            String(cachedProfile.userId) === String(userId) &&
            typeof cachedProfile.role === 'string' &&
            cachedProfile.role.trim().length > 0 &&
            typeof cachedProfile.requiresPasswordChange === 'boolean'
          ) {
            return {
              user: currentUser,
              role: normalizeRole(cachedProfile.role),
              requiresPasswordChange:
                cachedProfile.requiresPasswordChange,
            };
          }
        }
      } catch (error) {
        console.warn(
          'Unable to read cached user profile:',
          getErrorMessage(error)
        );
      }

      console.log('🔍 Fetching profile for ID:', userId);

      const profileResult = await withTimeout(
        supabase
          .from('profiles')
          .select('role, requires_password_change')
          .eq('id', userId)
          .single(),
        'Profile query timeout exceeded.'
      );

      if (profileResult.error) {
        console.error(
          '❌ Error reading database:',
          getErrorMessage(profileResult.error)
        );

        if (profileResult.error.code === 'PGRST116') {
          saveProfileToCache({
            userId,
            role: 'client',
            requiresPasswordChange: false,
          });

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
        console.warn(
          "⚠️ Authenticated user has no profile in the 'profiles' table."
        );

        saveProfileToCache({
          userId,
          role: 'client',
          requiresPasswordChange: false,
        });

        return {
          user: currentUser,
          role: 'client',
          requiresPasswordChange: false,
        };
      }

      const role = normalizeRole(profileResult.data.role || 'client');
      const requiresPasswordChange =
        role === 'employee' &&
        Boolean(profileResult.data.requires_password_change);

      saveProfileToCache({
        userId,
        role,
        requiresPasswordChange,
      });

      console.log('✅ Profile found:', profileResult.data);

      return {
        user: currentUser,
        role,
        requiresPasswordChange,
      };
    } catch (error) {
      console.error(
        '🔥 Critical Error in AuthService:',
        getErrorMessage(error)
      );

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
        'Registration timeout exceeded.'
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
        'Employee registration timeout exceeded.'
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
      localStorage.removeItem('app_user_profile');
    } catch (error) {
      console.warn(
        'Unable to clear cached profile during logout:',
        getErrorMessage(error)
      );
    }

    try {
      const result = await withTimeout(
        supabase.auth.signOut(),
        'Logout timeout exceeded.'
      );

      signOutError = result?.error ?? null;
    } catch (error) {
      signOutError = error;
      console.error('Error forcing logout:', error);
    } finally {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
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
        'Fetching the user timeout exceeded.'
      );

      if (result.error || !result.data?.user) {
        if (result.error) {
          console.warn(
            'No valid session or token expired:',
            getErrorMessage(result.error)
          );
        }

        return null;
      }

      return result.data.user;
    } catch (error) {
      console.error('Error fetching user:', getErrorMessage(error));
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
            'Error processing session change:',
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
              'Error notifying session change:',
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
        'Password recovery request timeout exceeded.'
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
        'Password update timeout exceeded.'
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
        error: 'Password is required.',
      };
    }

    if (password.trim().length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long.',
      };
    }

    try {
      const authResult = await withTimeout(
        supabase.auth.updateUser({
          password: password.trim(),
        }),
        'Password update timeout exceeded.'
      );

      if (authResult.error) {
        return {
          success: false,
          error: getErrorMessage(authResult.error),
        };
      }

      const userResult = await withTimeout(
        supabase.auth.getUser(),
        'User verification timeout exceeded.'
      );

      if (userResult.error || !userResult.data?.user) {
        return {
          success: false,
          error: 'Unable to verify the user after the password change.',
        };
      }

      const profileResult = await withTimeout(
        supabase
          .from('profiles')
          .update({ requires_password_change: false })
          .eq('id', userResult.data.user.id),
        'Profile update timeout exceeded.'
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
        'Fetching the session timeout exceeded.'
      );

      return result.data?.session ?? null;
    } catch (error) {
      console.error('Error fetching session:', getErrorMessage(error));
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
        message: 'There are no changes to save.',
      };
    }

    try {
      const result = await withTimeout(
        supabase.auth.updateUser(updates),
        'Security update timeout exceeded.'
      );

      if (result.error) {
        return {
          updated: false,
          message: getErrorMessage(result.error),
        };
      }

      let message = 'Security updated.';

      if (updates.email) {
        message += ' Check your new email to confirm the change.';
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
        error: 'Password is required.',
      };
    }

    if (!profileUserId) {
      return {
        success: false,
        error: 'User identifier was not found.',
      };
    }

    try {
      const authResult = await withTimeout(
        supabase.auth.updateUser({
          password: newPassword.trim(),
        }),
        'Password update timeout exceeded.'
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
        'Profile update timeout exceeded.'
      );

      if (profileResult.error) {
        console.error('Error unlocking profile:', profileResult.error);

        return {
          success: false,
          error: 'Password changed, but the profile could not be updated.',
        };
      }

      try {
        localStorage.removeItem('app_user_profile');
      } catch (error) {
        console.warn(
          'Unable to clear cached profile after password change:',
          getErrorMessage(error)
        );
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error(
        'Error changing password and unlocking profile:',
        getErrorMessage(error)
      );

      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  },
};
