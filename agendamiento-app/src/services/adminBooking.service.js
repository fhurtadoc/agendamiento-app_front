import { supabase } from './supabaseClient';
import { adminBookingAdapter } from '../adapters/adminBooking.adapter';

const DEFAULT_LOCALE = 'en';
const TENANT_ID = '40764130-8de4-4408-80bc-a8af3b002c7e';

const normalizeRequestDate = (date) => {
  if (!date) return null;

  if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const match = String(date).match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : null;
};

const throwSupabaseError = (error, fallbackMessage) => {
  throw new Error(error?.message || fallbackMessage);
};

export const adminBookingService = {
  async getServices(locale = DEFAULT_LOCALE) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true, nullsFirst: false });

    if (error) {
      throwSupabaseError(error, 'Unable to load services.');
    }

    return (data || []).map((service) =>
      adminBookingAdapter.toServiceDTO(service, locale)
    );
  },

  async getClients() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, email')
      .eq('is_active', true)
      .order('full_name', { ascending: true, nullsFirst: true });

    if (error) {
      throwSupabaseError(error, 'Unable to load clients.');
    }

    const excludedRoles = new Set([
      'employee',
      'empleado',
      'admin',
      'owner',
      'superadmin',
    ]);

    return (data || [])
      .filter((profile) => {
        const role = String(profile.role ?? '')
          .trim()
          .toLowerCase();

        return !role || !excludedRoles.has(role);
      })
      .map((profile) => adminBookingAdapter.toClientDTO(profile));
  },

  async getEmployees() {
    const rpcResult = await supabase.rpc('obtener_empleados_disponibles');

    if (!rpcResult.error) {
      return (rpcResult.data || [])
        .filter((employee) => employee.is_active !== false)
        .map((employee) => adminBookingAdapter.toEmployeeDTO(employee));
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*, email')
      .in('role', ['employee', 'empleado'])
      .eq('is_active', true)
      .order('full_name', { ascending: true, nullsFirst: true });

    if (error) {
      throwSupabaseError(error, 'Unable to load employees.');
    }

    return (data || []).map((employee) =>
      adminBookingAdapter.toEmployeeDTO(employee)
    );
  },

  async getAvailableSlots(date, employeeId, locale = DEFAULT_LOCALE) {
    const datePart = normalizeRequestDate(date);
    const normalizedEmployeeId = String(employeeId ?? '').trim();

    if (!datePart || !normalizedEmployeeId) {
      throw new Error('Date and employee ID are required.');
    }

    const { data, error } = await supabase.rpc('get_available_slots', {
      query_date: datePart,
      query_employee_id: normalizedEmployeeId,
      tenant_filter: TENANT_ID,
    });

    if (error) {
      throwSupabaseError(error, 'Unable to load available time slots.');
    }

    return adminBookingAdapter.toSlotDTOList(data || [], locale);
  },

  async createAppointment(selection) {
    const payload = adminBookingAdapter.toAppointmentPayload({
      ...selection,
      tenantId: TENANT_ID,
    });

    const { data, error } = await supabase
      .from('appointments')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throwSupabaseError(error, 'Unable to create the appointment.');
    }

    if (!data) {
      throw new Error('The appointment was not created.');
    }

    return adminBookingAdapter.toAppointmentDTO(data);
  },
};
