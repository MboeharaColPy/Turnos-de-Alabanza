import React from 'react';
import { SongItem } from '../types';
import { generateId } from '../services/storage';
import {
  Music,
  Plus,
  Trash2,
  KeyRound,
  Copy,
  Check,
  FileText,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Layers,
} from 'lucide-react';

interface ShiftSongsManagerProps {
  shiftKey: string;
  slotLabel: string;
  dateStr: string;
  songs: SongItem[];
  catalog: SongItem[];
  onUpdateSongs: (shiftKey: string, songs: SongItem[]) => void;
  onAddToCatalog?: (song: SongItem) => void;
  onSelectSong?: (song: SongItem, contextSongs?: SongItem[]) => void;
  showToast: (msg: string) => void;
}

export const ShiftSongsManager: React.FC<ShiftSongsManagerProps> = ({
  shiftKey,
  slotLabel,
  dateStr,
  songs = [],
  catalog = [],
  onUpdateSongs,
  onAddToCatalog,
  onSelectSong,
  showToast,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [artist, setArtist] = React.useState('');
  const [key, setKey] = React.useState('');
  const [tempo, setTempo] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = React.useState('');

  const handleAddCustomSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSong: SongItem = {
      id: generateId('sng'),
      title: title.trim(),
      artist: artist.trim() || undefined,
      artists: artist.trim() ? [artist.trim()] : undefined,
      key: key.trim() || undefined,
      tempo: tempo.trim() || undefined,
    };

    const nextList = [...songs, newSong];
    onUpdateSongs(shiftKey, nextList);

    if (onAddToCatalog) {
      onAddToCatalog(newSong);
    }

    setTitle('');
    setArtist('');
    setKey('');
    setTempo('');
    setIsAdding(false);
    showToast(`Canción "${newSong.title}" agregada a la lista.`);
  };

  const handleSelectFromCatalog = (songId: string) => {
    if (!songId) return;
    const found = catalog.find(c => c.id === songId);
    if (!found) return;

    const alreadyInShift = songs.some(s => s.title.toLowerCase().trim() === found.title.toLowerCase().trim());
    if (alreadyInShift) {
      showToast(`La canción "${found.title}" ya está en la lista de este turno.`);
      setSelectedCatalogId('');
      return;
    }

    const songToAdd: SongItem = {
      ...found,
      id: generateId('sng'),
    };

    const nextList = [...songs, songToAdd];
    onUpdateSongs(shiftKey, nextList);
    setSelectedCatalogId('');
    showToast(`"${found.title}" agregada al repertorio.`);
  };

  const handleRemoveSong = (songId: string) => {
    const nextList = songs.filter(s => s.id !== songId);
    onUpdateSongs(shiftKey, nextList);
  };

  // Reorganizar canciones (Mover arriba / abajo)
  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === songs.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const nextList = [...songs];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIndex, 0, moved);

    onUpdateSongs(shiftKey, nextList);
    showToast(`Canción movida al puesto ${targetIndex + 1}.`);
  };

  const handleCopySetlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (songs.length === 0) {
      showToast('No hay canciones agregadas aún en este turno.');
      return;
    }

    let text = `🎶 *REPERTORIO / ALABANZAS*\n`;
    text += `📌 ${slotLabel} (${dateStr})\n\n`;

    songs.forEach((s, idx) => {
      text += `${idx + 1}. *${s.title}*`;
      if (s.key) text += ` [Tono: ${s.key}]`;
      if (s.artist) text += ` - _${s.artist}_`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    showToast('Repertorio copiado para WhatsApp');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-t border-[#1f1f23] bg-[#0c0c0e]/80">
      {/* Header del Acordeón de Canciones */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#141418] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0">
            <Music size={12} />
          </div>
          <span className="text-xs font-serif text-white tracking-wide truncate">
            Repertorio Semanal <span className="text-[#888894] font-mono text-[11px]">({songs.length})</span>
          </span>
          {songs.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 overflow-hidden max-w-xs">
              {songs.slice(0, 2).map((s, idx) => (
                <span
                  key={s.id || idx}
                  onClick={e => {
                    e.stopPropagation();
                    if (onSelectSong) onSelectSong(s, songs);
                  }}
                  className="text-[10px] font-mono bg-[#1a1a1d] hover:bg-[#25252a] hover:border-[#c5a059] text-[#c5a059] px-2 py-0.5 rounded border border-[#2a2a2e] truncate cursor-pointer transition-colors"
                  title="Ver letra y notas de esta alabanza"
                >
                  {s.title}
                </span>
              ))}
              {songs.length > 2 && (
                <span className="text-[10px] font-mono text-[#888894]">+{songs.length - 2}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {songs.length > 0 && (
            <button
              onClick={handleCopySetlist}
              className="px-2.5 py-1 bg-[#1a1a1d] hover:bg-[#232328] text-[#c5a059] border border-[#c5a059]/30 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              title="Copiar setlist de canciones"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          )}
          <span className="text-xs text-[#888894] font-mono">
            {isOpen ? 'Ocultar ▲' : 'Ver / Reorganizar ▼'}
          </span>
        </div>
      </div>

      {/* Contenido Desplegable */}
      {isOpen && (
        <div className="p-4 border-t border-dashed border-[#1f1f23] space-y-3 bg-[#0a0a0b]">
          {/* Lista de Canciones del Turno con Reorganización */}
          {songs.length === 0 ? (
            <div className="text-center py-4 text-xs text-[#888894] italic bg-[#121215] rounded-xl border border-[#1f1f23]">
              No hay canciones asignadas a este servicio todavía.
            </div>
          ) : (
            <div className="space-y-1.5">
              {songs.map((song, index) => (
                <div
                  key={song.id || index}
                  className="flex items-center justify-between p-2 sm:p-2.5 bg-[#141418] rounded-xl border border-[#1f1f23] hover:border-[#c5a059]/40 transition-colors group"
                >
                  {/* Botones de Reorganización (Subir / Bajar) */}
                  <div className="flex flex-col items-center gap-0.5 mr-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveSong(index, 'up')}
                      className="p-0.5 text-[#6b6b75] hover:text-[#c5a059] disabled:opacity-20 disabled:hover:text-[#6b6b75] transition-colors cursor-pointer"
                      title="Mover arriba en el orden del servicio"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === songs.length - 1}
                      onClick={() => handleMoveSong(index, 'down')}
                      className="p-0.5 text-[#6b6b75] hover:text-[#c5a059] disabled:opacity-20 disabled:hover:text-[#6b6b75] transition-colors cursor-pointer"
                      title="Mover abajo en el orden del servicio"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  <div
                    onClick={() => onSelectSong && onSelectSong(song, songs)}
                    className="flex items-center gap-2.5 flex-1 cursor-pointer min-w-0"
                    title="Haz clic para abrir visor de acordes y letra (Navega sólo en esta lista)"
                  >
                    <span className="font-mono text-xs text-[#c5a059] font-bold w-4 text-center">
                      {index + 1}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-white group-hover:text-[#c5a059] transition-colors truncate">
                          {song.title}
                        </span>
                        {song.key && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-mono bg-[#0a0a0b] text-[#c5a059] border border-[#c5a059]/30 px-1.5 py-0.5 rounded">
                            <KeyRound size={9} />
                            {song.key}
                          </span>
                        )}
                        {song.tempo && (
                          <span className="text-[9px] font-mono text-[#888894] bg-[#0a0a0b] px-1.5 py-0.5 rounded">
                            {song.tempo}
                          </span>
                        )}
                      </div>
                      {song.artist && (
                        <p className="text-[10px] text-[#888894] italic truncate">{song.artist}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectSong && onSelectSong(song, songs)}
                      className="px-2.5 py-1 rounded-lg bg-[#1a1a1d] hover:bg-[#25252a] text-[#c5a059] border border-[#c5a059]/30 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                      title="Abrir letra, acordes y herramientas"
                    >
                      <FileText size={11} />
                      <span className="hidden sm:inline">Ver Letra</span>
                    </button>

                    <button
                      onClick={() => handleRemoveSong(song.id)}
                      className="w-7 h-7 rounded-lg bg-[#1a1a1d] hover:bg-red-950/40 text-[#6b6b75] hover:text-red-400 border border-[#2a2a2e] flex items-center justify-center transition-colors cursor-pointer"
                      title="Remover canción de este turno"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Opciones para agregar canciones */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Elegir del catálogo */}
            <div className="flex-1">
              <select
                value={selectedCatalogId}
                onChange={e => handleSelectFromCatalog(e.target.value)}
                className="w-full bg-[#121215] text-xs text-[#e0e0e0] rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none cursor-pointer"
              >
                <option value="">+ Seleccionar del catálogo de alabanzas...</option>
                {[...catalog]
                  .sort((a, b) => a.title.localeCompare(b.title, 'es', { numeric: true, sensitivity: 'base' }))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.key ? `(${c.key})` : ''} {c.artist ? `— ${c.artist}` : ''}
                    </option>
                  ))}
              </select>
            </div>

            {/* O escribir nueva canción */}
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a1a1d] hover:bg-[#232328] text-xs font-mono uppercase tracking-wider text-[#c5a059] border border-[#c5a059]/30 rounded-xl cursor-pointer transition-colors"
            >
              <Plus size={13} />
              <span>{isAdding ? 'Cerrar formulario' : 'Nueva canción'}</span>
            </button>
          </div>

          {/* Formulario para crear canción nueva */}
          {isAdding && (
            <form
              onSubmit={handleAddCustomSong}
              className="p-4 bg-[#121215] rounded-xl border border-[#2a2a2e] space-y-3 animate-fadeIn"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
                    Título de la canción *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej: La Bondad de Dios"
                    className="w-full bg-[#0a0a0b] text-xs text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
                    Autor / Intérprete (Opcional)
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={e => setArtist(e.target.value)}
                    placeholder="Ej: Bethel Music / En Espíritu"
                    className="w-full bg-[#0a0a0b] text-xs text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
                    Tonalidad / Nota (Ej: G, C, D, Em)
                  </label>
                  <input
                    type="text"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="Ej: Sol Mayor / G"
                    className="w-full bg-[#0a0a0b] text-xs text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#888894] uppercase tracking-wider mb-1">
                    Tempo / Ritmo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={tempo}
                    onChange={e => setTempo(e.target.value)}
                    placeholder="Ej: Lenta / 72 BPM / Júbilo"
                    className="w-full bg-[#0a0a0b] text-xs text-white rounded-xl px-3 py-2 border border-[#2a2a2e] focus:border-[#c5a059] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-[#888894] hover:text-white cursor-pointer font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all font-mono"
                >
                  Guardar y Agregar
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
