import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const appointmentAdapter = {
  /**
   * Transforma una cita cruda de Supabase para mostrarla en la lista "Mis Citas"
   * Entrada: Objeto DB con joins (services, employee)
   * Salida: Objeto limpio para la UI
   */
  toListDTO(appointment) {
    // 1. Manejo seguro de nulos (por si se borró el servicio o empleado)
    const serviceName = appointment.services?.name || 'Servicio no disponible';
    const price = appointment.services?.price || 0;
    const employeeName = appointment.employee?.full_name || 'Por asignar';

    // 2. Formateo de fechas (Usando date-fns)
    // De "2025-01-20T14:00:00" a "Lunes, 20 de Enero" y "02:00 PM"
    const startDate = parseISO(appointment.start_time);
    
    return {
      id: appointment.id,
      title: `${serviceName} con ${employeeName}`, // Título listo para pintar
      dateReadable: format(startDate, "EEEE d 'de' MMMM", { locale: es }), // "lunes 20 de enero"
      timeReadable: format(startDate, 'h:mm a', { locale: es }), // "10:00 AM"
      priceFormatted: `$${Number(price).toFixed(2)}`, // "$25.00"
      status: appointment.status, // confirmed, pending, etc.
      
      // Mantenemos los IDs originales por si hay que cancelar/reprogramar
      rawIds: {
        employee: appointment.employee_id,
        service: appointment.service_id
      }
    };
  },

  /**
   * Transforma los "slots" (huecos libres) del RPC para mostrarlos en botones
   */
  toSlotDTO(slotObj) {
    // Entrada: { slot_time: "10:00:00" }
    // Salida: { value: "10:00:00", label: "10:00 AM" }
    
    // Truco: Creamos una fecha ficticia hoy con esa hora para poder formatearla
    const [hours, minutes] = slotObj.slot_time.split(':');
    const dateDummy = new Date();
    dateDummy.setHours(hours, minutes, 0);

    return {
      value: slotObj.slot_time, // Lo que enviaremos al backend
      label: format(dateDummy, 'h:mm a') // Lo que ve el usuario
    };
  },

  ///------------------------------ Employee ----------------------------------------------/////

  toEmployeeView: (dbAppointments) => {
    if (!dbAppointments) return [];
    
    return dbAppointments.map(app => ({
      id: app.id,
      serviceName: app.service?.name || 'Servicio General', // Fallback seguro
      clientName: app.client?.full_name || 'Cliente Desconocido',
      date: new Date(app.start_time).toLocaleDateString(),
      startTime: new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: new Date(app.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: app.status
    }));
  },
  
  toCalendarEvents: (dbAppointments) => {
    // Protección: Si viene nulo o vacío, devolvemos array vacío para que no explote
    if (!dbAppointments || !Array.isArray(dbAppointments)) return [];
    
    return dbAppointments.map(app => {
      // 1. Validamos que las fechas existan
      const startDate = app.start_time ? new Date(app.start_time) : new Date();
      const endDate = app.end_time ? new Date(app.end_time) : new Date(startDate.getTime() + 60*60*1000);

      // 2. Extraemos nombres con seguridad (Safe navigation ?.)
      // FÍJATE AQUÍ: Usamos .full_name porque eso es lo que trae tu JSON ahora
      const clientName = app.client?.full_name || 'Cliente Desconocido';
      const serviceName = app.service?.name || 'Servicio General';

      return {
        id: app.id,
        // Título corto para la vista mensual/semanal
        title: `${serviceName} - ${clientName}`,
        
        // Objetos de fecha obligatorios para el calendario
        start: startDate,
        end: endDate,
        
        // Datos extra para el Modal y el componente personalizado
        resource: {
          clientName: clientName,
          serviceName: serviceName,
          status: app.status || 'pending'
        }
      };
    });
  }
};