import { AppState, DAYS_OF_WEEK, Slot } from '../types';

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
 * Duración estándar de cada evento o culto (3 horas)
 */
export const EVENT_DURATION_HOURS = 3;

/**
 * Obtiene la próxima fecha en la que se ejecuta un Slot (por día de la semana 0..6 y hora HH:mm).
 * La duración de cada evento es de 3 horas y sigue mostrándose como evento actual hasta que finaliza.
 */
export function getNextUpcomingDateForSlot(
  dayOfWeekIndex: number,
  timeStr: string,
  durationHours: number = EVENT_DURATION_HOURS
): Date {
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
      const eventEndTime = new Date(candidate.getTime() + durationHours * 60 * 60 * 1000);
      // Si el evento aún no ha finalizado (está por comenzar o en curso durante sus 3 horas)
      if (now <= eventEndTime || i > 0) {
        return candidate;
      }
    }
  }

  // Si ya finalizó hoy o no se encontró en esta semana, calcular la próxima
  const fallback = new Date(now);
  fallback.setDate(now.getDate() + 7);
  fallback.setHours(hours || 0, minutes || 0, 0, 0);
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

  if (!state.slots || state.slots.length === 0) {
    return text + 'No hay turnos programados.';
  }

  // Filtrar ensayos vinculados para no duplicar integrantes (las personas de eventos y ensayos son las mismas)
  const isSlotRehearsal = (slot: Slot): boolean => {
    if (!slot) return false;
    if (slot.id === 'slt_sabado_ensayo') return true;
    const isCoveredByOther = (state.slots || []).some(
      other => other.id !== slot.id && other.rehearsal?.enabled && other.rehearsal.day === slot.day
    );
    if (isCoveredByOther && (slot.label || '').toLowerCase().includes('ensayo')) {
      return true;
    }
    return false;
  };

  const mainSlots = (state.slots || []).filter(slot => !isSlotRehearsal(slot));
  const sortedSlots = [...mainSlots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

  if (sortedSlots.length === 0) {
    return text + 'No hay eventos principales configurados.';
  }

  // Orden estricto de roles: 1. Director, 2. Voces, 3. Instrumentos, 4. Sonido y Audiovisual
  const getRoleSortOrder = (roleName: string): { group: number; sub: number } => {
    const norm = roleName.toLowerCase().trim();
    if (norm.includes('director') || norm.includes('dirección') || norm.includes('direccion') || norm.includes('lider') || norm.includes('líder')) {
      return { group: 1, sub: 0 };
    }
    if (norm.includes('voz') || norm.includes('voces') || norm.includes('cantante') || norm.includes('vocal') || norm.includes('coro')) {
      let sub = 50;
      if (norm.includes('voz h 1') || norm.includes('voz 1 h')) sub = 10;
      else if (norm.includes('voz h 2') || norm.includes('voz 2 h')) sub = 11;
      else if (norm.includes('voz h 3') || norm.includes('voz 3 h')) sub = 12;
      else if (norm.includes('voz m 1') || norm.includes('voz 1 m')) sub = 20;
      else if (norm.includes('voz m 2') || norm.includes('voz 2 m')) sub = 21;
      else if (norm.includes('voz m 3') || norm.includes('voz 3 m')) sub = 22;
      else if (norm.includes('voz h') || norm.includes('masculin')) sub = 30;
      else if (norm.includes('voz m') || norm.includes('femenin')) sub = 40;
      return { group: 2, sub };
    }
    if (
      norm.includes('sonido') ||
      norm.includes('audio visual') ||
      norm.includes('audiovisual') ||
      norm.includes('luces') ||
      norm.includes('pantalla') ||
      norm.includes('proyeccion') ||
      norm.includes('cámara') ||
      norm.includes('camara')
    ) {
      let sub = 10;
      if (norm.includes('sonido 2')) sub = 12;
      else if (norm.includes('audio visual') || norm.includes('audiovisual')) sub = 20;
      return { group: 4, sub };
    }
    // Instrumentos
    let sub = 30;
    if (norm.includes('piano') || norm.includes('teclado')) sub = 1;
    else if (norm.includes('guitarra acustica') || norm.includes('acústica')) sub = 2;
    else if (norm.includes('guitarra electrica') || norm.includes('eléctrica')) sub = 3;
    else if (norm.includes('bajo')) sub = 4;
    else if (norm.includes('bateria') || norm.includes('batería')) sub = 5;
    return { group: 3, sub };
  };

  sortedSlots.forEach((slot, index) => {
    const date = dateForDay(weekStart, slot.day);
    const dateStr = formatCardDate(date);
    const eventShiftKey = `${isoLocal(date)}__${slot.id}`;
    const assignment = state.assignments[eventShiftKey] || {};

    text += `🔹 *${DAYS_OF_WEEK[slot.day].toUpperCase()} ${dateStr}* · ${slot.time} hs\n`;
    text += `📌 *${slot.label}*\n`;

    // Ensayo previo vinculado (se informa aquí para no duplicar integrantes dos veces)
    if (slot.rehearsal && slot.rehearsal.enabled) {
      text += `🎹 *Ensayo:* ${DAYS_OF_WEEK[slot.rehearsal.day]} ${slot.rehearsal.time} hs\n`;
    }

    // Repertorio / Setlist de canciones asignadas a este culto
    let songs = (state.shiftSongs && state.shiftSongs[eventShiftKey]) || [];
    if ((!songs || songs.length === 0) && slot.rehearsal && slot.rehearsal.enabled) {
      const rehearsalDate = dateForDay(weekStart, slot.rehearsal.day);
      const rKey1 = `${isoLocal(rehearsalDate)}__slt_sabado_ensayo`;
      const rKey2 = `${isoLocal(rehearsalDate)}__${slot.id}`;
      songs = (state.shiftSongs && (state.shiftSongs[rKey1] || state.shiftSongs[rKey2])) || [];
    }

    if (Array.isArray(songs) && songs.length > 0) {
      text += `\n🎶 *SETLIST / CANCIONES (${songs.length}):*\n`;
      songs.forEach((s, sIdx) => {
        text += `  ${sIdx + 1}. *${s.title}*`;
        if (s.key) text += ` [Tono: ${s.key}]`;
        if (s.artist) text += ` - _${s.artist}_`;
        text += `\n`;
      });
    }

    // Equipo convocado (única lista por evento, ordenada por jerarquía ministerial)
    const validRolesInSlot = (slot.roleIds || [])
      .map(rid => (state.roles || []).find(r => r.id === rid))
      .filter((r): r is NonNullable<typeof r> => Boolean(r && r.name && r.name.trim().toLowerCase() !== 'rol'))
      .sort((a, b) => {
        const orderA = getRoleSortOrder(a.name);
        const orderB = getRoleSortOrder(b.name);
        if (orderA.group !== orderB.group) return orderA.group - orderB.group;
        if (orderA.sub !== orderB.sub) return orderA.sub - orderB.sub;
        return a.name.localeCompare(b.name, 'es');
      });

    text += `\n👥 *EQUIPO CONVOCADO:*\n`;
    if (validRolesInSlot.length === 0) {
      text += `  _(Sin roles configurados)_\n`;
    } else {
      validRolesInSlot.forEach(role => {
        const musicianId = assignment[role.id];
        const musician = (state.musicians || []).find(m => m.id === musicianId);
        const musicianName = musician ? musician.name : '— Vacante —';
        text += `  • *${role.name}:* ${musicianName}\n`;
      });
    }

    if (index < sortedSlots.length - 1) {
      text += `\n────────────────────\n\n`;
    }
  });

  return text.trim();
}
