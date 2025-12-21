import { bookingAdapter } from '../adapters/booking.adapter';

export const bookingService = {
  /**
   * Provee el catálogo de servicios.
   */
  getCatalog: async () => {
    try {
      return await bookingAdapter.getActiveServices();
    } catch (error) {
      console.error("Error obteniendo catálogo:", error);
      throw error; // Lanzamos el error para que la vista muestre "Reintentar"
    }
  },
  getSlots: async (dateObject) => {
    try {
      const dateStr = dateObject.toISOString().split('T')[0];
      
      // 1. Obtenemos datos crudos del adaptador (Ej: [{slot_time: "09:00:00"}, ...])
      const rawSlots = await bookingAdapter.getAvailableSlots(dateStr, null);

      // 2. NORMALIZACIÓN (Aquí estaba lo que faltaba)
      // Convertimos objetos complejos a una lista simple de horas limpias "HH:MM"
      return rawSlots.map(slot => {
        // Aseguramos obtener el string de la propiedad correcta
        const fullTime = slot.slot_time || slot.start_time || slot;
        
        // Cortamos los segundos ":00" del final si existen
        // "09:00:00" -> "09:00"
        return typeof fullTime === 'string' ? fullTime.slice(0, 5) : fullTime;
      });

    } catch (error) {
      console.error("Error cargando horarios:", error);
      throw error;
    }
  }, 
  /**
   * Prepara los datos y llama al adaptador para crear la reserva.
   * @param {string} userId - UUID del cliente
   * @param {object} service - Objeto del servicio (necesita .id y .duration)
   * @param {Date} dateObj - Objeto JS Date con el día seleccionado
   * @param {string} timeStr - Hora en formato "HH:MM" (ej: "09:30")
   */
  createBooking: async (userId, service, dateObj, timeStr) => {
    try {
      // 1. COMBINAR FECHA Y HORA
      // Creamos una copia de la fecha para no mutar el original
      const startDateTime = new Date(dateObj);
      
      // Extraemos horas y minutos del string "09:30"
      const [hours, minutes] = timeStr.split(':').map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      // 2. CALCULAR HORA DE FIN
      // Clonamos la fecha de inicio
      const endDateTime = new Date(startDateTime);
      // Sumamos la duración del servicio (en minutos)
      // Nota: Si 'service.duration' viene como string "30 min", asegúrate de usar la propiedad numérica raw
      // En el adaptador habíamos guardado 'rawDuration', o parseamos aquí.
      const durationMinutes = service.rawDuration || parseInt(service.duration); 
      endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

      // 3. PREPARAR PAYLOAD PARA EL ADAPTADOR
      const payload = {
        clientId: userId,
        serviceId: service.id,
        startTime: startDateTime.toISOString(), // Formato que le gusta a Supabase
        endTime: endDateTime.toISOString()
      };

      // 4. ENVIAR
      return await bookingAdapter.createAppointment(payload);

    } catch (error) {
      console.error("Error en createBooking:", error);
      // Re-lanzamos el error para que la vista muestre la alerta al usuario
      throw error; 
    }
  }
};

