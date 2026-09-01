import React, { useState, useMemo } from 'react';
import { AppState, Musician, Gender, Couple, Role } from '../types';
import { generateId } from '../services/storage';
import { getRoleCategory } from '../services/rotativeScheduler';
import {
  UserPlus,
  Pencil,
  Trash2,
  Heart,
  Search,
  CheckSquare,
  Square,
  X,
  Users,
  Star,
  Link,
  Unlink,
  AlertCircle,
  LayoutGrid,
  List,
  Layers,
  ArrowUpDown,
  Filter,
  Check,
  Music,
  Sliders,
  Mic2,
} from 'lucide-react';

interface MusiciansViewProps {
  state: AppState;
  isAdmin?: boolean;
  onRequestAdmin?: () => void;
  onSaveMusician: (musician: Musician) => void;
  onDeleteMusician: (musicianId: string) => void;
  onSaveCouple: (couple: Couple) => void;
  onDeleteCouple: (coupleId: string) => void;
  showToast: (msg: string) => void;
}

type ViewMode = 'grid' | 'list' | 'details';
type SortOption = 'name_asc' | 'name_desc' | 'role' | 'gender' | 'roles_count';

// Helpers for voice detection & automatic 3-voice grouping
const isVoiceRole = (roleName: string): boolean => {
  const n = roleName.toLowerCase().trim();
  return n.startsWith('voz') || n.includes('voces');
};

const getVoiceRoleIdsForGender = (roles: Role[], g: Gender): string[] => {
  const prefix = g === 'H' ? 'voz h' : 'voz m';
  return roles
    .filter(r => r.name.toLowerCase().trim().startsWith(prefix))
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
    .slice(0, 3)
    .map(r => r.id);
};

