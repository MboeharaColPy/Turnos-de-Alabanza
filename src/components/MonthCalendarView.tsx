import React, { useState, useMemo } from 'react';
import { AppState, DAYS_OF_WEEK, SongItem, Musician, Role } from '../types';
import {
  dateForDay,
  formatCardDate,
  formatWeekRange,
  getDefaultMonthDate,
  getMonday,
  isPastLastSundayOfMonth,
  isoLocal,
} from '../utils/dateUtils';
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
  HelpCircle,
  AlertTriangle,
  Heart,
  Check,
  Info,
} from 'lucide-react';
import { generateRotativeSchedule, getRoleCategory } from '../services/rotativeScheduler';
import { ConflictExplainerModal } from './ConflictExplainerModal';

interface MonthCalendarViewProps {
  state: AppState;
  isAdmin: boolean;
  onApplySchedule: (newAssignments: Record<string, Record<string, string>>) => void;
  onSelectWeek: (weekStart: Date) => void;
  onSelectSong?: (song: SongItem, contextSongs?: SongItem[]) => void;
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
  // Inicialización inteligente: Si ya pasó el último domingo de este mes, abre en el siguiente mes
  const [currentDate, setCurrentDate] = useState<Date>(() => getDefaultMonthDate(new Date()));
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'agenda' | 'calendar' | 'table'>('agenda');
  const [hidePastDates, setHidePastDates] = useState(false);
  const [expandedPastKeys, setExpandedPastKeys] = useState<Record<string, boolean>>({});
  const [showExplainerModal, setShowExplainerModal] = useState(false);

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
    setCurrentDate(getDefaultMonthDate(new Date()));
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Comprobar si el mes en visualización es el mes inteligente activo (avance automático por último domingo)
  const isAutoAdvancedNextMonth = useMemo(() => {
    const now = new Date();
    const actualCurrentMonth = now.getMonth();
    const actualCurrentYear = now.getFullYear();
    const targetIsNext = (year === actualCurrentYear && month === actualCurrentMonth + 1) ||
                         (year === actualCurrentYear + 1 && actualCurrentMonth === 11 && month === 0);
    return targetIsNext && isPastLastSundayOfMonth(actualCurrentYear, actualCurrentMonth, now);
  }, [year, month]);

