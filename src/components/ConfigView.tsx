import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AppState,
  DAYS_OF_WEEK,
  DEFAULT_SONG_CATEGORIES,
  INITIAL_PRELOADED_ROLES,
  Role,
  Slot,
} from '../types';
import { generateId, getInitialDefaultState, scanAvailableLocalBackups, fetchCloudBackup, DetectedBackup, isRehearsalSlot } from '../services/storage';
import {
  Settings,
  Clock,
  Pencil,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckSquare,
  Square,
  Sparkles,
  KeyRound,
  AlertCircle,
  Check,
  RefreshCw,
  GitBranch,
  Smartphone,
  CheckCircle2,
  ArrowUpCircle,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Calendar,
  Tag,
  Plus,
  Layers,
  Music,
  History,
  Database,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface ConfigViewProps {
  state: AppState;
  onSaveRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
  onSaveSlot: (slot: Slot) => void;
  onDeleteSlot: (slotId: string) => void;
  onUpdateAdminPassword: (newPassword: string) => void;
  onResetAllData: (freshState: AppState) => void;
  onImportState: (importedState: AppState) => void;
  onSaveSongCategories?: (categories: string[]) => void;
  onRenameSongCategory?: (oldCat: string, newCat: string) => void;
  showToast: (msg: string) => void;
  onCheckForUpdates?: () => Promise<boolean>;
  isCheckingUpdate?: boolean;
  isInstallable?: boolean;
  isInstalled?: boolean;
  isIOS?: boolean;
  onInstallApp?: () => Promise<boolean>;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  state,
  onSaveRole,
  onDeleteRole,
  onSaveSlot,
  onDeleteSlot,
  onUpdateAdminPassword,
  onResetAllData,
  onImportState,
  onSaveSongCategories,
  onRenameSongCategory,
  showToast,
  onCheckForUpdates,
  isCheckingUpdate = false,
  isInstallable = false,
  isInstalled = false,
  isIOS = false,
  onInstallApp,
}) => {
  // Roles state
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');

  // Slots (Eventos y Turnos) state
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [slotLabel, setSlotLabel] = useState('');
  const [slotDay, setSlotDay] = useState<number>(6);
  const [slotTime, setSlotTime] = useState('10:00');
  const [slotDuration, setSlotDuration] = useState<number>(90);
  const [hasRehearsal, setHasRehearsal] = useState<boolean>(false);
  const [rehearsalDay, setRehearsalDay] = useState<number>(5);
  const [rehearsalTime, setRehearsalTime] = useState<string>('18:00');
  const [rehearsalDuration, setRehearsalDuration] = useState<number>(90);
  const [rehearsalLabel, setRehearsalLabel] = useState<string>('Ensayo previo');
  const [slotRoleIds, setSlotRoleIds] = useState<string[]>([]);

  // Categorías de Alabanzas state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<string | null>(null);

  // Admin password change state
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Confirmation Modals
  const [deleteConfirmSlot, setDeleteConfirmSlot] = useState<{ id: string; label: string } | null>(null);
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<{ id: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Import JSON file ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize slot roles with all roles if empty
  useEffect(() => {
    if (slotRoleIds.length === 0 && state.roles.length > 0 && !editingSlotId) {
      setSlotRoleIds(state.roles.map(r => r.id));
    }
  }, [state.roles]);

  // --- Handlers for Roles ---
  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roleName.trim();
    if (!clean) return;

    const roleToSave: Role = {
      id: editingRoleId || generateId('rol'),
      name: clean,
    };

    onSaveRole(roleToSave);
    showToast(editingRoleId ? `Rol "${clean}" actualizado.` : `Rol "${clean}" agregado.`);
    setEditingRoleId(null);
    setRoleName('');
  };

  const startEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
  };

  const cancelEditRole = () => {
    setEditingRoleId(null);
    setRoleName('');
  };

  const handleRestorePreloadedRoles = () => {
    INITIAL_PRELOADED_ROLES.forEach(preloadedName => {
      const exists = state.roles.some(
        r => r.name.toLowerCase() === preloadedName.toLowerCase()
      );
      if (!exists) {
        onSaveRole({
          id: generateId('rol'),
          name: preloadedName,
        });
      }
    });
    showToast('Roles pre-cargados restaurados con éxito.');
  };

  // --- Handlers for Slots (Eventos y Turnos) ---
  const handleSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const label = slotLabel.trim();
    if (!label || !slotTime) {
      showToast('Por favor completa el nombre y la hora del evento.');
      return;
    }

    const slotToSave: Slot = {
      id: editingSlotId || generateId('slt'),
      label,
      day: slotDay,
      time: slotTime,
      durationMinutes: Number(slotDuration) || 90,
      rehearsal: hasRehearsal
        ? {
            enabled: true,
            day: rehearsalDay,
            time: rehearsalTime,
            durationMinutes: Number(rehearsalDuration) || 90,
            label: rehearsalLabel.trim() || 'Ensayo previo',
          }
        : undefined,
      roleIds: slotRoleIds,
    };

    onSaveSlot(slotToSave);
    showToast(editingSlotId ? `Evento "${label}" actualizado.` : `Evento "${label}" creado.`);
    cancelEditSlot();
  };

  const startEditSlot = (slot: Slot) => {
    setEditingSlotId(slot.id);
    setSlotLabel(slot.label);
    setSlotDay(slot.day);
    setSlotTime(slot.time);
    setSlotDuration(slot.durationMinutes || 90);
    if (slot.rehearsal && slot.rehearsal.enabled) {
      setHasRehearsal(true);
      setRehearsalDay(slot.rehearsal.day);
      setRehearsalTime(slot.rehearsal.time);
      setRehearsalDuration(slot.rehearsal.durationMinutes || 90);
      setRehearsalLabel(slot.rehearsal.label || 'Ensayo previo');
    } else {
      setHasRehearsal(false);
      setRehearsalDay(5);
      setRehearsalTime('18:00');
      setRehearsalDuration(90);
      setRehearsalLabel('Ensayo previo');
    }
    setSlotRoleIds(slot.roleIds || []);
  };

  const cancelEditSlot = () => {
    setEditingSlotId(null);
    setSlotLabel('');
    setSlotDay(6);
    setSlotTime('10:00');
    setSlotDuration(90);
    setHasRehearsal(false);
    setRehearsalDay(5);
    setRehearsalTime('18:00');
    setRehearsalDuration(90);
    setRehearsalLabel('Ensayo previo');
    setSlotRoleIds(state.roles.map(r => r.id));
  };

  const toggleSlotRole = (roleId: string) => {
    setSlotRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  // --- Handlers for Song Categories ---
  const currentCategories = state.songCategories && state.songCategories.length > 0
    ? state.songCategories
    : DEFAULT_SONG_CATEGORIES;

  // Conteo de canciones por categoría
  const songCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    currentCategories.forEach(cat => { counts[cat] = 0; });

    (state.songCatalog || []).forEach(song => {
      const cats = song.categories && song.categories.length > 0
        ? song.categories
        : (song.category ? [song.category] : []);
      cats.forEach(c => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });

    return counts;
  }, [state.songCatalog, currentCategories]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;

    if (currentCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
      showToast(`La categoría "${clean}" ya existe.`);
      return;
    }

    const updated = [...currentCategories, clean];
    if (onSaveSongCategories) {
      onSaveSongCategories(updated);
    }
    setNewCategoryName('');
    showToast(`Categoría "${clean}" agregada con éxito.`);
  };

  const handleRenameCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const oldName = editingCategory.oldName;
    const newName = editingCategory.newName.trim();

    if (!newName) {
      showToast('El nombre de la categoría no puede estar vacío.');
      return;
    }

    if (oldName === newName) {
      setEditingCategory(null);
      return;
    }

    if (currentCategories.some(c => c.toLowerCase() === newName.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      showToast(`Ya existe una categoría llamada "${newName}".`);
      return;
    }

    if (onRenameSongCategory) {
      onRenameSongCategory(oldName, newName);
    } else if (onSaveSongCategories) {
      onSaveSongCategories(currentCategories.map(c => c === oldName ? newName : c));
    }
    setEditingCategory(null);
    showToast(`Categoría "${oldName}" actualizada a "${newName}".`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (currentCategories.length <= 1) {
      showToast('Debe haber al menos una categoría en el sistema.');
      setDeleteConfirmCategory(null);
      return;
    }

    const updated = currentCategories.filter(c => c !== catToDelete);
    if (onSaveSongCategories) {
      onSaveSongCategories(updated);
    }
    setDeleteConfirmCategory(null);
    showToast(`Categoría "${catToDelete}" eliminada.`);
  };

  const handleRestoreDefaultCategories = () => {
    if (onSaveSongCategories) {
      onSaveSongCategories(DEFAULT_SONG_CATEGORIES);
      showToast('Categorías predeterminadas restauradas.');
    }
  };

  // --- Password Handler ---
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    const currentPwd = (state.adminPassword || 'alabanza2026').trim();
    const enteredCurrent = currentPasswordInput.trim();
    const enteredNew = newPasswordInput.trim();
    const enteredConfirm = confirmPasswordInput.trim();

    // 1. Validar contraseña actual si se ha configurado
    if (enteredCurrent !== currentPwd) {
      setPasswordStatus({
        type: 'error',
        message: 'La contraseña actual ingresada es incorrecta. Verifica e intenta de nuevo.',
      });
      showToast('Contraseña actual incorrecta.');
      return;
    }

    // 2. Validar longitud mínima
    if (enteredNew.length < 6) {
      setPasswordStatus({
        type: 'error',
        message: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      showToast('La nueva clave debe tener al menos 6 caracteres.');
      return;
    }

    // 3. Validar coincidencia
    if (enteredNew !== enteredConfirm) {
      setPasswordStatus({
        type: 'error',
        message: 'La nueva contraseña y su confirmación no coinciden.',
      });
      showToast('Las contraseñas no coinciden.');
      return;
    }

    // Guardar
    onUpdateAdminPassword(enteredNew);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordStatus({
      type: 'success',
      message: '¡Contraseña de administrador actualizada correctamente! Tu sesión activa se mantiene.',
    });
    showToast('Contraseña de administrador actualizada con éxito.');
  };

  // --- Handlers for Backup / Export / Reset ---
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `alabanza_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Copia de seguridad descargada.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = event => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.roles) && Array.isArray(parsed.musicians)) {
            onImportState(parsed);
            showToast('¡Datos importados con éxito!');
          } else {
            showToast('El archivo JSON no tiene un formato válido.');
          }
        } catch (err) {
          showToast('Error al leer el archivo JSON.');
        }
      };
    }
  };

  const handleExecuteReset = () => {
    const fresh = getInitialDefaultState();
    onResetAllData(fresh);
    setShowResetConfirm(false);
    showToast('Datos restablecidos al estado inicial.');
  };

  // --- Recuperación de Respaldos de Navegador y Firestore ---
  const [localBackups, setLocalBackups] = useState<DetectedBackup[]>([]);
  const [isScanningBackups, setIsScanningBackups] = useState(false);

  const handleRefreshBackups = () => {
    setIsScanningBackups(true);
    const found = scanAvailableLocalBackups();
    setLocalBackups(found);
    setTimeout(() => setIsScanningBackups(false), 300);
  };

  useEffect(() => {
    handleRefreshBackups();
  }, []);

  const handleCheckCloudBackup = async () => {
    showToast('Consultando respaldo en Firestore...');
    const cloudBkp = await fetchCloudBackup();
    if (cloudBkp) {
      const assignCount = Object.keys(cloudBkp.assignments || {}).reduce(
        (acc, k) => acc + Object.keys(cloudBkp.assignments[k] || {}).length,
        0
      );
      if (assignCount > 0) {
        onImportState(cloudBkp);
        showToast(`¡Respaldo en la nube recuperado con éxito (${assignCount} asignaciones)!`);
      } else {
        showToast('El respaldo en la nube no contiene asignaciones adicionales.');
      }
    } else {
      showToast('No se encontró copia en el respaldo de Firestore.');
    }
  };

  const sortedSlots = useMemo(() => {
    return [...state.slots]
      .filter(s => !isRehearsalSlot(s, state.slots))
      .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  }, [state.slots]);

  return (
    <div className="space-y-8" id="config-view">
      {/* SECCIÓN 1: SEGURIDAD & CONTRASEÑA DE ADMINISTRADOR */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-[#1f1f23] pb-4">
          <div className="w-8 h-8 rounded-lg bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 flex items-center justify-center">
            <KeyRound size={16} />
          </div>
          <div>
            <h2 className="font-serif text-xl font-light text-white">
              Seguridad & <span className="italic text-[#c5a059]">Contraseña del Administrador</span>
            </h2>
            <p className="text-xs text-[#6b6b75]">
              Protege las asignaciones, configuración de roles, catálogo y estadísticas frente a visitantes públicos.
            </p>
          </div>
        </div>

        {passwordStatus && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
              passwordStatus.type === 'error'
                ? 'bg-red-950/40 border-red-800/60 text-red-200'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
            }`}
          >
            {passwordStatus.type === 'error' ? (
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            )}
            <span>{passwordStatus.message}</span>
          </div>
        )}

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-xl">
          {/* Contraseña Actual */}
          <div>
            <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
              Contraseña Actual *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPasswordInput}
                onChange={e => setCurrentPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña actual..."
                required
                className="w-full bg-[#0a0a0b] text-white text-xs rounded-xl px-3.5 py-2.5 pr-10 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b75] hover:text-[#c5a059] cursor-pointer"
                title={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Nueva Contraseña y Confirmación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
                Nueva Contraseña * (Mín. 6 car.)
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  placeholder="Nueva clave..."
                  required
                  minLength={6}
                  className="w-full bg-[#0a0a0b] text-white text-xs rounded-xl px-3.5 py-2.5 pr-10 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b75] hover:text-[#c5a059] cursor-pointer"
                  title={showNewPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPasswordInput}
                onChange={e => setConfirmPasswordInput(e.target.value)}
                placeholder="Repite la nueva clave..."
                required
                minLength={6}
                className="w-full bg-[#0a0a0b] text-white text-xs rounded-xl px-3.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-[#888894] font-mono">
              <ShieldCheck size={13} className="text-[#c5a059]" />
              <span>Sincronización instantánea y cifrada en la nube</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-[#c5a059]/20"
            >
              Guardar Nueva Clave
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2: EVENTOS Y TURNOS CONFIGURADOS (DÍA, HORA, DURACIÓN Y ENSAYO) */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-[#1f1f23] pb-4">
          <h2 className="font-serif text-2xl font-light tracking-tight text-white flex items-center gap-2">
            <Clock size={18} className="text-[#c5a059]" />
            <span>Eventos y Turnos <span className="italic text-[#c5a059]">Configurados</span></span>
          </h2>
          <p className="text-xs text-[#6b6b75] mt-0.5">
            Configura el día, horario y duración de cada evento recurrente (cultos, turnos), y define si incluye un ensayo previo programado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario de Turno / Evento */}
          <form onSubmit={handleSlotSubmit} className="lg:col-span-5 space-y-4">
            <h3 className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em]">
              {editingSlotId ? 'Editar Evento / Turno' : 'Agregar Evento / Turno'}
            </h3>

            <div>
              <label className="block font-mono text-[10px] text-[#6b6b75] mb-1 uppercase tracking-[0.2em]">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={slotLabel}
                onChange={e => setSlotLabel(e.target.value)}
                placeholder="Ej: Culto Dominical Matutino, Culto de Jóvenes"
                required
                className="w-full bg-[#0a0a0b] text-white text-sm rounded-lg px-3.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
              />
            </div>

            {/* Día, Hora y Duración del Evento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-mono text-[10px] text-[#6b6b75] mb-1 uppercase tracking-[0.2em]">
                  Día
                </label>
                <select
                  value={slotDay}
                  onChange={e => setSlotDay(parseInt(e.target.value, 10))}
                  className="w-full bg-[#0a0a0b] text-white text-xs rounded-lg px-2.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#6b6b75] mb-1 uppercase tracking-[0.2em]">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  value={slotTime}
                  onChange={e => setSlotTime(e.target.value)}
                  required
                  className="w-full bg-[#0a0a0b] text-[#c5a059] font-mono text-sm font-bold rounded-lg px-2.5 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['08:30', '09:00', '10:00', '11:00', '17:00', '18:00', '19:00', '20:00'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlotTime(t)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer border ${
                        slotTime === t
                          ? 'bg-[#c5a059] text-black font-bold border-[#c5a059]'
                          : 'bg-[#141418] text-[#888894] border-[#25252a] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#6b6b75] mb-1 uppercase tracking-[0.2em]">
                  Duración (min)
                </label>
                <input
                  type="number"
                  min={15}
                  max={360}
                  step={15}
                  value={slotDuration}
                  onChange={e => setSlotDuration(Math.max(15, parseInt(e.target.value, 10) || 90))}
                  className="w-full bg-[#0a0a0b] text-white text-xs rounded-lg px-2.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Presets de duración */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-mono text-[#6b6b75]">Presets:</span>
              {[60, 90, 120, 150].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSlotDuration(mins)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors border ${
                    slotDuration === mins
                      ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40 font-bold'
                      : 'bg-[#0a0a0b] text-[#6b6b75] border-[#2a2a2e] hover:text-white'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* CAJA DE ENSAYO ASOCIADO */}
            <div className="bg-[#0e0e11] border border-[#232328] rounded-xl p-3.5 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasRehearsal}
                  onChange={e => setHasRehearsal(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c5a059] focus:ring-0 focus:ring-offset-0 bg-[#0a0a0b] border-[#2a2a2e] cursor-pointer"
                />
                <span className="text-xs font-medium text-white flex items-center gap-1.5">
                  <Music size={13} className="text-[#c5a059]" />
                  <span>Programar Ensayo para este Evento</span>
                </span>
              </label>

              {hasRehearsal && (
                <div className="space-y-3 pt-2 border-t border-[#1f1f23]">
                  <div>
                    <label className="block font-mono text-[10px] text-[#888894] mb-1 uppercase tracking-[0.2em]">
                      Nombre / Etiqueta del Ensayo
                    </label>
                    <input
                      type="text"
                      value={rehearsalLabel}
                      onChange={e => setRehearsalLabel(e.target.value)}
                      placeholder="Ej: Ensayo General de Alabanza"
                      className="w-full bg-[#0a0a0b] text-white text-xs rounded-lg px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-mono text-[10px] text-[#888894] mb-1 uppercase tracking-[0.2em]">
                        Día Ensayo
                      </label>
                      <select
                        value={rehearsalDay}
                        onChange={e => setRehearsalDay(parseInt(e.target.value, 10))}
                        className="w-full bg-[#0a0a0b] text-white text-xs rounded-lg px-2 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
                      >
                        {DAYS_OF_WEEK.map((d, idx) => (
                          <option key={idx} value={idx}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-[#888894] mb-1 uppercase tracking-[0.2em]">
                        Hora Ensayo
                      </label>
                      <input
                        type="time"
                        value={rehearsalTime}
                        onChange={e => setRehearsalTime(e.target.value)}
                        className="w-full bg-[#0a0a0b] text-amber-400 font-mono text-sm font-bold rounded-lg px-2 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setRehearsalTime(t)}
                            className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer border ${
                              rehearsalTime === t
                                ? 'bg-amber-400 text-black font-bold border-amber-400'
                                : 'bg-[#141418] text-[#888894] border-[#25252a] hover:text-white'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] text-[#888894] mb-1 uppercase tracking-[0.2em]">
                        Duración (min)
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={300}
                        step={15}
                        value={rehearsalDuration}
                        onChange={e => setRehearsalDuration(Math.max(15, parseInt(e.target.value, 10) || 90))}
                        className="w-full bg-[#0a0a0b] text-white text-xs rounded-lg px-2 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Roles Requeridos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em]">
                  Roles Requeridos ({slotRoleIds.length})
                </label>
                <div className="flex gap-2 text-[10px] font-mono uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => setSlotRoleIds(state.roles.map(r => r.id))}
                    className="text-[#c5a059] hover:underline cursor-pointer"
                  >
                    Todos
                  </button>
                  <span className="text-[#2a2a2e]">|</span>
                  <button
                    type="button"
                    onClick={() => setSlotRoleIds([])}
                    className="text-[#6b6b75] hover:text-white cursor-pointer"
                  >
                    Ninguno
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#0a0a0b] rounded-xl border border-[#1f1f23]">
                {state.roles.map(r => {
                  const isChecked = slotRoleIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleSlotRole(r.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/40'
                          : 'bg-[#141418] text-[#6b6b75] border-[#1f1f23] hover:text-[#e0e0e0]'
                      }`}
                    >
                      {isChecked ? <CheckSquare size={11} className="text-[#c5a059]" /> : <Square size={11} />}
                      <span>{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs uppercase tracking-widest py-2.5 px-3 rounded-lg transition-all cursor-pointer shadow-lg shadow-[#c5a059]/10"
              >
                {editingSlotId ? 'Guardar Cambios' : 'Agregar Evento'}
              </button>
              {editingSlotId && (
                <button
                  type="button"
                  onClick={cancelEditSlot}
                  className="bg-[#1a1a1d] hover:bg-[#232328] text-[#6b6b75] hover:text-white text-xs uppercase tracking-wider py-2.5 px-3 rounded-lg border border-[#2a2a2e] cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de Turnos / Eventos */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em]">
              Eventos Configurados ({sortedSlots.length})
            </h3>
            {sortedSlots.length === 0 ? (
              <p className="text-xs text-[#6b6b75] italic p-4 bg-[#0a0a0b] rounded-xl border border-[#1f1f23]">
                No hay turnos ni eventos configurados.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {sortedSlots.map(s => {
                  return (
                    <div
                      key={s.id}
                      className="bg-[#0a0a0b] border border-[#1f1f23] hover:border-[#2a2a2e] p-3.5 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-xs text-white">{s.label}</span>
                          <span className="font-mono text-[10px] text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/20 uppercase tracking-wider">
                            {DAYS_OF_WEEK[s.day]} · {s.time} HS · {s.durationMinutes || 90} min
                          </span>
                        </div>

                        {/* Rehearsal badge si está configurado */}
                        {s.rehearsal && s.rehearsal.enabled && (
                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300/90 bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-800/30">
                            <Music size={11} className="text-amber-400" />
                            <span>
                              {s.rehearsal.label || 'Ensayo'}: {DAYS_OF_WEEK[s.rehearsal.day]} a las {s.rehearsal.time} HS ({s.rehearsal.durationMinutes || 90} min)
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {(s.roleIds || []).map(rid => {
                            const r = state.roles.find(x => x.id === rid);
                            return r ? (
                              <span
                                key={r.id}
                                className="text-[10px] font-mono bg-[#141418] text-[#6b6b75] px-2 py-0.5 rounded border border-[#1f1f23]"
                              >
                                {r.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => startEditSlot(s)}
                          className="w-8 h-8 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-[#6b6b75] hover:text-white border border-[#2a2a2e] flex items-center justify-center cursor-pointer"
                          title="Editar evento"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmSlot({ id: s.id, label: s.label })}
                          className="w-8 h-8 rounded-lg bg-[#1a1a1d] hover:bg-red-950/40 text-[#6b6b75] hover:text-red-400 border border-[#2a2a2e] flex items-center justify-center cursor-pointer"
                          title="Eliminar evento"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN NUEVA: CATEGORÍAS DE CANCIONES Y ALABANZAS */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f1f23] pb-4">
          <div>
            <h2 className="font-serif text-2xl font-light tracking-tight text-white flex items-center gap-2">
              <Layers size={18} className="text-[#c5a059]" />
              <span>Categorías de <span className="italic text-[#c5a059]">Canciones & Alabanzas</span></span>
            </h2>
            <p className="text-xs text-[#6b6b75] mt-0.5">
              Administra las etiquetas del cancionero. Cada canción puede ser asignada a múltiples categorías (ej. Adoración, Júbilo, Comunión).
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestoreDefaultCategories}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a1a1d] hover:bg-[#232328] text-[#c5a059] text-[11px] font-mono uppercase tracking-wider rounded-lg border border-[#c5a059]/30 hover:border-[#c5a059] transition-all cursor-pointer"
            title="Restaurar las 7 categorías estándar predefinidas"
          >
            <Sparkles size={12} />
            <span>Restaurar Categorías Predeterminadas</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario Agregar Categoría */}
          <form onSubmit={handleAddCategory} className="lg:col-span-4 space-y-3">
            <h3 className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em]">
              Nueva Categoría
            </h3>
            <div>
              <label className="block font-mono text-[10px] text-[#6b6b75] mb-1 uppercase tracking-[0.2em]">
                Nombre de la Categoría
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Ej: Apertura, Especial, Reflexión"
                required
                className="w-full bg-[#0a0a0b] text-white text-sm rounded-lg px-3.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs uppercase tracking-widest py-2.5 px-3 rounded-lg transition-all cursor-pointer shadow-lg shadow-[#c5a059]/10 flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Agregar Categoría</span>
            </button>
          </form>

          {/* Lista de Categorías Existentes */}
          <div className="lg:col-span-8 space-y-3">
            <h3 className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em]">
              Categorías Activas ({currentCategories.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {currentCategories.map(cat => {
                const count = songCountByCategory[cat] || 0;
                const isEditing = editingCategory?.oldName === cat;

                return (
                  <div
                    key={cat}
                    className="bg-[#0a0a0b] border border-[#1f1f23] hover:border-[#2a2a2e] p-3 rounded-xl flex items-center justify-between gap-2"
                  >
                    {isEditing ? (
                      <form
                        onSubmit={handleRenameCategorySubmit}
                        className="flex-1 flex items-center gap-1.5"
                      >
                        <input
                          type="text"
                          value={editingCategory.newName}
                          onChange={e =>
                            setEditingCategory({ ...editingCategory, newName: e.target.value })
                          }
                          autoFocus
                          className="flex-1 bg-[#141418] text-white text-xs px-2.5 py-1 rounded border border-[#c5a059] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 bg-[#c5a059] text-black text-xs font-bold rounded cursor-pointer"
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="px-2 py-1 bg-[#1a1a1d] text-[#888894] text-xs rounded cursor-pointer hover:text-white"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag size={13} className="text-[#c5a059] flex-shrink-0" />
                          <span className="text-xs font-medium text-white truncate">{cat}</span>
                          <span className="text-[10px] font-mono text-[#888894] bg-[#141418] px-1.5 py-0.5 rounded border border-[#232328] whitespace-nowrap">
                            {count} {count === 1 ? 'canción' : 'canciones'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                            className="w-7 h-7 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-[#6b6b75] hover:text-white border border-[#2a2a2e] flex items-center justify-center cursor-pointer"
                            title={`Renombrar categoría "${cat}"`}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCategory(cat)}
                            className="w-7 h-7 rounded-lg bg-[#1a1a1d] hover:bg-red-950/40 text-[#6b6b75] hover:text-red-400 border border-[#2a2a2e] flex items-center justify-center cursor-pointer"
                            title={`Eliminar categoría "${cat}"`}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: ROLES / FUNCIONES */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f1f23] pb-4">
          <div>
            <h2 className="font-serif text-2xl font-light tracking-tight text-white flex items-center gap-2">
              <Settings size={18} className="text-[#c5a059]" />
              <span>Roles & <span className="italic text-[#c5a059]">Funciones</span></span>
            </h2>
            <p className="text-xs text-[#6b6b75] mt-0.5">
              Instrumentos, voces y áreas técnicas disponibles en el ministerio.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestorePreloadedRoles}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a1a1d] hover:bg-[#232328] text-[#c5a059] text-[11px] font-mono uppercase tracking-wider rounded-lg border border-[#c5a059]/30 hover:border-[#c5a059] transition-all cursor-pointer"
          >
            <Sparkles size={12} />
            <span>Restaurar 10 Roles Pre-cargados</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario Rol */}
          <form onSubmit={handleRoleSubmit} className="lg:col-span-4 space-y-3">
            <h3 className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em]">
              {editingRoleId ? 'Editar Rol' : 'Agregar Nuevo Rol'}
            </h3>
            <div>
              <input
                type="text"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder="Ej: Saxofón, Guía"
                required
                className="w-full bg-[#0a0a0b] text-white text-sm rounded-lg px-3.5 py-2.5 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs uppercase tracking-widest py-2.5 px-3 rounded-lg transition-all cursor-pointer shadow-lg shadow-[#c5a059]/10"
              >
                {editingRoleId ? 'Guardar Cambios' : 'Agregar Rol'}
              </button>
              {editingRoleId && (
                <button
                  type="button"
                  onClick={cancelEditRole}
                  className="bg-[#1a1a1d] hover:bg-[#232328] text-[#6b6b75] hover:text-white text-xs uppercase tracking-wider py-2.5 px-3 rounded-lg border border-[#2a2a2e] cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de Roles */}
          <div className="lg:col-span-8">
            <h3 className="font-mono text-[10px] text-[#6b6b75] uppercase tracking-[0.2em] mb-3">
              Roles Configurados ({state.roles.length})
            </h3>
            {state.roles.length === 0 ? (
              <p className="text-xs text-[#6b6b75] italic p-3 bg-[#0a0a0b] rounded-xl border border-[#1f1f23]">
                No hay roles configurados.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {state.roles.map(r => {
                  const musicianCount = state.musicians.filter(m =>
                    (m.roleIds || []).includes(r.id)
                  ).length;
                  return (
                    <div
                      key={r.id}
                      className="bg-[#0a0a0b] border border-[#1f1f23] hover:border-[#2a2a2e] p-3 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {r.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#6b6b75]">
                          {musicianCount} integrante(s) habilitado(s)
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => startEditRole(r)}
                          className="w-7 h-7 rounded-lg bg-[#1a1a1d] hover:bg-[#232328] text-[#6b6b75] hover:text-white border border-[#2a2a2e] flex items-center justify-center cursor-pointer"
                          title="Editar rol"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRole({ id: r.id, name: r.name })}
                          className="w-7 h-7 rounded-lg bg-[#1a1a1d] hover:bg-red-950/40 text-[#6b6b75] hover:text-red-400 border border-[#2a2a2e] flex items-center justify-center cursor-pointer"
                          title="Eliminar rol"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: RESPALDO Y RECUPERACIÓN DE DATOS */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 shadow-xl space-y-5" id="config-backups-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f23] pb-4">
          <div>
            <h2 className="font-serif text-xl font-light text-white flex items-center gap-2">
              <Download size={16} className="text-[#c5a059]" />
              <span>Respaldo & <span className="italic text-[#c5a059]">Recuperación de Datos</span></span>
            </h2>
            <p className="text-xs text-[#6b6b75] mt-0.5">
              Gestiona copias locales, exporta en JSON o restaura versiones previas guardadas en este navegador o en Firestore.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshBackups}
              disabled={isScanningBackups}
              className="px-3 py-1.5 rounded-lg bg-[#0a0a0b] hover:bg-[#1a1a1d] border border-[#2a2a2e] text-xs text-[#a0a0ab] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
              title="Volver a escanear memoria de este navegador"
            >
              <RefreshCw size={12} className={isScanningBackups ? 'animate-spin text-[#c5a059]' : ''} />
              <span>Escanear navegador</span>
            </button>
            <button
              onClick={handleCheckCloudBackup}
              className="px-3 py-1.5 rounded-lg bg-[#c5a059]/15 hover:bg-[#c5a059]/25 border border-[#c5a059]/40 text-xs text-[#c5a059] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Buscar copia de seguridad secundaria en Firestore"
            >
              <Database size={12} />
              <span>Buscar en Firestore</span>
            </button>
          </div>
        </div>

        {/* Acciones principales: Exportar, Importar, Restablecer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-2 p-3.5 bg-[#0a0a0b] hover:bg-[#1a1a1d] border border-[#2a2a2e] hover:border-[#c5a059]/40 rounded-xl text-xs font-mono uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm"
          >
            <Download size={14} className="text-[#c5a059]" />
            <span>Exportar Copia (JSON)</span>
          </button>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3.5 bg-[#0a0a0b] hover:bg-[#1a1a1d] border border-[#2a2a2e] hover:border-[#c5a059]/40 rounded-xl text-xs font-mono uppercase tracking-wider text-white transition-all cursor-pointer shadow-sm"
            >
              <Upload size={14} className="text-[#c5a059]" />
              <span>Importar Copia (JSON)</span>
            </button>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center justify-center gap-2 p-3.5 bg-[#0a0a0b] hover:bg-red-950/20 border border-[#2a2a2e] hover:border-red-900/40 rounded-xl text-xs font-mono uppercase tracking-wider text-[#6b6b75] hover:text-red-400 transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw size={14} className="text-red-400" />
            <span>Restablecer Fábrica</span>
          </button>
        </div>

        {/* Lista de Versiones Previas Detectadas en el Navegador */}
        <div className="pt-2 space-y-2.5">
          <div className="flex items-center gap-2">
            <History size={14} className="text-[#c5a059]" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#a0a0ab]">
              Copias de Seguridad Detectadas en este Dispositivo ({localBackups.length})
            </h3>
          </div>

          {localBackups.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-[#0a0a0b] border border-[#1f1f23] text-center text-xs text-[#6b6b75]">
              No se detectaron copias previas adicionales en la memoria de este navegador.
            </div>
          ) : (
            <div className="space-y-2">
              {localBackups.map(bkp => (
                <div
                  key={bkp.key}
                  className="p-3 rounded-xl bg-[#0a0a0b] border border-[#1f1f23] hover:border-[#2a2a2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-[#141418] border border-[#222226] text-[11px] font-mono text-[#c5a059]">
                        {bkp.key}
                      </span>
                      <span className="text-xs text-[#8e8e99]">{bkp.dateStr}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6b6b75]">
                      <span className="font-semibold text-emerald-400">
                        {bkp.assignmentsCount} asignaciones
                      </span>
                      <span>•</span>
                      <span>{bkp.musiciansCount} músicos</span>
                      <span>•</span>
                      <span>{bkp.slotsCount} turnos</span>
                      <span>•</span>
                      <span>{bkp.songsCount} canciones</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onImportState(bkp.state);
                      showToast(`¡Versión "${bkp.key}" restaurada y guardada en la nube!`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 flex-shrink-0"
                  >
                    <RotateCcw size={12} />
                    <span>Restaurar esta versión</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 5: DESPLIEGUE CONTINUO EN GITHUB & ACTUALIZACIONES PWA */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#232328]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <GitBranch size={16} />
            </div>
            <div>
              <h2 className="font-serif text-xl font-light text-white">
                Actualizaciones & <span className="italic text-[#c5a059]">Despliegue Automático</span>
              </h2>
              <p className="text-xs text-[#8e8e99]">
                Sincronización continua de versiones desde GitHub hacia la app instalada
              </p>
            </div>
          </div>

          {/* Botón Buscar Actualizaciones */}
          {onCheckForUpdates && (
            <button
              onClick={async () => {
                const hasUpdate = await onCheckForUpdates();
                if (hasUpdate) {
                  showToast('¡Nueva versión encontrada! Revisa el aviso superior.');
                } else {
                  showToast('Tu aplicación está al día con la última versión de GitHub.');
                }
              }}
              disabled={isCheckingUpdate}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#1e1e24] hover:bg-[#282830] border border-[#33333d] hover:border-[#c5a059]/50 text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isCheckingUpdate ? 'animate-spin text-[#c5a059]' : 'text-[#c5a059]'} />
              <span>{isCheckingUpdate ? 'Comprobando...' : 'Buscar Actualización'}</span>
            </button>
          )}
        </div>

        {/* Tarjeta de Instalación PWA */}
        {onInstallApp && (
          <PWAInstallButton
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            isIOS={isIOS}
            onInstall={onInstallApp}
            variant="full"
          />
        )}

        {/* Cómo funciona el ciclo GitHub -> App Instalada */}
        <div className="bg-[#0a0a0b] p-4 rounded-2xl border border-[#232328] space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
            <Sparkles size={13} />
            <span>¿Cómo se actualiza la app al subir a GitHub?</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#a0a0ab]">
            <div className="p-3 bg-[#121216] rounded-xl border border-[#1f1f23] space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] text-[10px] font-mono flex items-center justify-center">1</span>
                <span>Push a GitHub</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Al hacer <code>git push</code> a la rama <code>main</code>, GitHub Actions compila automáticamente los nuevos cambios.
              </p>
            </div>

            <div className="p-3 bg-[#121216] rounded-xl border border-[#1f1f23] space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] text-[10px] font-mono flex items-center justify-center">2</span>
                <span>Detección en Silencio</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                El Service Worker consulta al servidor en segundo plano cada 5 minutos y al enfocar la pantalla.
              </p>
            </div>

            <div className="p-3 bg-[#121216] rounded-xl border border-[#1f1f23] space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#c5a059]/20 text-[#c5a059] text-[10px] font-mono flex items-center justify-center">3</span>
                <span>Aviso Instantáneo</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Aparece el aviso flotante <em>"¡Nueva versión disponible!"</em> para actualizar con 1 clic sin perder datos ni canciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Confirmación Eliminar Turno */}
      {deleteConfirmSlot && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-red-900/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg text-white font-medium">¿Eliminar Turno?</h3>
            </div>
            <p className="text-xs text-[#a0a0ab]">
              ¿Estás seguro de que deseas eliminar el turno recurrente <strong className="text-white">{deleteConfirmSlot.label}</strong>? Se removerán todas las asignaciones vinculadas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmSlot(null)}
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSlot(deleteConfirmSlot.id);
                  if (editingSlotId === deleteConfirmSlot.id) cancelEditSlot();
                  showToast(`Turno "${deleteConfirmSlot.label}" eliminado.`);
                  setDeleteConfirmSlot(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar Rol */}
      {deleteConfirmRole && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-red-900/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg text-white font-medium">¿Eliminar Rol?</h3>
            </div>
            <p className="text-xs text-[#a0a0ab]">
              ¿Estás seguro de que deseas eliminar el rol <strong className="text-white">{deleteConfirmRole.name}</strong>? Se desvinculará de todos los músicos y turnos.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRole(null)}
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteRole(deleteConfirmRole.id);
                  if (editingRoleId === deleteConfirmRole.id) cancelEditRole();
                  showToast(`Rol "${deleteConfirmRole.name}" eliminado.`);
                  setDeleteConfirmRole(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar Categoría */}
      {deleteConfirmCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-red-900/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg text-white font-medium">¿Eliminar Categoría?</h3>
            </div>
            <p className="text-xs text-[#a0a0ab]">
              ¿Estás seguro de que deseas eliminar la categoría <strong className="text-white">"{deleteConfirmCategory}"</strong>?
              Las canciones que la tenían asignada conservarán sus otras categorías.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCategory(null)}
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteConfirmCategory)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Restablecer Fábrica */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-red-900/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle size={24} />
              <h3 className="font-serif text-lg text-white font-medium">¿Restablecer de Fábrica?</h3>
            </div>
            <p className="text-xs text-[#a0a0ab]">
              Esto restablecerá la base de datos a los valores predeterminados (10 roles oficiales, integrantes base y catálogo oficial de 220+ canciones). Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs uppercase tracking-wider cursor-pointer shadow-lg"
              >
                Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
