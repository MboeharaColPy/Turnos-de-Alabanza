import React, { useState } from 'react';
import { Clock, Calendar, Music, X, Check, AlertCircle } from 'lucide-react';
import { Slot, SlotRehearsal } from '../types';

interface EditEventScheduleModalProps {
  slot: Slot;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSaveSlot: (updatedSlot: Slot) => void;
  onRequestAdmin: () => void;
  showToast: (msg: string) => void;
}

const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const EVENT_TIME_PRESETS = ['08:30', '09:00', '09:30', '10:00', '11:00', '17:00', '18:00', '19:00', '20:00'];
const REHEARSAL_TIME_PRESETS = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

export const EditEventScheduleModal: React.FC<EditEventScheduleModalProps> = ({
  slot,
  isOpen,
  isAdmin,
  onClose,
  onSaveSlot,
  onRequestAdmin,
  showToast,
}) => {
  if (!isOpen) return null;

  const [label, setLabel] = useState(slot.label || 'Culto');
  const [day, setDay] = useState<number>(typeof slot.day === 'number' ? slot.day : 6);
  const [time, setTime] = useState<string>(slot.time ? slot.time.slice(0, 5) : '10:00');
  const [durationMinutes, setDurationMinutes] = useState<number>(slot.durationMinutes || 90);

  // Rehearsal state
  const initialRehearsal = slot.rehearsal;
  const [hasRehearsal, setHasRehearsal] = useState<boolean>(!!initialRehearsal?.enabled);
  const [rehearsalDay, setRehearsalDay] = useState<number>(
    typeof initialRehearsal?.day === 'number' ? initialRehearsal.day : 5
  );
  const [rehearsalTime, setRehearsalTime] = useState<string>(
    initialRehearsal?.time ? initialRehearsal.time.slice(0, 5) : '18:00'
  );
  const [rehearsalDuration, setRehearsalDuration] = useState<number>(
    initialRehearsal?.durationMinutes || 90
  );
  const [rehearsalLabel, setRehearsalLabel] = useState<string>(
    initialRehearsal?.label || 'Ensayo previo del Sábado'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      onRequestAdmin();
      return;
    }

    if (!time.trim()) {
      showToast('Por favor introduce la hora del evento.');
      return;
    }

    const updatedRehearsal: SlotRehearsal | undefined = hasRehearsal
      ? {
          enabled: true,
          day: rehearsalDay,
          time: rehearsalTime.trim() || '18:00',
          durationMinutes: Number(rehearsalDuration) || 90,
          label: rehearsalLabel.trim() || 'Ensayo previo',
        }
      : undefined;

    const updatedSlot: Slot = {
      ...slot,
      label: label.trim() || slot.label,
      day,
      time: time.trim(),
      durationMinutes: Number(durationMinutes) || 90,
      rehearsal: updatedRehearsal,
    };

    onSaveSlot(updatedSlot);
    showToast(`Horarios actualizados: ${updatedSlot.label} a las ${updatedSlot.time} HS`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#141418] border border-[#2a2a2e] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 text-white flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-[#232328] flex items-center justify-between bg-gradient-to-r from-[#18181d] to-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/15 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-white">
                Modificar Horarios
              </h3>
              <p className="text-xs text-[#888894]">
                Evento: <strong className="text-white">{slot.label}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#1e1e24] hover:bg-[#282830] text-[#888894] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {!isAdmin && (
            <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-2xl flex items-center gap-2.5 text-amber-200 text-xs">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
              <span>Modo consulta: Requiere acceso de Administrador para guardar los cambios.</span>
            </div>
          )}

          {/* SECCIÓN 1: HORARIO DEL EVENTO (CULTO) */}
          <div className="bg-[#0e0e11] border border-[#232328] rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c20]">
              <span className="font-mono text-xs uppercase tracking-wider text-[#c5a059] font-bold flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Horario Oficial del Evento</span>
              </span>
              <span className="text-[11px] font-mono text-[#888894]">
                {DAYS_OF_WEEK[day]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                  Día de la Semana
                </label>
                <select
                  value={day}
                  onChange={e => setDay(Number(e.target.value))}
                  className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                  Hora del Evento (HS)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                  className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono text-sm font-bold text-[#c5a059]"
                />
              </div>
            </div>

            {/* Presets rápidos de hora de evento */}
            <div>
              <span className="block font-mono text-[10px] text-[#6b6b75] mb-1">Horas comunes:</span>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TIME_PRESETS.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTime(preset)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs cursor-pointer transition-all border ${
                      time === preset
                        ? 'bg-[#c5a059] text-black font-bold border-[#c5a059]'
                        : 'bg-[#18181d] text-[#888894] border-[#25252a] hover:text-white'
                    }`}
                  >
                    {preset} hs
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                  Nombre del Evento
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  step={15}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value) || 90)}
                  className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: APARTADO DE ENSAYO (DENTRO DEL EVENTO) */}
          <div className="bg-[#0e0e11] border border-[#232328] rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c20]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasRehearsal}
                  onChange={e => setHasRehearsal(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c5a059] focus:ring-0 focus:ring-offset-0 bg-[#141418] border-[#2a2a2e] cursor-pointer"
                />
                <span className="font-mono text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                  <Music size={13} className="text-amber-400" />
                  <span>Apartado de Ensayo Previo</span>
                </span>
              </label>

              {hasRehearsal && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                  Activo
                </span>
              )}
            </div>

            {hasRehearsal ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                    Etiqueta / Nombre del Ensayo
                  </label>
                  <input
                    type="text"
                    value={rehearsalLabel}
                    onChange={e => setRehearsalLabel(e.target.value)}
                    placeholder="Ej: Ensayo previo del Sábado"
                    className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                      Día del Ensayo
                    </label>
                    <select
                      value={rehearsalDay}
                      onChange={e => setRehearsalDay(Number(e.target.value))}
                      className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
                    >
                      {DAYS_OF_WEEK.map((d, idx) => (
                        <option key={idx} value={idx}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                      Hora del Ensayo (HS)
                    </label>
                    <input
                      type="time"
                      value={rehearsalTime}
                      onChange={e => setRehearsalTime(e.target.value)}
                      required
                      className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono text-sm font-bold text-amber-400"
                    />
                  </div>
                </div>

                {/* Presets rápidos de hora de ensayo */}
                <div>
                  <span className="block font-mono text-[10px] text-[#6b6b75] mb-1">Horas comunes para ensayo:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {REHEARSAL_TIME_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRehearsalTime(preset)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs cursor-pointer transition-all border ${
                          rehearsalTime === preset
                            ? 'bg-amber-400 text-black font-bold border-amber-400'
                            : 'bg-[#18181d] text-[#888894] border-[#25252a] hover:text-white'
                        }`}
                      >
                        {preset} hs
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-[#888894] uppercase tracking-wider mb-1">
                    Duración del Ensayo (minutos)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={240}
                    step={15}
                    value={rehearsalDuration}
                    onChange={e => setRehearsalDuration(Number(e.target.value) || 90)}
                    className="w-full bg-[#141418] text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none font-mono"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#6b6b75] italic">
                Marca la casilla para vincular un ensayo específico a este evento (aparecerá como un apartado dentro de la tarjeta del evento).
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#232328]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#888894] hover:text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-bold rounded-xl text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#c5a059]/20"
            >
              <Check size={14} />
              <span>Guardar Horarios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
