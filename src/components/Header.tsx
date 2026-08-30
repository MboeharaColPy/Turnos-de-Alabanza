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
  Unlock,
  ShieldCheck,
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
}) => {
  return (
    <header className="border-b border-[#1f1f23] pb-6 mb-8" id="main-header">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        {/* Brand / Logo */}
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="font-serif italic text-2xl tracking-tight text-[#c5a059]">
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
              <div className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded border text-emerald-400 bg-emerald-950/30 border-emerald-800/40">
                <ShieldCheck size={11} />
                <span>Modo Administrador Activo</span>
                <button
                  onClick={onLogoutAdmin}
                  className="ml-1 text-[#6b6b75] hover:text-white underline cursor-pointer"
                  title="Bloquear y salir a modo público"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onToggleAdminModal}
                className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-0.5 rounded border text-[#a0a0ab] hover:text-white bg-[#141418] hover:bg-[#1f1f23] border-[#2a2a2e] cursor-pointer transition-all"
                title="Ingresar contraseña de administrador"
              >
                <Lock size={10} className="text-[#c5a059]" />
                <span>Acceso Admin</span>
              </button>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight text-white">
            Ministerio de <span className="italic text-[#c5a059]">Alabanza</span>
          </h1>
        </div>

        {/* Tab Navigation & Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <nav className="flex bg-[#0f0f12] p-1 rounded-xl border border-[#1f1f23] shadow-inner overflow-x-auto max-w-full">
            {/* PESTAÑAS PÚBLICAS */}
            <button
              onClick={() => onTabChange('mes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === 'mes'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.05)]'
                  : 'text-[#6b6b75] hover:text-[#e0e0e0] hover:bg-[#121215]'
              }`}
              id="tab-mes-btn"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'mes' ? 'bg-[#c5a059]' : 'border border-[#6b6b75]'}`} />
              <CalendarDays size={13} />
              <span>Calendario Mensual</span>
            </button>

            <button
              onClick={() => onTabChange('semana')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === 'semana'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.05)]'
                  : 'text-[#6b6b75] hover:text-[#e0e0e0] hover:bg-[#121215]'
              }`}
              id="tab-semana-btn"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'semana' ? 'bg-[#c5a059]' : 'border border-[#6b6b75]'}`} />
              <Calendar size={13} />
              <span>Semana Detallada</span>
            </button>

            <button
              onClick={() => onTabChange('cancionero')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === 'cancionero'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.05)]'
                  : 'text-[#6b6b75] hover:text-[#e0e0e0] hover:bg-[#121215]'
              }`}
              id="tab-cancionero-btn"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'cancionero' ? 'bg-[#c5a059]' : 'border border-[#6b6b75]'}`} />
              <BookOpen size={13} />
              <span>Repertorio de Alabanzas</span>
            </button>

            {/* PESTAÑAS ADMINISTRADOR (Protegidas) */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('estadisticas');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === 'estadisticas'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.05)]'
                  : 'text-[#6b6b75] hover:text-[#e0e0e0] hover:bg-[#121215]'
              }`}
              id="tab-estadisticas-btn"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'estadisticas' ? 'bg-[#c5a059]' : 'border border-[#6b6b75]'}`} />
              <BarChart3 size={13} />
              <span>Estadísticas</span>
              {!isAdmin && <Lock size={10} className="text-[#c5a059] ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('musicos');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === 'musicos'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.05)]'
                  : 'text-[#6b6b75] hover:text-[#e0e0e0] hover:bg-[#121215]'
              }`}
              id="tab-musicos-btn"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'musicos' ? 'bg-[#c5a059]' : 'border border-[#6b6b75]'}`} />
              <Users size={13} />
              <span>Músicos & Parejas</span>
              {!isAdmin && <Lock size={10} className="text-[#c5a059] ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (!isAdmin) {
                  onToggleAdminModal();
                } else {
                  onTabChange('config');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs tracking-wider uppercase transition-all cursor-pointer font-medium whitespace-nowrap ${
                activeTab === 'config'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-[inset_0_0_10px_rgba(197,160,89,0.05)]'
                  : 'text-[#6b6b75] hover:text-[#e0e0e0] hover:bg-[#121215]'
              }`}
              id="tab-config-btn"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'config' ? 'bg-[#c5a059]' : 'border border-[#6b6b75]'}`} />
              <Sliders size={13} />
              <span>Roles y Turnos</span>
              {!isAdmin && <Lock size={10} className="text-[#c5a059] ml-0.5" />}
            </button>
          </nav>

          <button
            onClick={onRefresh}
            className="w-10 h-10 rounded-xl bg-[#141418] hover:bg-[#1a1a1d] text-[#6b6b75] hover:text-white border border-[#1f1f23] hover:border-[#c5a059]/40 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 shadow-md"
            title="Sincronizar datos"
          >
            <RotateCw size={14} className={isSaving ? 'animate-spin text-[#c5a059]' : ''} />
          </button>
        </div>
      </div>
    </header>
  );
};
