import React, { useEffect, useState } from 'react';
import { format } from 'date-fns'; 
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook

// Import services
import { appointmentService } from '../../services/appointmentService';
import { appointmentAdapter } from '../../adapters/appointmentAdapter';

// Import reusable calendar component
import { CalendarWidget } from '../../components/CalendarWidget';

// Ensure styles are loaded
import '../../components/CalendarWidget.css'; 

export const EmployeeDashboard = () => {
  const { t } = useTranslation(); // <--- Init hook
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State to control the POP-UP (Modal)
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load data
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const rawData = await appointmentService.getMyAssignedAppointments();
        const calendarEvents = appointmentAdapter.toCalendarEvents(rawData);
        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error loading agenda:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) return <div className="p-10 text-center">{t('employee.loading_agenda')}</div>;

  return (
    <>
      {/* 1. THE CALENDAR (WIDGET) */}
      <CalendarWidget 
        events={events} 
        onSelectEvent={(event) => {
            console.log("Click on event:", event); 
            setSelectedEvent(event);
        }}
        title={t('employee.calendar_title')}
      />

      {/* 2. THE POP-UP (MODAL) */}
      {/* Only shown if selectedEvent has data */}
      {selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            
            {/* Header */}
            <div className="modal-header">
              <h3 className="modal-title">{t('employee.service_detail_title')}</h3>
              <p className="modal-id">ID: {selectedEvent.id ? selectedEvent.id.slice(0, 8) : '...'}...</p>
            </div>
            
            {/* Body */}
            <div className="modal-body">
              
              <div className="modal-field">
                <span className="modal-label">{t('employee.requested_service_label')}</span>
                <div className="modal-value">✂️ {selectedEvent.resource.serviceName}</div>
              </div>

              <div className="modal-field">
                <span className="modal-label">{t('employee.client_label')}</span>
                <div className="modal-value">👤 {selectedEvent.resource.clientName}</div>
              </div>

              <div className="modal-grid">
                <div>
                  <span className="modal-label">{t('employee.date_label')}</span>
                  <div className="text-gray-700">
                    {selectedEvent.start && format(selectedEvent.start, 'dd/MM/yyyy')}
                  </div>
                </div>
                <div>
                  <span className="modal-label">{t('employee.time_label')}</span>
                  <div className="text-gray-700">
                    {selectedEvent.start && format(selectedEvent.start, 'h:mm a')} - 
                    {selectedEvent.end && format(selectedEvent.end, 'h:mm a')}
                  </div>
                </div>
              </div>

              {/* Status with dynamic classes */}
              <div>
                 <span className={`status-badge status-${selectedEvent.resource.status}`}>
                  {t('employee.status_label')}: {selectedEvent.resource.status ? selectedEvent.resource.status.toUpperCase() : 'PENDING'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button 
                className="btn-close"
                onClick={() => setSelectedEvent(null)}
              >
                {t('common.close')}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};