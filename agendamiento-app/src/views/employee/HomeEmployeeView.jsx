import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import i18n hook
import { appointmentService } from '../../services/appointmentService';
import { appointmentAdapter } from '../../adapters/appointmentAdapter';
import { useAlert } from '../../context/AlertContext'; // <--- Import Alert Context

export default function HomeEmployeeView() {
  const { t } = useTranslation(); // <--- Init hook
  const { showAlert } = useAlert(); // <--- Init alert
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Load data on startup
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const rawData = await appointmentService.getMyAssignedAppointments();
        const formattedData = appointmentAdapter.toEmployeeView(rawData);
        setAppointments(formattedData);
      } catch (error) {
        console.error("Error loading agenda:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // 2. Logic to finish appointment
  const handleComplete = async (id) => {
    try {
      await appointmentService.completeAppointment(id);
      // Optimistic update: remove item from UI immediately
      setAppointments(prev => prev.filter(app => app.id !== id));
    } catch (error) {
      // Reusing the existing error key
      showAlert(t('error.end_appointment'));
    }
  };

  // 3. NEW LOGIC: Group appointments by date
  // Converts flat list to object: { "18/12/2025": [App1, App2], "19/12/2025": [App3] }
  const groupedAppointments = appointments.reduce((groups, app) => {
    const dateKey = app.date; // We use the date string provided by the adapter
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(app);
    return groups;
  }, {});

  // Base Card Style
  const cardStyle = {
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '15px' 
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '10px' }}>
        👋 {t('employee.welcome_title')}
      </h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {t('employee.pending_tasks_subtitle')}
      </p>

      {/* LOADING STATE */}
      {loading && <p>{t('employee.loading_agenda')}</p>}

      {/* EMPTY STATE */}
      {!loading && appointments.length === 0 && (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#666' }}>
          <p>✅ {t('employee.no_pending_tasks')}</p>
        </div>
      )}

      {/* LIST GROUPED BY DAYS */}
      {!loading && Object.keys(groupedAppointments).length > 0 && (
        <div>
          {Object.entries(groupedAppointments).map(([date, appsInDay]) => (
            <div key={date} style={{ marginBottom: '30px' }}>
              
              {/* DATE HEADER (SEPARATOR) */}
              <h3 style={{ 
                background: '#eef2ff', 
                color: '#4f46e5', 
                padding: '8px 15px', 
                borderRadius: '6px', 
                display: 'inline-block',
                marginBottom: '15px',
                fontSize: '1rem'
              }}>
                📅 {date}
              </h3>

              {/* CARDS FOR THAT SPECIFIC DAY */}
              {appsInDay.map((app) => (
                <div key={app.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1f2937', fontSize: '1.1rem' }}>
                      {app.serviceName}
                    </h3>
                    <p style={{ margin: 0, color: '#4b5563', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      👤 {app.clientName}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.95em', color: '#6b7280', fontWeight: '500' }}>
                      🕒 {app.startTime} - {app.endTime}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleComplete(app.id)}
                    style={{
                      background: '#10b981', // Modern green
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                      transition: 'background 0.2s'
                    }}
                  >
                    {t('employee.finish_button')}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}