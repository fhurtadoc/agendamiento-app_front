import { bookingAdapter } from '../adapters/booking.adapter';

export const bookingService = {
  /**
   * Proveedor del catálogo de servicios activos.
   */
  getCatalog: async () => {
    try {
      return await bookingAdapter.getActiveServices();
    } catch (error) {
      console.error('Error obteniendo catálogo:', error);
      throw error;
    }
  },

  /**
   * Obtiene las empleadas activas disponibles para reserva.
   */
  getAvailableEmployees: async () => {
    try {
      return await bookingAdapter.getActiveEmployees();
    } catch (error) {
      console.error('Error obteniendo empleadas disponibles:', error);
      throw error;
    }
  },

  getSlots: async (dateObject, employeeId = null) => {
    try {
      const dateStr = dateObject.toISOString().split('T')[0];
      const rawSlots = await bookingAdapter.getAvailableSlots(
        dateStr,
        employeeId
      );

      return rawSlots.map((slot) => {
        const fullTime = slot.slot_time || slot.start_time || slot;
        return typeof fullTime === 'string'
          ? fullTime.slice(0, 5)
          : fullTime;
      });
    } catch (error) {
      console.error('Error cargando horarios:', error);
      throw error;
    }
  },

  /**
   * Prepara los datos y crea la reserva.
   *
   * @param {string} userId - UUID del cliente autenticado.
   * @param {object} service - Servicio seleccionado.
   * @param {Date} dateObj - Día seleccionado.
   * @param {string} timeStr - Hora seleccionada en formato HH:MM.
   * @param {string|null} employeeId - Empleada seleccionada.
   */
  createBooking: async (
    userId,
    service,
    dateObj,
    timeStr,
    employeeId = null
  ) => {
    try {
      const startDateTime = new Date(dateObj);
      const [hours, minutes] = timeStr.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      const durationMinutes = Number.isFinite(service.rawDuration)
        ? Number(service.rawDuration)
        : parseInt(service.duration, 10);

      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error('Service duration is invalid');
      }

      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(
        endDateTime.getMinutes() + durationMinutes
      );

      const payload = {
        clientId: userId,
        serviceId: service.id,
        employeeId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };

      return await bookingAdapter.createAppointment(payload);
    } catch (error) {
      console.error('Error en createBooking:', error);
      throw error;
    }
  },
};
