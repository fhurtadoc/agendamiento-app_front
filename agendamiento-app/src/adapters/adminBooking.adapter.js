const DEFAULT_LOCALE = 'en';

const toFiniteNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatPrice = (value, locale = DEFAULT_LOCALE) => {
  const price = toFiniteNumber(value);

  if (price === null) return '';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    return `$${price.toFixed(2)}`;
  }
};

const normalizeDatePart = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  const text = String(value ?? '').trim();
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (isoMatch) return isoMatch[1];

  const parsedDate = new Date(text);

  if (Number.isNaN(parsedDate.getTime())) return null;

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const normalizeTimePart = (value) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    return `${String(value.getHours()).padStart(2, '0')}:${String(
      value.getMinutes()
    ).padStart(2, '0')}`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    if (hours > 23 || minutes > 59) return null;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}`;
  }

  const text = String(value ?? '').trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return null;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}`;
};

const formatTimeLabel = (timeValue, locale = DEFAULT_LOCALE) => {
  const time = normalizeTimePart(timeValue);

  if (!time) return '';

  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}`;
  }
};

export const adminBookingAdapter = {
  toServiceDTO(service, locale = DEFAULT_LOCALE) {
    const source = service ?? {};
    const duration = toFiniteNumber(
      source.duration_min ?? source.duration ?? source.durationMinutes
    );
    const price = toFiniteNumber(source.price ?? source.rawPrice);

    return {
      id: source.id,
      title: source.name ?? source.title ?? '',
      details: source.description ?? '',
      duration: duration ? `${duration} min` : '',
      price: formatPrice(price, locale),
      rawDuration: duration,
      rawPrice: price,
      isActive: source.is_active !== false,
    };
  },

  toClientDTO(profile, locale = DEFAULT_LOCALE) {
    const source = profile ?? {};

    return {
      id: source.id,
      fullName:
        source.full_name ??
        source.fullName ??
        source.name ??
        source.email ??
        '',
      email: source.email ?? '',
      phone: source.phone ?? '',
      role: source.role ?? 'client',
      isActive: source.is_active !== false,
    };
  },

  toEmployeeDTO(profile, locale = DEFAULT_LOCALE) {
    const source = profile ?? {};

    return {
      id: source.id ?? source.employee_id,
      fullName:
        source.full_name ??
        source.fullName ??
        source.name ??
        source.email ??
        '',
      email: source.email ?? '',
      phone: source.phone ?? '',
      role: source.role ?? 'employee',
      isActive: source.is_active !== false,
    };
  },

  toSlotDTO(slot, locale = DEFAULT_LOCALE) {
    let rawValue = slot;

    if (slot !== null && typeof slot === 'object') {
      const minutesFromMidnight = toFiniteNumber(
        slot.minutes_from_midnight ?? slot.minutes
      );

      if (minutesFromMidnight !== null) {
        const value = normalizeTimePart(minutesFromMidnight);

        if (!value) return null;

        return {
          value,
          label: formatTimeLabel(value, locale),
          raw: null,
        };
      }

      rawValue =
        slot.slot_time ??
        slot.start_time ??
        slot.time ??
        slot.value ??
        null;
    }

    const value = normalizeTimePart(rawValue);

    if (!value) return null;

    return {
      value,
      label: formatTimeLabel(value, locale),
      raw: typeof rawValue === 'string' ? rawValue : null,
    };
  },

  toSlotDTOList(slots = [], locale = DEFAULT_LOCALE) {
    return slots
      .map((slot) => this.toSlotDTO(slot, locale))
      .filter(Boolean);
  },

  toAppointmentPayload(selection) {
    const service = selection.service ?? {};
    const client = selection.client ?? {};
    const employee = selection.employee ?? {};
    const selectedSlot = selection.timeSlot ?? selection.time;

    const rawTime =
      selectedSlot instanceof Date
        ? selectedSlot
        : selectedSlot !== null && typeof selectedSlot === 'object'
          ? selectedSlot.value ??
            selectedSlot.slot_time ??
            selectedSlot.start_time ??
            selectedSlot.time
          : selectedSlot;

    const datePart = normalizeDatePart(selection.date);
    const timePart = normalizeTimePart(rawTime);
    const durationMinutes = toFiniteNumber(
      service.rawDuration ??
        service.duration_min ??
        service.duration ??
        service.durationMinutes
    );

    if (!client.id) {
      throw new Error('A client is required to create an appointment.');
    }

    if (!employee.id) {
      throw new Error('An employee is required to create an appointment.');
    }

    if (!service.id) {
      throw new Error('A service is required to create an appointment.');
    }

    if (!datePart || !timePart) {
      throw new Error('A valid date and time are required.');
    }

    if (!durationMinutes || durationMinutes <= 0) {
      throw new Error('The selected service has an invalid duration.');
    }

    const startDateTime = new Date(`${datePart}T${timePart}:00`);

    if (Number.isNaN(startDateTime.getTime())) {
      throw new Error('The selected appointment date is invalid.');
    }

    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60 * 1000
    );

    return {
      tenant_id: selection.tenantId,
      client_id: client.id,
      employee_id: employee.id,
      service_id: service.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
    };
  },

  toAppointmentDTO(appointment) {
    const source = appointment ?? {};

    return {
      id: source.id,
      tenantId: source.tenant_id,
      clientId: source.client_id,
      employeeId: source.employee_id,
      serviceId: source.service_id,
      startTime: source.start_time ?? null,
      endTime: source.end_time ?? null,
      status: source.status ?? 'pending',
    };
  },
};
