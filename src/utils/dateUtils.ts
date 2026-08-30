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

export function dateForDay(weekStart: Date, dayIndex: number): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d;
}

export function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const s = start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const e = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${s} – ${e}`;
}

export function formatCardDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
