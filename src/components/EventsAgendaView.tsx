import React, { useState } from 'react';
import { AppState, SongItem } from '../types';
import { MonthCalendarView } from './MonthCalendarView';
import { WeekView } from './WeekView';

interface EventsAgendaViewProps {
  state: AppState;
  isAdmin: boolean;
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  onApplySchedule: (newAssignments: Record<string, Record<string, string>>) => void;
  onSelectWeek: (startOfWeek: Date) => void;
  onSelectSong: (song: SongItem, contextSongs?: SongItem[]) => void;
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
      {/* Renderizado de la vista seleccionada con cabecera combinada e integrada */}
      {viewMode === 'mes' ? (
        <MonthCalendarView
          state={state}
          isAdmin={isAdmin}
          onApplySchedule={onApplySchedule}
          onSelectWeek={handleSelectWeekFromMonth}
          onSelectSong={onSelectSong}
          showToast={showToast}
          onRequestAdmin={onRequestAdmin}
          agendaViewMode={viewMode}
          onAgendaViewModeChange={setViewMode}
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
          agendaViewMode={viewMode}
          onAgendaViewModeChange={setViewMode}
        />
      )}
    </div>
  );
};