export const MusiciansView: React.FC<MusiciansViewProps> = ({
  state,
  isAdmin = false,
  onRequestAdmin,
  onSaveMusician,
  onDeleteMusician,
  onSaveCouple,
  onDeleteCouple,
  showToast,
}) => {
  // Visual Mode and Sorting States (Default: Listado & Alfabético A-Z)
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  // Modal State for New / Edit Musician
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('H');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState<string>('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'H' | 'M'>('ALL');
  const [coupleFilter, setCoupleFilter] = useState<'ALL' | 'COUPLED' | 'SINGLE'>('ALL');

  // Couple pairing form state
  const [couplePersonA, setCouplePersonA] = useState<string>('');
  const [couplePersonB, setCouplePersonB] = useState<string>('');

  // Delete modal state
  const [deleteConfirmMusician, setDeleteConfirmMusician] = useState<{ id: string; name: string } | null>(null);

  // Quick lookup maps
  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    state.roles.forEach(r => map.set(r.id, r));
    return map;
  }, [state.roles]);

  const musicianMap = useMemo(() => {
    const map = new Map<string, Musician>();
    state.musicians.forEach(m => map.set(m.id, m));
    return map;
  }, [state.musicians]);

  // Open modal for creating a new musician
  const handleOpenNewModal = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }
    setEditingId(null);
    setName('');
    setGender('H');
    setSelectedRoleIds([]);
    setPrimaryRoleId('');
    setIsModalOpen(true);
  };

  // Open modal for editing an existing musician
  const handleStartEdit = (m: Musician) => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }
    setEditingId(m.id);
    setName(m.name);
    setGender(m.gender || 'H');
    setSelectedRoleIds(m.roleIds || []);
    setPrimaryRoleId(m.primaryRoleId || (m.roleIds && m.roleIds[0]) || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setName('');
    setGender('H');
    setSelectedRoleIds([]);
    setPrimaryRoleId('');
  };

  // When changing Primary Role: if it's a voice role, auto-select all 3 corresponding voices!
  const handlePrimaryRoleChange = (newPrimaryId: string) => {
    setPrimaryRoleId(newPrimaryId);
    if (!newPrimaryId) return;

    const targetRole = roleMap.get(newPrimaryId);
    if (!targetRole) return;

    // Ensure the primary role itself is in selected roles
    let nextSelected = selectedRoleIds.includes(newPrimaryId)
      ? [...selectedRoleIds]
      : [...selectedRoleIds, newPrimaryId];

    // If it's a voice role, auto-select all 3 voice roles for the current gender
    if (isVoiceRole(targetRole.name)) {
      let targetGender = gender;
      if (targetRole.name.toLowerCase().includes('voz h') && gender !== 'H') {
        targetGender = 'H';
        setGender('H');
      } else if (targetRole.name.toLowerCase().includes('voz m') && gender !== 'M') {
        targetGender = 'M';
        setGender('M');
      }

      const voiceIds = getVoiceRoleIdsForGender(state.roles, targetGender);
      voiceIds.forEach(vId => {
        if (!nextSelected.includes(vId)) {
          nextSelected.push(vId);
        }
      });
    }

    setSelectedRoleIds(nextSelected);
  };

  // When changing Gender: update voice roles if primary role is a voice
  const handleGenderChange = (newGender: Gender) => {
    setGender(newGender);

    const currentPrimary = roleMap.get(primaryRoleId);
    if (currentPrimary && isVoiceRole(currentPrimary.name)) {
      const oldGender: Gender = newGender === 'H' ? 'M' : 'H';
      const oldVoiceIds = getVoiceRoleIdsForGender(state.roles, oldGender);
      const newVoiceIds = getVoiceRoleIdsForGender(state.roles, newGender);

      let nextSelected = selectedRoleIds.filter(id => !oldVoiceIds.includes(id));
      newVoiceIds.forEach(vId => {
        if (!nextSelected.includes(vId)) {
          nextSelected.push(vId);
        }
      });

      if (newVoiceIds.length > 0) {
        setPrimaryRoleId(newVoiceIds[0]);
      }
      setSelectedRoleIds(nextSelected);
    }
  };

  const toggleRole = (roleId: string) => {
    const roleObj = roleMap.get(roleId);
    const isCurrentlyChecked = selectedRoleIds.includes(roleId);

    if (isCurrentlyChecked) {
      const next = selectedRoleIds.filter(id => id !== roleId);
      setSelectedRoleIds(next);
      if (primaryRoleId === roleId) {
        setPrimaryRoleId(next[0] || '');
      }
    } else {
      let next = [...selectedRoleIds, roleId];

      if (roleObj && isVoiceRole(roleObj.name)) {
        const voiceIds = getVoiceRoleIdsForGender(state.roles, gender);
        voiceIds.forEach(vId => {
          if (!next.includes(vId)) next.push(vId);
        });
      }

      setSelectedRoleIds(next);
      if (!primaryRoleId) {
        setPrimaryRoleId(roleId);
      }
    }
  };

  const selectAllRoles = () => {
    const all = state.roles.map(r => r.id);
    setSelectedRoleIds(all);
    if (!primaryRoleId && all.length > 0) setPrimaryRoleId(all[0]);
  };

  const clearAllRoles = () => {
    setSelectedRoleIds([]);
    setPrimaryRoleId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      showToast('Por favor escribe un nombre.');
      return;
    }

    const musicianToSave: Musician = {
      id: editingId || generateId('mus'),
      name: cleanName,
      gender,
      roleIds: selectedRoleIds,
      primaryRoleId: primaryRoleId || selectedRoleIds[0] || '',
    };

    onSaveMusician(musicianToSave);
    showToast(editingId ? `Integrante "${cleanName}" actualizado.` : `Integrante "${cleanName}" registrado.`);
    handleCloseModal();
  };

  const handlePromptDelete = (id: string, name: string) => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }
    setDeleteConfirmMusician({ id, name });
  };

  const handleAddCouple = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }
    if (!couplePersonA || !couplePersonB) {
      showToast('Selecciona a ambas personas de la pareja.');
      return;
    }
    if (couplePersonA === couplePersonB) {
      showToast('Debes seleccionar dos integrantes diferentes.');
      return;
    }

    const alreadyPaired = state.couples.some(
      c => c.aId === couplePersonA || c.bId === couplePersonA || c.aId === couplePersonB || c.bId === couplePersonB
    );
    if (alreadyPaired) {
      showToast('Uno de los integrantes seleccionados ya tiene una pareja registrada.');
      return;
    }

    const newCouple: Couple = {
      id: generateId('cpl'),
      aId: couplePersonA,
      bId: couplePersonB,
    };

    onSaveCouple(newCouple);
    setCouplePersonA('');
    setCouplePersonB('');
    showToast('Pareja registrada con éxito.');
  };

  // Filter & Sort Musicians
  const filteredAndSortedMusicians = useMemo(() => {
    // 1. Filter
    const filtered = state.musicians.filter(m => {
      // Name Search
      if (searchQuery.trim() && !m.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
        return false;
      }

      // Role Filter
      if (selectedRoleFilter !== 'ALL') {
        if (selectedRoleFilter === 'NO_ROLES') {
          if ((m.roleIds || []).length > 0) return false;
        } else {
          if (!(m.roleIds || []).includes(selectedRoleFilter)) return false;
        }
      }

      // Gender Filter
      if (genderFilter !== 'ALL' && m.gender !== genderFilter) {
        return false;
      }

      // Couple Filter
      if (coupleFilter !== 'ALL') {
        const isPaired = state.couples.some(c => c.aId === m.id || c.bId === m.id);
        if (coupleFilter === 'COUPLED' && !isPaired) return false;
        if (coupleFilter === 'SINGLE' && isPaired) return false;
      }

      return true;
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name, 'es');
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name, 'es');
      }
      if (sortBy === 'gender') {
        if (a.gender !== b.gender) {
          return a.gender === 'H' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, 'es');
      }
      if (sortBy === 'roles_count') {
        const countA = (a.roleIds || []).length;
        const countB = (b.roleIds || []).length;
        if (countA !== countB) return countB - countA;
        return a.name.localeCompare(b.name, 'es');
      }
      if (sortBy === 'role') {
        const roleA = a.primaryRoleId ? roleMap.get(a.primaryRoleId)?.name || '' : 'zzz';
        const roleB = b.primaryRoleId ? roleMap.get(b.primaryRoleId)?.name || '' : 'zzz';
        const cmp = roleA.localeCompare(roleB, 'es');
        if (cmp !== 0) return cmp;
        return a.name.localeCompare(b.name, 'es');
      }
      return 0;
    });
  }, [state.musicians, searchQuery, selectedRoleFilter, genderFilter, coupleFilter, sortBy, roleMap, state.couples]);

  // Statistics
  const totalMen = useMemo(() => state.musicians.filter(m => m.gender === 'H').length, [state.musicians]);
  const totalWomen = useMemo(() => state.musicians.filter(m => m.gender === 'M').length, [state.musicians]);
  const totalCoupled = useMemo(() => {
    const ids = new Set<string>();
    state.couples.forEach(c => {
      ids.add(c.aId);
      ids.add(c.bId);
    });
    return state.musicians.filter(m => ids.has(m.id)).length;
  }, [state.musicians, state.couples]);

  return (
    <div className="space-y-8" id="musicians-view">
      {/* ======================================================== */}
      {/* 1. SECCIÓN PRINCIPAL: LISTADO DE PERSONAS / MÚSICOS      */}
      {/* ======================================================== */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1f1f23] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-normal tracking-tight text-white flex items-center gap-2">
                <span>Directorio de</span>
                <span className="italic text-[#c5a059]">Integrantes</span>
                <span className="text-xs font-mono text-[#888894] font-normal">
                  ({filteredAndSortedMusicians.length} de {state.musicians.length})
                </span>
              </h2>
              <div className="flex items-center gap-3 text-xs text-[#888894] mt-0.5 flex-wrap">
                <span>{totalMen} Varones</span>
                <span>•</span>
                <span>{totalWomen} Mujeres</span>
                <span>•</span>
                <span>{state.couples.length} Parejas ({totalCoupled} personas)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Buscador de Nombre */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b75]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full bg-[#0a0a0b] text-[#e0e0e0] text-xs rounded-xl pl-9 pr-3.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none placeholder-[#6b6b75] transition-colors"
              />
            </div>

            {/* BOTÓN NUEVO INTEGRANTE */}
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-[#c5a059]/10 hover:shadow-[#c5a059]/20 active:scale-95 flex-shrink-0"
              id="open-new-musician-btn"
            >
              <UserPlus size={15} />
              <span>Nuevo Integrante</span>
            </button>
          </div>
        </div>

        {/* BARRA DE CONTROLES: MODOS DE VISUALIZACIÓN Y ORDENACIÓN */}
        <div className="bg-[#0a0a0b] p-3 rounded-xl border border-[#1f1f23] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Selector de Modo de Visualización (Ventana / Listado / Detalles) */}
          <div className="flex items-center gap-1.5 bg-[#141418] p-1 rounded-lg border border-[#1f1f23]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6b75] px-2 hidden sm:inline">
              Vista:
            </span>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#c5a059] text-black font-bold shadow-sm'
                  : 'text-[#888894] hover:text-white hover:bg-[#1f1f23]'
              }`}
              title="Vista de Tarjetas / Ventana"
            >
              <LayoutGrid size={13} />
              <span>Ventana</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#c5a059] text-black font-bold shadow-sm'
                  : 'text-[#888894] hover:text-white hover:bg-[#1f1f23]'
              }`}
              title="Vista de Listado / Tabla compacta"
            >
              <List size={13} />
              <span>Listado</span>
            </button>

            <button
              onClick={() => setViewMode('details')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === 'details'
                  ? 'bg-[#c5a059] text-black font-bold shadow-sm'
                  : 'text-[#888894] hover:text-white hover:bg-[#1f1f23]'
              }`}
              title="Vista de Detalles Completos"
            >
              <Layers size={13} />
              <span>Detalles</span>
            </button>
          </div>

          {/* Selector de Ordenación (Alfabético / Rol / Género / Roles) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={13} className="text-[#c5a059]" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6b75]">
                Organizar por:
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-[#141418] text-white text-xs rounded-lg px-2.5 py-1.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer font-mono"
              >
                <option value="name_asc">Alfabético (A → Z)</option>
                <option value="name_desc">Alfabético (Z → A)</option>
                <option value="role">Rol Primordial</option>
                <option value="gender">Género (H / M)</option>
                <option value="roles_count">Cantidad de Roles</option>
              </select>
            </div>

            {/* Filtro Rápido por Género */}
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value as 'ALL' | 'H' | 'M')}
              className="bg-[#141418] text-[#888894] text-xs rounded-lg px-2 py-1.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer font-mono"
            >
              <option value="ALL">Género: Todos</option>
              <option value="H">Solo Varones (H)</option>
              <option value="M">Solo Mujeres (M)</option>
            </select>

            {/* Filtro Rápido por Pareja */}
            <select
              value={coupleFilter}
              onChange={e => setCoupleFilter(e.target.value as 'ALL' | 'COUPLED' | 'SINGLE')}
              className="bg-[#141418] text-[#888894] text-xs rounded-lg px-2 py-1.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer font-mono"
            >
              <option value="ALL">Pareja: Todas</option>
              <option value="COUPLED">Con Pareja</option>
              <option value="SINGLE">Sin Pareja</option>
            </select>
          </div>
        </div>

        {/* Barra de Filtros por Rol Específico */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
          <button
            onClick={() => setSelectedRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider border whitespace-nowrap cursor-pointer transition-all ${
              selectedRoleFilter === 'ALL'
                ? 'bg-[#1a1a1d] text-white border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.08)] font-semibold'
                : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23] hover:text-white'
            }`}
          >
            Todos ({state.musicians.length})
          </button>
          {state.roles.map(r => {
            const count = state.musicians.filter(m => (m.roleIds || []).includes(r.id)).length;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wider border whitespace-nowrap cursor-pointer transition-all ${
                  selectedRoleFilter === r.id
                    ? 'bg-[#1a1a1d] text-[#c5a059] border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.08)] font-semibold'
                    : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23] hover:text-white'
                }`}
              >
                {r.name} ({count})
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* RENDERIZADO SEGÚN EL MODO DE VISTA                       */}
        {/* ======================================================== */}
        {filteredAndSortedMusicians.length === 0 ? (
          <div className="text-center py-16 text-[#6b6b75] bg-[#0a0a0b] rounded-2xl border border-[#1f1f23] space-y-3">
            <Users size={32} className="mx-auto text-[#3a3a42] opacity-60" />
            <p className="text-sm">
              {searchQuery || selectedRoleFilter !== 'ALL' || genderFilter !== 'ALL' || coupleFilter !== 'ALL'
                ? 'No se encontraron integrantes con los filtros aplicados.'
                : 'Todavía no hay músicos registrados en el ministerio.'}
            </p>
            <button
              onClick={handleOpenNewModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a1d] hover:bg-[#25252a] text-[#c5a059] text-xs font-mono rounded-lg border border-[#c5a059]/30 transition-colors cursor-pointer"
            >
              <UserPlus size={13} />
              <span>Registrar Integrante</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ---------------------------------------------------- */
          /* MODO 1: VENTANA / TARJETAS EN CUADRÍCULA             */
          /* ---------------------------------------------------- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAndSortedMusicians.map(m => {
              const couple = state.couples.find(c => c.aId === m.id || c.bId === m.id);
              const partner = couple
                ? musicianMap.get(couple.aId === m.id ? couple.bId : couple.aId)
                : null;
              const primaryRole = m.primaryRoleId ? roleMap.get(m.primaryRoleId) : null;
              const musicianRoles = (m.roleIds || [])
                .map(rid => roleMap.get(rid))
                .filter((r): r is Role => Boolean(r));
              const isMale = m.gender === 'H';

              return (
                <div
                  key={m.id}
                  className="bg-[#0e0e11] border border-[#1f1f23] hover:border-[#2e2e36] rounded-xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-sm group hover:shadow-md"
                >
                  <div className="space-y-2.5">
                    {/* Fila Superior: Nombre, Género y Acciones */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 ${
                            isMale
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          }`}
                        >
                          {isMale ? 'H' : 'M'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f3efe6] transition-colors">
                            {m.name}
                          </h4>
                          <span className="text-[10px] font-mono text-[#6b6b75]">
                            {isMale ? 'Hombre (Voz Tenor/Barítono)' : 'Mujer (Voz Soprano/Contralto)'}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="w-7 h-7 rounded-lg bg-[#141418] hover:bg-[#c5a059] text-[#888894] hover:text-black border border-[#24242a] hover:border-[#c5a059] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                          title="Editar integrante"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(m.id, m.name)}
                          className="w-7 h-7 rounded-lg bg-[#141418] hover:bg-red-600 text-[#888894] hover:text-white border border-[#24242a] hover:border-red-600 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                          title="Eliminar integrante"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Rol Primordial & Pareja */}
                    <div className="flex flex-wrap gap-1.5">
                      {primaryRole && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded-md">
                          <Star size={9} className="fill-[#c5a059]" />
                          <span>Primordial: {primaryRole.name}</span>
                        </span>
                      )}

                      {partner && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-400 bg-pink-950/20 border border-pink-900/30 px-2 py-0.5 rounded-md">
                          <Heart size={9} className="fill-pink-400 text-pink-400" />
                          <span>Pareja: {partner.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Roles Habilitados */}
                    <div className="pt-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#6b6b75] block mb-1">
                        Roles Habilitados ({musicianRoles.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {musicianRoles.length === 0 ? (
                          <span className="text-[10px] font-mono text-[#6b6b75] italic">
                            Sin roles asignados
                          </span>
                        ) : (
                          musicianRoles.map(r => (
                            <span
                              key={r.id}
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                                r.id === m.primaryRoleId
                                  ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/50 font-semibold'
                                  : 'bg-[#141418] text-[#a0a0ab] border-[#222228]'
                              }`}
                            >
                              {r.name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : viewMode === 'list' ? (
          /* ---------------------------------------------------- */
          /* MODO 2: LISTADO COMPACTO / TABLA                     */
          /* ---------------------------------------------------- */
          <div className="overflow-x-auto bg-[#0a0a0b] rounded-xl border border-[#1f1f23]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1f1f23] bg-[#101013] text-[#888894] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Integrante</th>
                  <th className="py-3 px-3 font-semibold">Género</th>
                  <th className="py-3 px-3 font-semibold">Rol Primordial</th>
                  <th className="py-3 px-3 font-semibold">Roles Habilitados</th>
                  <th className="py-3 px-3 font-semibold">Pareja</th>
                  <th className="py-3 px-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#18181c]">
                {filteredAndSortedMusicians.map(m => {
                  const couple = state.couples.find(c => c.aId === m.id || c.bId === m.id);
                  const partner = couple
                    ? musicianMap.get(couple.aId === m.id ? couple.bId : couple.aId)
                    : null;
                  const primaryRole = m.primaryRoleId ? roleMap.get(m.primaryRoleId) : null;
                  const musicianRoles = (m.roleIds || [])
                    .map(rid => roleMap.get(rid))
                    .filter((r): r is Role => Boolean(r));
                  const isMale = m.gender === 'H';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#141418] transition-colors group"
                    >
                      <td className="py-2.5 px-4 font-medium text-white flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono ${
                            isMale
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                          }`}
                        >
                          {isMale ? 'H' : 'M'}
                        </div>
                        <span className="font-semibold group-hover:text-[#c5a059] transition-colors">{m.name}</span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#888894]">
                        {isMale ? 'Hombre' : 'Mujer'}
                      </td>

                      <td className="py-2.5 px-3">
                        {primaryRole ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded">
                            <Star size={9} className="fill-[#c5a059]" />
                            <span>{primaryRole.name}</span>
                          </span>
                        ) : (
                          <span className="text-[#6b6b75] italic text-[10px]">— Sin definir —</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {musicianRoles.slice(0, 4).map(r => (
                            <span
                              key={r.id}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#141418] text-[#a0a0ab] border border-[#222228]"
                            >
                              {r.name}
                            </span>
                          ))}
                          {musicianRoles.length > 4 && (
                            <span className="text-[9px] font-mono text-[#6b6b75] px-1 py-0.2">
                              +{musicianRoles.length - 4} más
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {partner ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-pink-400 bg-pink-950/20 border border-pink-900/30 px-2 py-0.5 rounded">
                            <Heart size={9} className="fill-pink-400 text-pink-400" />
                            <span>{partner.name}</span>
                          </span>
                        ) : (
                          <span className="text-[#6b6b75] text-[10px] italic">—</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(m)}
                            className="p-1.5 rounded-lg bg-[#141418] hover:bg-[#c5a059] text-[#888894] hover:text-black transition-colors cursor-pointer"
                            title="Editar integrante"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handlePromptDelete(m.id, m.name)}
                            className="p-1.5 rounded-lg bg-[#141418] hover:bg-red-600 text-[#888894] hover:text-white transition-colors cursor-pointer"
                            title="Eliminar integrante"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ---------------------------------------------------- */
          /* MODO 3: VISTA DE DETALLES COMPLETOS                  */
          /* ---------------------------------------------------- */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAndSortedMusicians.map(m => {
              const couple = state.couples.find(c => c.aId === m.id || c.bId === m.id);
              const partner = couple
                ? musicianMap.get(couple.aId === m.id ? couple.bId : couple.aId)
                : null;
              const primaryRole = m.primaryRoleId ? roleMap.get(m.primaryRoleId) : null;
              const musicianRoles = (m.roleIds || [])
                .map(rid => roleMap.get(rid))
                .filter((r): r is Role => Boolean(r));
              const isMale = m.gender === 'H';

              // Categorize roles
              const voiceRoles = musicianRoles.filter(r => isVoiceRole(r.name));
              const instrumentRoles = musicianRoles.filter(
                r => getRoleCategory(r.name) === 'instrument'
              );
              const techRoles = musicianRoles.filter(r => getRoleCategory(r.name) === 'tech');
              const dirRoles = musicianRoles.filter(r => getRoleCategory(r.name) === 'director');

              return (
                <div
                  key={m.id}
                  className="bg-[#0e0e11] border border-[#222228] hover:border-[#c5a059]/40 rounded-2xl p-5 space-y-4 shadow-sm transition-all group"
                >
                  {/* Cabecera del detalle */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#1b1b20] pb-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold font-mono flex-shrink-0 ${
                          isMale
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800/50 shadow-md shadow-blue-950/20'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-800/50 shadow-md shadow-rose-950/20'
                        }`}
                      >
                        {isMale ? '👨 H' : '👩 M'}
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white group-hover:text-[#f3efe6] transition-colors">
                          {m.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#888894] mt-0.5">
                          <span>{isMale ? 'Hombre' : 'Mujer'}</span>
                          <span>•</span>
                          <span>{musicianRoles.length} roles habilitados</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartEdit(m)}
                        className="p-2 rounded-xl bg-[#141418] hover:bg-[#c5a059] text-[#888894] hover:text-black border border-[#24242a] hover:border-[#c5a059] transition-all cursor-pointer"
                        title="Editar integrante"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handlePromptDelete(m.id, m.name)}
                        className="p-2 rounded-xl bg-[#141418] hover:bg-red-600 text-[#888894] hover:text-white border border-[#24242a] hover:border-red-600 transition-all cursor-pointer"
                        title="Eliminar integrante"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Resumen de Rol Primordial & Pareja */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="bg-[#08080a] p-2.5 rounded-xl border border-[#1b1b20]">
                      <span className="text-[9px] font-mono uppercase text-[#6b6b75] block mb-1">
                        Rol Prioritario / Primordial
                      </span>
                      {primaryRole ? (
                        <span className="text-xs font-semibold text-[#c5a059] flex items-center gap-1">
                          <Star size={12} className="fill-[#c5a059]" />
                          <span>{primaryRole.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#6b6b75] italic">Sin definir</span>
                      )}
                    </div>

                    <div className="bg-[#08080a] p-2.5 rounded-xl border border-[#1b1b20]">
                      <span className="text-[9px] font-mono uppercase text-[#6b6b75] block mb-1">
                        Pareja en el Ministerio
                      </span>
                      {partner ? (
                        <span className="text-xs font-semibold text-pink-400 flex items-center gap-1">
                          <Heart size={12} className="fill-pink-400" />
                          <span>{partner.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#6b6b75] italic">Sin pareja vinculada</span>
                      )}
                    </div>
                  </div>

                  {/* Desglose de Capacidades por Categoría */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#888894] font-semibold block">
                      Habilitaciones y Roles:
                    </span>

                    <div className="flex flex-wrap gap-1.5">
                      {dirRoles.map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950/30 text-amber-300 border border-amber-800/40"
                        >
                          <Star size={10} className="fill-amber-300" />
                          <span>{r.name}</span>
                        </span>
                      ))}

                      {voiceRoles.map(r => (
                        <span
                          key={r.id}
                          className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md ${
                            isMale
                              ? 'bg-blue-950/30 text-blue-300 border border-blue-800/40'
                              : 'bg-rose-950/30 text-rose-300 border border-rose-800/40'
                          }`}
                        >
                          <Mic2 size={10} />
                          <span>{r.name}</span>
                        </span>
                      ))}

                      {instrumentRoles.map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#18181e] text-[#d0d0d8] border border-[#2a2a32]"
                        >
                          <Music size={10} className="text-[#c5a059]" />
                          <span>{r.name}</span>
                        </span>
                      ))}

                      {techRoles.map(r => (
                        <span
                          key={r.id}
                          className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/30 text-cyan-300 border border-cyan-800/40"
                        >
                          <Sliders size={10} />
                          <span>{r.name}</span>
                        </span>
                      ))}

                      {musicianRoles.length === 0 && (
                        <span className="text-xs text-[#6b6b75] italic">
                          No tiene roles configurados.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SECCIÓN SECUNDARIA: GESTIÓN DE PAREJAS DEL MINISTERIO  */}
      {/* ======================================================== */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-5 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f1f23] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
              <Heart size={18} className="fill-pink-400/20" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-normal text-white">
                Gestión de <span className="italic text-[#c5a059]">Parejas del Ministerio</span>
              </h3>
              <p className="text-xs text-[#6b6b75]">
                Vincula parejas para coordinar descansos mensuales conjuntos y asignar turnos simultáneos siempre que sea posible.
              </p>
            </div>
          </div>
        </div>

        {/* Formulario para registrar parejas y Listado de parejas existentes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAddCouple} className="lg:col-span-6 bg-[#0a0a0b] p-4.5 rounded-xl border border-[#1f1f23] space-y-3.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-semibold">
              <Link size={13} />
              <span>Registrar Nueva Pareja</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-[#6b6b75] uppercase mb-1">Integrante 1</label>
                <select
                  value={couplePersonA}
                  onChange={e => setCouplePersonA(e.target.value)}
                  className="w-full bg-[#141418] text-xs text-white rounded-lg p-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
                >
                  <option value="">— Seleccionar —</option>
                  {state.musicians.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.gender === 'H' ? 'Hombre' : 'Mujer'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#6b6b75] uppercase mb-1">Integrante 2</label>
                <select
                  value={couplePersonB}
                  onChange={e => setCouplePersonB(e.target.value)}
                  className="w-full bg-[#141418] text-xs text-white rounded-lg p-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
                >
                  <option value="">— Seleccionar —</option>
                  {state.musicians.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.gender === 'H' ? 'Hombre' : 'Mujer'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#1a1a1d] hover:bg-[#c5a059] text-[#c5a059] hover:text-black font-mono text-xs uppercase tracking-wider rounded-lg border border-[#c5a059]/30 hover:border-[#c5a059] transition-all cursor-pointer font-medium"
            >
              Vincular Pareja
            </button>
          </form>

          {/* Listado de Parejas Registradas */}
          <div className="lg:col-span-6 space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#6b6b75] font-semibold">
              Parejas Registradas ({state.couples.length})
            </h4>
            {state.couples.length === 0 ? (
              <div className="text-xs text-[#6b6b75] italic p-6 bg-[#0a0a0b] rounded-xl border border-[#1f1f23] text-center">
                No hay parejas registradas todavía.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {state.couples.map(couple => {
                  const ma = musicianMap.get(couple.aId);
                  const mb = musicianMap.get(couple.bId);
                  if (!ma || !mb) return null;

                  return (
                    <div
                      key={couple.id}
                      className="flex items-center justify-between p-3 bg-[#0a0a0b] border border-[#1f1f23] rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Heart size={14} className="text-pink-400 fill-pink-400 flex-shrink-0" />
                        <span className="text-white font-medium">{ma.name}</span>
                        <span className="text-[#6b6b75]">&</span>
                        <span className="text-white font-medium">{mb.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (!isAdmin) {
                            if (onRequestAdmin) onRequestAdmin();
                            return;
                          }
                          onDeleteCouple(couple.id);
                          showToast(`Pareja de ${ma.name} y ${mb.name} desvinculada.`);
                        }}
                        className="text-xs text-[#6b6b75] hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20 transition-colors cursor-pointer"
                        title="Desvincular pareja"
                      >
                        <Unlink size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL FLOTANTE: AGREGAR / EDITAR INTEGRANTE           */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div
            className="bg-[#141418] border border-[#2a2a30] hover:border-[#c5a059]/40 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8 transition-all"
            id="musician-modal"
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 flex items-center justify-center">
                  {editingId ? <Pencil size={15} /> : <UserPlus size={15} />}
                </div>
                <h3 className="font-serif text-xl font-normal text-white">
                  {editingId ? (
                    <>
                      Editar <span className="italic text-[#c5a059]">Integrante</span>
                    </>
                  ) : (
                    <>
                      Nuevo <span className="italic text-[#c5a059]">Integrante</span>
                    </>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg text-[#6b6b75] hover:text-white hover:bg-[#202025] flex items-center justify-center transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X size={16} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre y Apellido */}
              <div>
                <label className="block font-mono text-[10px] text-[#a0a0ab] mb-1.5 uppercase tracking-[0.15em] font-semibold">
                  Nombre y Apellido
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: David Pérez"
                  required
                  autoFocus
                  className="w-full bg-[#0a0a0b] text-white text-sm rounded-xl px-3.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none transition-colors"
                  id="modal-musician-name"
                />
              </div>

              {/* Género (Hombre / Mujer) */}
              <div>
                <label className="block font-mono text-[10px] text-[#a0a0ab] mb-1.5 uppercase tracking-[0.15em] font-semibold">
                  Género (Para balance vocal 3H / 3M)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenderChange('H')}
                    className={`py-2 px-3 rounded-xl text-xs font-mono uppercase tracking-wider border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      gender === 'H'
                        ? 'bg-blue-950/30 text-blue-300 border-blue-600/80 font-bold shadow-sm'
                        : 'bg-[#0a0a0b] text-[#6b6b75] border-[#2a2a2e] hover:text-white'
                    }`}
                  >
                    <span>👨 Hombre (H)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderChange('M')}
                    className={`py-2 px-3 rounded-xl text-xs font-mono uppercase tracking-wider border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      gender === 'M'
                        ? 'bg-rose-950/30 text-rose-300 border-rose-600/80 font-bold shadow-sm'
                        : 'bg-[#0a0a0b] text-[#6b6b75] border-[#2a2a2e] hover:text-white'
                    }`}
                  >
                    <span>👩 Mujer (M)</span>
                  </button>
                </div>
              </div>

              {/* ROL PRIMORDIAL */}
              <div className="bg-[#0c0c0f] p-3.5 rounded-xl border border-[#202026] space-y-1.5">
                <label className="block font-mono text-[11px] text-[#c5a059] uppercase tracking-[0.15em] flex items-center gap-1.5 font-bold">
                  <Star size={13} className="fill-[#c5a059] text-[#c5a059]" />
                  <span>Rol Primordial / Prioritario</span>
                </label>
                <p className="text-[11px] text-[#888894] leading-relaxed">
                  Si seleccionas <strong>Voz</strong>, se seleccionarán automáticamente las <strong>3 voces correspondientes</strong> ({gender === 'H' ? 'Voz h 1, 2 y 3' : 'Voz m 1, 2 y 3'}).
                </p>
                <select
                  value={primaryRoleId}
                  onChange={e => handlePrimaryRoleChange(e.target.value)}
                  className="w-full bg-[#141418] text-white text-xs rounded-lg px-3 py-2.5 border border-[#c5a059]/40 focus:border-[#c5a059] focus:outline-none cursor-pointer"
                >
                  <option value="">— Seleccionar Rol Primordial —</option>
                  {state.roles.map(r => (
                    <option key={r.id} value={r.id}>
                      ⭐ {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Roles Habilitados */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] text-[#a0a0ab] uppercase tracking-[0.15em] font-semibold">
                    Todos los Roles Habilitados ({selectedRoleIds.length})
                  </label>
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase">
                    <button
                      type="button"
                      onClick={selectAllRoles}
                      className="text-[#c5a059] hover:underline cursor-pointer"
                    >
                      Todos
                    </button>
                    <span className="text-[#2a2a2e]">|</span>
                    <button
                      type="button"
                      onClick={clearAllRoles}
                      className="text-[#6b6b75] hover:text-white cursor-pointer"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                {state.roles.length === 0 ? (
                  <p className="text-xs text-[#6b6b75] italic p-3 bg-[#0a0a0b] rounded border border-[#1f1f23]">
                    No hay roles configurados.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 bg-[#0a0a0b] rounded-xl border border-[#1f1f23]">
                    {state.roles.map(role => {
                      const isChecked = selectedRoleIds.includes(role.id);
                      const isPrimary = primaryRoleId === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono tracking-wider uppercase border transition-all cursor-pointer select-none ${
                            isPrimary
                              ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059] font-bold shadow-sm'
                              : isChecked
                              ? 'bg-[#c5a059]/10 text-white border-[#c5a059]/40'
                              : 'bg-[#141418] text-[#6b6b75] border-[#1f1f23] hover:border-[#2a2a2e] hover:text-[#e0e0e0]'
                          }`}
                        >
                          {isChecked ? <CheckSquare size={13} className="text-[#c5a059]" /> : <Square size={13} />}
                          <span>{role.name}</span>
                          {isPrimary && <Star size={10} className="fill-[#c5a059] text-[#c5a059]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botones de Acción del Modal */}
              <div className="pt-3 border-t border-[#1f1f23] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-[#1a1a1d] hover:bg-[#25252a] text-[#888894] hover:text-white text-xs font-mono uppercase tracking-wider rounded-xl border border-[#2a2a2e] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-[#c5a059]/10 hover:shadow-[#c5a059]/20 active:scale-95"
                >
                  {editingId ? 'Guardar Cambios' : 'Registrar Integrante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL DE CONFIRMACIÓN PARA ELIMINAR INTEGRANTE        */}
      {/* ======================================================== */}
      {deleteConfirmMusician && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141418] border border-red-900/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={22} />
              <h3 className="font-serif text-lg text-white font-medium">¿Eliminar Integrante?</h3>
            </div>
            <p className="text-xs text-[#a0a0ab] leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong className="text-white">{deleteConfirmMusician.name}</strong>? Se removerá también de todos los turnos asignados y parejas vinculadas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMusician(null)}
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMusician(deleteConfirmMusician.id);
                  if (editingId === deleteConfirmMusician.id) handleCloseModal();
                  showToast(`Integrante "${deleteConfirmMusician.name}" eliminado.`);
                  setDeleteConfirmMusician(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
