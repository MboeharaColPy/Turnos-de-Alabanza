import React, { useState } from 'react';
import {
  X,
  Calendar,
  Check,
  Plus,
  Trash2,
  Clock,
  Music,
  ListMusic,
  Sparkles,
} from 'lucide-react';
import { AppState, DAYS_OF_WEEK, Slot, SongItem } from '../types';
import { isRehearsalSlot } from '../services/storage';
import { dateForDay, formatCardDate, getMonday, isoLocal } from '../utils/dateUtils';

interface AssignSongToEventModalProps {
  song: SongItem;
  state: AppState;
  onClose: () => void;
  onUpdateSongs: (shiftKey: string, songs: SongItem[]) => void;
  showToast: (msg: string) => void;
}

interface EventOccurrence {
  shiftKey: string;
  slot: Slot;
  date: Date;
  dateStr: string;
  isoDate: string;
  isPast: boolean;
  songs: SongItem[];
  isAssigned: boolean;
  assignedOrder: number; // 1-indexed position if assigned
}

export const AssignSongToEventModal: React.FC<AssignSongToEventModalProps> = ({
  song,
  state,
  onClose,
  onUpdateSongs,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'assigned' | 'upcoming'>('upcoming');

  // Construir ocurrencias de eventos para las próximas 8 semanas
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startMonday = getMonday(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)); // Incluir semana previa

  const occurrencesMap = new Map<string, EventOccurrence>();

  // 1. Generar ocurrencias a partir de los slots configurados para 8 semanas
  for (let w = 0; w < 8; w++) {
    const weekStart = new Date(startMonday.getTime() + w * 7 * 24 * 60 * 60 * 1000);
    (state.slots || [])
      .filter(slot => !isRehearsalSlot(slot, state.slots))
      .forEach(slot => {
      const date = dateForDay(weekStart, slot.day);
      const isoDate = isoLocal(date);
      const shiftKey = `${isoDate}__${slot.id}`;
      const songs = state.shiftSongs[shiftKey] || [];
      const songIndex = songs.findIndex(s => s.id === song.id);
      const isAssigned = songIndex !== -1;

      occurrencesMap.set(shiftKey, {
        shiftKey,
        slot,
        date,
        dateStr: formatCardDate(date),
        isoDate,
        isPast: date.getTime() < today.getTime(),
        songs,
        isAssigned,
        assignedOrder: isAssigned ? songIndex + 1 : 0,
      });
    });
  }

  // 2. Revisar si hay keys en shiftSongs que contengan esta canción y no hayan sido capturadas
  Object.entries(state.shiftSongs || {}).forEach(([k, songsList]) => {
    if (!occurrencesMap.has(k)) {
      const [isoDate, slotId] = k.split('__');
      if (isoDate && slotId) {
        const slot = (state.slots || []).find(s => s.id === slotId) || {
          id: slotId,
          label: 'Turno especial',
          day: 0,
          time: '10:00',
          durationMinutes: 90,
          roleIds: [],
        };
        const parts = isoDate.split('-');
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const songs = Array.isArray(songsList) ? songsList : [];
        const songIndex = songs.findIndex(s => s.id === song.id);
        const isAssigned = songIndex !== -1;

        occurrencesMap.set(k, {
          shiftKey: k,
          slot,
          date,
          dateStr: formatCardDate(date),
          isoDate,
          isPast: date.getTime() < today.getTime(),
          songs,
          isAssigned,
          assignedOrder: isAssigned ? songIndex + 1 : 0,
        });
      }
    }
  });

  const occurrences = Array.from(occurrencesMap.values()).sort((a, b) => {
    // Si una ya está asignada y se filtra por assigned, orden cronológico
    const timeA = a.date.getTime();
    const timeB = b.date.getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.slot.time || '').localeCompare(b.slot.time || '');
  });

  // Filtrado
  const filteredEvents = occurrences.filter(ev => {
    if (filterView === 'assigned' && !ev.isAssigned) return false;
    if (filterView === 'upcoming' && ev.isPast) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      ev.slot.label.toLowerCase().includes(term) ||
      ev.dateStr.toLowerCase().includes(term) ||
      DAYS_OF_WEEK[ev.slot.day].toLowerCase().includes(term)
    );
  });

  const totalAssigned = occurrences.filter(e => e.isAssigned).length;

  const handleToggleAssign = (ev: EventOccurrence) => {
    const currentSongs = state.shiftSongs[ev.shiftKey] || [];
    const exists = currentSongs.some(s => s.id === song.id);

    let updatedList: SongItem[];
    if (exists) {
      updatedList = currentSongs.filter(s => s.id !== song.id);
      onUpdateSongs(ev.shiftKey, updatedList);
      showToast(`Canción quitada de "${ev.slot.label}" (${ev.dateStr}).`);
    } else {
      updatedList = [...currentSongs, song];
      onUpdateSongs(ev.shiftKey, updatedList);
      showToast(`¡"${song.title}" asignada a "${ev.slot.label}" (${ev.dateStr})!`);
    }
  };

  const songCategories = (song.categories && song.categories.length > 0)
    ? song.categories
    : (song.category ? [song.category] : ['General']);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-[#121216] border border-[#26262e] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#24242a] bg-[#16161c] flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0 mt-0.5">
              <Calendar size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#c5a059] font-bold">
                  Programar en Evento / Culto
                </span>
                {totalAssigned > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    {totalAssigned} {totalAssigned === 1 ? 'evento asignado' : 'eventos asignados'}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white truncate flex items-center gap-2">
                <span>{song.title}</span>
                {song.key && (
                  <span className="text-xs font-mono font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/30">
                    {song.key}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#888894] mt-0.5 flex-wrap">
                <span>{song.artist || 'Desconocido'}</span>
                {song.bpm ? <span>· {song.bpm} BPM</span> : null}
                <div className="flex items-center gap-1">
                  {songCategories.map((c, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.2 text-[10px] rounded bg-[#202028] text-[#a0a0ab] border border-[#2d2d38]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#888894] hover:text-white rounded-lg hover:bg-[#202028] transition-colors flex-shrink-0"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and search bar */}
        <div className="p-3 sm:px-5 border-b border-[#202026] bg-[#141418] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Quick filter pills */}
          <div className="flex items-center gap-1.5 bg-[#0e0e11] p-1 rounded-xl border border-[#24242a]">
            <button
              type="button"
              onClick={() => setFilterView('upcoming')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterView === 'upcoming'
                  ? 'bg-[#c5a059] text-black font-bold shadow'
                  : 'text-[#888894] hover:text-white'
              }`}
            >
              Próximos
            </button>
            <button
              type="button"
              onClick={() => setFilterView('assigned')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterView === 'assigned'
                  ? 'bg-emerald-500 text-black font-bold shadow'
                  : 'text-[#888894] hover:text-white'
              }`}
            >
              Asignados ({totalAssigned})
            </button>
            <button
              type="button"
              onClick={() => setFilterView('all')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                filterView === 'all'
                  ? 'bg-[#252530] text-white font-bold'
                  : 'text-[#888894] hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Search input */}
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por día o evento..."
            className="px-3 py-1.5 bg-[#0e0e11] border border-[#24242a] rounded-xl text-xs text-white placeholder-[#5d5d66] focus:outline-none focus:border-[#c5a059] flex-1 sm:max-w-[220px]"
          />
        </div>

        {/* Events List */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y-0">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-[#888894] space-y-2">
              <Calendar size={36} className="mx-auto opacity-30 text-[#c5a059]" />
              <p className="text-sm font-medium">No se encontraron eventos para mostrar.</p>
              <p className="text-xs text-[#62626d]">
                {filterView === 'assigned'
                  ? 'Esta canción aún no está programada en ningún evento.'
                  : 'Prueba cambiando los filtros o verificando los turnos configurados.'}
              </p>
            </div>
          ) : (
            filteredEvents.map(ev => {
              const dayName = DAYS_OF_WEEK[ev.slot.day];
              const duration = ev.slot.durationMinutes || 90;
              const rehearsal = ev.slot.rehearsal;

              return (
                <div
                  key={ev.shiftKey}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    ev.isAssigned
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : 'bg-[#16161c] border-[#222228] hover:border-[#2f2f38]'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/20">
                        {dayName} · {ev.dateStr}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {ev.slot.label}
                      </span>
                      {ev.isPast && (
                        <span className="text-[10px] text-[#6b6b75] bg-[#1a1a20] px-1.5 py-0.5 rounded">
                          Pasado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#888894] flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-[#a0a0ab]">
                        <Clock size={12} className="text-[#c5a059]" />
                        {ev.slot.time} hs ({duration} min)
                      </span>
                      <span className="flex items-center gap-1 text-[#a0a0ab]">
                        <ListMusic size={12} className="text-[#888894]" />
                        {ev.songs.length} {ev.songs.length === 1 ? 'canción' : 'canciones'}
                      </span>
                      {ev.isAssigned && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                          <Check size={13} />
                          Posición #{ev.assignedOrder} en el setlist
                        </span>
                      )}
                    </div>

                    {/* Associated rehearsal info if configured */}
                    {rehearsal && rehearsal.enabled && (
                      <div className="inline-flex items-center gap-1.5 text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/30 px-2 py-0.5 rounded-md font-mono">
                        <span>🎵 Ensayo: {DAYS_OF_WEEK[rehearsal.day]} a las {rehearsal.time} hs ({rehearsal.durationMinutes} min)</span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="flex-shrink-0 self-end sm:self-center">
                    {ev.isAssigned ? (
                      <button
                        type="button"
                        onClick={() => handleToggleAssign(ev)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                        title="Quitar esta canción del evento"
                      >
                        <Trash2 size={13} />
                        <span>Quitar del Evento</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleAssign(ev)}
                        className="px-3 py-1.5 rounded-xl bg-[#c5a059] hover:bg-[#d8b065] text-black text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow hover:scale-[1.02]"
                        title="Asignar esta canción al evento"
                      >
                        <Plus size={14} />
                        <span>Asignar a este Evento</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 border-t border-[#202026] bg-[#141418] flex items-center justify-between text-xs text-[#888894]">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#c5a059]" />
            Los cambios se sincronizan en vivo con el setlist del culto.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#22222a] hover:bg-[#2c2c36] text-white font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
