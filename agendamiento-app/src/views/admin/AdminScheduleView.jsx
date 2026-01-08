import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, 
  setHours, setMinutes, format
} from 'date-fns';
import { timeOffService } from '../../services/timeOffService';
import { userService } from '../../services/user.service';
import { CalendarWidget } from '../../components/CalendarWidget';
import { useAlert } from '../../context/AlertContext';
import { Plus, Trash2 } from 'lucide-react';

// IMPORTAMOS LOS CSS
import '../../components/CalendarWidget.css'; // Estilos del calendario
import './AdminScheduleView.css'; // <--- TUS NUEVOS ESTILOS RESPONSIVOS

export default function AdminScheduleView() {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  
  const [employees, setEmployees] = useState([]);
  const [timeOffRecords, setTimeOffRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [currentView, setCurrentView] = useState('month'); 
  const [currentDate, setCurrentDate] = useState(new Date());

  const [showModal, setShowModal] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '', start: '', end: '', reason: ''
  });

  // 1. Load Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const empList = await userService.getAllEmployees();
        setEmployees(empList);
        if (empList.length > 0) setSelectedEmployeeId(empList[0].id);
      } catch (error) {
        console.error(error);
        showAlert(t('schedule.error_fetching'), 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // 2. Load TimeOffs
  const fetchTimeOffs = async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    try {
      const allTimeOffs = await timeOffService.getAllTimeOffs(); 
      const filtered = allTimeOffs.filter(t => t.employee_id === selectedEmployeeId);
      setTimeOffRecords(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeOffs();
    // eslint-disable-next-line
  }, [selectedEmployeeId]);

  // 3. Events Generation
  const calendarEvents = useMemo(() => {
    if (!selectedEmployeeId) return [];
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInView = eachDayOfInterval({ start, end });

    const workEvents = daysInView
      .filter(day => !isWeekend(day))
      .map(day => {
        const baseProps = { type: 'work', resource: { type: 'work', status: 'available' } };
        if (currentView === 'month') {
          return { ...baseProps, id: `work-${day.toISOString()}`, title: '', start: day, end: day, allDay: true };
        } else {
          return { ...baseProps, id: `work-shift-${day.toISOString()}`, title: 'Available', start: setMinutes(setHours(day, 9), 0), end: setMinutes(setHours(day, 17), 0), allDay: false };
        }
      });

    const restEvents = timeOffRecords.map(record => ({
      id: record.id,
      title: `🚫 ${record.reason || 'OFF'}`,
      start: new Date(record.start_time),
      end: new Date(record.end_time),
      type: 'rest',
      resource: { ...record, type: 'time_off' },
      allDay: currentView === 'month'
    }));

    return [...workEvents, ...restEvents];
  }, [timeOffRecords, currentView, currentDate, selectedEmployeeId]);

  const eventStyleGetter = (event) => {
    const isRest = event.type === 'rest';
    if (isRest) {
      return { style: { backgroundColor: '#EF4444', opacity: 1, color: 'white', border: '1px solid #B91C1C', borderRadius: '4px', zIndex: 10 } };
    } else {
      return { style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'transparent', border: 'none', borderRadius: '0px', height: '100%', pointerEvents: 'none', zIndex: 1 } };
    }
  };

  const handleSelectEvent = (event) => {
    if (event.resource?.type === 'time_off') {
      setSelectedBlock(event);
      setShowModal(true);
    }
  };

  const handleCreate = () => {
    setSelectedBlock(null);
    setFormData({ employeeId: selectedEmployeeId, start: '', end: '', reason: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await timeOffService.createTimeOff({
        employee_id: formData.employeeId,
        start_time: formData.start,
        end_time: formData.end,
        reason: formData.reason
      });
      showAlert(t('schedule.create_success'));
      setShowModal(false);
      fetchTimeOffs();
    } catch (error) {
      showAlert(t('error.generic') + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedBlock) return;
    if (!window.confirm(t('schedule.confirm_delete'))) return;
    try {
      await timeOffService.deleteTimeOff(selectedBlock.id);
      showAlert(t('schedule.delete_success'));
      setShowModal(false);
      fetchTimeOffs();
    } catch (error) {
      showAlert(t('error.generic') + error.message);
    }
  };

  return (
    <div className="schedule-container">
      
      {/* HEADER RESPONSIVO */}
      <div className="schedule-header">
        <div className="schedule-controls">
           <h1 className="text-xl font-bold">{t('schedule.title')}</h1>
           
           <div className="employee-selector-group">
             <label className="text-sm font-semibold">{t('schedule.employee_label')}:</label>
             <select 
                className="employee-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
             >
                <option value="">{t('common.select')}...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name || emp.firstName}</option>
                ))}
             </select>
           </div>
        </div>

        <button className="btn-primary schedule-add-btn flex items-center gap-2" onClick={handleCreate}>
          <Plus size={18} /> {t('schedule.add_time_off')}
        </button>
      </div>

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <CalendarWidget 
          events={calendarEvents}
          title={t('schedule.title')}
          view={currentView} 
          date={currentDate}
          onView={(v) => setCurrentView(v)}
          onNavigate={(d) => setCurrentDate(d)}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          enableDrag={false} 
        />
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header" style={{ borderBottomColor: selectedBlock ? 'red' : 'blue' }}>
              <h3>{selectedBlock ? t('schedule.delete_title') : t('schedule.add_time_off')}</h3>
            </div>
            
            <div className="modal-body">
              {selectedBlock ? (
                // DELETE MODE
                <div>
                   <p className="mb-2 text-red-600 font-bold">Bloqueo de Horario (Time Off)</p>
                   <p><strong>{t('schedule.reason_label')}:</strong> {selectedBlock.title}</p>
                   <p><strong>Start:</strong> {format(selectedBlock.start, 'PP p')}</p>
                   <p><strong>End:</strong> {format(selectedBlock.end, 'PP p')}</p>
                   
                   <button onClick={handleDelete} className="text-red-600 font-bold mt-4 flex items-center gap-2 border p-2 rounded border-red-200 hover:bg-red-50 w-full justify-center">
                     <Trash2 size={16} /> {t('common.delete')}
                   </button>
                </div>
              ) : (
                // CREATE MODE
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label>{t('schedule.employee_label')}</label>
                    <select 
                      className="w-full border p-2 rounded"
                      value={formData.employeeId}
                      onChange={e => setFormData({...formData, employeeId: e.target.value})}
                      required
                      disabled 
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name || emp.firstName}</option>
                      ))}
                    </select>
                  </div>

                  {/* AQUÍ ESTÁ EL CAMBIO GRID RESPONSIVO PARA FECHAS */}
                  <div className="modal-dates-grid">
                    <div>
                      <label>{t('schedule.start_label')}</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full border p-2 rounded"
                        value={formData.start}
                        onChange={e => setFormData({...formData, start: e.target.value})}
                      />
                    </div>
                    <div>
                      <label>{t('schedule.end_label')}</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full border p-2 rounded"
                        value={formData.end}
                        onChange={e => setFormData({...formData, end: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label>{t('schedule.reason_label')}</label>
                    <input 
                      type="text" 
                      placeholder={t('schedule.reason_placeholder')}
                      className="w-full border p-2 rounded"
                      value={formData.reason}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="btn-primary mt-2">
                    {t('common.save')}
                  </button>
                </form>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={() => setShowModal(false)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}