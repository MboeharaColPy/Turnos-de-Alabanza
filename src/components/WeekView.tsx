import React, { useState, useMemo } from 'react';
import { AppState, DAYS_OF_WEEK, SongItem, Musician, Role } from '../types';
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
  Heart,
  HelpCircle,
  UserPlus,
  Sliders,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ShiftSongsManager } from './ShiftSongsManager';
import { generateRotativeSchedule, getRoleCategory } from '../services/rotativeScheduler';
import { ConflictExplainerModal } from './ConflictExplainerModal';

interface WeekViewProps {
  state: AppState;
  isAdmin: boolean;
  currentWeekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  onUpdateAssignment: (slotInstanceKey: string, roleId: string, musicianId: string) => void;
  onUpdateSongs: (shiftKey: string, songs: SongItem[]) => void;
  onAddToCatalog?: (song: SongItem) => void;
  onSelectSong?: (song: SongItem, contextSongs?: SongItem[]) => void;
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
  const [showExplainerModal, setShowExplainerModal] = useState(false);
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
    showToast('¡Resumen de turnos copiado para WhatsApp!');
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
      showToast('¡Turnos rotativos generados para esta semana!');
    }, 350);
  };

  return (
    <div className="space-y-6 pb-12" id="week-view">
      {/* Guía Visual Modal */}
      <ConflictExplainerModal
        isOpen={showExplainerModal}
        onClose={() => setShowExplainerModal(false)}
      />

      {/* Barra de navegación de semana y acciones principales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#141418] p-4 sm:p-5 rounded-2xl border border-[#1f1f23] shadow-xl">
        {/* Selector de semana */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={prevWeek}
            className="w-10 h-10 rounded-xl bg-[#1a1a1d] hover:bg-[#25252b] text-[#e0e0e0] border border-[#2a2a2e] hover:border-[#c5a059]/50 flex items-center justify-center transition-all cursor-pointer min-h-[44px]"
            title="Semana anterior"
            id="prev-week-btn"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="px-4 py-2 bg-[#0a0a0b] border border-[#1f1f23] rounded-xl text-center min-w-[200px]">
            <span className="font-mono text-[9px] text-[#888894] block uppercase tracking-[0.25em]">
              Ciclo Semanal
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#c5a059] tracking-wider">
              {formatWeekRange(currentWeekStart)}
            </span>
          </div>

          <button
            onClick={nextWeek}
            className="w-10 h-10 rounded-xl bg-[#1a1a1d] hover:bg-[#25252b] text-[#e0e0e0] border border-[#2a2a2e] hover:border-[#c5a059]/50 flex items-center justify-center transition-all cursor-pointer min-h-[44px]"
            title="Semana siguiente"
            id="next-week-btn"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={setThisWeek}
            className="px-3.5 py-2 bg-[#1a1a1d] hover:bg-[#25252b] text-xs font-mono uppercase tracking-wider rounded-xl border border-[#2a2a2e] text-[#a0a0ab] hover:text-white transition-colors cursor-pointer min-h-[44px]"
            id="current-week-btn"
          >
            Esta Semana
          </button>

          {/* Botón Guía Rápida de Alertas */}
          <button
            onClick={() => setShowExplainerModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition-colors cursor-pointer min-h-[44px]"
            title="Ver qué significan los conflictos y reglas de descanso"
          >
            <HelpCircle size={14} />
            <span className="hidden sm:inline">¿Dudas de Alertas?</span>
          </button>
        </div>

        {/* Barra de Botones de Acción Destacados (Fácil Visualización) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenCatalog && (
            <button
              onClick={onOpenCatalog}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#18181c] hover:bg-[#222228] text-white hover:text-amber-300 border border-[#2e2e36] hover:border-amber-500/50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md min-h-[44px]"
              title="Abrir el repertorio de 220 alabanzas con letras y notas"
              id="open-catalog-btn"
            >
              <Music size={15} className="text-amber-400" />
              <span className="hidden sm:inline">Repertorio</span>
              <span className="sm:hidden">Canciones</span>
            </button>
          )}

          {undoSnapshot && (
            <button
              onClick={handleUndoClear}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[44px]"
            >
              <RotateCcw size={14} />
              <span>Deshacer</span>
            </button>
          )}

          {/* Botón de Generador Automático (IA) */}
          {isAdmin ? (
            <button
              onClick={handleAutoFillWeek}
              disabled={isGenerating || sortedSlots.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-md min-h-[44px] active:scale-95"
              title="Genera asignaciones rotativas respetando descansos, parejas y balance vocal"
              id="btn-auto-suggest-week"
            >
              <Sparkles size={15} className={`text-slate-950 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generando...' : 'Sugerir Turnos'}</span>
            </button>
          ) : (
            <button
              onClick={onRequestAdmin}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#18181c] hover:bg-[#222228] text-[#a0a0ab] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider border border-[#2e2e36] cursor-pointer transition-all min-h-[44px]"
            >
              <Lock size={13} className="text-amber-400" />
              <span>Desbloquear Edición</span>
            </button>
          )}

          {/* Botón Copiar WhatsApp (Verde Esmeralda Destacado) */}
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/30 cursor-pointer min-h-[44px] active:scale-95"
            id="copy-summary-btn"
            title="Copiar lista formateada para pegar directamente en el grupo de WhatsApp"
          >
            {copied ? <Check size={16} className="text-white stroke-[3]" /> : <Copy size={15} />}
            <span>{copied ? '¡Copiado!' : 'Copiar WhatsApp'}</span>
          </button>

          {isAdmin &&
            currentWeekKeys.some(
              k => state.assignments[k] && Object.keys(state.assignments[k]).length > 0
            ) && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-[#1a1a1d] hover:bg-red-950/40 text-[#888894] hover:text-red-300 border border-[#2a2a2e] hover:border-red-900/50 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[44px]"
                title="Vaciar asignaciones de esta semana"
              >
                <UserX size={14} />
                <span>Vaciar</span>
              </button>
            )}
        </div>
      </div>

      {/* Lista de turnos de la semana */}
      {sortedSlots.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#141418] border border-dashed border-[#2a2a2e] rounded-2xl">
          <Calendar className="w-12 h-12 text-[#c5a059]/40 mx-auto mb-3" />
          <h3 className="font-serif text-2xl font-light text-white mb-1">
            Sin turnos recurrentes programados
          </h3>
          <p className="text-xs text-[#888894] max-w-md mx-auto mb-4">
            Ingresa a la pestaña{' '}
            <strong className="text-[#c5a059]">"Ajustes / Roles y turnos"</strong> para configurar horarios y
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
            const techExclusiveViolations = new Set<string>();
            const duplicateRoleCategoryViolations = new Set<string>();
            const dualRoleMusicians = new Set<string>();

            Object.entries(musicianRoleAssignments).forEach(([mId, roleIdList]) => {
              if (roleIdList.length > 1) {
                const cats = roleIdList.map(rid => roleCategoriesMap.get(rid) || 'other');
                const hasTech = cats.includes('tech');

                if (hasTech) {
                  techExclusiveViolations.add(mId);
                } else {
                  const instCount = cats.filter(c => c === 'instrument').length;
                  const voiceCount = cats.filter(c => c === 'voz_h' || c === 'voz_m').length;

                  if (instCount > 1 || voiceCount > 1) {
                    duplicateRoleCategoryViolations.add(mId);
                  } else {
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

            // Couple warnings structure with quick-action resolution
            const assignedMusicianIds = new Set(Object.values(assignment).filter(Boolean));
            const coupleIssues: {
              couple: (typeof state.couples)[0];
              onMusician: Musician;
              offMusician: Musician;
              assignedRoleId: string;
            }[] = [];

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
                const onMusician = aOn ? a : b;
                const offMusician = aOn ? b : a;
                // Find role ID of the assigned one
                const assignedRoleId = Object.entries(assignment).find(([_, mId]) => mId === onMusician.id)?.[0] || '';
                coupleIssues.push({
                  couple: c,
                  onMusician,
                  offMusician,
                  assignedRoleId,
                });
              }
            });

            // Quick Resolver for Couples: Assign offMusician to an available eligible vacant role
            const handleReuniteCouple = (offMusician: Musician) => {
              if (!isAdmin) {
                if (onRequestAdmin) onRequestAdmin();
                return;
              }
              // Find a vacant role in slotRoleIds that offMusician can play
              const vacantRole = slotRoleIds.find(rid => {
                if (assignment[rid]) return false; // Already occupied
                const roleObj = state.roles.find(r => r.id === rid);
                if (!roleObj) return false;
                const cat = getRoleCategory(roleObj.name);

                if (cat === 'voz_h') return offMusician.gender === 'H';
                if (cat === 'voz_m') return offMusician.gender === 'M';
                if (cat === 'director') return (offMusician.roleIds || []).includes(rid) || offMusician.primaryRoleId === rid;

                return (offMusician.roleIds || []).includes(rid) || offMusician.primaryRoleId === rid ||
                  (offMusician.roleIds || []).some(orid => {
                    const r = state.roles.find(x => x.id === orid);
                    return r && getRoleCategory(r.name) === cat;
                  });
              });

              if (vacantRole) {
                onUpdateAssignment(key, vacantRole, offMusician.id);
                showToast(`¡${offMusician.name} convocado/a para servir junto a su pareja!`);
              } else {
                showToast(`No hay puestos vacíos compatibles para ${offMusician.name}. Puedes liberar otro puesto primero.`);
              }
            };

            // Quick Resolver for Couples: Unassign onMusician so both rest
            const handleRestBothCouple = (assignedRoleId: string, onMusicianName: string) => {
              if (!isAdmin) {
                if (onRequestAdmin) onRequestAdmin();
                return;
              }
              if (assignedRoleId) {
                onUpdateAssignment(key, assignedRoleId, '');
                showToast(`${onMusicianName} desconvocado/a para descansar juntos.`);
              }
            };

            // Resumen de asignados
            const assignedCount = Object.values(assignment).filter(Boolean).length;
            const directorGender: 'H' | 'M' | null = directorMusician?.gender || null;
            const directorRoleId = directorRole?.id;

            // Voice roles
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

            // Compute total required
            let optionalRoleCount = 0;
            if (directorGender === 'H') {
              const thirdVozH = allVoiceRolesH[2]?.id;
              if (thirdVozH && !assignment[thirdVozH]) optionalRoleCount++;
            } else if (directorGender === 'M') {
              const thirdVozM = allVoiceRolesM[2]?.id;
              if (thirdVozM && !assignment[thirdVozM]) optionalRoleCount++;
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

            // Helper to render role card
            const renderRoleCard = (roleId: string, customBadge?: string, isOptional?: boolean) => {
              const role = state.roles.find(r => r.id === roleId);
              if (!role) return null;

              const category = getRoleCategory(role.name);
              const isTechRole = category === 'tech';
              const isVoiceH = category === 'voz_h';
              const isVoiceM = category === 'voz_m';
              const isDirRole = category === 'director';

              const assignedInOtherRoleMap = new Map<string, string>();
              Object.entries(assignment).forEach(([rId, mId]) => {
                if (rId !== roleId && mId && typeof mId === 'string') {
                  const assignedRole = state.roles.find(r => r.id === rId);
                  assignedInOtherRoleMap.set(mId, assignedRole ? assignedRole.name : 'Otro rol');
                }
              });

              const isMusicianQualified = (m: Musician) => {
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

              const qualifiedMusicians = state.musicians
                .filter(isMusicianQualified)
                .sort((a, b) => {
                  const aAssigned = assignedInOtherRoleMap.has(a.id);
                  const bAssigned = assignedInOtherRoleMap.has(b.id);
                  if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;
                  return a.name.localeCompare(b.name, 'es');
                });

              const currentMusicianId = assignment[roleId] || '';
              const hasTechViolation = currentMusicianId && techExclusiveViolations.has(currentMusicianId);
              const hasCategoryViolation = currentMusicianId && duplicateRoleCategoryViolations.has(currentMusicianId);
              const isDualRole = currentMusicianId && dualRoleMusicians.has(currentMusicianId);

              return (
                <div
                  key={roleId}
                  className={`p-2.5 rounded-xl border transition-all ${
                    hasTechViolation || hasCategoryViolation
                      ? 'bg-red-950/30 border-red-800/80 shadow-md ring-1 ring-red-500/40'
                      : isVoiceH
                      ? currentMusicianId
                        ? 'bg-blue-950/25 border-blue-800/50 shadow-sm'
                        : 'bg-[#101013] border-blue-900/30 hover:border-blue-700/50'
                      : isVoiceM
                      ? currentMusicianId
                        ? 'bg-rose-950/25 border-rose-800/50 shadow-sm'
                        : 'bg-[#101013] border-rose-900/30 hover:border-rose-700/50'
                      : currentMusicianId
                      ? 'bg-[#18181c] border-[#2e2e34] shadow-sm'
                      : isOptional
                      ? 'bg-[#101013]/60 border-[#1a1a1e] opacity-75'
                      : 'bg-[#101013] border-[#1e1e24]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-[#f0f0f3] truncate">
                        {role.name}
                      </span>
                      {isDirRole && (
                        <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50">
                          Dir
                        </span>
                      )}
                      {isVoiceH && (
                        <span className="text-[9px] font-mono font-bold text-blue-300 bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-700/50">
                          H
                        </span>
                      )}
                      {isVoiceM && (
                        <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950/70 px-1.5 py-0.5 rounded border border-rose-700/50">
                          M
                        </span>
                      )}
                      {isTechRole && (
                        <span className="text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-700/50">
                          Multimedia
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isOptional && !currentMusicianId && (
                        <span className="text-[8px] font-mono uppercase text-[#888894] bg-[#0a0a0b] px-1.5 py-0.5 rounded border border-[#1f1f23]">
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
                    className={`w-full bg-[#0a0a0b] text-xs rounded-xl px-2.5 py-2 border transition-all focus:outline-none cursor-pointer disabled:cursor-default disabled:opacity-85 font-semibold min-h-[38px] ${
                      hasTechViolation || hasCategoryViolation
                        ? 'border-red-500 bg-red-950/40 text-red-100 focus:border-red-400'
                        : isDualRole
                        ? 'border-[#c5a059]/80 bg-[#16161a] text-white focus:border-[#c5a059]'
                        : isVoiceH && currentMusicianId
                        ? 'border-blue-500/60 bg-[#101420] text-blue-100 focus:border-blue-400'
                        : isVoiceM && currentMusicianId
                        ? 'border-rose-500/60 bg-[#201015] text-rose-100 focus:border-rose-400'
                        : currentMusicianId
                        ? 'border-[#c5a059]/50 bg-[#1a1a1d] text-white focus:border-[#c5a059]'
                        : 'border-[#28282e] text-[#888894] hover:border-[#3e3e48] focus:border-[#c5a059]'
                    }`}
                  >
                    <option value="">— Vacante / Sin Asignar —</option>
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

                  {/* Badges de validación y botón resolver si hay conflicto */}
                  {hasTechViolation && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-red-950/50 border border-red-800/60 flex items-center justify-between gap-1 text-[10px] text-red-200">
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                        <span>Conflicto Sonido (Exclusivo)</span>
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onUpdateAssignment(key, roleId, '')}
                          className="px-1.5 py-0.5 bg-red-800 hover:bg-red-700 text-white rounded text-[9px] font-bold cursor-pointer transition active:scale-95"
                          title="Desasignar para resolver el conflicto"
                        >
                          Liberar
                        </button>
                      )}
                    </div>
                  )}

                  {hasCategoryViolation && !hasTechViolation && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-red-950/50 border border-red-800/60 flex items-center justify-between gap-1 text-[10px] text-red-200">
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={11} className="text-red-400 flex-shrink-0" />
                        <span>Duplicado en misma categoría</span>
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onUpdateAssignment(key, roleId, '')}
                          className="px-1.5 py-0.5 bg-red-800 hover:bg-red-700 text-white rounded text-[9px] font-bold cursor-pointer transition active:scale-95"
                          title="Desasignar para resolver el conflicto"
                        >
                          Liberar
                        </button>
                      )}
                    </div>
                  )}

                  {isDualRole && !hasTechViolation && !hasCategoryViolation && (
                    <div className="mt-1.5 p-1.5 rounded-lg bg-[#c5a059]/15 border border-[#c5a059]/40 text-[10px] text-[#e0c588] font-mono font-medium flex items-center gap-1.5">
                      <Layers size={11} className="text-[#c5a059] flex-shrink-0" />
                      <span>
                        Doble rol: <strong>{role.name}</strong> +{' '}
                        <strong>{assignedInOtherRoleMap.get(currentMusicianId) || 'Otro puesto'}</strong>
                      </span>
                    </div>
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
                {/* Cabecera del Turno */}
                <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-[#1a1a1d] border-b border-[#242429]">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-white">
                      {DAYS_OF_WEEK[slot.day]}
                    </span>
                    <span className="font-mono text-xs text-[#d4d4dc] bg-[#0a0a0b] px-2.5 py-1 rounded-lg border border-[#242429] font-medium">
                      {dateStr}
                    </span>
                    <span className="font-mono text-xs text-[#c5a059] font-extrabold tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {slot.time} HS
                    </span>
                    <span className="text-xs text-[#a0a0ab] font-medium">
                      • {slot.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {directorMusician ? (
                      <span className="font-mono text-xs text-white bg-[#0a0a0b] border border-[#c5a059]/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-sm">
                        <span className="text-amber-400">Dir:</span>
                        <span>{directorMusician.name}</span>
                        <span className="text-[10px] text-[#888894]">({directorGender === 'H' ? 'H' : 'M'})</span>
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[#888894] bg-[#0a0a0b] border border-[#222226] px-2.5 py-1 rounded-lg">
                        Sin Director(a)
                      </span>
                    )}

                    <span
                      className={`text-xs font-mono px-2.5 py-1 rounded-lg font-bold ${
                        isFullyStaffed
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                          : 'bg-[#222228] text-[#a0a0ab] border border-[#33333d]'
                      }`}
                    >
                      {assignedCount}/{adjustedTotalRequired} Confirmados
                    </span>

                    {dualRoleMusicians.size > 0 && (
                      <span
                        className="text-xs font-mono px-2.5 py-1 rounded-lg font-bold bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/40 flex items-center gap-1.5"
                        title="Integrantes asignados a más de un rol en este culto"
                      >
                        <Layers size={12} />
                        <span>{dualRoleMusicians.size} con doble rol</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner de balance y directivas vocales */}
                <div className="px-3.5 py-2 bg-[#0e0e11] border-b border-[#1a1a1d] flex items-center justify-between text-xs text-[#a0a0ab] flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">✦ Armonía Vocal:</span>
                    {directorGender === 'H' ? (
                      <span>
                        Director H ➔ Acompañan <strong className="text-blue-300">Voz h 1, 2</strong> +{' '}
                        <strong className="text-rose-300">Voz m 1, 2, 3</strong> (3 Hombres + 3 Mujeres).
                      </span>
                    ) : directorGender === 'M' ? (
                      <span>
                        Directora M ➔ Acompañan <strong className="text-rose-300">Voz m 1, 2</strong> +{' '}
                        <strong className="text-blue-300">Voz h 1, 2, 3</strong> (3 Mujeres + 3 Hombres).
                      </span>
                    ) : (
                      <span className="text-[#888894]">
                        Meta: 3 Voces Hombres y 3 Voces Mujeres para equilibrio total (6 puestos).
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Interactivo de Advertencia de Parejas con Botón 1-Click Resolver */}
                {coupleIssues.length > 0 && (
                  <div className="p-3 bg-amber-950/30 border-b border-amber-800/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Heart size={15} className="text-amber-400 fill-amber-500/20" />
                        <span>Alerta de Pareja & Descanso Familiar ({coupleIssues.length}):</span>
                      </div>
                      <button
                        onClick={() => setShowExplainerModal(true)}
                        className="text-[11px] text-amber-300 hover:text-white underline cursor-pointer"
                      >
                        ¿Por qué pasa esto?
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {coupleIssues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#141418] border border-amber-900/40 text-xs"
                        >
                          <div className="flex items-center gap-2 text-amber-200">
                            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                            <span>
                              <strong className="text-white">{issue.onMusician.name}</strong> está en el turno pero su pareja <strong className="text-white">{issue.offMusician.name}</strong> descansa.
                            </span>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleReuniteCouple(issue.offMusician)}
                                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-sm"
                                title={`Convocar a ${issue.offMusician.name} en una vacante libre`}
                              >
                                <UserPlus size={12} />
                                <span>Reunir Pareja</span>
                              </button>
                              <button
                                onClick={() => handleRestBothCouple(issue.assignedRoleId, issue.onMusician.name)}
                                className="px-2.5 py-1 bg-[#1a1a1d] hover:bg-rose-950/40 text-[#a0a0ab] hover:text-rose-300 border border-[#2a2a2e] rounded-lg text-[11px] font-medium cursor-pointer transition active:scale-95"
                                title={`Desconvocar a ${issue.onMusician.name} para que ambos descansen`}
                              >
                                Descansar Ambos
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Layout Principal: Equipo (Izquierda) y Canciones (Derecha / Prominente) */}
                <div className="p-3.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#121215]">
                  {/* COLUMNA 1: Equipo Ministerial (Roles) */}
                  <div className="lg:col-span-7 space-y-3.5">
                    {/* SECCIÓN 1: Dirección */}
                    {directorRoleId && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between pb-1 border-b border-[#24242a]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-bold">
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
                        <div className="flex items-center justify-between pb-1 border-b border-blue-900/40">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1.5 font-bold">
                            <span>🎤 Voces Masculinas (3 Puestos)</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#888894]">
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
                        <div className="flex items-center justify-between pb-1 border-b border-rose-900/40">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1.5 font-bold">
                            <span>🎤 Voces Femeninas (3 Puestos)</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#888894]">
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
                        <div className="flex items-center justify-between pb-1 border-b border-[#24242a]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#d4d4dc] flex items-center gap-1.5 font-bold">
                            <span>🎸 Instrumentos</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#888894]">
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
                        <div className="flex items-center justify-between pb-1 border-b border-cyan-900/40">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5 font-bold">
                            <span>🎛️ Sonido Multimedia (Exclusivo)</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#888894]">
                            Consola de Audio y Proyección
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
                        <div className="flex items-center justify-between pb-1 border-b border-[#24242a]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#d4d4dc] font-bold">
                            Otros Roles
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {otherRoles.map(rid => renderRoleCard(rid))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COLUMNA 2: Repertorio & Alabanzas */}
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
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#888894] hover:text-white rounded-xl text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
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
