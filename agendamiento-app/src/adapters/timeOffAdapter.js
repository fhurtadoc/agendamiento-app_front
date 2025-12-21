// src/adapters/timeOffAdapter.js
export const timeOffAdapter = {
  toCalendarEvents: (timeOffs) => {
    return timeOffs.map(item => {
      // Intentamos obtener el nombre, si no, usamos 'Sin nombre'
      const empName = item.profiles 
        ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim()
        : 'Desconocido';

      return {
        id: item.id,
        title: `🚫 ${item.reason || 'No disponible'}`, // Icono de bloqueo visual
        start: new Date(item.start_time),
        end: new Date(item.end_time),
        resource: {
          type: 'time_off', // Para diferenciar de citas normales
          employeeId: item.employee_id,
          employeeName: empName,
          status: 'blocked'
        }
      };
    });
  }
};