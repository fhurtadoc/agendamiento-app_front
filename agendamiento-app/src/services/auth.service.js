import { authService as canonicalAuthService } from './authService';

export const authService = {
  ...canonicalAuthService,

  logout: async () => {
    const result = await canonicalAuthService.logout();

    if (result?.error) {
      throw result.error;
    }

    return result;
  },
};
