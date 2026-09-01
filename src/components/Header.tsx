import React from 'react';
import {
  Calendar,
  Users,
  Sliders,
  RotateCw,
  Radio,
  BarChart3,
  CalendarDays,
  BookOpen,
  Lock,
  LogOut,
  ShieldCheck,
  HelpCircle,
  Edit3,
  Sparkles,
  Music
} from 'lucide-react';

export type ActiveTab = 'mes' | 'semana' | 'cancionero' | 'estadisticas' | 'musicos' | 'config';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isAdmin: boolean;
  onToggleAdminModal: () => void;
  onLogoutAdmin: () => void;
  isSaving: boolean;
  isCloudConnected?: boolean;
  onRefresh: () => void;
  onOpenExplainer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isAdmin,
  onToggleAdminModal,
  onLogoutAdmin,
  isSaving,
  isCloudConnected = true,
  onRefresh,
  onOpenExplainer,
}) => {
  return (
    <header className="border-b border-[#1f1f23] pb-5 mb-6" id="main-header">
      {/* Banner de Modo Edición Activo para Administradores */}
      {isAdmin && (
        <div 
          id="admin-active-editing-banner"
          className="mb-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3.5 py-2 rounded-xl shadow-lg flex items-center justify-between flex-wrap gap-2 animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold min-w-0">
            <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
            </span>
            <span className="truncate flex items-center gap-1.5 font-sans">
              <Edit3 size={15} className="text-slate-950 flex-shrink-0" />
              <span>Modo Edición Activado</span>
            </span>
            <span className="hidden md:inline text-[11px] font-medium text-slate-800 bg-amber-300/80 px-2 py-0.5 rounded-full">
              Puedes modificar turnos, agregar músicos y gestionar alabanzas
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenExplainer && (
              <button
                onClick={onOpenExplainer}
                className="inline-flex items-center px-2.5 py-1 bg-amber-300/90 hover:bg-amber-200 text-slate-950 text-xs font-semibold rounded-lg transition active:scale-95 gap-1 cursor-pointer"
                title="Ver qué significan las advertencias"
              >
                <HelpCircle size={13} />
                <span className="hidden sm:inline">Guía de Alertas</span>
              </button>
            )}
            <button
              id="btn-exit-admin-mode"
              onClick={onLogoutAdmin}
              className="inline-flex items-center px-3 py-1 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg shadow-sm transition active:scale-95 gap-1.5 flex-shrink-0 border border-slate-800 cursor-pointer"
              title="Salir del modo edición y bloquear cambios"
            >
              <LogOut size={13} className="text-amber-400" />
              <span>Salir de edición</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        {/* Brand / Logo */}
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="font-serif italic text-2xl sm:text-3xl tracking-tight text-[#c5a059]">
              Iglesia Dios es Amor
            </span>
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#6b6b75] uppercase border-l border-[#1f1f23] pl-3">
              Ministerio de Alabanza
            </span>

            {/* Cloud Sync Badge */}
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded border uppercase tracking-widest ${
                isCloudConnected
                  ? 'text-[#c5a059] bg-[#c5a059]/10 border-[#c5a059]/30'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              }`}
              title="Sincronización en la nube en tiempo real para todos los integrantes"
            >
              {isSaving ? (
                <>
                  <RotateCw size={10} className="text-[#c5a059] animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Radio size={10} className="text-[#c5a059] animate-pulse" />
                  <span>Nube en vivo</span>
                </>
              )}
            </span>

            {/* Admin status pill */}
            {isAdmin ? (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded-full border text-emerald-400 bg-emerald-950/40 border-emerald-800/50">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="font-bold">ADMIN HABILITADO</span>
              </div>
            ) : (
              <button
                onClick={onToggleAdminModal}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg border text-[#e0e0e0] hover:text-white bg-[#18181c] hover:bg-[#222228] border-[#2e2e36] hover:border-amber-500/40 cursor-pointer transition-all shadow-sm"
                title="Desbloquear modo edición con contraseña de administrador"
                id="btn-login-admin"
              >
                <Lock size={12} className="text-amber-400" />
                <span>Acceso Administrador</span>
              </button>
            )}

            {/* Guía Rápida Button */}
            {onOpenExplainer && (
              <button
                onClick={onOpenExplainer}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 cursor-pointer transition-all"
                title="Ver guía visual de conflictos, parejas y reglas"
              >
                <HelpCircle size={12} />
                <span>Ayuda & Reglas</span>
              </button>
            )}
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-light tracking-tight text-white mt-1">
            Gestión de <span className="italic text-[#c5a059]">Turnos y Alabanzas</span>
          </h1>
        </div>

        {/* Tab Navigation on Desktop */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <nav className="hidden md:flex bg-[#0f0f12] p-1.5 rounded-xl border border-[#1f1f23] shadow-inner overflow-x-auto max-w-full gap-1">
            {/* PESTAÑAS PÚBLICAS */}
            <button
              onClick={() => onTabChange('mes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                activeTab === 'mes'
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-mes-btn"
            >
              <CalendarDays size={14} className={activeTab === 'mes' ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Mes</span>
            </button>

            <button
              onClick={() => onTabChange('semana')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                activeTab === 'semana'
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-semana-btn"
            >
              <Calendar size={14} className={activeTab === 'semana' ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Semana</span>
            </button>

            <button
              onClick={() => onTabChange('cancionero')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                activeTab === 'cancionero'
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-cancionero-btn"
            >
              <Music size={14} className={activeTab === 'cancionero' ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Repertorio</span>
            </button>

            {/* PESTAÑAS ADMINISTRADOR (Protegidas) */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('musicos');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                activeTab === 'musicos'
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-musicos-btn"
            >
              <Users size={14} className={activeTab === 'musicos' ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Músicos & Parejas</span>
              {!isAdmin && <Lock size={11} className="text-[#c5a059] ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('estadisticas');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                activeTab === 'estadisticas'
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-estadisticas-btn"
            >
              <BarChart3 size={14} className={activeTab === 'estadisticas' ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Reportes</span>
              {!isAdmin && <Lock size={11} className="text-[#c5a059] ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('config');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap min-h-[40px] ${
                activeTab === 'config'
                  ? 'bg-[#1e1e24] text-white border border-[#c5a059]/50 shadow-[inset_0_0_10px_rgba(197,160,89,0.1)] font-bold'
                  : 'text-[#888894] hover:text-[#e0e0e0] hover:bg-[#151518]'
              }`}
              id="tab-config-btn"
            >
              <Sliders size={14} className={activeTab === 'config' ? 'text-[#c5a059]' : 'text-[#888894]'} />
              <span>Ajustes</span>
              {!isAdmin && <Lock size={11} className="text-[#c5a059] ml-0.5" />}
            </button>
          </nav>

          <button
            onClick={onRefresh}
            className="w-11 h-11 rounded-xl bg-[#141418] hover:bg-[#1a1a1d] text-[#888894] hover:text-white border border-[#1f1f23] hover:border-[#c5a059]/50 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-md min-h-[44px]"
            title="Sincronizar datos con la nube"
            id="btn-sync-refresh"
          >
            <RotateCw size={16} className={isSaving ? 'animate-spin text-[#c5a059]' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
};
