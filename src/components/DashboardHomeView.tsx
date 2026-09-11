import React from 'react';
import { AppState, SongItem, Musician, Slot } from '../types';
import {
  Calendar,
  Clock,
  Users,
  Music,
  ChevronRight,
  CalendarDays,
  FileText,
  Mic,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { getNextUpcomingDateForSlot, formatDateDisplay, isoLocal } from '../utils/dateUtils';
import { ActiveTab } from './Header';
import { YouTubePlaylistEmbed } from './YouTubePlaylistEmbed';

interface DashboardHomeViewProps {
  state: AppState;
  isAdmin: boolean;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectSong: (song: SongItem, contextSongs?: SongItem[], initialView?: 'view' | 'pdf') => void;
  onSelectDateEvent?: (isoDate: string) => void;
  onUpdatePlaylist?: (url: string) => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  state,
  isAdmin,
  onNavigateTab,
  onSelectSong,
  onSelectDateEvent,
  onUpdatePlaylist,
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

  // Comprobar si el evento está en curso (duración de 3 horas)
  const isEventLiveNow = Boolean(
    nextMainEvent &&
    now.getTime() >= nextMainEvent.nextDate.getTime() &&
    now.getTime() <= nextMainEvent.nextDate.getTime() + 3 * 60 * 60 * 1000
  );

  const formattedEndTime = nextMainEvent
    ? (() => {
        const end = new Date(nextMainEvent.nextDate.getTime() + 3 * 60 * 60 * 1000);
        const h = String(end.getHours()).padStart(2, '0');
        const m = String(end.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      })()
    : '';

  // 2. Músicos asignados en el próximo evento principal
  // Orden estricto requerido:
  // 1. Director
  // 2. Voces
  // 3. Instrumentos
  // 4. Sonido y audiovisual
  interface ConvocadoMusician {
    roleId: string;
    roleName: string;
    musicianName: string;
    gender: string;
    category: 'director' | 'voz' | 'instrument' | 'tech';
    categoryTitle: string;
    groupIndex: number;
    subWeight: number;
  }

  const getConvocadoSortInfo = (roleName: string): {
    category: 'director' | 'voz' | 'instrument' | 'tech';
    categoryTitle: string;
    groupIndex: number;
    subWeight: number;
  } => {
    const norm = roleName.toLowerCase().trim();

    // 1. Director
    if (
      norm.includes('director') ||
      norm.includes('dirección') ||
      norm.includes('direccion') ||
      norm.includes('lider') ||
      norm.includes('líder')
    ) {
      return { category: 'director', categoryTitle: 'Director', groupIndex: 1, subWeight: 0 };
    }

    // 2. Voces
    if (
      norm.includes('voz') ||
      norm.includes('voces') ||
      norm.includes('vocal') ||
      norm.includes('cantante') ||
      norm.includes('tenor') ||
      norm.includes('soprano') ||
      norm.includes('contralto') ||
      norm.includes('baritono') ||
      norm.includes('barítono') ||
      norm.includes('coro')
    ) {
      let sub = 50;
      if (norm.includes('voz h 1') || norm.includes('voz 1 h')) sub = 10;
      else if (norm.includes('voz h 2') || norm.includes('voz 2 h')) sub = 11;
      else if (norm.includes('voz h 3') || norm.includes('voz 3 h')) sub = 12;
      else if (norm.includes('voz m 1') || norm.includes('voz 1 m')) sub = 20;
      else if (norm.includes('voz m 2') || norm.includes('voz 2 m')) sub = 21;
      else if (norm.includes('voz m 3') || norm.includes('voz 3 m')) sub = 22;
      else if (norm.includes('voz h') || norm.includes('masculin')) sub = 30;
      else if (norm.includes('voz m') || norm.includes('femenin')) sub = 40;
      return { category: 'voz', categoryTitle: 'Voces', groupIndex: 2, subWeight: sub };
    }

    // 4. Sonido y audiovisual
    if (
      norm.includes('sonido') ||
      norm.includes('audio') ||
      norm.includes('visual') ||
      norm.includes('audiovisual') ||
      norm.includes('multimedia') ||
      norm.includes('camara') ||
      norm.includes('cámara') ||
      norm.includes('luces') ||
      norm.includes('pantalla') ||
      norm.includes('proyeccion') ||
      norm.includes('proyección') ||
      norm.includes('streaming') ||
      norm.includes('consola') ||
      norm.includes('video')
    ) {
      let sub = 10;
      if (norm.includes('sonido 2')) sub = 12;
      else if (norm.includes('sonido')) sub = 11;
      else if (norm.includes('visual 2') || norm.includes('audiovisual 2')) sub = 22;
      else if (norm.includes('audio') || norm.includes('visual')) sub = 21;
      return { category: 'tech', categoryTitle: 'Sonido y audiovisual', groupIndex: 4, subWeight: sub };
    }

    // 3. Instrumentos (Piano, Guitarra acústica, Batería, Bajo, Guitarra eléctrica, etc.)
    let sub = 50;
    if (norm.includes('piano') || norm.includes('teclado') || norm.includes('tecla')) sub = 10;
    else if (norm.includes('guitarra acustica') || norm.includes('acústica') || norm.includes('acustica')) sub = 15;
    else if (norm.includes('bateria') || norm.includes('batería')) sub = 20;
    else if (norm.includes('bajo')) sub = 25;
    else if (norm.includes('guitarra electrica') || norm.includes('eléctrica') || norm.includes('electrica')) sub = 30;
    return { category: 'instrument', categoryTitle: 'Instrumentos', groupIndex: 3, subWeight: sub };
  };

  const nextEventMusicians: ConvocadoMusician[] = [];
  if (nextMainEvent) {
    const roleMap = new Map<string, string>((state.roles || []).map(r => [r.id, r.name]));
    const musicianMap = new Map<string, Musician>((state.musicians || []).map(m => [m.id, m]));
    const assignments = (nextMainEvent.assignments || {}) as Record<string, string>;

    Object.entries(assignments).forEach(([roleId, musicianId]) => {
      if (musicianId) {
        const musician = musicianMap.get(String(musicianId));
        if (musician) {
          const roleName = roleMap.get(roleId) || 'Rol';
          const info = getConvocadoSortInfo(roleName);
          nextEventMusicians.push({
            roleId,
            roleName,
            musicianName: musician.name,
            gender: musician.gender,
            category: info.category,
            categoryTitle: info.categoryTitle,
            groupIndex: info.groupIndex,
            subWeight: info.subWeight,
          });
        }
      }
    });

    // Ordenar estrictamente: 1. Director, 2. Voces, 3. Instrumentos, 4. Sonido y audiovisual
    nextEventMusicians.sort((a, b) => {
      if (a.groupIndex !== b.groupIndex) {
        return a.groupIndex - b.groupIndex;
      }
      if (a.subWeight !== b.subWeight) {
        return a.subWeight - b.subWeight;
      }
      return a.roleName.localeCompare(b.roleName, 'es');
    });
  }

  // Grupos en el orden exacto solicitado por el usuario:
  // 1. Director
  // 2. Voces
  // 3. Instrumentos
  // 4. Sonido y audiovisual
  const CATEGORY_GROUPS = [
    {
      key: 'director' as const,
      title: 'Director',
      icon: UserCheck,
      headerBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      tagBg: 'bg-[#141418] border-[#232328] hover:border-amber-500/60 shadow-sm',
      roleColor: 'text-amber-400 font-bold',
      members: nextEventMusicians.filter(m => m.category === 'director'),
    },
    {
      key: 'voz' as const,
      title: 'Voces',
      icon: Mic,
      headerBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      tagBg: 'bg-[#141418] border-[#232328] hover:border-rose-500/40 shadow-sm',
      roleColor: 'text-rose-300 font-semibold',
      members: nextEventMusicians.filter(m => m.category === 'voz'),
    },
    {
      key: 'instrument' as const,
      title: 'Instrumentos',
      icon: Music,
      headerBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      tagBg: 'bg-[#141418] border-[#232328] hover:border-emerald-500/40 shadow-sm',
      roleColor: 'text-emerald-300 font-semibold',
      members: nextEventMusicians.filter(m => m.category === 'instrument'),
    },
    {
      key: 'tech' as const,
      title: 'Sonido y audiovisual',
      icon: Sliders,
      headerBadge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      tagBg: 'bg-[#141418] border-[#232328] hover:border-cyan-500/40 shadow-sm',
      roleColor: 'text-cyan-300 font-semibold',
      members: nextEventMusicians.filter(m => m.category === 'tech'),
    },
  ];

  return (
    <div className="space-y-6" id="dashboard-home-view">
      {/* Tarjeta de Próximo Evento / Culto */}
      {nextMainEvent ? (
        <div className="bg-[#141418] border border-[#232328] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1f1f23]">
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isEventLiveNow
                  ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
              }`}>
                <Calendar size={18} />
              </div>
              <div>
                {isEventLiveNow ? (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    En Curso Ahora · Duración 3 horas (hasta {formattedEndTime} hs)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] font-bold block">
                    Próxima Convocatoria
                  </span>
                )}
                <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
                  {nextMainEvent.slot.label}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isEventLiveNow
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 shadow-sm shadow-emerald-950/30'
                  : 'bg-[#0a0a0b] text-white border-[#2a2a30]'
              }`}>
                <Clock size={13} className={isEventLiveNow ? 'text-emerald-400 animate-pulse' : 'text-[#c5a059]'} />
                <span>
                  {nextMainEvent.slot.time} hs {isEventLiveNow ? `→ ${formattedEndTime} hs` : '(3h)'}
                </span>
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
          <div className="space-y-2.5 mb-6">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {nextMainEvent.songs.map((song, sIdx) => {
                  const hasPdf = (song.attachments || []).some(a => {
                    const url = (a.url || '').toLowerCase();
                    const name = (a.name || '').toLowerCase();
                    return (
                      url.startsWith('data:application/pdf') ||
                      url.includes('.pdf') ||
                      name.endsWith('.pdf') ||
                      a.type === 'pdf'
                    );
                  });

                  return (
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

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {hasPdf && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSong(song, nextMainEvent.songs, 'pdf');
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Ver partitura PDF directamente"
                          >
                            <FileText size={10} />
                            <span>PDF</span>
                          </button>
                        )}
                        {song.key && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#141418] text-[#c5a059] border border-[#c5a059]/20 flex-shrink-0">
                            {song.key}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#0a0a0b] rounded-xl border border-dashed border-[#232328] text-center text-xs text-[#8e8e99]">
                No se han seleccionado canciones para este turno todavía.
              </div>
            )}
          </div>

          {/* Músicos Asignados en este Servicio ordenados en:
              1. Director, 2. Voces, 3. Instrumentos, 4. Sonido y audiovisual */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-[#8e8e99] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users size={13} className="text-amber-400" />
                <span>Equipo Convocado ({nextEventMusicians.length})</span>
              </span>
              <span className="text-[10px] text-[#6b6b75] normal-case hidden sm:inline">
                Orden: Director · Voces · Instrumentos · Sonido y audiovisual
              </span>
            </div>

            {/* Categorías ordenadas */}
            <div className="space-y-2.5">
              {CATEGORY_GROUPS.map(group => {
                const IconComponent = group.icon;
                if (group.members.length === 0) return null;

                return (
                  <div
                    key={group.key}
                    className="p-3 bg-[#0a0a0b] border border-[#232328] rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${group.headerBadge}`}>
                        <IconComponent size={11} />
                        <span>{group.title}</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#6b6b75]">
                        ({group.members.length})
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {group.members.map((m, idx) => (
                        <div
                          key={`${m.roleId}-${idx}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${group.tagBg}`}
                        >
                          <span className={`text-[10px] font-mono ${group.roleColor}`}>
                            {m.roleName}:
                          </span>
                          <span className="font-medium text-white">{m.musicianName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {nextEventMusicians.length === 0 && (
                <div className="p-4 bg-[#0a0a0b] rounded-xl border border-dashed border-[#232328] text-center text-xs text-[#8e8e99] italic">
                  Sin integrantes asignados aún para esta convocatoria.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-[#141418] border border-[#232328] rounded-2xl text-center text-[#8e8e99]">
          No hay turnos configurados.
        </div>
      )}

      {/* Espacio para embeber Playlist de YouTube / YouTube Music */}
      <YouTubePlaylistEmbed
        initialUrl={state.worshipPlaylistUrl}
        isAdmin={isAdmin}
        onUpdateUrl={onUpdatePlaylist}
      />
    </div>
  );
};
