import { AppState, DAYS_OF_WEEK } from '../types';

export function getMonday(d: Date | string): Date {
  const date = new Date(d);
  const day = date.getDay();
  // Sunday is 0, so diff is -6 to get previous Monday; Monday is 1, so diff is 0
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function dateForDay(weekStart: Date | string, dayIndex: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

export function isoLocal(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatWeekRange(start: Date | string): string {
  const startDate = start instanceof Date ? start : new Date(start);
  if (isNaN(startDate.getTime())) return '';
  const end = new Date(startDate);
  end.setDate(end.getDate() + 6);
  const s = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const e = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

export function formatCardDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

/**
 * Retorna la fecha del mes que debe mostrarse por defecto en la vista mensual:
 * Una vez haya transcurrido el último domingo del mes en curso, cambia automáticamente
 * al siguiente mes para que la congregación/liderazgo vea de inmediato la programación activa.
 */
export function getDefaultMonthDate(referenceDate: Date = new Date()): Date {
  const date = new Date(referenceDate);
  const year = date.getFullYear();
  const month = date.getMonth();

  // Encontrar el último día del mes
  const lastDayOfMonth = new Date(year, month + 1, 0);
  // Calcular el día del mes correspondiente al último domingo (0 = Domingo)
  const lastSundayDay = lastDayOfMonth.getDate() - lastDayOfMonth.getDay();
  const lastSunday = new Date(year, month, lastSundayDay, 23, 59, 59, 999);

  // Si hoy ya pasó el último domingo de este mes, pasamos automáticamente al mes siguiente
  if (date > lastSunday) {
    return new Date(year, month + 1, 1);
  }

  return new Date(year, month, 1);
}

/**
 * Determina si el último domingo de un mes ya ha transcurrido
 */
export function isPastLastSundayOfMonth(year: number, month: number, referenceDate: Date = new Date()): boolean {
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const lastSundayDay = lastDayOfMonth.getDate() - lastDayOfMonth.getDay();
  const lastSunday = new Date(year, month, lastSundayDay, 23, 59, 59, 999);
  return referenceDate > lastSunday;
}

/**
 * Obtiene la próxima fecha en la que se ejecuta un Slot (por día de la semana 0..6 y hora HH:mm)
 */
export function getNextUpcomingDateForSlot(dayOfWeekIndex: number, timeStr: string): Date {
  const now = new Date();
  const [hours, minutes] = (timeStr || '10:00').split(':').map(Number);
  
  // Buscar hoy o los próximos 7 días
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + i);
    candidate.setHours(hours || 0, minutes || 0, 0, 0);

    // Ajuste de día: en nuestro array 0=Lunes, 1=Martes... 6=Domingo
    // En JS estándar: 0=Domingo, 1=Lunes... 6=Sábado
    const candidateJsDay = candidate.getDay(); // 0..6 (0=Dom)
    const convertedIndex = candidateJsDay === 0 ? 6 : candidateJsDay - 1;

    if (convertedIndex === dayOfWeekIndex) {
      if (candidate >= now || i > 0) {
        return candidate;
      }
    }
  }

  // Si no se encontró en esta semana, calcular la próxima
  const fallback = new Date(now);
  fallback.setDate(now.getDate() + 7);
  return fallback;
}

export function formatDateDisplay(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return '';
  let d: Date;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string') {
    // If it's YYYY-MM-DD, parse year, month, day to avoid UTC timezone day shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [y, m, day] = dateInput.split('-').map(Number);
      d = new Date(y, m - 1, day, 12, 0, 0);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = new Date(dateInput);
  }

  if (isNaN(d.getTime())) return String(dateInput);

  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function generateWhatsAppSummary(state: AppState, weekStart: Date): string {
  const weekLabel = formatWeekRange(weekStart);
  let text = `📅 *TURNOS DEL GRUPO (${weekLabel})*\n\n`;

  if (state.slots.length === 0) {
    return text + 'No hay turnos programados.';
  }

  const sortedSlots = [...state.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

  // Role ordering priority helper for a clean WhatsApp format
  const getRoleWeight = (roleName: string): number => {
    const n = roleName.toLowerCase().trim();
    if (n.includes('director')) return 1;
    if (n.startsWith('voz h 1')) return 10;
    if (n.startsWith('voz h 2')) return 11;
    if (n.startsWith('voz h 3')) return 12;
    if (n.startsWith('voz m 1')) return 20;
    if (n.startsWith('voz m 2')) return 21;
    if (n.startsWith('voz m 3')) return 22;
    if (n.includes('piano')) return 30;
    if (n.includes('guitarra acustica') || n.includes('acústica')) return 31;
    if (n.includes('bateria') || n.includes('batería')) return 32;
    if (n.includes('bajo')) return 33;
    if (n.includes('guitarra electrica') || n.includes('eléctrica')) return 34;
    if (n.includes('sonido')) return 40;
    if (n.includes('audio visual') || n.includes('audiovisual')) return 41;
    return 50;
  };

  sortedSlots.forEach(slot => {
    const date = dateForDay(weekStart, slot.day);
    const dateStr = formatCardDate(date);
    const key = `${isoLocal(date)}__${slot.id}`;
    const assignment = state.assignments[key] || {};

    text += `🔹 *${DAYS_OF_WEEK[slot.day].toUpperCase()} ${dateStr}* · ${slot.time} hs\n`;
    text += `📌 *${slot.label}*\n`;

    // Filter only existing, valid roles from state.roles (never fictitious or generic "Rol")
    const validRolesInSlot = (slot.roleIds || [])
      .map(rid => state.roles.find(r => r.id === rid))
      .filter((r): r is NonNullable<typeof r> => Boolean(r && r.name && r.name.trim().toLowerCase() !== 'rol'))
      .sort((a, b) => getRoleWeight(a.name) - getRoleWeight(b.name));

    if (validRolesInSlot.length === 0) {
      text += `  _(Sin roles configurados)_\n`;
    } else {
      validRolesInSlot.forEach(role => {
        const musicianId = assignment[role.id];
        const musician = state.musicians.find(m => m.id === musicianId);
        const musicianName = musician ? musician.name : '— Vacante —';
        text += `  • *${role.name}:* ${musicianName}\n`;
      });
    }
    text += `\n`;
  });

  return text.trim();
}
