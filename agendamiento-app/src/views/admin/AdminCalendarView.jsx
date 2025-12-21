import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { appointmentService } from '../../services/appointmentService';
import { appointmentAdapter } from '../../adapters/appointmentAdapter';
import { CalendarWidget } from '../../components/CalendarWidget';
import '../../components/CalendarWidget.css';
import { useAlert } from '../../context/AlertContext';

export const AdminCalendarView = () => {
  const { t } = useTranslation(); // <--- Init hook
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { showAlert } = useAlert();

  // 1. Load ALL appointments
  const fetchAppointments = async () => {
    try {
      // Use getAllAppointments to see the entire business
      const rawData = await appointmentService.getAllAppointments();
      const calendarEvents = appointmentAdapter.toCalendarEvents(rawData);
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // 2. Logic to MOVE an event (Drag & Drop)
  const moveEvent = async ({ event, start, end }) => {
    // a) Optimistic Update (Visually instant)
    const originalEvents = [...events]; // Save copy in case of failure
    
    setEvents(prev => prev.map(ev => {
      if (ev.id === event.id) {
        return { ...ev, start, end }; // Update local position
      }
      return ev;
    }));

    // b) API Call
    try {
      await appointmentService.updateAppointment(event.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
      console.log("Appointment moved successfully");
    } catch (error) {
      console.error("Error moving appointment:", error);
      // Using existing error key
      showAlert(t('error.move_appointment'));
      setEvents(originalEvents); // Revert visual change
    }
  };

  // 3. Logic to CHANGE DURATION (Resize)
  const resizeEvent = async ({ event, start, end }) => {
    const originalEvents = [...events];
    
    setEvents(prev => prev.map(ev => {
      if (ev.id === event.id) {
        return { ...ev, start, end };
      }
      return ev;
    }));

    try {
      await appointmentService.updateAppointment(event.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString()
      });
    } catch (error) {
      // Using existing error key
      showAlert(t('error.change_duration'));
      setEvents(originalEvents);
    }
  };

  if (loading) return <div className="p-10 text-center">{t('admin.loading_master_panel')}</div>;

  return (
    <>
      <CalendarWidget 
        events={events} 
        title={t('admin.master_panel_title')}
        
        // ACTIVATE GOD MODE (Admin)
        enableDrag={true} 
        
        // Pass handlers
        onEventDrop={moveEvent}
        onEventResize={resizeEvent}
        onSelectEvent={(event) => setSelectedEvent(event)}
      />

      {/* QUICK EDIT MODAL (Reusing style) */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{t('admin.manage_appointment')}</h3>
              <p className="modal-id">ID: {selectedEvent.id.slice(0,6)}...</p>
            </div>
            
            <div className="modal-body">
              <div className="modal-field">
                {/* Reusing existing employee label */}
                <span className="modal-label">{t('employee.client_label')}</span>
                <div className="modal-value">{selectedEvent.resource.clientName}</div>
              </div>

              <div className="modal-grid">
                <div>
                    <span className="modal-label">{t('admin.start_label')}</span>
                    <div className="text-gray-700">{format(selectedEvent.start, 'h:mm a')}</div>
                </div>
                <div>
                    <span className="modal-label">{t('admin.end_label')}</span>
                    <div className="text-gray-700">{format(selectedEvent.end, 'h:mm a')}</div>
                </div>
              </div>

              <div className="p-2 bg-yellow-50 text-yellow-800 text-sm rounded mb-4 border border-yellow-200">
                {t('admin.drag_drop_hint')}
              </div>
            </div>

            <div className="modal-footer flex justify-between">
              <button className="text-red-600 font-bold text-sm">{t('admin.delete_button')}</button>
              <button className="btn-close" onClick={() => setSelectedEvent(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};