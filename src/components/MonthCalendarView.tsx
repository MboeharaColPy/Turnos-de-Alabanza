import React, { useState, useMemo } from 'react';
import { AppState, DAYS_OF_WEEK, SongItem } from '../types';
import { dateForDay, formatCardDate, getMonday, isoLocal } from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Music,
  ArrowRight,
  Table as TableIcon,
  LayoutGrid,
  ListFilter,
  Clock,
  UserCheck,
  Lock,
  Mic2,
  Sliders,
  Users,
  CheckCircle2,
  FileText,
  KeyRound,
} from 'lucide-react';
import { generateRotativeSchedule, getRoleCategory } from '../services/rotativeScheduler';

interface MonthCalendarViewProps {
  state: AppState;
  isAdmin: boolean;
  onApplySchedule: (newAssignments: Record<string, Record<string, string>>) => void;
  onSelectWeek: (weekStart: Date) => void;
  onSelectSong?: (song: SongItem) => void;
  showToast: (msg: string) => void;
  onRequestAdmin?: () => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  state,
  isAdmin,
  onApplySchedule,
  onSelectWeek,
  onSelectSong,
  showToast,
  onRequestAdmin,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'agenda' | 'calendar' | 'table'>('agenda');
  const [hidePastDates, setHidePastDates] = useState(false);
  const [expandedPastKeys, setExpandedPastKeys] = useState<Record<string, boolean>>({});

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const toggleExpandPast = (key: string) => {
    setExpandedPastKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0 = Enero, 11 = Diciembre

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const setThisMonth = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Turnos ordenados por día y hora
  const sortedSlots = useMemo(() => {
    return [...state.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  }, [state.slots]);

  // Saturday and Sunday standard slots
  const saturdaySlot = sortedSlots.find(s => s.day === 5) || sortedSlots[0];
  const sundaySlot = sortedSlots.find(s => s.day === 6) || sortedSlots[1];

  // Helper map for fast musician lookup
  const musicianMap = useMemo(() => {
    const map = new Map<string, (typeof state.musicians)[0]>();
    state.musicians.forEach(m => map.set(m.id, m));
    return map;
  }, [state.musicians]);

  // Helper map for role lookup
  const roleMap = useMemo(() => {
    const map = new Map<string, (typeof state.roles)[0]>();
    state.roles.forEach(r => map.set(r.id, r));
    return map;
  }, [state.roles]);

  // Calculate all weeks of the month
  const weeksOfMonth = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstMonday = getMonday(firstDayOfMonth);
    const lastMonday = getMonday(lastDayOfMonth);

    const weeks: Date[] = [];
    const curr = new Date(firstMonday);

    while (curr <= lastMonday) {
      weeks.push(new Date(curr));
      curr.setDate(curr.getDate() + 7);
    }

    return weeks;
  }, [year, month]);

