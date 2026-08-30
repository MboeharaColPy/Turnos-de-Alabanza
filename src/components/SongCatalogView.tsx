import React, { useState, useMemo } from 'react';
import { SongItem } from '../types';
import { Search, Music, Sparkles, Filter, Plus, Check, BookOpen } from 'lucide-react';

interface SongCatalogViewProps {
  songs: SongItem[];
  isAdmin: boolean;
  onAddSong?: (song: Omit<SongItem, 'id'>) => void;
  onUpdateSong?: (song: SongItem) => void;
  onDeleteSong?: (id: string) => void;
  onSelectSong?: (song: SongItem) => void;
}

export const SongCatalogView: React.FC<SongCatalogViewProps> = ({
  songs,
  isAdmin,
  onAddSong,
  onSelectSong,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newKey, setNewKey] = useState('');

  // Extract unique artists
  const uniqueArtists = useMemo(() => {
    const artistSet = new Set<string>();
    songs.forEach(s => {
      if (s.artist && s.artist.trim()) {
        artistSet.add(s.artist.trim());
      }
    });
    return Array.from(artistSet).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  // Filter and sort songs alphabetically
  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = songs.filter(s => {
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.key && s.key.toLowerCase().includes(q));

      const matchArtist =
        selectedArtist === 'all' || (s.artist && s.artist.trim() === selectedArtist);

      return matchSearch && matchArtist;
    });

    return result.sort((a, b) =>
      a.title.localeCompare(b.title, 'es', { numeric: true, sensitivity: 'base' })
    );
  }, [songs, searchQuery, selectedArtist]);

  const handleCreateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (onAddSong) {
      onAddSong({
        title: newTitle.trim(),
        artist: newArtist.trim() || 'Desconocido',
        key: newKey.trim() || '',
      });
    }
    setNewTitle('');
    setNewArtist('');
    setNewKey('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6" id="song-catalog-view">
      {/* Header Banner */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#c5a059] uppercase tracking-widest mb-1">
              <BookOpen size={14} />
              <span>Repertorio Oficial</span>
            </div>
            <h2 className="font-serif text-3xl font-light text-white">
              Cancionero de <span className="italic text-[#c5a059]">Alabanza</span>
            </h2>
            <p className="text-xs text-[#6b6b75] mt-1 max-w-xl">
              Catálogo completo de las alabanzas y adoraciones del ministerio disponibles para programar en los cultos y ensayos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0a0a0b] px-4 py-2 rounded-xl border border-[#1f1f23] text-center">
              <span className="text-xl font-serif font-medium text-[#c5a059]">{songs.length}</span>
              <span className="block text-[10px] font-mono uppercase text-[#6b6b75] tracking-wider">Canciones</span>
            </div>

            {isAdmin && onAddSong && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black rounded-lg text-xs font-medium uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#c5a059]/10"
              >
                <Plus size={14} />
                <span>Nueva Canción</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#1f1f23]">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b75]" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar alabanza por título, artista o tono..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-lg text-sm text-white placeholder-[#6b6b75] focus:outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b75]" size={14} />
            <select
              value={selectedArtist}
              onChange={e => setSelectedArtist(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-lg text-xs text-white focus:outline-none transition-all cursor-pointer appearance-none"
            >
              <option value="all">Todos los artistas ({uniqueArtists.length})</option>
              {uniqueArtists.map(artist => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Songs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSongs.map((song, index) => (
          <div
            key={song.id || `s_${index}`}
            onClick={() => onSelectSong && onSelectSong(song)}
            className="bg-[#141418] border border-[#1f1f23] hover:border-[#c5a059] rounded-xl p-4 transition-all group flex items-start justify-between gap-3 shadow-md cursor-pointer hover:bg-[#18181d]"
            title="Haz clic para ver la letra y notas de esta alabanza"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#0a0a0b] border border-[#1f1f23] flex items-center justify-center text-[#c5a059] flex-shrink-0 group-hover:border-[#c5a059]/50 group-hover:bg-[#c5a059]/15 transition-colors">
                <Music size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-[#c5a059] transition-colors">
                    {song.title}
                  </h4>
                </div>
                <p className="text-xs text-[#6b6b75] truncate mt-0.5">
                  {song.artist || 'Desconocido'}
                </p>
                {song.lyrics ? (
                  <span className="inline-block text-[10px] font-mono text-emerald-400/80 mt-1">
                    ✓ Letra y acordes cargados
                  </span>
                ) : (
                  <span className="inline-block text-[10px] font-mono text-[#6b6b75] mt-1">
                    + Cargar letra / acordes
                  </span>
                )}
              </div>
            </div>

            {song.key && (
              <span className="font-mono text-[10px] uppercase font-semibold text-[#c5a059] bg-[#c5a059]/10 border border-[#c5a059]/30 px-2 py-0.5 rounded flex-shrink-0">
                {song.key}
              </span>
            )}
          </div>
        ))}
      </div>

      {filteredSongs.length === 0 && (
        <div className="text-center py-16 bg-[#141418] border border-dashed border-[#2a2a2e] rounded-2xl">
          <Music className="w-10 h-10 text-[#6b6b75]/40 mx-auto mb-3" />
          <h3 className="font-serif text-xl text-white font-light">No se encontraron alabanzas</h3>
          <p className="text-xs text-[#6b6b75] mt-1">Intenta con otro término de búsqueda o filtro de artista.</p>
        </div>
      )}

      {/* Modal Agregar Canción */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-[#2a2a2e] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-xl text-white">Agregar Alabanza al Repertorio</h3>
            <form onSubmit={handleCreateSong} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-[#6b6b75] mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: Cuan Grande es Dios"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#6b6b75] mb-1">Artista / Autor</label>
                <input
                  type="text"
                  value={newArtist}
                  onChange={e => setNewArtist(e.target.value)}
                  placeholder="Ej: Marcos Witt"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-[#6b6b75] mb-1">Tono Predeterminado (Opcional)</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="Ej: Sol / G / Dm"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-medium rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Guardar Alabanza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
