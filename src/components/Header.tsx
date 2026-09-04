import React, { useState } from 'react';
import {
  Calendar,
  Users,
  Sliders,
  RotateCw,
  Radio,
  BarChart3,
  CalendarDays,
  Lock,
  LogOut,
  ShieldCheck,
  HelpCircle,
  Edit3,
  Music,
  Home,
  Sun,
  Moon,
  KeyRound,
  X,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';

import { PWAInstallButton } from './PWAInstallButton';
import { DoveLogo } from './DoveLogo';

export type ActiveTab =
  | 'inicio'
  | 'canciones'
  | 'calendario'
  | 'eventos'
  | 'musicos'
  | 'estadisticas'
  | 'config'
  | 'mes'
  | 'semana'
  | 'cancionero';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin: boolean;
  onToggleAdminModal: () => void;
  onLogoutAdmin: () => void;
  isSaving: boolean;
  isCloudConnected?: boolean;
  onSync: () => void;
  onOpenExplainer?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onChangeAdminPassword?: (newPass: string) => void;
  adminPassword?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  onToggleAdminModal,
  onLogoutAdmin,
  isSaving,
  isCloudConnected = true,
  onSync,
  onOpenExplainer,
  theme = 'dark',
  onToggleTheme,
  onChangeAdminPassword,
  adminPassword = 'alabanza2026',
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  const isTabActive = (tabName: string) => {
    if (tabName === 'inicio' && activeTab === 'inicio') return true;
    if (tabName === 'canciones' && (activeTab === 'canciones' || activeTab === 'cancionero'))
      return true;
    if (
      tabName === 'calendario' &&
      (activeTab === 'calendario' || activeTab === 'eventos' || activeTab === 'mes' || activeTab === 'semana')
    )
      return true;
    if (tabName === 'musicos' && activeTab === 'musicos') return true;
    if (tabName === 'estadisticas' && activeTab === 'estadisticas') return true;
    if (tabName === 'config' && activeTab === 'config') return true;
    return activeTab === tabName;
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess(false);

    const actualCurrent = (adminPassword || 'alabanza2026').trim();
    if (currentPass.trim() !== actualCurrent) {
      setPassError('La contraseña actual ingresada es incorrecta.');
      return;
    }
    if (newPass.trim().length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPass.trim() !== confirmPass.trim()) {
      setPassError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (onChangeAdminPassword) {
      onChangeAdminPassword(newPass.trim());
    }
    setPassSuccess(true);
    setTimeout(() => {
      setPassSuccess(false);
      setShowPasswordModal(false);
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setPassError('');
    }, 1200);
  };

  return (
    <header className="border-b border-[#1f1f23] pb-0 mb-0" id="main-header">
      {/* Banner de Modo Edición Activo para Administradores */}
      {isAdmin && (
        <div
          id="admin-active-editing-banner"
          className="mb-4 bg-gradient-to-r from-[#c5a059] via-[#d8b56f] to-[#c5a059] text-black px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between flex-wrap gap-2 animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold min-w-0">
            <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black"></span>
            </span>
            <span className="truncate flex items-center gap-1.5 font-sans">
              <Edit3 size={15} className="text-black flex-shrink-0" />
              <span>Modo Administrador Activado</span>
            </span>
            <span className="hidden md:inline text-[11px] font-medium text-slate-900 bg-amber-200/90 px-2 py-0.5 rounded-full">
              Gestión de repertorio, músicos y programación
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Cambiar Contraseña */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center px-2.5 py-1 bg-black/10 hover:bg-black/20 text-black text-xs font-semibold rounded-lg transition active:scale-95 gap-1 cursor-pointer"
              title="Cambiar contraseña de administrador"
            >
              <KeyRound size={13} />
              <span className="hidden sm:inline">Cambiar Contraseña</span>
            </button>

            {/* Guía de Alertas (Solo visible para Admin) */}
            {onOpenExplainer && (
              <button
                onClick={onOpenExplainer}
                className="inline-flex items-center px-2.5 py-1 bg-black/10 hover:bg-black/20 text-black text-xs font-semibold rounded-lg transition active:scale-95 gap-1 cursor-pointer"
                title="Ver qué significan las alertas y reglas"
              >
                <HelpCircle size={13} />
                <span className="hidden sm:inline">Ayuda & Reglas</span>
              </button>
            )}

            {/* Salir de Administrador */}
            <button
              id="btn-exit-admin-mode"
              onClick={onLogoutAdmin}
              className="inline-flex items-center px-3 py-1 bg-black hover:bg-slate-900 text-[#c5a059] hover:text-[#d8b56f] text-xs font-bold rounded-lg shadow-sm transition active:scale-95 gap-1.5 flex-shrink-0 cursor-pointer"
              title="Salir del modo edición"
            >
              <LogOut size={13} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
        {/* Brand / Logo & Quick Controls */}
        <div className="flex items-center gap-3.5 min-w-0 pb-2">
          <DoveLogo className="w-11 h-11 sm:w-13 sm:h-13 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="flex items-center gap-3 font-serif text-2xl sm:text-3xl tracking-tight text-white m-0 flex-wrap">
                <span className="italic text-[#c5a059]">Iglesia Dios es Amor</span>
                <span className="text-xs sm:text-sm font-mono tracking-[0.2em] text-[#888894] uppercase border-l border-[#1f1f23] pl-3 font-normal">
                  Ministerio de Alabanza
                </span>
              </h1>

              {/* Acciones Rápidas: Sincronización, Modo Claro/Oscuro y Acceso Admin */}
              <div className="flex items-center gap-1.5 flex-shrink-0" id="header-quick-actions">
                {/* Botón Sincronizar / Refrescar */}
                <button
                  onClick={onSync}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#141418] hover:bg-[#1a1a1d] text-[#888894] hover:text-white border border-[#1f1f23] hover:border-[#c5a059]/50 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                  title={isAdmin ? "Guardar cambios en la nube" : "Sincronizar datos de la nube"}
                  id="btn-sync-refresh"
                >
                  <RotateCw size={14} className={isSaving ? 'animate-spin text-[#c5a059]' : ''} />
                </button>

                {/* Botón General de Modo Claro / Oscuro */}
                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#141418] hover:bg-[#1a1a1d] text-[#888894] hover:text-[#c5a059] border border-[#1f1f23] hover:border-[#c5a059]/40 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm"
                    title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
                    id="btn-theme-toggle"
                  >
                    {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                )}

                {/* Botón Acceso Admin: Solo un ícono al lado del cambio de tema */}
                {isAdmin ? (
                  <button
                    onClick={onToggleAdminModal}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 hover:border-emerald-600 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm"
                    title="Sesión de Administrador activa (Click para ver estado o salir)"
                    id="btn-login-admin"
                  >
                    <ShieldCheck size={16} className="text-emerald-400" />
                  </button>
                ) : (
                  <button
                    onClick={onToggleAdminModal}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#141418] hover:bg-[#1a1a1d] text-[#888894] hover:text-[#c5a059] border border-[#1f1f23] hover:border-[#c5a059]/40 flex items-center justify-center transition-all cursor-pointer flex-shrink-0 shadow-sm"
                    title="Acceso Administrador (desbloquear edición)"
                    id="btn-login-admin"
                  >
                    <Lock size={15} className="text-[#c5a059]" />
                  </button>
                )}
              </div>

              {/* Cloud Sync Badge */}
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded border uppercase tracking-widest ${
                  isCloudConnected
                    ? 'text-[#c5a059] bg-[#c5a059]/10 border-[#c5a059]/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}
                title="Sincronización en la nube en tiempo real"
              >
                {isSaving ? (
                  <>
                    <RotateCw size={10} className="text-[#c5a059] animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Radio size={10} className="text-[#c5a059] animate-pulse" />
                    <span>En vivo</span>
                  </>
                )}
              </span>

              {/* Ayuda & Reglas: SOLO PARA ADMINISTRADOR */}
              {isAdmin && onOpenExplainer && (
                <button
                  onClick={onOpenExplainer}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 cursor-pointer transition-all"
                  title="Ver guía visual de reglas y descansos"
                >
                  <HelpCircle size={12} />
                  <span>Ayuda & Reglas</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation on Desktop: El borde inferior coincide exactamente con el borde del header */}
        <div className="flex items-end gap-2.5 flex-wrap">
          <nav className="hidden md:flex bg-[#0f0f12] p-1 rounded-t-xl rounded-b-none border border-b-0 border-[#1f1f23] shadow-inner overflow-x-auto max-w-full gap-1">
            {/* INICIO */}
            <button
              onClick={() => onTabChange('inicio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                isTabActive('inicio')
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-inicio-btn"
            >
              <Home size={14} className={isTabActive('inicio') ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Inicio</span>
            </button>

            {/* CANCIONES */}
            <button
              onClick={() => onTabChange('canciones')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                isTabActive('canciones')
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-canciones-btn"
            >
              <Music size={14} className={isTabActive('canciones') ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Canciones</span>
            </button>

            {/* CALENDARIO (Renombrado de Eventos) */}
            <button
              onClick={() => onTabChange('calendario')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                isTabActive('calendario')
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-calendario-btn"
            >
              <CalendarDays size={14} className={isTabActive('calendario') ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Calendario</span>
            </button>

            {/* MÚSICOS / INTEGRANTES (Visible para todos!) */}
            <button
              onClick={() => onTabChange('musicos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                isTabActive('musicos')
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-musicos-btn"
            >
              <Users size={14} className={isTabActive('musicos') ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Integrantes</span>
            </button>

            {/* REPORTES (Solo Admin) */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('estadisticas');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                isTabActive('estadisticas')
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-estadisticas-btn"
            >
              <BarChart3 size={14} className={isTabActive('estadisticas') ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Reportes</span>
              {!isAdmin && <Lock size={11} className="text-[#c5a059] ml-0.5" />}
            </button>

            {/* AJUSTES (Solo Admin) */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('config');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                isTabActive('config')
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-config-btn"
            >
              <Sliders size={14} className={isTabActive('config') ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Ajustes</span>
              {!isAdmin && <Lock size={11} className="text-[#c5a059] ml-0.5" />}
            </button>
          </nav>
        </div>
      </div>

      {/* Modal Cambiar Contraseña de Administrador */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-[#2a2a2e] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#232328]">
              <div className="flex items-center gap-2 text-[#c5a059]">
                <KeyRound size={18} />
                <h3 className="font-serif text-lg text-white font-medium">Cambiar Contraseña</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-[#888894] hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={currentPass}
                    onChange={e => setCurrentPass(e.target.value)}
                    placeholder="Ingresa la contraseña actual..."
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888894] hover:text-white"
                  >
                    {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">
                  Nueva Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres..."
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888894] hover:text-white"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repite la nueva contraseña..."
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {passError && <p className="text-xs text-rose-400 font-mono">{passError}</p>}
              {passSuccess && (
                <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <Check size={14} />
                  <span>¡Contraseña actualizada con éxito!</span>
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232328]">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#888894] hover:text-white rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d8b56f] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer font-mono shadow-md shadow-[#c5a059]/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
