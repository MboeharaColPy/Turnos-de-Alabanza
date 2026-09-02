import React from 'react';
import { AppState, SongItem, Musician, Slot } from '../types';
import {
  Sparkles,
  Calendar,
  Clock,
  Users,
  Music,
  ChevronRight,
  Pin,
  Flame,
  Activity,
  Layers,
  ArrowRight,
  UserCheck,
  CalendarDays,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { getNextUpcomingDateForSlot, formatDateDisplay, isoLocal } from '../utils/dateUtils';
import { ActiveTab } from './Header';

interface DashboardHomeViewProps {
  state: AppState;
  isAdmin: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectSong: (song: SongItem, contextSongs?: SongItem[]) => void;
  onSelectDateEvent?: (isoDate: string) => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  state,
  isAdmin,
  onNavigateTab,
  onSelectSong,
  onSelectDateEvent,
}) => {
  // 1. Encontrar el próximo servicio o ensayo programado
  const now = new Date();
  const sortedUpcomingSlots = (state.slots || [])
    .map(slot => {
      const nextDate = getNextUpcomingDateForSlot(slot.day, slot.time);
      const isoDate = isoLocal(nextDate);
      const shiftKey = `${isoDate}__${slot.id}`;
      const assignments = state.assignments[shiftKey] || {};
      const songs = state.shiftSongs[shiftKey] || [];
      return {
        slot,
        nextDate,
        isoDate,
        shiftKey,
        assignments,
        songs,
        assignedCount: Object.keys(assignments).length,
      };
    })
    .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

  const nextMainEvent = sortedUpcomingSlots[0];

  // 2. Músicos asignados en el próximo evento principal
  const nextEventMusicians: { roleName: string; musicianName: string; gender: string }[] = [];
  if (nextMainEvent) {
    const roleMap = new Map<string, string>((state.roles || []).map(r => [r.id, r.name]));
    const musicianMap = new Map<string, Musician>((state.musicians || []).map(m => [m.id, m]));

    Object.entries((nextMainEvent.assignments || {}) as Record<string, string>).forEach(([roleId, musicianId]) => {
      const roleName = roleMap.get(roleId) || 'Rol';
      const musician = musicianMap.get(String(musicianId));
      if (musician) {
        nextEventMusicians.push({
          roleName,
          musicianName: musician.name,
          gender: musician.gender,
        });
      }
    });
  }

  // 3. Avisos y mensajes fijados
  const notices = state.notices || [];

  return (
    <div className="space-y-6" id="dashboard-home-view">
      {/* Banner Principal de Bienvenida */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#18181c] via-[#121215] to-[#0d0d10] border border-[#232328] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5a059]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 text-[#c5a059] text-xs font-mono font-semibold uppercase tracking-widest">
              <Sparkles size={13} />
              <span>Ministerio de Alabanza · Iglesia Dios es Amor</span>
            </div>
            
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-light tracking-tight">
              Plataforma de <span className="italic text-[#c5a059] font-normal">Alabanza & Adoración</span>
            </h2>
            
            <p className="text-sm text-[#8e8e99] leading-relaxed">
              Gestiona el repertorio de alabanzas, letras con acordes en cifrado americano, diagramas de instrumentos, calendario de cultos y roles del equipo.
            </p>
          </div>

          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 flex-shrink-0">
            <div 
              onClick={() => onNavigateTab('canciones')}
              className="bg-[#0a0a0b]/80 backdrop-blur-sm border border-[#26262e] hover:border-[#c5a059]/50 p-3 sm:p-4 rounded-2xl text-center cursor-pointer transition-all hover:scale-105"
            >
              <div className="text-2xl sm:text-3xl font-serif text-[#c5a059] font-medium">
                {state.songCatalog?.length || 0}
              </div>
              <div className="text-[10px] font-mono text-[#8e8e99] uppercase tracking-wider mt-0.5">
                Canciones
              </div>
            </div>

            <div 
              onClick={() => onNavigateTab('calendario')}
              className="bg-[#0a0a0b]/80 backdrop-blur-sm border border-[#26262e] hover:border-[#c5a059]/50 p-3 sm:p-4 rounded-2xl text-center cursor-pointer transition-all hover:scale-105"
            >
              <div className="text-2xl sm:text-3xl font-serif text-white font-medium">
                {state.slots?.length || 0}
              </div>
              <div className="text-[10px] font-mono text-[#8e8e99] uppercase tracking-wider mt-0.5">
                Turnos
              </div>
            </div>

            <div 
              onClick={() => onNavigateTab('musicos')}
              className="bg-[#0a0a0b]/80 backdrop-blur-sm border border-[#26262e] hover:border-[#c5a059]/50 p-3 sm:p-4 rounded-2xl text-center cursor-pointer transition-all hover:scale-105"
            >
              <div className="text-2xl sm:text-3xl font-serif text-amber-400 font-medium">
                {state.musicians?.length || 0}
              </div>
              <div className="text-[10px] font-mono text-[#8e8e99] uppercase tracking-wider mt-0.5">
                Integrantes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Próximo Servicio & Repertorio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda & Central (2 columnas): Próximo Evento y Repertorio Activo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Próximo Evento / Culto */}
          {nextMainEvent ? (
            <div className="bg-[#141418] border border-[#232328] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1f1f23]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] font-bold block">
                      Próxima Convocatoria
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
                      {nextMainEvent.slot.label}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-white bg-[#0a0a0b] px-3 py-1.5 rounded-xl border border-[#2a2a30] flex items-center gap-1.5">
                    <Clock size={13} className="text-[#c5a059]" />
                    <span>{nextMainEvent.slot.time} hs</span>
                  </span>
                  <button
                    onClick={() => onNavigateTab('calendario')}
                    className="p-1.5 text-[#8e8e99] hover:text-[#c5a059] hover:bg-[#1a1a1e] rounded-lg transition-colors cursor-pointer"
                    title="Ver en el calendario"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Fecha y Resumen */}
              <div className="flex items-center gap-3 text-xs text-[#a0a0ab] mb-5">
                <span className="capitalize font-medium text-white">
                  {formatDateDisplay(nextMainEvent.nextDate)}
                </span>
                <span>•</span>
                <span>
                  {nextMainEvent.assignedCount} integrantes convocados
                </span>
                <span>•</span>
                <span className="text-[#c5a059]">
                  {nextMainEvent.songs.length} canciones en lista
                </span>
              </div>

              {/* Lista de Canciones para este Servicio */}
              <div className="space-y-2.5 mb-5">
                <div className="flex items-center justify-between text-xs font-mono text-[#8e8e99] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Music size={13} className="text-[#c5a059]" />
                    <span>Setlist de Canciones ({nextMainEvent.songs.length})</span>
                  </span>
                  <button
                    onClick={() => onNavigateTab('canciones')}
                    className="text-[11px] text-[#c5a059] hover:underline cursor-pointer lowercase"
                  >
                    ver cancionero completo →
                  </button>
                </div>

                {nextMainEvent.songs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {nextMainEvent.songs.map((song, sIdx) => (
                      <div
                        key={song.id || sIdx}
                        onClick={() => onSelectSong(song, nextMainEvent.songs)}
                        className="flex items-center justify-between p-2.5 bg-[#0a0a0b] hover:bg-[#1a1a1e] border border-[#232328] hover:border-[#c5a059]/40 rounded-xl cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#141418] text-[#8e8e99] group-hover:text-[#c5a059] text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                            {sIdx + 1}
                          </span>
                          <div className="truncate">
                            <h4 className="text-xs font-medium text-white group-hover:text-[#c5a059] transition-colors truncate">
                              {song.title}
                            </h4>
                            {song.artist && (
                              <p className="text-[10px] text-[#8e8e99] truncate">{song.artist}</p>
                            )}
                          </div>
                        </div>

                        {song.key && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141418] text-[#c5a059] border border-[#c5a059]/20 flex-shrink-0">
                            {song.key}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-[#0a0a0b] rounded-xl border border-dashed border-[#232328] text-center text-xs text-[#8e8e99]">
                    No se han seleccionado canciones para este turno todavía.
                  </div>
                )}
              </div>

              {/* Músicos Asignados en este Servicio */}
              <div>
                <div className="text-xs font-mono text-[#8e8e99] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Users size={13} className="text-amber-400" />
                  <span>Equipo Convocado ({nextEventMusicians.length})</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {nextEventMusicians.map((m, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0a0a0b] border border-[#232328] text-xs text-white"
                    >
                      <span className="text-[10px] font-mono text-[#c5a059] font-medium">
                        {m.roleName}:
                      </span>
                      <span className="font-medium">{m.musicianName}</span>
                    </div>
                  ))}
                  {nextEventMusicians.length === 0 && (
                    <span className="text-xs text-[#8e8e99] italic">
                      Sin integrantes asignados aún.
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#141418] border border-[#232328] rounded-2xl text-center text-[#8e8e99]">
              No hay turnos configurados.
            </div>
          )}

          {/* Accesos Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onNavigateTab('canciones')}
              className="p-4 bg-[#141418] hover:bg-[#18181d] border border-[#232328] hover:border-[#c5a059]/40 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] group-hover:scale-110 transition-transform">
                <Music size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white group-hover:text-[#c5a059] transition-colors">
                  Cancionero & Acordes
                </h4>
                <p className="text-[10px] text-[#8e8e99] mt-0.5">Letras, tonos, capo e instrumentos</p>
              </div>
              <ChevronRight size={16} className="text-[#8e8e99] group-hover:text-white" />
            </div>

            <div
              onClick={() => onNavigateTab('musicos')}
              className="p-4 bg-[#141418] hover:bg-[#18181d] border border-[#232328] hover:border-[#c5a059]/40 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Users size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">
                  Directorio de Integrantes
                </h4>
                <p className="text-[10px] text-[#8e8e99] mt-0.5">Roles, voces y parejas</p>
              </div>
              <ChevronRight size={16} className="text-[#8e8e99] group-hover:text-white" />
            </div>
          </div>
        </div>

        {/* Columna Derecha (1 columna): Avisos del Ministerio */}
        <div className="space-y-6">
          <div className="bg-[#141418] border border-[#232328] rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-[#1f1f23]">
              <div className="flex items-center gap-2">
                <Pin size={16} className="text-[#c5a059]" />
                <h3 className="font-serif text-lg text-white font-medium">Avisos del Ministerio</h3>
              </div>
            </div>

            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    notice.isImportant
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-[#0a0a0b] border-[#232328] text-[#e0e0e0]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {notice.isImportant && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      <span>{notice.title}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-[#8e8e99]">{notice.date}</span>
                  </div>
                  <p className="text-xs text-[#a0a0ab] leading-relaxed">{notice.content}</p>
                  <div className="mt-2 text-[10px] font-mono text-[#c5a059]">
                    Por: {notice.author}
                  </div>
                </div>
              ))}

              {notices.length === 0 && (
                <p className="text-xs text-[#8e8e99] text-center py-4 italic">
                  No hay avisos publicados en este momento.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
