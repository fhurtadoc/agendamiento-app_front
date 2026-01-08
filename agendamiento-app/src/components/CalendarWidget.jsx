import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { useTranslation } from 'react-i18next';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import { es, enUS } from 'date-fns/locale'; 

import 'react-big-calendar/lib/css/react-big-calendar.css'; 
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarWidget.css'; // <--- Aquí pondremos la magia CSS

const locales = { 'es': es, 'en': enUS, 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
});

const dragAndDropModule = withDragAndDrop.default || withDragAndDrop;
const DnDCalendar = dragAndDropModule(Calendar);

const DefaultEventInfo = ({ event }) => (
  <div className="event-info text-xs md:text-sm"> {/* Texto más pequeño en evento pero legible */}
    <div className="event-title font-semibold truncate">{event.title}</div>
    {event.resource?.clientName && (
      <div className="event-client truncate">
        <span>👤 {event.resource.clientName}</span>
      </div>
    )}
  </div>
);

export const CalendarWidget = ({ 
  events = [], 
  onSelectEvent, 
  onEventDrop,   
  onEventResize, 
  enableDrag = false, 
  title = "Agenda",
  view: externalView,
  onView: externalOnView,
  date: externalDate,
  onNavigate: externalOnNavigate,
  eventPropGetter: externalEventPropGetter
}) => {
  const { t, i18n } = useTranslation();
  
  const [internalView, setInternalView] = useState(Views.WEEK);
  const [internalDate, setInternalDate] = useState(new Date());

  const finalView = externalView || internalView;
  const finalDate = externalDate || internalDate;
  
  const handleViewChange = (newView) => {
    if (externalOnView) externalOnView(newView);
    setInternalView(newView);
  };

  const handleNavigate = (newDate) => {
    if (externalOnNavigate) externalOnNavigate(newDate);
    setInternalDate(newDate);
  };

  const defaultStyleGetter = (event) => {
    let backgroundColor = '#3b82f6';
    if (event.resource?.status === 'completed') backgroundColor = '#64748b';
    if (event.resource?.status === 'pending') backgroundColor = '#f59e0b';
    return { style: { backgroundColor } };
  };

  const finalEventPropGetter = externalEventPropGetter || defaultStyleGetter;

  // --- LÓGICA RESPONSIVE TIPO GOOGLE CALENDAR ---
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      
      // Si estamos en móvil y la vista actual es MES o SEMANA, forzamos DIA o AGENDA
      // Esto imita a Google Calendar que en móvil no muestra la semana completa comprimida
      if (isMobile) {
        if (finalView === Views.MONTH || finalView === Views.WEEK) {
            handleViewChange(Views.DAY); 
        }
      } else {
        // En escritorio, si estábamos en Agenda/Día por responsive, volvemos a Semana
        // (Opcional, depende de tu gusto)
        if (finalView === Views.AGENDA) {
           handleViewChange(Views.WEEK);
        }
      }
    };

    // Ejecutar al montar
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line
  }, []); // Dependencias vacías para que solo configure el listener, la lógica interna usa el estado actual

  const availableViews = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];
  const CalendarComponent = enableDrag ? DnDCalendar : Calendar;
  const currentCulture = locales[i18n.language] ? i18n.language : 'es';

  return (
    <div className="calendar-container h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      
      {/* HEADER PERSONALIZADO (STACK EN MOBILE) */}
      <div className="calendar-custom-header p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-100">
        <div>
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <span className="text-sm text-gray-500 capitalize">
                {finalDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
        </div>
        {/* Aquí podrías poner botones extra si quisieras */}
      </div>

      <div className="calendar-wrapper flex-1 relative" style={{ minHeight: '500px' }}>
        <CalendarComponent
          culture={currentCulture}
          localizer={localizer}
          events={events}
          view={finalView} 
          onView={handleViewChange}
          date={finalDate}
          onNavigate={handleNavigate}
          views={availableViews}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          components={{ event: DefaultEventInfo }}
          // Ajuste de horas visibles (7am a 8pm)
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          onSelectEvent={onSelectEvent}
          eventPropGetter={finalEventPropGetter} 
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          resizable={enableDrag} 
          selectable={enableDrag} 
          
          messages={{
            next: t('calendar.next'),
            previous: t('calendar.previous'),
            today: t('calendar.today'),
            month: t('calendar.month'),
            week: t('calendar.week'),
            day: t('calendar.day'),
            agenda: t('calendar.agenda'),
            noEventsInRange: t('calendar.no_events'),
            showMore: total => `+${total} más`
          }}
        />
      </div>
    </div>
  );
};