  // Turnos ordenados por día y hora
  const sortedSlots = useMemo(() => {
    return [...state.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  }, [state.slots]);

  // Helper map for fast musician lookup
  const musicianMap = useMemo(() => {
    const map = new Map<string, Musician>();
    state.musicians.forEach(m => map.set(m.id, m));
    return map;
  }, [state.musicians]);

  // Helper map for role lookup
  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    state.roles.forEach(r => map.set(r.id, r));
    return map;
  }, [state.roles]);

  // Helper map for couples lookup
  const coupleMap = useMemo(() => {
    const map = new Map<string, string>();
    (state.couples || []).forEach(c => {
      map.set(c.aId, c.bId);
      map.set(c.bId, c.aId);
    });
    return map;
  }, [state.couples]);

  // Calculate all weeks of the month (from first Monday to last Sunday)
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

  // Agenda items: Todas las fechas con eventos y asignaciones en el mes
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
      {/* Guía Visual Modal */}
      <ConflictExplainerModal
        isOpen={showExplainerModal}
        onClose={() => setShowExplainerModal(false)}
      />

      {/* Barra de Navegación del Mes */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Título del Mes y Navegación */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0">
            <CalendarIcon size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#6b6b75] block">
                Agenda & Turnos del Mes
              </span>
              {isAutoAdvancedNextMonth && (
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check size={10} />
                  <span>Ciclo Activo</span>
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-tight">
              {capitalizedMonthName}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 ml-0 sm:ml-4 bg-[#0a0a0b] p-1 rounded-xl border border-[#1f1f23]">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-white flex items-center justify-center cursor-pointer transition-colors min-h-[36px]"
              title="Mes anterior"
              id="prev-month-btn"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={setThisMonth}
              className="px-3.5 py-1.5 bg-[#1a1a1d] hover:bg-[#232328] text-xs font-mono uppercase tracking-wider text-[#a0a0ab] hover:text-white rounded-lg transition-colors cursor-pointer min-h-[36px]"
              title="Ir al mes del ciclo activo actual"
              id="this-month-btn"
            >
              Ciclo Activo
            </button>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-white flex items-center justify-center cursor-pointer transition-colors min-h-[36px]"
              title="Mes siguiente"
              id="next-month-btn"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowExplainerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition-colors cursor-pointer min-h-[36px]"
            title="Ver guía visual de alertas y reglas de parejas"
          >
            <HelpCircle size={14} />
            <span>Guía de Alertas</span>
          </button>
        </div>

        {/* Acciones & Toggle de Vista */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Switch de modo de vista (Agenda / Calendario / Tabla) */}
          <div className="flex bg-[#0a0a0b] p-1 rounded-xl border border-[#1f1f23]">
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] ${
                viewMode === 'agenda'
                  ? 'bg-[#1e1e24] text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-[#888894] hover:text-white'
              }`}
              title="Vista de agenda con fechas y detalles asignados"
            >
              <ListFilter size={14} />
              <span>Agenda</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] ${
                viewMode === 'calendar'
                  ? 'bg-[#1e1e24] text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-[#888894] hover:text-white'
              }`}
              title="Vista cuadrícula de calendario"
            >
              <LayoutGrid size={14} />
              <span>Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px] ${
                viewMode === 'table'
                  ? 'bg-[#1e1e24] text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-[#888894] hover:text-white'
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
            className={`px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer flex items-center gap-1.5 min-h-[40px] ${
              hidePastDates
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                : 'bg-[#0a0a0b] border-[#1f1f23] text-[#888894] hover:text-white'
            }`}
            title={hidePastDates ? 'Mostrando solo fechas vigentes y futuras' : 'Ocultar fechas ya pasadas del mes'}
          >
            <span>{hidePastDates ? 'Pasadas Ocultas' : 'Minimizar Pasadas'}</span>
          </button>

          {isAdmin ? (
            <button
              onClick={handleAutoGenerateMonth}
              disabled={isGenerating || sortedSlots.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 min-h-[42px] active:scale-95"
              id="auto-generate-month-btn"
              title="Sugerir automáticamente los turnos del mes respetando directores, balance 3H/3M, descansos y parejas"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Generando...' : 'Sugerir Mes (IA)'}</span>
            </button>
          ) : (
            <button
              onClick={onRequestAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#18181c] hover:bg-[#222228] text-[#a0a0ab] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-[#2e2e36] cursor-pointer transition-all min-h-[42px]"
              title="Desbloquear modo administrador"
            >
              <Lock size={12} className="text-amber-400" />
              <span>Modo Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: AGENDA DE FECHAS ASIGNADAS (SINCRONIZACIÓN EXACTA 100% CON VISTA SEMANAL) */}
      {viewMode === 'agenda' && (
        <div className="space-y-5">
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

              // Extraer y categorizar TODOS los roles configurados + asignaciones activas
              const slotRoleIds = (evt.slot.roleIds || []).filter(rid =>
                state.roles.some(r => r.id === rid && r.name && r.name.toLowerCase().trim() !== 'rol')
              );

              // Rol Director
              const directorRole = state.roles.find(r => getRoleCategory(r.name) === 'director');
              const directorMusicianId = directorRole ? evt.assignments[directorRole.id] : null;
              const directorMusician = directorMusicianId ? musicianMap.get(directorMusicianId) : null;
              const directorGender: 'H' | 'M' | null = directorMusician?.gender || null;

              // Voces H (3 puestos) y Voces M (3 puestos)
              const allVoiceRolesH = state.roles
                .filter(r => getRoleCategory(r.name) === 'voz_h')
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
                .slice(0, 3);

              const allVoiceRolesM = state.roles
                .filter(r => getRoleCategory(r.name) === 'voz_m')
                .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
                .slice(0, 3);

              // Instrumentos
              const instrumentRoles = slotRoleIds
                .map(rid => roleMap.get(rid))
                .filter((r): r is Role => !!r && getRoleCategory(r.name) === 'instrument');

              // Sonido Multimedia
              const techRoles = slotRoleIds
                .map(rid => roleMap.get(rid))
                .filter((r): r is Role => !!r && getRoleCategory(r.name) === 'tech');

              // Otros roles adicionales configurados o asignados
              const otherRoles = slotRoleIds
                .map(rid => roleMap.get(rid))
                .filter(
                  (r): r is Role =>
                    !!r &&
                    getRoleCategory(r.name) !== 'director' &&
                    getRoleCategory(r.name) !== 'voz_h' &&
                    getRoleCategory(r.name) !== 'voz_m' &&
                    getRoleCategory(r.name) !== 'instrument' &&
                    getRoleCategory(r.name) !== 'tech'
                );

              // Conteo de asignados reales
              const assignedMusicianIds = Object.values(evt.assignments).filter(Boolean);
              const assignedCount = assignedMusicianIds.length;

              // Roles opcionales (3ra voz del mismo género del director)
              let optionalVoiceCount = 0;
              if (directorGender === 'H' && allVoiceRolesH.length >= 3 && !evt.assignments[allVoiceRolesH[2].id]) {
                optionalVoiceCount++;
              } else if (directorGender === 'M' && allVoiceRolesM.length >= 3 && !evt.assignments[allVoiceRolesM[2].id]) {
                optionalVoiceCount++;
              }

              const totalConfiguredCount =
                (directorRole ? 1 : 0) +
                allVoiceRolesH.length +
                allVoiceRolesM.length +
                instrumentRoles.length +
                techRoles.length +
                otherRoles.length;

              const adjustedTotalRequired = Math.max(1, totalConfiguredCount - optionalVoiceCount);
              const isFullyStaffed = assignedCount >= adjustedTotalRequired;

              // Detección de Parejas en descanso
              const assignedMusiciansSet = new Set(assignedMusicianIds);
              const coupleAlerts: { musicianName: string; spouseName: string }[] = [];
              assignedMusiciansSet.forEach(mId => {
                const spouseId = coupleMap.get(mId);
                if (spouseId && !assignedMusiciansSet.has(spouseId)) {
                  const m = musicianMap.get(mId);
                  const spouse = musicianMap.get(spouseId);
                  if (m && spouse) {
                    coupleAlerts.push({ musicianName: m.name, spouseName: spouse.name });
                  }
                }
              });

              // Detección de Dobles Roles
              const musicianAssignmentCount: Record<string, string[]> = {};
              Object.entries(evt.assignments).forEach(([rId, mId]) => {
                if (mId && typeof mId === 'string') {
                  const r = roleMap.get(rId);
                  if (r) {
                    musicianAssignmentCount[mId] = [...(musicianAssignmentCount[mId] || []), r.name];
                  }
                }
              });

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
                        <p className="text-xs text-[#888894] mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-white">{evt.slot.label}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-[#6b6b75]">
                            {formatCardDate(evt.date)}
                          </span>
                          {directorMusician && (
                            <>
                              <span>•</span>
                              <span className="text-[#c5a059] font-medium flex items-center gap-1">
                                <UserCheck size={12} />
                                <span>Dir: {directorMusician.name}</span>
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`font-mono text-[11px] px-3 py-1 rounded-full border uppercase tracking-wider font-semibold ${
                          isFullyStaffed
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                            : assignedCount > 0
                            ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/30'
                            : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23]'
                        }`}
                      >
                        {assignedCount}/{adjustedTotalRequired} CONVOCADOS
                      </span>

                      {isPast && (
                        <button
                          onClick={() => toggleExpandPast(evt.shiftKey)}
                          className="px-3 py-1.5 bg-[#0a0a0b] hover:bg-[#1a1a1d] text-[#a0a0ab] hover:text-white font-mono text-xs uppercase tracking-wider rounded-lg border border-[#2a2a2e] transition-all cursor-pointer min-h-[36px]"
                        >
                          {isExpanded ? 'Minimizar ▲' : 'Ver Detalle ▼'}
                        </button>
                      )}

                      <button
                        onClick={() => onSelectWeek(evt.weekStart)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a1a1d] hover:bg-[#c5a059] text-[#c5a059] hover:text-black font-mono text-xs uppercase tracking-wider rounded-lg border border-[#c5a059]/40 hover:border-[#c5a059] transition-all cursor-pointer shadow-sm min-h-[36px]"
                        title="Ir a la edición de esta semana en la vista semanal"
                      >
                        <span>Editar Semana</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo Detallado del Evento de Agenda (Desplegable si es fecha pasada) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 space-y-5 bg-[#121215]">
                      {/* Avisos de Parejas o Dobles Roles si aplican */}
                      {coupleAlerts.length > 0 && (
                        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 flex items-start gap-2.5">
                          <Heart size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-200">
                            <span className="font-bold">Aviso de Parejas: </span>
                            {coupleAlerts.map((ca, i) => (
                              <span key={i}>
                                <strong>{ca.musicianName}</strong> está convocado(a) mientras que su cónyuge{' '}
                                <strong>{ca.spouseName}</strong> tiene descanso.
                                {i < coupleAlerts.length - 1 ? ' · ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Director Convocado (Destacado) */}
                      <div className="bg-[#0a0a0b] border border-[#232328] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
                            <UserCheck size={18} />
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
                                — Director(a) no asignado(a) todavía —
                              </span>
                            )}
                          </div>
                        </div>

                        {directorMusician && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2.5 py-1 rounded-md font-semibold">
                              ✓ Director(a) Asignado(a)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Voces Convocadas (Voz h 1, 2, 3 y Voz m 1, 2, 3) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-semibold">
                            <Mic2 size={13} />
                            <span>Equipo Vocal (3 Hombres & 3 Mujeres)</span>
                          </span>
                          <span className="font-mono text-[10px] text-[#6b6b75]">
                            {directorGender === 'H'
                              ? '2 Voz H + 3 Voz M + Dir H (3+3)'
                              : directorGender === 'M'
                              ? '3 Voz H + 2 Voz M + Dir M (3+3)'
                              : 'Voz h 1, 2, 3 & Voz m 1, 2, 3'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {allVoiceRolesH.map((r, voiceIdx) => {
                            const assignedId = evt.assignments[r.id];
                            const musician = assignedId ? musicianMap.get(assignedId) : null;
                            const isOptionalSlot = directorGender === 'H' && voiceIdx === 2;
                            return (
                              <div
                                key={r.id}
                                className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl border ${
                                  musician
                                    ? 'bg-blue-950/20 border-blue-800/40 shadow-sm'
                                    : 'bg-[#0a0a0b] border-[#1f1f23]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-bold text-blue-300 bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-700/50">
                                    H
                                  </span>
                                  <span className="text-[#a0a0ab] font-mono text-[11px] font-medium">
                                    {r.name}:
                                  </span>
                                </div>
                                {musician ? (
                                  <span className="text-white font-medium truncate max-w-[120px] text-right">
                                    {musician.name}
                                  </span>
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

                          {allVoiceRolesM.map((r, voiceIdx) => {
                            const assignedId = evt.assignments[r.id];
                            const musician = assignedId ? musicianMap.get(assignedId) : null;
                            const isOptionalSlot = directorGender === 'M' && voiceIdx === 2;
                            return (
                              <div
                                key={r.id}
                                className={`flex items-center justify-between text-xs py-2 px-3 rounded-xl border ${
                                  musician
                                    ? 'bg-rose-950/20 border-rose-800/40 shadow-sm'
                                    : 'bg-[#0a0a0b] border-[#1f1f23]'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-700/50">
                                    M
                                  </span>
                                  <span className="text-[#a0a0ab] font-mono text-[11px] font-medium">
                                    {r.name}:
                                  </span>
                                </div>
                                {musician ? (
                                  <span className="text-white font-medium truncate max-w-[120px] text-right">
                                    {musician.name}
                                  </span>
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

                      {/* Banda / Instrumentos & Multimedia */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Instrumentos */}
                        <div className="space-y-2">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#a0a0ab] flex items-center gap-1.5 font-semibold">
                            <Music size={13} className="text-[#c5a059]" />
                            <span>Banda / Instrumentos ({instrumentRoles.length})</span>
                          </span>
                          <div className="bg-[#0a0a0b] border border-[#1f1f23] rounded-xl p-3 space-y-2">
                            {instrumentRoles.length === 0 ? (
                              <span className="text-xs text-[#6b6b75] italic">Sin instrumentos configurados</span>
                            ) : (
                              instrumentRoles.map(r => {
                                const assignedId = evt.assignments[r.id];
                                const musician = assignedId ? musicianMap.get(assignedId) : null;
                                return (
                                  <div
                                    key={r.id}
                                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border ${
                                      musician
                                        ? 'bg-[#18181c] border-[#2e2e34]'
                                        : 'bg-[#121215] border-[#1f1f23]'
                                    }`}
                                  >
                                    <span className="text-[#888894] font-mono text-[11px]">
                                      {r.name}:
                                    </span>
                                    {musician ? (
                                      <span className="text-white font-medium">{musician.name}</span>
                                    ) : (
                                      <span className="text-[#6b6b75] italic text-[11px]">— Vacante —</span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Sonido Multimedia */}
                        <div className="space-y-2">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#a0a0ab] flex items-center gap-1.5 font-semibold">
                            <Sliders size={13} className="text-cyan-400" />
                            <span>Sonido Multimedia ({techRoles.length})</span>
                          </span>
                          <div className="bg-[#0a0a0b] border border-[#1f1f23] rounded-xl p-3 space-y-2">
                            {techRoles.length === 0 ? (
                              <span className="text-xs text-[#6b6b75] italic">Sin técnica configurada</span>
                            ) : (
                              techRoles.map(r => {
                                const assignedId = evt.assignments[r.id];
                                const musician = assignedId ? musicianMap.get(assignedId) : null;
                                return (
                                  <div
                                    key={r.id}
                                    className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border ${
                                      musician
                                        ? 'bg-cyan-950/20 border-cyan-800/40'
                                        : 'bg-[#121215] border-[#1f1f23]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/70 px-1 py-0.5 rounded border border-cyan-700/50">
                                        Audio
                                      </span>
                                      <span className="text-[#888894] font-mono text-[11px]">
                                        {r.name}:
                                      </span>
                                    </div>
                                    {musician ? (
                                      <span className="text-cyan-300 font-medium">{musician.name}</span>
                                    ) : (
                                      <span className="text-[#6b6b75] italic text-[11px]">— Vacante —</span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Otros roles adicionales */}
                      {otherRoles.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#a0a0ab]">
                            Otros Roles ({otherRoles.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0a0a0b] p-3 rounded-xl border border-[#1f1f23]">
                            {otherRoles.map(r => {
                              const assignedId = evt.assignments[r.id];
                              const musician = assignedId ? musicianMap.get(assignedId) : null;
                              return (
                                <div
                                  key={r.id}
                                  className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded bg-[#141418] border border-[#1f1f23]"
                                >
                                  <span className="text-[#888894] font-mono text-[11px]">{r.name}:</span>
                                  {musician ? (
                                    <span className="text-white font-medium">{musician.name}</span>
                                  ) : (
                                    <span className="text-[#6b6b75] italic text-[11px]">— Vacante —</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Repertorio / Alabanzas del Turno (Clickeables para ver Letra y Notas) */}
                      <div className="pt-3 border-t border-[#1f1f23] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-semibold">
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
                                onClick={() => onSelectSong && onSelectSong(song, evt.songs)}
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

      {/* VISTA 2: CUADRÍCULA DE CALENDARIO VISUAL (SINCRONIZADA) */}
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
                  className={`min-h-[110px] sm:min-h-[145px] p-2 flex flex-col justify-between transition-all cursor-pointer group ${
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
                      <span className="text-[9px] font-mono text-[#c5a059] opacity-80">
                        {daySlots.length === 1 ? '1 Turno' : `${daySlots.length} Turnos`}
                      </span>
                    )}
                  </div>

                  {/* Turnos / Actividades del día */}
                  <div className="mt-1 space-y-1.5 flex-1 flex flex-col justify-start">
                    {daySlots.map(slot => {
                      const key = `${dateIso}__${slot.id}`;
                      const assignment = state.assignments[key] || {};
                      const assignedCount = Object.values(assignment).filter(Boolean).length;
                      const songs = state.shiftSongs?.[key] || [];

                      // Director
                      const directorRole = state.roles.find(r => getRoleCategory(r.name) === 'director');
                      const directorId = directorRole ? assignment[directorRole.id] : null;
                      const directorMusician = directorId ? musicianMap.get(directorId) : null;

                      // Nombres de algunos convocados para previsualización
                      const sampleNames = Array.from(new Set(Object.values(assignment).filter(Boolean)))
                        .map(mid => musicianMap.get(mid)?.name)
                        .filter(Boolean)
                        .slice(0, 3);

                      return (
                        <div
                          key={slot.id}
                          className="bg-[#0a0a0b] border border-[#232328] group-hover:border-[#c5a059]/40 rounded-lg p-1.5 text-[10px] space-y-1 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[#c5a059] font-semibold">
                              {slot.time} hs
                            </span>
                            <span className="text-[#6b6b75] truncate max-w-[65px] text-right font-medium">
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

                          {/* Integrantes asignados */}
                          {sampleNames.length > 0 && !directorMusician && (
                            <div className="text-[#a0a0ab] truncate text-[9px]">
                              {sampleNames.join(', ')}
                            </div>
                          )}

                          {/* Resumen de equipo & canciones */}
                          <div className="flex items-center justify-between text-[#888894] pt-0.5 border-t border-[#1a1a1d]">
                            <span className="font-mono text-[9px]">{assignedCount} asignados</span>
                            {songs.length > 0 && (
                              <span className="text-[#c5a059] flex items-center gap-0.5 font-mono text-[9px]">
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

      {/* VISTA 3: TABLA DE FECHAS Y SERVICIOS DEL MES (DINÁMICA & SINCRONIZADA) */}
      {viewMode === 'table' && (
        <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 bg-[#1a1a1d] border-b border-[#1f1f23] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TableIcon size={16} className="text-[#c5a059]" />
              <span className="font-serif text-lg text-white font-medium">
                Resumen de Fechas & Convocatorias — {capitalizedMonthName}
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
                  <th className="py-3.5 px-4 font-semibold">Servicios Programados</th>
                  <th className="py-3.5 px-4 font-semibold">Dirección de Alabanza</th>
                  <th className="py-3.5 px-4 font-semibold">Músicos Convocados</th>
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
                    const weekLabel = `${weekMonday.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                    })} – ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

                    // Obtener todos los slots para esta semana con sus asignaciones reales
                    const weekShifts = sortedSlots.map(slot => {
                      const shiftDate = dateForDay(weekMonday, slot.day);
                      const key = `${isoLocal(shiftDate)}__${slot.id}`;
                      const assign = state.assignments[key] || {};
                      const count = Object.values(assign).filter(Boolean).length;
                      const songs = state.shiftSongs?.[key] || [];

                      const directorRole = state.roles.find(r => getRoleCategory(r.name) === 'director');
                      const dirMusicianId = directorRole ? assign[directorRole.id] : null;
                      const dirMusician = dirMusicianId ? musicianMap.get(dirMusicianId) : null;

                      return {
                        slot,
                        shiftDate,
                        key,
                        assign,
                        count,
                        songs,
                        dirMusician,
                      };
                    });

                    // Directores de la semana
                    const directorsList = Array.from(
                      new Set(
                        weekShifts
                          .map(ws => ws.dirMusician?.name)
                          .filter((name): name is string => Boolean(name))
                      )
                    );

                    // Músicos únicos convocados en toda la semana
                    const allAssignedMusicianIdsInWeek = Array.from(
                      new Set(
                        weekShifts.flatMap(ws => Object.values(ws.assign).filter(Boolean))
                      )
                    );
                    const assignedMusicians = allAssignedMusicianIdsInWeek
                      .map(mid => musicianMap.get(mid))
                      .filter((m): m is Musician => Boolean(m));

                    // Total de canciones en la semana
                    const totalSongsCount = weekShifts.reduce(
                      (acc, ws) => acc + ws.songs.length,
                      0
                    );

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

                        {/* Servicios Programados */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-1.5">
                            {weekShifts.map((ws, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-[10px] uppercase font-bold text-[#c5a059]">
                                  {DAYS_OF_WEEK[ws.slot.day].substring(0, 3)}:
                                </span>
                                <span className="text-white font-medium">{ws.slot.time} hs</span>
                                <span className="text-[11px] text-[#6b6b75]">
                                  ({formatCardDate(ws.shiftDate)})
                                </span>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border inline-block ${
                                    ws.count > 0
                                      ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                                      : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23]'
                                  }`}
                                >
                                  {ws.count} convocados
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Director(a) */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {directorsList.length > 0 ? (
                            <div className="space-y-1">
                              {directorsList.map((dirName, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-1.5 text-xs text-white">
                                  <UserCheck size={13} className="text-[#c5a059]" />
                                  <span className="font-medium">{dirName}</span>
                                </div>
                              ))}
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
                                <span className="text-[10px] font-mono text-[#c5a059] bg-[#c5a059]/10 px-1 py-0.5 rounded">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1d] hover:bg-[#c5a059] text-[#c5a059] hover:text-black font-mono text-xs uppercase tracking-wider rounded-lg border border-[#c5a059]/40 hover:border-[#c5a059] transition-all cursor-pointer shadow-sm min-h-[36px]"
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
