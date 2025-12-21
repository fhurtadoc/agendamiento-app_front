import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { useTranslation } from 'react-i18next';

// 1. IMPORT DRAG AND DROP MODULE
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';

// Import locales for date-fns
import { es, enUS } from 'date-fns/locale'; 

import 'react-big-calendar/lib/css/react-big-calendar.css'; 
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import './CalendarWidget.css';

// --- CONFIGURATION ---
const locales = { 
  'es': es,
  'en': enUS,
  'en-US': enUS 
};

const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales,
});

const dragAndDropModule = withDragAndDrop.default || withDragAndDrop;
const DnDCalendar = dragAndDropModule(Calendar);

// Custom component for event content (optional)
const DefaultEventInfo = ({ event }) => (
  <div className="event-info">
    <div className="event-title">
      {event.title} 
    </div>
    {event.resource?.clientName && (
      <div className="event-client">
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
  
  // --- CORRECCIÓN 1: Recibir props de control externo ---
  view: externalView,       // Vista controlada por el padre
  onView: externalOnView,   // Handler de vista del padre
  date: externalDate,       // Fecha controlada por el padre
  onNavigate: externalOnNavigate, // Handler de navegación del padre
  eventPropGetter: externalEventPropGetter // <--- ESTILOS DEL PADRE (ROJO/VERDE)
}) => {
  const { t, i18n } = useTranslation();
  
  // Estado interno (Fallback si el padre no controla el componente)
  const [internalView, setInternalView] = useState(Views.WEEK);
  const [internalDate, setInternalDate] = useState(new Date());

  // Determinar qué valores usar (Externos del padre o Internos)
  const finalView = externalView || internalView;
  const finalDate = externalDate || internalDate;
  
  // Handlers unificados
  const handleViewChange = (newView) => {
    if (externalOnView) externalOnView(newView);
    setInternalView(newView);
  };

  const handleNavigate = (newDate) => {
    if (externalOnNavigate) externalOnNavigate(newDate);
    setInternalDate(newDate);
  };

  // --- CORRECCIÓN 2: Lógica de Estilos Default (solo si no hay externos) ---
  const defaultStyleGetter = (event) => {
    let backgroundColor = '#3b82f6';
    if (event.resource?.status === 'completed') backgroundColor = '#64748b';
    if (event.resource?.status === 'pending') backgroundColor = '#f59e0b';
    return { style: { backgroundColor } };
  };

  // Usar el estilo externo si existe, si no, usar el default (azul)
  const finalEventPropGetter = externalEventPropGetter || defaultStyleGetter;

  // Lógica Mobile (Opcional, pero ajustada para respetar control externo)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      // Solo forzar cambio si NO está controlado externamente
      if (!externalView) {
        if (mobile && (internalView === Views.MONTH || internalView === Views.WEEK)) {
          setInternalView(Views.DAY);
        } else if (!mobile && internalView === Views.DAY) {
          setInternalView(Views.WEEK);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [internalView, externalView]);

  const availableViews = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];
  const CalendarComponent = enableDrag ? DnDCalendar : Calendar;
  const currentCulture = locales[i18n.language] ? i18n.language : 'es';

  return (
    <div className="calendar-container h-full flex flex-col">
      <div className="calendar-header mb-2 flex justify-between items-center">
        <h2 className="calendar-title text-xl font-bold">{title}</h2>
        <span className="calendar-subtitle text-gray-600">
           {finalDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="calendar-wrapper flex-1" style={{ minHeight: '500px' }}>
        <CalendarComponent
          culture={currentCulture}
          localizer={localizer}
          events={events}
          
          // --- CORRECCIÓN 3: Pasar los valores correctos ---
          view={finalView} 
          onView={handleViewChange}
          date={finalDate}
          onNavigate={handleNavigate}
          
          views={availableViews}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          
          components={{ event: DefaultEventInfo }}
          
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          
          onSelectEvent={onSelectEvent}
          
          // --- CORRECCIÓN 4: USAR EL ESTILO CORRECTO ---
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