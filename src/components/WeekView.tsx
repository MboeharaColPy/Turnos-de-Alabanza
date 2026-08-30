import React, { useState, useMemo } from 'react';
import { AppState, DAYS_OF_WEEK, SongItem } from '../types';
import {
  dateForDay,
  formatCardDate,
  formatWeekRange,
  generateWhatsAppSummary,
  getMonday,
  isoLocal,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  UserX,
  Sparkles,
  RotateCcw,
  Lock,
  CheckCircle2,
  Music,
} from 'lucide-react';
import { ShiftSongsManager } from './ShiftSongsManager';
import { generateRotativeSchedule, getRoleCategory } from '../services/rotativeScheduler';

interface WeekViewProps {
  state: AppState;
  isAdmin: boolean;
  currentWeekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  onUpdateAssignment: (slotInstanceKey: string, roleId: string, musicianId: string) => void;
  onUpdateSongs: (shiftKey: string, songs: SongItem[]) => void;
  onAddToCatalog?: (song: SongItem) => void;
  onSelectSong?: (song: SongItem) => void;
  onOpenCatalog?: () => void;
  onClearWeek: (keysToClear: string[]) => void;
  onRestoreWeek?: (previousAssignments: Record<string, Record<string, string>>) => void;
  onApplySchedule: (newAssignments: Record<string, Record<string, string>>) => void;
  showToast: (msg: string) => void;
  onRequestAdmin?: () => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  state,
  isAdmin,
  currentWeekStart,
  onWeekChange,
  onUpdateAssignment,
  onUpdateSongs,
  onAddToCatalog,
  onSelectSong,
  onOpenCatalog,
  onClearWeek,
  onRestoreWeek,
  onApplySchedule,
  showToast,
  onRequestAdmin,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<Record<string, Record<string, string>> | null>(
    null
  );

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    onWeekChange(next);
  };

  const prevWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() - 7);
    onWeekChange(next);
  };

  const setThisWeek = () => {
    onWeekChange(getMonday(new Date()));
  };

  const handleCopySummary = () => {
    const text = generateWhatsAppSummary(state, currentWeekStart);
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('¡Resumen de turnos copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Turnos ordenados por día y hora
  const sortedSlots = useMemo(() => {
    return [...state.slots].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  }, [state.slots]);

  const currentWeekKeys = useMemo(() => {
    return sortedSlots.map(slot => {
      const date = dateForDay(currentWeekStart, slot.day);
      return `${isoLocal(date)}__${slot.id}`;
    });
  }, [sortedSlots, currentWeekStart]);

  // Handle Clear with Undo
  const handleExecuteClear = () => {
    const snapshot: Record<string, Record<string, string>> = {};
    currentWeekKeys.forEach(k => {
      if (state.assignments[k]) {
        snapshot[k] = { ...state.assignments[k] };
      }
    });
    setUndoSnapshot(snapshot);

    onClearWeek(currentWeekKeys);
    setShowClearConfirm(false);
    showToast('Asignaciones de la semana vaciadas. Puedes deshacer si fue un error.');
  };

  const handleUndoClear = () => {
    if (undoSnapshot && onRestoreWeek) {
      onRestoreWeek(undoSnapshot);
      setUndoSnapshot(null);
      showToast('¡Asignaciones restauradas con éxito!');
    }
  };

  // Generar sugerencias automáticas para esta semana
  const handleAutoFillWeek = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }

    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    setIsGenerating(true);
    setTimeout(() => {
      const result = generateRotativeSchedule(state, currentWeekStart, weekEnd, {
        targetSlotKeys: currentWeekKeys,
        preserveExisting: false,
      });

      onApplySchedule(result.assignments);
      setIsGenerating(false);
      showToast('¡Sugerencias de turnos generadas para esta semana!');
    }, 350);
  };

  return (
    <div className="space-y-6" id="week-view">
      {/* Barra de navegación de semana y acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#141418] p-5 rounded-2xl border border-[#1f1f23] shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={prevWeek}
            className="w-9 h-9 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-[#e0e0e0] border border-[#2a2a2e] hover:border-[#c5a059]/40 flex items-center justify-center transition-all cursor-pointer"
            title="Semana anterior"
            id="prev-week-btn"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-4 py-1.5 bg-[#0a0a0b] border border-[#1f1f23] rounded-lg text-center min-w-[210px]">
            <span className="font-mono text-[9px] text-[#6b6b75] block uppercase tracking-[0.25em]">
              Ciclo Semanal
            </span>
            <span className="font-mono text-xs font-semibold text-[#c5a059] tracking-wider">
              {formatWeekRange(currentWeekStart)}
            </span>
          </div>
          <button
            onClick={nextWeek}
            className="w-9 h-9 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-[#e0e0e0] border border-[#2a2a2e] hover:border-[#c5a059]/40 flex items-center justify-center transition-all cursor-pointer"
            title="Semana siguiente"
            id="next-week-btn"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={setThisWeek}
            className="px-3 py-2 bg-[#1a1a1d] hover:bg-[#232328] text-[11px] font-mono uppercase tracking-wider rounded-lg border border-[#2a2a2e] text-[#6b6b75] hover:text-white transition-colors cursor-pointer"
            id="current-week-btn"
          >
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1d] hover:bg-[#25252a] text-[#c5a059] hover:text-[#d4b068] border border-[#c5a059]/40 hover:border-[#c5a059] font-medium rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
              title="Abrir el repertorio de 220 alabanzas con letras y notas"
              id="open-catalog-btn"
            >
              <Music size={14} className="text-[#c5a059]" />
              <span>Repertorio de Canciones</span>
            </button>
          )}

          {undoSnapshot && (
            <button
              onClick={handleUndoClear}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Deshacer Vaciar</span>
            </button>
          )}

          {isAdmin ? (
            <button
              onClick={handleAutoFillWeek}
              disabled={isGenerating || sortedSlots.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1d] hover:bg-[#232328] text-[#c5a059] border border-[#c5a059]/40 hover:border-[#c5a059] font-medium rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              title="Genera asignaciones rotativas respetando descansos, parejas y balance vocal"
            >
              <Sparkles size={13} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Sugerir...' : 'Sugerir Turnos (Semana)'}</span>
            </button>
          ) : (
            <button
              onClick={onRequestAdmin}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1d] hover:bg-[#232328] text-[#a0a0ab] hover:text-white rounded-lg text-xs font-mono uppercase tracking-wider border border-[#2a2a2e] cursor-pointer transition-all"
            >
              <Lock size={12} className="text-[#c5a059]" />
              <span>Desbloquear Edición</span>
            </button>
          )}

          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold rounded-lg text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#c5a059]/10 cursor-pointer"
            id="copy-summary-btn"
          >
            {copied ? <Check size={14} className="text-black stroke-[3]" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado' : 'Copiar WhatsApp'}</span>
          </button>

          {isAdmin &&
            currentWeekKeys.some(
              k => state.assignments[k] && Object.keys(state.assignments[k]).length > 0
            ) && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1d] hover:bg-red-950/30 text-[#6b6b75] hover:text-red-400 border border-[#2a2a2e] hover:border-red-900/40 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
                title="Vaciar asignaciones de esta semana"
              >
                <UserX size={13} />
                <span>Vaciar</span>
              </button>
            )}
        </div>
      </div>

      {/* Lista de turnos de la semana */}
      {sortedSlots.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#141418] border border-dashed border-[#2a2a2e] rounded-2xl">
          <Calendar className="w-10 h-10 text-[#c5a059]/40 mx-auto mb-3" />
          <h3 className="font-serif text-2xl font-light text-white mb-1">
            Sin turnos recurrentes programados
          </h3>
          <p className="text-xs text-[#6b6b75] max-w-md mx-auto mb-4">
            Ingresa a la pestaña{' '}
            <strong className="text-[#c5a059]">"Roles y turnos"</strong> para configurar horarios y
            vacantes requeridas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedSlots.map(slot => {
            const date = dateForDay(currentWeekStart, slot.day);
            const dateStr = formatCardDate(date);
            const key = `${isoLocal(date)}__${slot.id}`;
            const assignment = state.assignments[key] || {};
            const slotRoleIds = (slot.roleIds || []).filter(rid =>
              state.roles.some(r => r.id === rid && r.name && r.name.toLowerCase().trim() !== 'rol')
            );
            const songs = state.shiftSongs?.[key] || [];

            // Classify roles in this slot
            const roleCategoriesMap = new Map<string, string>();
            slotRoleIds.forEach(rid => {
              const r = state.roles.find(x => x.id === rid);
              if (r) roleCategoriesMap.set(rid, getRoleCategory(r.name));
            });

            // Count musician roles in this shift to detect valid dual-roles vs genuine conflicts
            const musicianRoleAssignments: Record<string, string[]> = {};
            (Object.entries(assignment) as [string, string][]).forEach(([rId, mId]) => {
              if (mId && typeof mId === 'string') {
                if (!musicianRoleAssignments[mId]) musicianRoleAssignments[mId] = [];
                musicianRoleAssignments[mId].push(rId);
              }
            });

            // Identify genuine conflicts:
            // 1. Tech role conflict (Sonido / Audio visual must NOT have any other role in the shift)
            // 2. Same musician in two instrument roles
            // 3. Same musician in two voice roles
            const techExclusiveViolations = new Set<string>();
            const duplicateRoleCategoryViolations = new Set<string>();
            const dualRoleMusicians = new Set<string>(); // e.g. Instrument + Voice or Director + Voice (Valid!)

            Object.entries(musicianRoleAssignments).forEach(([mId, roleIdList]) => {
              if (roleIdList.length > 1) {
                const cats = roleIdList.map(rid => roleCategoriesMap.get(rid) || 'other');
                const hasTech = cats.includes('tech');

                if (hasTech) {
                  techExclusiveViolations.add(mId);
                } else {
                  // Check if duplicate in instrument or duplicate in voice
                  const instCount = cats.filter(c => c === 'instrument').length;
                  const voiceCount = cats.filter(c => c === 'voz_h' || c === 'voz_m').length;

                  if (instCount > 1 || voiceCount > 1) {
                    duplicateRoleCategoryViolations.add(mId);
                  } else {
                    // Valid permitted dual-role (e.g. 1 instrument + 1 voice, or director + voice)
                    dualRoleMusicians.add(mId);
                  }
                }
              }
            });

            // Director
            const directorRole = state.roles.find(r => r.name.toLowerCase().includes('director'));
            const directorMusician =
              directorRole && assignment[directorRole.id]
                ? state.musicians.find(m => m.id === assignment[directorRole.id])
                : null;

            // Couple warnings
            const assignedMusicianIds = new Set(Object.values(assignment).filter(Boolean));
            const coupleWarnings: string[] = [];

            state.couples.forEach(c => {
              const a = state.musicians.find(m => m.id === c.aId);
              const b = state.musicians.find(m => m.id === c.bId);
              if (!a || !b) return;

              const aEligible = (a.roleIds || []).some(rid => slotRoleIds.includes(rid));
              const bEligible = (b.roleIds || []).some(rid => slotRoleIds.includes(rid));
              if (!aEligible || !bEligible) return;

              const aOn = assignedMusicianIds.has(a.id);
              const bOn = assignedMusicianIds.has(b.id);
              if (aOn !== bOn) {
                const onName = aOn ? a.name : b.name;
                const offName = aOn ? b.name : a.name;
                coupleWarnings.push(
                  `⚠ ${onName} está convocado/a pero su pareja ${offName} descansa en este turno.`
                );
              }
            });

            // Resumen de asignados
            const assignedCount = Object.values(assignment).filter(Boolean).length;
            
            // Gender of assigned director (used internally for team balance)
            const directorGender: 'H' | 'M' | null = directorMusician?.gender || null;
            
            // Separate roles by category for a compact, well-structured UI
            const directorRoleObj = state.roles.find(r => r.name.toLowerCase().includes('director'));
            const directorRoleId = directorRoleObj?.id;

            // Separate and strictly limit to 3 Male Voice roles and 3 Female Voice roles (6 total voice positions)
            const allVoiceRolesH = state.roles
              .filter(r => r.name.toLowerCase().trim().startsWith('voz h'))
              .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
              .slice(0, 3);

            const allVoiceRolesM = state.roles
              .filter(r => r.name.toLowerCase().trim().startsWith('voz m'))
              .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
              .slice(0, 3);

            const instrumentRoles = slotRoleIds.filter(rid => {
              const r = state.roles.find(x => x.id === rid);
              if (!r) return false;
              return getRoleCategory(r.name) === 'instrument';
            });

            const techRoles = slotRoleIds.filter(rid => {
              const r = state.roles.find(x => x.id === rid);
              if (!r) return false;
              return getRoleCategory(r.name) === 'tech';
            });

            const otherRoles = slotRoleIds.filter(
              rid => {
                const r = state.roles.find(x => x.id === rid);
                if (!r || r.name.toLowerCase().trim() === 'rol') return false;
                return (
                  rid !== directorRoleId &&
                  !allVoiceRolesH.some(v => v.id === rid) &&
                  !allVoiceRolesM.some(v => v.id === rid) &&
                  !instrumentRoles.includes(rid) &&
                  !techRoles.includes(rid)
                );
              }
            );

            // Compute total required considering optional 3rd voice based on director gender
            let optionalRoleCount = 0;
            if (directorGender === 'H') {
              // 3rd male voice is optional
              const thirdVozH = allVoiceRolesH[2]?.id;
              if (thirdVozH && !assignment[thirdVozH]) {
                optionalRoleCount++;
              }
            } else if (directorGender === 'M') {
              // 3rd female voice is optional
              const thirdVozM = allVoiceRolesM[2]?.id;
              if (thirdVozM && !assignment[thirdVozM]) {
                optionalRoleCount++;
              }
            }

            const totalConfiguredRoles =
              (directorRoleId ? 1 : 0) +
              allVoiceRolesH.length +
              allVoiceRolesM.length +
              instrumentRoles.length +
              techRoles.length +
              otherRoles.length;
            const adjustedTotalRequired = Math.max(1, totalConfiguredRoles - optionalRoleCount);
            const isFullyStaffed = assignedCount >= adjustedTotalRequired;

            // Helper to render a compact role card
            const renderRoleCard = (roleId: string, customBadge?: string, isOptional?: boolean) => {
              const role = state.roles.find(r => r.id === roleId);
              if (!role) return null;

              const category = getRoleCategory(role.name);
              const isTechRole = category === 'tech';
              const isVoiceH = category === 'voz_h';
              const isVoiceM = category === 'voz_m';
              const isDirRole = category === 'director';

              // Map of musician ID -> other role name assigned in this same shift
              const assignedInOtherRoleMap = new Map<string, string>();
              Object.entries(assignment).forEach(([rId, mId]) => {
                if (rId !== roleId && mId && typeof mId === 'string') {
                  const assignedRole = state.roles.find(r => r.id === rId);
                  assignedInOtherRoleMap.set(mId, assignedRole ? assignedRole.name : 'Otro rol');
                }
              });

              // Helper to test if a musician is qualified for this specific role
              const isMusicianQualified = (m: (typeof state.musicians)[0]) => {
                if (isVoiceH) {
                  if (m.gender !== 'H') return false;
                  return (
                    (m.roleIds || []).includes(roleId) ||
                    m.primaryRoleId === roleId ||
                    (m.roleIds || []).some(rid => {
                      const r = state.roles.find(x => x.id === rid);
                      return r && (getRoleCategory(r.name) === 'voz_h' || getRoleCategory(r.name) === 'director');
                    }) ||
                    (m.primaryRoleId && (() => {
                      const pr = state.roles.find(x => x.id === m.primaryRoleId);
                      return pr && (getRoleCategory(pr.name) === 'voz_h' || getRoleCategory(pr.name) === 'director');
                    })())
                  );
                }

                if (isVoiceM) {
                  if (m.gender !== 'M') return false;
                  return (
                    (m.roleIds || []).includes(roleId) ||
                    m.primaryRoleId === roleId ||
                    (m.roleIds || []).some(rid => {
                      const r = state.roles.find(x => x.id === rid);
                      return r && (getRoleCategory(r.name) === 'voz_m' || getRoleCategory(r.name) === 'director');
                    }) ||
                    (m.primaryRoleId && (() => {
                      const pr = state.roles.find(x => x.id === m.primaryRoleId);
                      return pr && (getRoleCategory(pr.name) === 'voz_m' || getRoleCategory(pr.name) === 'director');
                    })())
                  );
                }

                if (isDirRole) {
                  return (
                    (m.roleIds || []).includes(roleId) ||
                    m.primaryRoleId === roleId ||
                    (m.roleIds || []).some(rid => {
                      const r = state.roles.find(x => x.id === rid);
                      return r && getRoleCategory(r.name) === 'director';
                    })
                  );
                }

                return (
                  (m.roleIds || []).includes(roleId) ||
                  m.primaryRoleId === roleId ||
                  (m.roleIds || []).some(rid => {
                    const r = state.roles.find(x => x.id === rid);
                    return r && getRoleCategory(r.name) === category;
                  })
                );
              };

              // List of Qualified musicians for this specific role
              const qualifiedMusicians = state.musicians
                .filter(isMusicianQualified)
                .sort((a, b) => {
                  const aAssigned = assignedInOtherRoleMap.has(a.id);
                  const bAssigned = assignedInOtherRoleMap.has(b.id);
                  if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;
                  return a.name.localeCompare(b.name, 'es');
                });

              const currentMusicianId = assignment[roleId] || '';

              const hasTechViolation =
                currentMusicianId && techExclusiveViolations.has(currentMusicianId);
              const hasCategoryViolation =
                currentMusicianId && duplicateRoleCategoryViolations.has(currentMusicianId);
              const isDualRole =
                currentMusicianId && dualRoleMusicians.has(currentMusicianId);

              return (
                <div
                  key={roleId}
                  className={`p-2 rounded-xl border transition-all ${
                    hasTechViolation || hasCategoryViolation
                      ? 'bg-red-950/20 border-red-800/60'
                      : isVoiceH
                      ? currentMusicianId
                        ? 'bg-blue-950/20 border-blue-800/40 shadow-sm'
                        : 'bg-[#101013] border-blue-900/30 hover:border-blue-700/50'
                      : isVoiceM
                      ? currentMusicianId
                        ? 'bg-rose-950/20 border-rose-800/40 shadow-sm'
                        : 'bg-[#101013] border-rose-900/30 hover:border-rose-700/50'
                      : currentMusicianId
                      ? 'bg-[#18181c] border-[#2e2e34] shadow-sm'
                      : isOptional
                      ? 'bg-[#101013]/60 border-[#1a1a1e] opacity-75'
                      : 'bg-[#101013] border-[#1e1e24]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-[#f0f0f3] truncate">
                        {role.name}
                      </span>
                      {isDirRole && (
                        <span className="text-[9px] font-mono text-amber-300 bg-amber-950/50 px-1 py-0.2 rounded border border-amber-800/40">
                          Dir
                        </span>
                      )}
                      {isVoiceH && (
                        <span className="text-[9px] font-mono text-blue-300 bg-blue-950/60 px-1 py-0.2 rounded border border-blue-800/40">
                          H
                        </span>
                      )}
                      {isVoiceM && (
                        <span className="text-[9px] font-mono text-rose-300 bg-rose-950/60 px-1 py-0.2 rounded border border-rose-800/40">
                          M
                        </span>
                      )}
                      {isTechRole && (
                        <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/60 px-1 py-0.2 rounded border border-cyan-800/40">
                          Multimedia
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isOptional && !currentMusicianId && (
                        <span className="text-[8px] font-mono uppercase text-[#6b6b75] bg-[#0a0a0b] px-1 py-0.5 rounded border border-[#1f1f23]">
                          Opcional
                        </span>
                      )}
                      <span
                        className="text-[9px] font-mono text-[#888894] bg-[#0a0a0b] px-1.5 py-0.5 rounded border border-[#1f1f23]"
                        title="Integrantes habilitados para este rol"
                      >
                        {qualifiedMusicians.length} disp.
                      </span>
                    </div>
                  </div>

                  <select
                    disabled={!isAdmin}
                    value={currentMusicianId}
                    onChange={e => onUpdateAssignment(key, roleId, e.target.value)}
                    className={`w-full bg-[#0a0a0b] text-xs rounded-lg px-2 py-1.5 border transition-all focus:outline-none cursor-pointer disabled:cursor-default disabled:opacity-85 font-medium ${
                      hasTechViolation || hasCategoryViolation
                        ? 'border-red-500 bg-red-950/30 text-red-200 focus:border-red-400'
                        : isDualRole
                        ? 'border-[#c5a059]/70 bg-[#16161a] text-white focus:border-[#c5a059]'
                        : isVoiceH && currentMusicianId
                        ? 'border-blue-500/50 bg-[#101420] text-blue-100 focus:border-blue-400'
                        : isVoiceM && currentMusicianId
                        ? 'border-rose-500/50 bg-[#201015] text-rose-100 focus:border-rose-400'
                        : currentMusicianId
                        ? 'border-[#c5a059]/40 bg-[#1a1a1d] text-white focus:border-[#c5a059]'
                        : 'border-[#242429] text-[#6b6b75] hover:border-[#383840] focus:border-[#c5a059]'
                    }`}
                  >
                    <option value="">— Vacante —</option>
                    {/* Si el asignado actual no está en la lista de habilitados, mostrarlo para no perder el valor */}
                    {currentMusicianId && !qualifiedMusicians.some(m => m.id === currentMusicianId) && (() => {
                      const currM = state.musicians.find(m => m.id === currentMusicianId);
                      return currM ? (
                        <option key={currM.id} value={currM.id}>
                          {currM.name} (Asignado actual)
                        </option>
                      ) : null;
                    })()}
                    {qualifiedMusicians.map(m => {
                      const otherRole = assignedInOtherRoleMap.get(m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.name}
                          {otherRole ? ` (Ya en: ${otherRole})` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Badges de validación compactos */}
                  {hasTechViolation && (
                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 leading-tight">
                      <AlertTriangle size={11} className="flex-shrink-0" />
                      <span>Exclusivo: Sonido Multimedia no canta ni toca.</span>
                    </p>
                  )}
                  {hasCategoryViolation && !hasTechViolation && (
                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 leading-tight">
                      <AlertTriangle size={11} className="flex-shrink-0" />
                      <span>Ya asignado en otra posición similar.</span>
                    </p>
                  )}
                  {isDualRole && !hasTechViolation && !hasCategoryViolation && (
                    <p className="text-[10px] text-[#c5a059] mt-1 flex items-center gap-1 leading-tight font-mono">
                      <CheckCircle2 size={11} className="flex-shrink-0 text-[#c5a059]" />
                      <span>Doble rol: Instrumento + Voz</span>
                    </p>
                  )}
                </div>
              );
            };

            return (
              <div
                key={key}
                className="bg-[#141418] border border-[#1f1f23] hover:border-[#2a2a2e] rounded-2xl overflow-hidden shadow-xl transition-all"
                id={`slot-card-${slot.id}`}
              >
                {/* Cabecera del Turno Compacta */}
                <div className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 bg-[#1a1a1d]/90 border-b border-[#1f1f23]">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-white">
                      {DAYS_OF_WEEK[slot.day]}
                    </span>
                    <span className="font-mono text-xs text-[#a0a0ab] bg-[#0a0a0b] px-2 py-0.5 rounded border border-[#1f1f23]">
                      {dateStr}
                    </span>
                    <span className="font-mono text-xs text-[#c5a059] font-semibold tracking-wider">
                      {slot.time} HS
                    </span>
                    <span className="text-xs text-[#7d7d88]">
                      • {slot.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {directorMusician ? (
                      <span className="font-mono text-[10px] text-white bg-[#0a0a0b] border border-[#c5a059]/40 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="text-[#c5a059] font-bold">Dir:</span>
                        <span>{directorMusician.name}</span>
                        <span className="text-[9px] text-[#888894]">({directorGender === 'H' ? 'H' : 'M'})</span>
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-[#7d7d88] bg-[#0a0a0b] border border-[#222226] px-2 py-0.5 rounded">
                        Sin Director(a)
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isFullyStaffed
                          ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                          : 'bg-[#222228] text-[#a0a0ab] border border-[#33333d]'
                      }`}
                    >
                      {assignedCount}/{adjustedTotalRequired} Confirmados
                    </span>
                  </div>
                </div>

                {/* Banner de balance y directivas vocales */}
                <div className="px-3.5 py-1.5 bg-[#0e0e11] border-b border-[#1a1a1d] flex items-center justify-between text-[11px] text-[#888894] flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#c5a059]">✦ Balance Vocal:</span>
                    {directorGender === 'H' ? (
                      <span>
                        Director H ➔ Acompañan <strong className="text-blue-300">Voz h 1, 2</strong> +{' '}
                        <strong className="text-rose-300">Voz m 1, 2, 3</strong> (3 + 3 en total).
                      </span>
                    ) : directorGender === 'M' ? (
                      <span>
                        Directora M ➔ Acompañan <strong className="text-rose-300">Voz m 1, 2</strong> +{' '}
                        <strong className="text-blue-300">Voz h 1, 2, 3</strong> (3 + 3 en total).
                      </span>
                    ) : (
                      <span className="text-[#7d7d88]">
                        3 Voces H (Hombres) y 3 Voces M (Mujeres) = 6 puestos vocales.
                      </span>
                    )}
                  </div>
                </div>

                {/* Layout Principal: Equipo (Izquierda) y Canciones (Derecha / Prominente) */}
                <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#121215]">
                  {/* COLUMNA 1: Equipo Ministerial (Roles) */}
                  <div className="lg:col-span-7 space-y-3">
                    {/* SECCIÓN 1: Dirección */}
                    {directorRoleId && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-[#1e1e24]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-semibold">
                            <span>👑 Dirección</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {renderRoleCard(directorRoleId)}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 2: Voces Masculinas (3 Puestos Exactos) */}
                    {allVoiceRolesH.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-blue-900/30">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-semibold">
                            <span>🎤 Voces Masculinas (3 Puestos)</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#6b6b75]">
                            {directorGender === 'H' ? '2 Voces H + Dir H' : '3 Voces H'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {allVoiceRolesH.map((r, vIdx) => {
                            const isOptional = directorGender === 'H' && vIdx === 2;
                            return renderRoleCard(r.id, undefined, isOptional);
                          })}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 3: Voces Femeninas (3 Puestos Exactos) */}
                    {allVoiceRolesM.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-rose-900/30">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-semibold">
                            <span>🎤 Voces Femeninas (3 Puestos)</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#6b6b75]">
                            {directorGender === 'M' ? '2 Voces M + Dir M' : '3 Voces M'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {allVoiceRolesM.map((r, vIdx) => {
                            const isOptional = directorGender === 'M' && vIdx === 2;
                            return renderRoleCard(r.id, undefined, isOptional);
                          })}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 4: Instrumentos */}
                    {instrumentRoles.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-[#1e1e24]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#a0a0ab] flex items-center gap-1.5 font-semibold">
                            <span>🎸 Instrumentos</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#6b6b75]">
                            {instrumentRoles.filter(rid => assignment[rid]).length}/{instrumentRoles.length} Asignados
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {instrumentRoles.map(rid => renderRoleCard(rid))}
                        </div>
                      </div>
                    )}

                    {/* SECCIÓN 5: Sonido Multimedia */}
                    {techRoles.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-cyan-900/30">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/90 flex items-center gap-1.5 font-semibold">
                            <span>🎛️ Sonido Multimedia</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#6b6b75]">
                            Exclusivo (no duplica en música/voz)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {techRoles.map(rid => renderRoleCard(rid))}
                        </div>
                      </div>
                    )}

                    {/* Otros roles si los hay */}
                    {otherRoles.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-[#1e1e24]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#a0a0ab] font-semibold">
                            Otros Roles
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {otherRoles.map(rid => renderRoleCard(rid))}
                        </div>
                      </div>
                    )}

                    {/* Advertencia de parejas */}
                    {coupleWarnings.length > 0 && (
                      <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-300 space-y-1">
                        {coupleWarnings.map((w, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 2: Repertorio & Alabanzas (Lugar Prominente) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <div className="h-full bg-[#0a0a0c] border border-[#1f1f23] rounded-xl overflow-hidden flex flex-col shadow-inner">
                      <ShiftSongsManager
                        shiftKey={key}
                        slotLabel={slot.label}
                        dateStr={`${DAYS_OF_WEEK[slot.day]} ${dateStr}`}
                        songs={songs}
                        catalog={state.songCatalog || []}
                        onUpdateSongs={onUpdateSongs}
                        onAddToCatalog={onAddToCatalog}
                        onSelectSong={onSelectSong}
                        showToast={showToast}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Confirmación Vaciar Semana */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-red-900/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <UserX size={24} />
              <h3 className="font-serif text-lg text-white font-medium">
                ¿Vaciar Turnos de la Semana?
              </h3>
            </div>
            <p className="text-xs text-[#a0a0ab]">
              ¿Estás seguro de que deseas vaciar todas las asignaciones de esta semana? Podrás
              deshacer la acción inmediatamente si fue un error.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Vaciar Asignaciones
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