  // Agenda items: ONLY dates and events that have scheduled shifts in this month
  const agendaEvents = useMemo(() => {
    const events: {
      date: Date;
      dateIso: string;
      dayOfWeek: number;
      slot: (typeof state.slots)[0];
      shiftKey: string;
      weekStart: Date;
      assignments: Record<string, string>;
      songs: SongItem[];
    }[] = [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const curr = new Date(firstDay);
    while (curr <= lastDay) {
      const dayOfWeek = (curr.getDay() + 6) % 7; // 0 = Lun, 5 = Sáb, 6 = Dom
      const matchingSlots = sortedSlots.filter(s => s.day === dayOfWeek);

      if (matchingSlots.length > 0) {
        const dateCopy = new Date(curr);
        const dateIso = isoLocal(dateCopy);
        const weekStart = getMonday(dateCopy);

        matchingSlots.forEach(slot => {
          const shiftKey = `${dateIso}__${slot.id}`;
          const currentAssignments = state.assignments[shiftKey] || {};
          const currentSongs = state.shiftSongs?.[shiftKey] || [];

          events.push({
            date: dateCopy,
            dateIso,
            dayOfWeek,
            slot,
            shiftKey,
            weekStart,
            assignments: currentAssignments,
            songs: currentSongs,
          });
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    return events;
  }, [year, month, sortedSlots, state.assignments, state.shiftSongs]);

  // Calendar matrix of days for full visual month grid
  const calendarDaysMatrix = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstMonday = getMonday(firstDayOfMonth);
    const lastMonday = getMonday(lastDayOfMonth);
    const endGridDate = new Date(lastMonday);
    endGridDate.setDate(endGridDate.getDate() + 6); // End on Sunday

    const days: { date: Date; isCurrentMonth: boolean; weekStart: Date }[] = [];
    const curr = new Date(firstMonday);

    while (curr <= endGridDate) {
      const dateCopy = new Date(curr);
      const weekStart = getMonday(dateCopy);
      days.push({
        date: dateCopy,
        isCurrentMonth: dateCopy.getMonth() === month,
        weekStart,
      });
      curr.setDate(curr.getDate() + 1);
    }

    return days;
  }, [year, month]);

  // Auto-generate for the entire month (Admin only)
  const handleAutoGenerateMonth = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    setIsGenerating(true);
    setTimeout(() => {
      const result = generateRotativeSchedule(state, firstDay, lastDay, {
        preserveExisting: false,
      });

      onApplySchedule(result.assignments);
      setIsGenerating(false);
      showToast(`¡Turnos de ${capitalizedMonthName} sugeridos automáticamente!`);
    }, 400);
  };

  return (
    <div className="space-y-6" id="month-calendar-view">
      {/* Barra de Navegación del Mes */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Título del Mes y Navegación */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0">
            <CalendarIcon size={18} />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b75] block">
              Agenda & Turnos del Mes
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-tight">
              {capitalizedMonthName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 ml-0 sm:ml-4 bg-[#0a0a0b] p-1 rounded-xl border border-[#1f1f23]">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Mes anterior"
              id="prev-month-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={setThisMonth}
              className="px-3 py-1 bg-[#1a1a1d] hover:bg-[#232328] text-[11px] font-mono uppercase tracking-wider text-[#6b6b75] hover:text-white rounded-lg transition-colors cursor-pointer"
              id="this-month-btn"
            >
              Hoy
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Mes siguiente"
              id="next-month-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Acciones & Toggle de Vista */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Switch de modo de vista (Agenda / Calendario / Tabla) */}
          <div className="flex bg-[#0a0a0b] p-1 rounded-xl border border-[#1f1f23]">
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                  : 'text-[#6b6b75] hover:text-white'
              }`}
              title="Vista de agenda con fechas y detalles asignados"
            >
              <ListFilter size={14} />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                  : 'text-[#6b6b75] hover:text-white'
              }`}
              title="Vista cuadrícula de calendario"
            >
              <LayoutGrid size={14} />
              <span>Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                  : 'text-[#6b6b75] hover:text-white'
              }`}
              title="Vista simultánea en tabla"
            >
              <TableIcon size={14} />
              <span>Tabla</span>
            </button>
          </div>

          {/* Toggle Fechas Pasadas */}
          <button
            onClick={() => setHidePastDates(!hidePastDates)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 ${
              hidePastDates
                ? 'bg-[#c5a059]/15 border-[#c5a059]/40 text-[#c5a059]'
                : 'bg-[#0a0a0b] border-[#1f1f23] text-[#6b6b75] hover:text-white'
            }`}
            title={hidePastDates ? 'Mostrando solo fechas vigentes y futuras' : 'Ocultar fechas ya pasadas del mes'}
          >
            <span>{hidePastDates ? 'Pasadas Ocultas' : 'Minimizar Pasadas'}</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleAutoGenerateMonth}
              disabled={isGenerating || sortedSlots.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#c5a059]/10 cursor-pointer disabled:opacity-50"
              id="auto-generate-month-btn"
              title="Sugerir automáticamente los turnos del mes respetando directores, balance 3H/3M, descansos y parejas"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Generando...' : 'Sugerir Turnos del Mes'}</span>
            </button>
          ) : (
            <button
              onClick={onRequestAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a1d] hover:bg-[#232328] text-[#a0a0ab] hover:text-white rounded-xl text-xs font-mono uppercase tracking-wider border border-[#2a2a2e] cursor-pointer transition-all"
              title="Desbloquear modo administrador"
            >
              <Lock size={12} className="text-[#c5a059]" />
              <span>Modo Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: AGENDA DE FECHAS ASIGNADAS (SOLO FECHAS CON EVENTO Y MÚLTIPLES DETALLES) */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {(() => {
            const filteredAgenda = agendaEvents.filter(evt => {
              if (hidePastDates) {
                const evtMidnight = new Date(evt.date);
                evtMidnight.setHours(0, 0, 0, 0);
                return evtMidnight >= todayStart;
              }
              return true;
            });

            if (filteredAgenda.length === 0) {
              return (
                <div className="text-center py-16 px-4 bg-[#141418] border border-dashed border-[#2a2a2e] rounded-2xl">
                  <CalendarIcon className="w-10 h-10 text-[#c5a059]/40 mx-auto mb-3" />
                  <h3 className="font-serif text-2xl font-light text-white mb-1">
                    {hidePastDates
                      ? `No hay más fechas pendientes en ${capitalizedMonthName}`
                      : `No hay fechas de servicio configuradas para ${capitalizedMonthName}`}
                  </h3>
                  <p className="text-xs text-[#6b6b75] max-w-md mx-auto mb-4">
                    {hidePastDates
                      ? 'Las fechas anteriores han sido ocultadas. Puedes desactivar "Pasadas Ocultas" arriba para verlas.'
                      : 'Configura los turnos recurrentes en "Roles y turnos" o selecciona otro mes.'}
                  </p>
                </div>
              );
            }

            return filteredAgenda.map((evt, idx) => {
              const evtMidnight = new Date(evt.date);
              evtMidnight.setHours(0, 0, 0, 0);
              const isPast = evtMidnight < todayStart;
              const isExpanded = expandedPastKeys[evt.shiftKey] ?? !isPast;

              const slotRoleIds = evt.slot.roleIds || [];
              const assignedCount = Object.values(evt.assignments).filter(Boolean).length;

              // Roles categorizados
              const directorRole = state.roles.find(r =>
                r.name.toLowerCase().includes('director')
              );

              const directorMusicianId = directorRole ? evt.assignments[directorRole.id] : null;
              const directorMusician = directorMusicianId
                ? musicianMap.get(directorMusicianId)
                : null;
              const directorGender: 'H' | 'M' | null = directorMusician?.gender || null;

              // Voces H (3 hombres) y Voces M (3 mujeres) estrictamente 6 puestos
              const vocesHRoles = state.roles
                .filter(r => r.name.toLowerCase().trim().startsWith('voz h'))
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
                .slice(0, 3);

              const vocesMRoles = state.roles
                .filter(r => r.name.toLowerCase().trim().startsWith('voz m'))
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
                .slice(0, 3);

              // Adjust required count if 3rd voice of director's gender is optional
              let optionalVoiceCount = 0;
              if (directorGender === 'H' && vocesHRoles.length >= 3 && !evt.assignments[vocesHRoles[2].id]) {
                optionalVoiceCount++;
              } else if (directorGender === 'M' && vocesMRoles.length >= 3 && !evt.assignments[vocesMRoles[2].id]) {
                optionalVoiceCount++;
              }

              const totalConfiguredRoles =
                (directorRole ? 1 : 0) +
                vocesHRoles.length +
                vocesMRoles.length +
                slotRoleIds.filter(rid => {
                  const r = roleMap.get(rid);
                  return r && (getRoleCategory(r.name) === 'instrument' || getRoleCategory(r.name) === 'tech');
                }).length;

              const adjustedTotalRequired = Math.max(1, totalConfiguredRoles - optionalVoiceCount);
              const isFullyStaffed = assignedCount >= adjustedTotalRequired;

              const instrumentRoles = slotRoleIds
                .map(rid => roleMap.get(rid))
                .filter(
                  (r): r is NonNullable<typeof r> => !!r && getRoleCategory(r.name) === 'instrument'
                );

              const techRoles = slotRoleIds
                .map(rid => roleMap.get(rid))
                .filter((r): r is NonNullable<typeof r> => !!r && getRoleCategory(r.name) === 'tech');

              return (
                <div
                  key={evt.shiftKey || idx}
                  className={`border rounded-2xl overflow-hidden transition-all shadow-xl ${
                    isPast
                      ? 'bg-[#121215]/80 border-[#1c1c20] opacity-80'
                      : 'bg-[#141418] border-[#1f1f23] hover:border-[#c5a059]/40'
                  }`}
                >
                  {/* Cabecera del Evento de Agenda */}
                  <div className="p-4 sm:p-5 bg-[#1a1a1d]/90 border-b border-[#1f1f23] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 flex-wrap">
                      {/* Badge de Fecha */}
                      <div className="bg-[#0a0a0b] border border-[#2a2a2e] rounded-xl px-3.5 py-2 text-center min-w-[70px]">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-[#c5a059] block">
                          {DAYS_OF_WEEK[evt.dayOfWeek].substring(0, 3)}
                        </span>
                        <span className="font-serif text-2xl font-light text-white leading-none">
                          {evt.date.getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif text-xl sm:text-2xl font-medium text-white tracking-tight">
                            {DAYS_OF_WEEK[evt.dayOfWeek]} {evt.date.getDate()} de {capitalizedMonthName}
                          </h3>
                          <span className="font-mono text-xs text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2.5 py-0.5 rounded-full font-semibold">
                            {evt.slot.time} HS
                          </span>
                          {isPast && (
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7d7d88] bg-[#0a0a0b] border border-[#222226] px-2 py-0.5 rounded">
                              Fecha Pasada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#888894] mt-0.5 flex items-center gap-1.5">
                          <span>{evt.slot.label}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-[#6b6b75]">
                            {formatCardDate(evt.date)}
                          </span>
                          {directorMusician && (
                            <>
                              <span>•</span>
                              <span className="text-white font-medium">Dir: {directorMusician.name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono text-[11px] px-3 py-1 rounded-full border uppercase tracking-wider ${
                          isFullyStaffed
                            ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                            : assignedCount > 0
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30'
                            : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23]'
                        }`}
                      >
                        {assignedCount}/{adjustedTotalRequired} ASIGNADOS
                      </span>

                      {isPast && (
                        <button
                          onClick={() => toggleExpandPast(evt.shiftKey)}
                          className="px-3 py-1.5 bg-[#0a0a0b] hover:bg-[#1a1a1d] text-[#a0a0ab] hover:text-white font-mono text-xs uppercase tracking-wider rounded-lg border border-[#2a2a2e] transition-all cursor-pointer"
                        >
                          {isExpanded ? 'Minimizar ▲' : 'Ver Detalle ▼'}
                        </button>
                      )}

                      <button
                        onClick={() => onSelectWeek(evt.weekStart)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a1a1d] hover:bg-[#c5a059] text-[#c5a059] hover:text-black font-mono text-xs uppercase tracking-wider rounded-lg border border-[#c5a059]/40 hover:border-[#c5a059] transition-all cursor-pointer shadow-sm"
                        title="Ir a la edición de la semana correspondiente"
                      >
                        <span>Editar Semana</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo Detallado del Evento de Agenda (Desplegable si es fecha pasada) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 space-y-5 bg-[#121215]">
                      {/* Director Convocado (Destacado) */}
                      <div className="bg-[#0a0a0b] border border-[#232328] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                            <UserCheck size={16} />
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-widest block">
                              Dirección de Alabanza
                            </span>
                            {directorMusician ? (
                              <span className="font-serif text-lg text-white font-medium">
                                {directorMusician.name}
                              </span>
                            ) : (
                              <span className="text-sm text-[#6b6b75] italic">
                                — Director no definido todavía —
                              </span>
                            )}
                          </div>
                        </div>

                        {directorMusician && (
                          <span className="self-start sm:self-center font-mono text-[10px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-2.5 py-0.5 rounded">
                            ✓ Director Asignado
                          </span>
                        )}
                      </div>

                      {/* Voces Convocadas (Voz h 1, 2, 3 y Voz m 1, 2, 3) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-semibold">
                            <Mic2 size={13} />
                            <span>Voces</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#6b6b75]">
                            {directorGender === 'H'
                              ? '2 Voz H + 3 Voz M + Dir (3+3)'
                              : directorGender === 'M'
                              ? '3 Voz H + 2 Voz M + Dir (3+3)'
                              : 'Voz h 1, 2, 3 & Voz m 1, 2, 3'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {vocesHRoles.map((r, voiceIdx) => {
                            const assignedId = evt.assignments[r.id];
                            const musician = assignedId ? musicianMap.get(assignedId) : null;
                            const isOptionalSlot = directorGender === 'H' && voiceIdx === 2;
                            return (
                              <div
                                key={r.id}
                                className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg bg-[#0a0a0b] border border-[#1f1f23]"
                              >
                                <span className="text-[#a0a0ab] font-mono text-[11px] font-medium">
                                  {r.name}:
                                </span>
                                {musician ? (
                                  <span className="text-white font-medium">{musician.name}</span>
                                ) : isOptionalSlot ? (
                                  <span className="text-[#6b6b75] italic text-[10px] font-mono">
                                    — Opcional (Dir H) —
                                  </span>
                                ) : (
                                  <span className="text-[#6b6b75] italic text-[11px]">— Vacante —</span>
                                )}
                              </div>
                            );
                          })}

                          {vocesMRoles.map((r, voiceIdx) => {
                            const assignedId = evt.assignments[r.id];
                            const musician = assignedId ? musicianMap.get(assignedId) : null;
                            const isOptionalSlot = directorGender === 'M' && voiceIdx === 2;
                            return (
                              <div
                                key={r.id}
                                className="flex items-center justify-between text-xs py-2 px-2.5 rounded-lg bg-[#0a0a0b] border border-[#1f1f23]"
                              >
                                <span className="text-[#a0a0ab] font-mono text-[11px] font-medium">
                                  {r.name}:
                                </span>
                                {musician ? (
                                  <span className="text-white font-medium">{musician.name}</span>
                                ) : isOptionalSlot ? (
                                  <span className="text-[#6b6b75] italic text-[10px] font-mono">
                                    — Opcional (Dir M) —
                                  </span>
                                ) : (
                                  <span className="text-[#6b6b75] italic text-[11px]">— Vacante —</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    {/* Banda / Instrumentos & Técnica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Instrumentos */}
                      <div className="space-y-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#a0a0ab] flex items-center gap-1.5">
                          <Music size={13} className="text-[#c5a059]" />
                          <span>Banda / Instrumentos</span>
                        </span>
                        <div className="bg-[#0a0a0b] border border-[#1f1f23] rounded-xl p-3 space-y-1.5">
                          {instrumentRoles.length === 0 ? (
                            <span className="text-xs text-[#6b6b75] italic">Sin instrumentos</span>
                          ) : (
                            instrumentRoles.map(r => {
                              const assignedId = evt.assignments[r.id];
                              const musician = assignedId ? musicianMap.get(assignedId) : null;
                              return (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#141418] border border-[#1f1f23]"
                                >
                                  <span className="text-[#888894] font-mono text-[11px]">
                                    {r.name}:
                                  </span>
                                  {musician ? (
                                    <span className="text-white font-medium">{musician.name}</span>
                                  ) : (
                                    <span className="text-[#6b6b75] italic">— Vacante —</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Sonido Multimedia */}
                      <div className="space-y-2">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#a0a0ab] flex items-center gap-1.5">
                          <Sliders size={13} className="text-cyan-400" />
                          <span>Sonido Multimedia</span>
                        </span>
                        <div className="bg-[#0a0a0b] border border-[#1f1f23] rounded-xl p-3 space-y-1.5">
                          {techRoles.length === 0 ? (
                            <span className="text-xs text-[#6b6b75] italic">Sin técnica</span>
                          ) : (
                            techRoles.map(r => {
                              const assignedId = evt.assignments[r.id];
                              const musician = assignedId ? musicianMap.get(assignedId) : null;
                              return (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#141418] border border-[#1f1f23]"
                                >
                                  <span className="text-[#888894] font-mono text-[11px]">
                                    {r.name}:
                                  </span>
                                  {musician ? (
                                    <span className="text-cyan-300 font-medium">{musician.name}</span>
                                  ) : (
                                    <span className="text-[#6b6b75] italic">— Vacante —</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Repertorio / Alabanzas del Turno (Clickeables para ver Letra y Notas) */}
                    <div className="pt-2 border-t border-[#1f1f23] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                          <FileText size={13} />
                          <span>Repertorio de Alabanzas ({evt.songs.length})</span>
                        </span>
                        <span className="text-[10px] text-[#6b6b75] font-mono">
                          Haz clic sobre una canción para abrir su letra y notas
                        </span>
                      </div>

                      {evt.songs.length === 0 ? (
                        <div className="text-xs text-[#6b6b75] italic bg-[#0a0a0b] p-3 rounded-xl border border-[#1f1f23]">
                          No hay canciones agregadas a este turno todavía.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {evt.songs.map((song, sIdx) => (
                            <button
                              key={song.id || sIdx}
                              onClick={() => onSelectSong && onSelectSong(song)}
                              type="button"
                              className="text-left bg-[#0a0a0b] hover:bg-[#18181d] border border-[#232328] hover:border-[#c5a059] p-2.5 rounded-xl flex items-center justify-between gap-2 transition-all group cursor-pointer"
                              title="Ver letra y notas de esta canción"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="font-mono text-xs text-[#c5a059] font-bold">
                                  {sIdx + 1}.
                                </span>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-medium text-white group-hover:text-[#c5a059] transition-colors truncate">
                                    {song.title}
                                  </h5>
                                  <p className="text-[10px] text-[#6b6b75] truncate">
                                    {song.artist || 'Desconocido'}
                                  </p>
                                </div>
                              </div>

                              {song.key && (
                                <span className="font-mono text-[10px] uppercase font-semibold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-1.5 py-0.5 rounded flex-shrink-0">
                                  {song.key}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    )}

      {/* VISTA 2: CUADRÍCULA DE CALENDARIO VISUAL */}
      {viewMode === 'calendar' && (
        <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl overflow-hidden shadow-2xl">
          {/* Días de la semana (Cabecera) */}
          <div className="grid grid-cols-7 border-b border-[#1f1f23] bg-[#0f0f12] text-center text-[11px] font-mono uppercase tracking-widest text-[#6b6b75] py-2.5">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div className="text-[#c5a059] font-semibold">Sáb</div>
            <div className="text-[#c5a059] font-semibold">Dom</div>
          </div>

          {/* Cuadrícula de días */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#1f1f23] bg-[#0a0a0b]">
            {calendarDaysMatrix.map((dayItem, idx) => {
              const dayOfWeek = (dayItem.date.getDay() + 6) % 7; // 0 = Lun, 5 = Sáb, 6 = Dom
              const dateIso = isoLocal(dayItem.date);
              const isToday = isoLocal(new Date()) === dateIso;
              const isPastDay = dayItem.date < todayStart && !isToday;

              // Matching slots for this day
              const daySlots = sortedSlots.filter(s => s.day === dayOfWeek);

              return (
                <div
                  key={idx}
                  onClick={() => onSelectWeek(dayItem.weekStart)}
                  className={`min-h-[110px] sm:min-h-[135px] p-2 flex flex-col justify-between transition-all cursor-pointer group ${
                    dayItem.isCurrentMonth
                      ? isPastDay
                        ? 'bg-[#121215]/80 opacity-60 hover:opacity-100 hover:bg-[#1a1a1e]'
                        : 'bg-[#141418] hover:bg-[#1a1a1e]'
                      : 'bg-[#0e0e11]/60 text-[#44444c] hover:bg-[#121215]'
                  } ${dayOfWeek >= 5 && dayItem.isCurrentMonth && !isPastDay ? 'bg-[#16161b]' : ''}`}
                >
                  {/* Número del día */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        isToday
                          ? 'bg-[#c5a059] text-black font-bold ring-1 ring-[#c5a059]'
                          : dayItem.isCurrentMonth
                          ? isPastDay
                            ? 'text-[#777785]'
                            : 'text-white font-medium group-hover:text-[#c5a059]'
                          : 'text-[#44444c]'
                      }`}
                    >
                      {dayItem.date.getDate()}
                    </span>

                    {daySlots.length > 0 && dayItem.isCurrentMonth && (
                      <span className="text-[9px] font-mono text-[#c5a059] opacity-75">
                        {daySlots.length === 1 ? '1 Turno' : `${daySlots.length} Turnos`}
                      </span>
                    )}
                  </div>

                  {/* Turnos / Actividades del día */}
                  <div className="mt-1 space-y-1.5 flex-1 flex flex-col justify-center">
                    {daySlots.map(slot => {
                      const key = `${dateIso}__${slot.id}`;
                      const assignment = state.assignments[key] || {};
                      const assignedCount = Object.values(assignment).filter(Boolean).length;
                      const songs = state.shiftSongs?.[key] || [];

                      // Director
                      const directorRole = state.roles.find(r =>
                        r.name.toLowerCase().includes('director')
                      );
                      const directorId = directorRole ? assignment[directorRole.id] : null;
                      const directorMusician = directorId
                        ? state.musicians.find(m => m.id === directorId)
                        : null;

                      return (
                        <div
                          key={slot.id}
                          className="bg-[#0a0a0b] border border-[#232328] group-hover:border-[#c5a059]/40 rounded-lg p-1.5 text-[10px] space-y-1 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[#c5a059] font-semibold">
                              {slot.time} hs
                            </span>
                            <span className="text-[#6b6b75] truncate max-w-[70px] text-right">
                              {slot.label}
                            </span>
                          </div>

                          {/* Director(a) */}
                          {directorMusician && (
                            <div className="text-white font-medium truncate flex items-center gap-1">
                              <span className="text-[#c5a059] font-mono text-[9px]">Dir:</span>
                              <span className="truncate">{directorMusician.name}</span>
                            </div>
                          )}

                          {/* Resumen de equipo & canciones */}
                          <div className="flex items-center justify-between text-[#888894] pt-0.5 border-t border-[#1a1a1d]">
                            <span>{assignedCount} asignados</span>
                            {songs.length > 0 && (
                              <span className="text-[#c5a059] flex items-center gap-0.5">
                                <Music size={9} />
                                <span>{songs.length}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 3: TABLA SIMULTÁNEA DE FECHAS DEL MES */}
      {viewMode === 'table' && (
        <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-[#1a1a1d] border-b border-[#1f1f23] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon size={16} className="text-[#c5a059]" />
              <span className="font-serif text-lg text-white font-medium">
                Resumen de Fechas — {capitalizedMonthName}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75]">
              {weeksOfMonth.length} Semanas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f0f12] text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] border-b border-[#1f1f23]">
                  <th className="py-3.5 px-4 font-semibold">Semana</th>
                  <th className="py-3.5 px-4 font-semibold">Ensayo Sábado</th>
                  <th className="py-3.5 px-4 font-semibold">Culto Dominical</th>
                  <th className="py-3.5 px-4 font-semibold">Director(a)</th>
                  <th className="py-3.5 px-4 font-semibold">Voces e Integrantes</th>
                  <th className="py-3.5 px-4 font-semibold">Alabanzas</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23] text-sm">
                {weeksOfMonth
                  .filter(weekMonday => {
                    if (!hidePastDates) return true;
                    const weekEnd = new Date(weekMonday);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return weekEnd >= todayStart;
                  })
                  .map((weekMonday, weekIdx) => {
                    const weekEnd = new Date(weekMonday);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    const isPastWeek = weekEnd < todayStart;
                    const weekLabel = `${weekMonday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

                    // Sábado
                    const satDate = dateForDay(weekMonday, 5);
                    const satKey = saturdaySlot ? `${isoLocal(satDate)}__${saturdaySlot.id}` : '';
                    const satAssign = satKey ? state.assignments[satKey] || {} : {};
                    const satCount = Object.values(satAssign).filter(Boolean).length;
                    const satSongs = satKey ? state.shiftSongs?.[satKey] || [] : [];

                    // Domingo
                    const sunDate = dateForDay(weekMonday, 6);
                    const sunKey = sundaySlot ? `${isoLocal(sunDate)}__${sundaySlot.id}` : '';
                    const sunAssign = sunKey ? state.assignments[sunKey] || {} : {};
                    const sunCount = Object.values(sunAssign).filter(Boolean).length;
                    const sunSongs = sunKey ? state.shiftSongs?.[sunKey] || [] : [];

                    // Director
                    const primaryAssign = Object.keys(sunAssign).length > 0 ? sunAssign : satAssign;
                    const directorRole = state.roles.find(r =>
                      r.name.toLowerCase().includes('director')
                    );
                    const dirMusicianId = directorRole ? primaryAssign[directorRole.id] : null;
                    const dirMusician = dirMusicianId
                      ? state.musicians.find(m => m.id === dirMusicianId)
                      : null;

                    // Unique scheduled musicians in Sunday shift
                    const assignedMusicians = Array.from(
                      new Set(Object.values(sunAssign).filter(Boolean))
                    )
                      .map(mid => state.musicians.find(m => m.id === mid))
                      .filter(Boolean);

                    const totalSongsCount = satSongs.length + sunSongs.length;

                    return (
                      <tr
                        key={weekIdx}
                        className={`transition-colors group cursor-pointer ${
                          isPastWeek
                            ? 'bg-[#101014]/60 opacity-60 hover:opacity-100 hover:bg-[#18181d]'
                            : 'hover:bg-[#18181d]'
                        }`}
                        onClick={() => onSelectWeek(weekMonday)}
                      >
                      {/* Semana */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase font-bold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded">
                            Sem {weekIdx + 1}
                          </span>
                          <span className="font-serif text-white font-medium">{weekLabel}</span>
                        </div>
                      </td>

                      {/* Ensayo Sábado */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-white">
                            <Clock size={12} className="text-[#c5a059]" />
                            <span>{saturdaySlot?.time || '18:00'} hs</span>
                            <span className="text-[11px] text-[#6b6b75]">
                              ({formatCardDate(satDate)})
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block ${
                              satCount > 0
                                ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                                : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23]'
                            }`}
                          >
                            {satCount} convocados
                          </span>
                        </div>
                      </td>

                      {/* Culto Dominical */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-white">
                            <Clock size={12} className="text-[#c5a059]" />
                            <span>{sundaySlot?.time || '10:00'} hs</span>
                            <span className="text-[11px] text-[#6b6b75]">
                              ({formatCardDate(sunDate)})
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border inline-block ${
                              sunCount > 0
                                ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                                : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23]'
                            }`}
                          >
                            {sunCount} convocados
                          </span>
                        </div>
                      </td>

                      {/* Director(a) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {dirMusician ? (
                          <div className="flex items-center gap-1.5">
                            <UserCheck size={14} className="text-[#c5a059]" />
                            <span className="text-xs font-medium text-white block">
                              {dirMusician.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6b6b75] italic">— Sin director —</span>
                        )}
                      </td>

                      {/* Integrantes Convocados */}
                      <td className="py-4 px-4 max-w-xs">
                        {assignedMusicians.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap text-xs text-[#c0c0cc]">
                            {assignedMusicians.slice(0, 4).map(m => (
                              <span
                                key={m.id}
                                className="bg-[#0a0a0b] px-1.5 py-0.5 rounded border border-[#1f1f23] text-[11px]"
                              >
                                {m.name}
                              </span>
                            ))}
                            {assignedMusicians.length > 4 && (
                              <span className="text-[10px] font-mono text-[#c5a059]">
                                +{assignedMusicians.length - 4} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#6b6b75] italic">— Pendiente —</span>
                        )}
                      </td>

                      {/* Alabanzas */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-[#a0a0ab]">
                          <Music size={13} className="text-[#c5a059]" />
                          <span>
                            {totalSongsCount > 0
                              ? `${totalSongsCount} alabanzas`
                              : '0 seleccionadas'}
                          </span>
                        </div>
                      </td>

                      {/* Acción */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectWeek(weekMonday);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1d] hover:bg-[#c5a059] text-[#c5a059] hover:text-black font-mono text-xs uppercase tracking-wider rounded-lg border border-[#c5a059]/40 hover:border-[#c5a059] transition-all cursor-pointer shadow-sm"
                        >
                          <span>Ver Semana</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
