import { userAdapter } from '../adapters/user.adapter';

export const userService = {
  /**
   * Obtiene el perfil o retorna valores por defecto.
   */
  getProfile: async (userId) => {
    try {
      const profile = await userAdapter.getProfile(userId);
      // Si no existe perfil, retornamos strings vacíos para evitar errores en los inputs
      return profile || { full_name: '', phone: '' };
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  /**
   * Valida y guarda los cambios.
   */
  updateProfile: async (userId, formData) => {
    if (!userId) throw new Error("ID de usuario no válido");
    
    // Aquí podrías validar formato de teléfono, etc.
    
    try {
      await userAdapter.updateProfile(userId, formData);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }, 

  updateProfileInfo: async (userId, { firstName, lastName }) => {
    try {
      await userAdapter.updateProfile(userId, { firstName, lastName });
      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Returns a list of all employees.
   */
  getAllEmployees: async () => {
    try {
      const users = await userAdapter.getAllEmployees();
      return users;
    } catch (error) {
      console.error("Service: Error fetching employees", error);
      return []; // Return empty array on error to prevent UI crash
    }
  },

  /**
   * Toggles the user's active status.
   */
  toggleUserStatus: async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    await userAdapter.updateUserStatus(userId, newStatus);
    return newStatus; // Return the new status to update UI
  }, 
  
  updatePersonalInfo: async (userId, { firstName, lastName }) => {
    if (!userId) throw new Error("ID requerido");
    return await userAdapter.updateProfile(userId, { firstName, lastName });
  }
};