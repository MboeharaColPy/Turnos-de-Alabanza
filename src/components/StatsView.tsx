import React from 'react';
import { AppState, Musician, Role, SongItem } from '../types';
import { BarChart3, Music, Users, Award, TrendingUp, Calendar, Mic2, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface StatsViewProps {
  state: AppState;
}

export const StatsView: React.FC<StatsViewProps> = ({ state }) => {
  const [activeSubTab, setActiveSubTab] = React.useState<'musicos' | 'canciones'>('musicos');
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('ALL'); // 'ALL' or 'YYYY-MM'

  // Extract available months from assignments and shiftSongs keys
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    Object.keys(state.assignments).forEach(key => {
      const datePart = key.split('__')[0];
      if (datePart && datePart.length >= 7) {
        monthsSet.add(datePart.substring(0, 7)); // YYYY-MM
      }
    });
    Object.keys(state.shiftSongs || {}).forEach(key => {
      const datePart = key.split('__')[0];
      if (datePart && datePart.length >= 7) {
        monthsSet.add(datePart.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [state.assignments, state.shiftSongs]);

  // --- STATS DE MÚSICOS ---
  const musicianStats = React.useMemo(() => {
    const totalAssignmentsByMusician: Record<string, number> = {};
    const roleBreakdownByMusician: Record<string, Record<string, number>> = {};
    let totalAssignedSeats = 0;

    Object.entries(state.assignments).forEach(([key, slotAssign]) => {
      const datePart = key.split('__')[0];
      if (selectedMonth !== 'ALL' && !datePart.startsWith(selectedMonth)) {
        return;
      }

      Object.entries(slotAssign).forEach(([roleId, musicianId]) => {
        if (!musicianId) return;

        if (selectedRoleId !== 'ALL' && roleId !== selectedRoleId) {
          return;
        }

        totalAssignedSeats++;
        totalAssignmentsByMusician[musicianId] = (totalAssignmentsByMusician[musicianId] || 0) + 1;

        if (!roleBreakdownByMusician[musicianId]) {
          roleBreakdownByMusician[musicianId] = {};
        }
        roleBreakdownByMusician[musicianId][roleId] = (roleBreakdownByMusician[musicianId][roleId] || 0) + 1;
      });
    });

    // Compute active streaks (consecutive shifts in chronological order)
    const sortedShiftKeys = Object.keys(state.assignments).sort();
    const currentStreaks: Record<string, number> = {};

    state.musicians.forEach(m => {
      let streak = 0;
      for (let i = sortedShiftKeys.length - 1; i >= 0; i--) {
        const k = sortedShiftKeys[i];
        const assign = state.assignments[k] || {};
        const isAssigned = Object.values(assign).includes(m.id);
        if (isAssigned) {
          streak++;
        } else {
          break;
        }
      }
      currentStreaks[m.id] = streak;
    });

    const list = state.musicians.map(m => ({
      musician: m,
      count: totalAssignmentsByMusician[m.id] || 0,
      roleCounts: roleBreakdownByMusician[m.id] || {},
      currentStreak: currentStreaks[m.id] || 0,
    }));

    list.sort((a, b) => b.count - a.count || a.musician.name.localeCompare(b.musician.name));
    return { list, totalAssignedSeats };
  }, [state.assignments, state.musicians, selectedMonth, selectedRoleId]);

  // --- STATS DE CANCIONES ---
  const songStats = React.useMemo(() => {
    const songUsageMap: Record<string, { song: SongItem; count: number; dates: string[] }> = {};
    let totalSongsPlayed = 0;

    Object.entries(state.shiftSongs || {}).forEach(([key, songsList]) => {
      const datePart = key.split('__')[0];
      if (selectedMonth !== 'ALL' && !datePart.startsWith(selectedMonth)) {
        return;
      }

      const songs = (songsList as SongItem[]) || [];
      songs.forEach(song => {
        totalSongsPlayed++;
        const normKey = song.title.toLowerCase().trim();
        if (!songUsageMap[normKey]) {
          songUsageMap[normKey] = {
            song,
            count: 0,
            dates: [],
          };
        }
        songUsageMap[normKey].count += 1;
        if (!songUsageMap[normKey].dates.includes(datePart)) {
          songUsageMap[normKey].dates.push(datePart);
        }
      });
    });

    const list = Object.values(songUsageMap).sort((a, b) => b.count - a.count || a.song.title.localeCompare(b.song.title));
    return { list, totalSongsPlayed };
  }, [state.shiftSongs, selectedMonth]);

  const formatMonthName = (mStr: string) => {
    if (mStr === 'ALL') return 'Todo el Histórico';
    const [y, m] = mStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior de Control de Estadísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141418] p-5 rounded-xl border border-[#1f1f23] shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-[#c5a059]" />
            <h2 className="font-serif text-2xl font-light text-white">
              Tablero de <span className="italic text-[#c5a059]">Estadísticas</span>
            </h2>
          </div>
          <p className="text-xs text-[#6b6b75]">
            Métricas de participación de músicos y frecuencia de alabanzas en la congregación.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0b] px-3 py-1.5 rounded-lg border border-[#1f1f23]">
            <Calendar size={13} className="text-[#c5a059]" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-mono"
            >
              <option value="ALL">Todo el Histórico</option>
              {availableMonths.map(m => (
                <option key={m} value={m} className="bg-[#141418]">
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Subpestaña */}
          <div className="flex bg-[#0f0f12] p-1 rounded-lg border border-[#1f1f23]">
            <button
              onClick={() => setActiveSubTab('musicos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'musicos'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-sm'
                  : 'text-[#6b6b75] hover:text-white'
              }`}
            >
              <Users size={12} />
              <span>Músicos ({musicianStats.list.filter(x => x.count > 0).length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('canciones')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'canciones'
                  ? 'bg-[#1a1a1d] text-white border border-[#c5a059]/40 shadow-sm'
                  : 'text-[#6b6b75] hover:text-white'
              }`}
            >
              <Music size={12} />
              <span>Canciones ({songStats.list.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISTA 1: ESTADÍSTICAS DE MÚSICOS */}
      {activeSubTab === 'musicos' && (
        <div className="space-y-6">
          {/* Métricas Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141418] border border-[#1f1f23] p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] block mb-1">
                Total Participaciones
              </span>
              <span className="font-serif text-3xl text-white font-light">
                {musicianStats.totalAssignedSeats}
              </span>
              <span className="text-[11px] text-[#6b6b75] block mt-1 font-mono">
                Asignaciones registradas
              </span>
            </div>

            <div className="bg-[#141418] border border-[#1f1f23] p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] block mb-1">
                Músico con Más Turnos
              </span>
              <span className="font-serif text-2xl text-[#c5a059] font-light truncate block">
                {musicianStats.list[0]?.count > 0 ? musicianStats.list[0].musician.name : '—'}
              </span>
              <span className="text-[11px] text-[#6b6b75] block mt-1 font-mono">
                {musicianStats.list[0]?.count || 0} turnos totales
              </span>
            </div>

            <div className="bg-[#141418] border border-[#1f1f23] p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] block mb-1">
                Regla de Descanso (4 Turnos)
              </span>
              <span className="font-serif text-2xl text-amber-400 font-light block">
                {musicianStats.list.filter(x => x.currentStreak >= 4).length} integrantes
              </span>
              <span className="text-[11px] text-[#6b6b75] block mt-1 font-mono">
                En descanso obligatorio actual
              </span>
            </div>
          </div>

          {/* Filtro por Rol */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-[#141418] p-3 rounded-xl border border-[#1f1f23]">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#6b6b75] pl-2 flex items-center gap-1">
              <Mic2 size={12} /> Rol:
            </span>
            <button
              onClick={() => setSelectedRoleId('ALL')}
              className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider border whitespace-nowrap cursor-pointer transition-all ${
                selectedRoleId === 'ALL'
                  ? 'bg-[#1a1a1d] text-white border-[#c5a059]/40'
                  : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23] hover:text-white'
              }`}
            >
              Todos los Roles
            </button>
            {state.roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`px-3 py-1 rounded text-xs font-mono uppercase tracking-wider border whitespace-nowrap cursor-pointer transition-all ${
                  selectedRoleId === r.id
                    ? 'bg-[#1a1a1d] text-[#c5a059] border-[#c5a059]/40'
                    : 'bg-[#0a0a0b] text-[#6b6b75] border-[#1f1f23] hover:text-white'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>

          {/* Tabla Ranking de Músicos */}
          <div className="bg-[#141418] border border-[#1f1f23] rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 bg-[#1a1a1d] border-b border-[#1f1f23] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-[#c5a059]" />
                <h3 className="font-serif text-lg text-white font-light">
                  Ranking de Participación de <span className="italic text-[#c5a059]">Integrantes</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6b75]">
                Ordenado por turnos acumulados
              </span>
            </div>

            <div className="divide-y divide-[#1f1f23]">
              {musicianStats.list.map((item, index) => {
                const maxCount = musicianStats.list[0]?.count || 1;
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const isTop3 = index < 3 && item.count > 0;
                const isMandatoryRest = item.currentStreak >= 4;

                return (
                  <div
                    key={item.musician.id}
                    className="p-4 hover:bg-[#1a1a1d]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Nombre y posición */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-semibold ${
                          index === 0 && item.count > 0
                            ? 'bg-[#c5a059] text-black shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                            : index === 1 && item.count > 0
                            ? 'bg-[#8c8c9a] text-black'
                            : index === 2 && item.count > 0
                            ? 'bg-[#9c683b] text-white'
                            : 'bg-[#1a1a1d] text-[#6b6b75] border border-[#2a2a2e]'
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-white">{item.musician.name}</span>
                          <span className="text-[10px] font-mono text-[#6b6b75] bg-[#0a0a0b] px-1.5 py-0.5 rounded border border-[#1f1f23]">
                            {item.musician.gender === 'H' ? 'Hombre' : 'Mujer'}
                          </span>
                          {isMandatoryRest && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/40">
                              <ShieldAlert size={10} />
                              <span>Descanso Obligatorio (4 turnos)</span>
                            </span>
                          )}
                          {!isMandatoryRest && item.currentStreak > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              <Flame size={10} />
                              <span>{item.currentStreak} seguidos</span>
                            </span>
                          )}
                        </div>

                        {/* Desglose por roles */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {Object.entries(item.roleCounts).map(([roleId, rCount]) => {
                            const r = state.roles.find(x => x.id === roleId);
                            if (!r) return null;
                            return (
                              <span
                                key={roleId}
                                className="text-[10px] font-mono bg-[#0a0a0b] text-[#c5a059] border border-[#c5a059]/20 px-1.5 py-0.5 rounded"
                              >
                                {r.name}: {rCount}
                              </span>
                            );
                          })}
                          {Object.keys(item.roleCounts).length === 0 && (
                            <span className="text-[10px] font-mono text-[#6b6b75] italic">
                              Sin turnos asignados en este período
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progreso y Conteo */}
                    <div className="flex items-center gap-4 flex-1 max-w-md">
                      <div className="flex-1 bg-[#0a0a0b] h-2.5 rounded-full overflow-hidden border border-[#1f1f23]">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isTop3 ? 'bg-[#c5a059]' : 'bg-[#6b6b75]'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-right min-w-[70px]">
                        <span className="font-mono text-base font-semibold text-white">
                          {item.count}
                        </span>
                        <span className="text-[10px] font-mono text-[#6b6b75] block uppercase">
                          Turnos
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: ESTADÍSTICAS DE CANCIONES */}
      {activeSubTab === 'canciones' && (
        <div className="space-y-6">
          {/* Resumen de Canciones */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141418] border border-[#1f1f23] p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] block mb-1">
                Alabanzas Cantadas
              </span>
              <span className="font-serif text-3xl text-white font-light">
                {songStats.totalSongsPlayed}
              </span>
              <span className="text-[11px] text-[#6b6b75] block mt-1 font-mono">
                Ejecuciones en servicios
              </span>
            </div>

            <div className="bg-[#141418] border border-[#1f1f23] p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] block mb-1">
                Repertorio Diferente
              </span>
              <span className="font-serif text-3xl text-[#c5a059] font-light">
                {songStats.list.length}
              </span>
              <span className="text-[11px] text-[#6b6b75] block mt-1 font-mono">
                Títulos distintos
              </span>
            </div>

            <div className="bg-[#141418] border border-[#1f1f23] p-4 rounded-xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b6b75] block mb-1">
                Canción Más Frecuente
              </span>
              <span className="font-serif text-xl text-white font-light truncate block">
                {songStats.list[0]?.song.title || '—'}
              </span>
              <span className="text-[11px] text-[#6b6b75] block mt-1 font-mono">
                {songStats.list[0]?.count || 0} veces entonada
              </span>
            </div>
          </div>

          {/* Ranking de Canciones */}
          <div className="bg-[#141418] border border-[#1f1f23] rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 bg-[#1a1a1d] border-b border-[#1f1f23] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music size={16} className="text-[#c5a059]" />
                <h3 className="font-serif text-lg text-white font-light">
                  Ranking de <span className="italic text-[#c5a059]">Alabanzas Más Usadas</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6b6b75]">
                Frecuencia de alabanzas
              </span>
            </div>

            {songStats.list.length === 0 ? (
              <div className="text-center py-12 text-[#6b6b75] italic bg-[#0a0a0b]">
                No hay canciones registradas en los turnos de este período.
                <br />
                <span className="text-xs text-[#c5a059] block mt-1">
                  Abre cualquier turno en la pestaña "Semana" y añade las canciones de cada servicio.
                </span>
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f23]">
                {songStats.list.map((item, index) => {
                  const maxCount = songStats.list[0]?.count || 1;
                  const percentage = (item.count / maxCount) * 100;
                  const isTop3 = index < 3;

                  return (
                    <div
                      key={item.song.title}
                      className="p-4 hover:bg-[#1a1a1d]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5 min-w-[220px]">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-semibold ${
                            index === 0
                              ? 'bg-[#c5a059] text-black'
                              : index === 1
                              ? 'bg-[#8c8c9a] text-black'
                              : index === 2
                              ? 'bg-[#9c683b] text-white'
                              : 'bg-[#1a1a1d] text-[#6b6b75] border border-[#2a2a2e]'
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white">{item.song.title}</span>
                            {item.song.key && (
                              <span className="text-[9px] font-mono bg-[#0a0a0b] text-[#c5a059] border border-[#c5a059]/30 px-1.5 py-0.5 rounded">
                                {item.song.key}
                              </span>
                            )}
                          </div>
                          {item.song.artist && (
                            <p className="text-[11px] text-[#6b6b75] italic">{item.song.artist}</p>
                          )}
                          <div className="text-[10px] font-mono text-[#6b6b75] mt-1">
                            Fechas: {item.dates.join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Barra de progreso y Conteo */}
                      <div className="flex items-center gap-4 flex-1 max-w-md">
                        <div className="flex-1 bg-[#0a0a0b] h-2.5 rounded-full overflow-hidden border border-[#1f1f23]">
                          <div
                            className={`h-full transition-all rounded-full ${
                              isTop3 ? 'bg-[#c5a059]' : 'bg-[#6b6b75]'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="text-right min-w-[70px]">
                          <span className="font-mono text-base font-semibold text-white">
                            {item.count}
                          </span>
                          <span className="text-[10px] font-mono text-[#6b6b75] block uppercase">
                            Veces
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
