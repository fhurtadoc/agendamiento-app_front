import { supabase } from '../services/supabaseClient';

export const authAdapter = {
  /**
   * Logs in with email and password.
   */
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Adapter normalizes the response
    if (error) {
      throw new Error(error.message); // Convert Supabase error to native JS Error
    }
    
    // Return only useful data
    return data; 
  },

  /**
   * Registers a new user.
   */
  signUp: async (email, password, options) => {
    console.log(options);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Logs out the current user.
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    return true;
  },

  /**
   * Gets the current session from the provider.
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Gets the current user object directly.
   */
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * Fetches the user role from the custom 'profiles' table.
   */
  getUserRole: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    // If no profile found or error, return null (service handles default)
    if (error) {
        console.warn("Error fetching role or no profile found", error);
        return null; 
    }
    return data?.role;
  },

  /**
   * Sends a password reset email.
   */
  resetPasswordForEmail: async (email, redirectTo) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Updates the authenticated user's password in Supabase.
   */
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (error) {
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * General user update.
   */
  updateUser: async (attributes) => {
    const { data, error } = await supabase.auth.updateUser(attributes);
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Subscribes to auth state changes (Login/Logout/TokenRefresh).
   * Returns the unsubscribe function.
   */
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  },
};