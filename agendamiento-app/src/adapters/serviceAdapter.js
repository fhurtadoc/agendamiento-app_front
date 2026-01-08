export const serviceAdapter = {
  /**
   * Transforma los datos del Formulario a formato Base de Datos
   */
  toDB: (formData, tenantId) => {
    return {
      name: formData.name,
      duration_min: parseInt(formData.duration), // Aseguramos que sea entero
      price: parseFloat(formData.price),     // Aseguramos que sea decimal
      tenant_id: tenantId,
      is_active: true
    };
  },

  /**
   * Transforma los datos de la BD para mostrarlos en la UI
   * (Útil para cuando hagas la lista de servicios)
   */
  toUI: (service) => {
    return {
      id: service.id,
      name: service.name,
      durationLabel: `${service.duration} min`,
      priceLabel: `$${service.price.toFixed(2)}`,
      rawPrice: service.price,
      rawDuration: service.duration
    };
  }
};