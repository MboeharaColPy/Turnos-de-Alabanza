import React, { useState } from 'react';
import { AppState, SongItem } from '../types';
import { MonthCalendarView } from './MonthCalendarView';
import { WeekView } from './WeekView';
import {
  CalendarDays,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  Filter
} from 'lucide-react';

interface EventsAgendaViewProps {
  state: AppState;
  isAdmin: boolean;
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  onApplySchedule: (newAssignments: Record<string, Record<string, string>>) => void;
  onSelectWeek: (startOfWeek: Date) => void;
  onSelectSong: (song: SongItem) => void;
  onOpenCatalog?: () => void;
  onUpdateAssignment: (slotInstanceKey: string, roleId: string, musicianId: string) => void;
  onUpdateSongs: (shiftKey: string, songs: SongItem[]) => void;
  onAddToCatalog: (song: SongItem) => void;
  onClearWeek: (keysToClear: string[]) => void;
  onRestoreWeek: (previousAssignments: Record<string, Record<string, string>>) => void;
  showToast: (msg: string) => void;
  onRequestAdmin: () => void;
}

export const EventsAgendaView: React.FC<EventsAgendaViewProps> = ({
  state,
  isAdmin,
  currentWeekStart,
  onWeekChange,
  onApplySchedule,
  onSelectWeek,
  onSelectSong,
  onOpenCatalog,
  onUpdateAssignment,
  onUpdateSongs,
  onAddToCatalog,
  onClearWeek,
  onRestoreWeek,
  showToast,
  onRequestAdmin,
}) => {
  const [viewMode, setViewMode] = useState<'mes' | 'semana'>('mes');

  const handleSelectWeekFromMonth = (startOfWeek: Date) => {
    onSelectWeek(startOfWeek);
    setViewMode('semana');
  };

  return (
    <div className="space-y-4" id="events-agenda-view">
      {/* Selector de sub-vista: Mes / Semana */}
      <div className="flex items-center justify-between bg-[#141418] border border-[#232328] rounded-2xl p-3 sm:p-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
            <CalendarDays size={16} />
          </div>
          <div>
            <h2 className="font-serif text-lg text-white font-medium">
              Calendario de <span className="italic text-[#c5a059]">Cultos & Ensayos</span>
            </h2>
            <p className="text-[11px] text-[#8e8e99]">
              Programación de servicios, ensayos y asignación de integrantes
            </p>
          </div>
        </div>

        {/* Botones de alternancia de vista */}
        <div className="flex bg-[#0a0a0b] p-1 rounded-xl border border-[#232328]">
          <button
            onClick={() => setViewMode('mes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'mes'
                ? 'bg-[#1e1e24] text-white border border-[#c5a059]/40 font-bold shadow-sm'
                : 'text-[#8e8e99] hover:text-white'
            }`}
          >
            <Calendar size={13} className={viewMode === 'mes' ? 'text-[#c5a059]' : ''} />
            <span>Vista Mes</span>
          </button>

          <button
            onClick={() => setViewMode('semana')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              viewMode === 'semana'
                ? 'bg-[#1e1e24] text-white border border-[#c5a059]/40 font-bold shadow-sm'
                : 'text-[#8e8e99] hover:text-white'
            }`}
          >
            <Layers size={13} className={viewMode === 'semana' ? 'text-[#c5a059]' : ''} />
            <span>Vista Semana</span>
          </button>
        </div>
      </div>

      {/* Renderizado de la vista seleccionada */}
      {viewMode === 'mes' ? (
        <MonthCalendarView
          state={state}
          isAdmin={isAdmin}
          onApplySchedule={onApplySchedule}
          onSelectWeek={handleSelectWeekFromMonth}
          onSelectSong={onSelectSong}
          showToast={showToast}
          onRequestAdmin={onRequestAdmin}
        />
      ) : (
        <WeekView
          state={state}
          isAdmin={isAdmin}
          currentWeekStart={currentWeekStart}
          onWeekChange={onWeekChange}
          onUpdateAssignment={onUpdateAssignment}
          onUpdateSongs={onUpdateSongs}
          onAddToCatalog={onAddToCatalog}
          onSelectSong={onSelectSong}
          onOpenCatalog={onOpenCatalog}
          onClearWeek={onClearWeek}
          onRestoreWeek={onRestoreWeek}
          onApplySchedule={onApplySchedule}
          showToast={showToast}
          onRequestAdmin={onRequestAdmin}
        />
      )}
    </div>
  );
};
