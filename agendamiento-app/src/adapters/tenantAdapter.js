export const tenantAdapter = {
  /**
   * Normaliza la configuración de la empresa para el ThemeProvider
   */
  toThemeConfig(tenantData) {
    if (!tenantData) return null;

    // Valores por defecto (Fallback) si el Tenant no tiene configuración
    // Asumimos que en el futuro guardarás un JSON 'settings' en la tabla tenants
    const settings = tenantData.settings || {};

    return {
      id: tenantData.id,
      name: tenantData.name,
      slug: tenantData.slug,
      theme: {
        primaryColor: settings.primary_color || '#2563eb', // Azul por defecto
        secondaryColor: settings.secondary_color || '#1e40af',
        logoUrl: settings.logo_url || '/icons/pwa-192x192.png', // Logo por defecto
        fontFamily: settings.font_family || 'sans-serif'
      }
    };
  }
};