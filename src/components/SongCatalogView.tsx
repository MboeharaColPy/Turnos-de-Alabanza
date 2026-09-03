import React, { useState, useMemo } from 'react';
import { SongItem } from '../types';
import {
  Search,
  Music,
  Filter,
  Plus,
  BookOpen,
  List,
  Table as TableIcon,
  Tag,
  Clock,
  Sparkles,
  X,
  Layers,
  ChevronRight,
  ExternalLink,
  Video,
  FileText,
} from 'lucide-react';
import { ALL_STANDARD_KEYS } from '../utils/chordUtils';

interface SongCatalogViewProps {
  songs: SongItem[];
  isAdmin: boolean;
  onAddSong?: (song: Omit<SongItem, 'id'>) => void;
  onUpdateSong?: (song: SongItem) => void;
  onDeleteSong?: (id: string) => void;
  onSelectSong?: (song: SongItem, contextSongs?: SongItem[], initialView?: 'view' | 'pdf') => void;
}

export const CATEGORIES = [
  'Todas',
  'Adoración',
  'Alabanza',
  'Júbilo',
  'Comunión',
  'Especial',
  'Apertura',
  'General',
];

export type SpeedFilter = 'all' | 'slow' | 'medium' | 'fast';
export type ViewMode = 'table' | 'compact';

export const SongCatalogView: React.FC<SongCatalogViewProps> = ({
  songs,
  isAdmin,
  onAddSong,
  onSelectSong,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modal Agregar Alabanza
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [artistInput, setArtistInput] = useState('');
  const [newCategory, setNewCategory] = useState('Adoración');
  const [newKey, setNewKey] = useState('G');
  const [newBpm, setNewBpm] = useState<number | ''>(80);
  const [newLyrics, setNewLyrics] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');

  // Extract unique artists for dropdowns and filters
  const uniqueArtists = useMemo(() => {
    const artistSet = new Set<string>();
    songs.forEach(s => {
      if (s.artists && Array.isArray(s.artists)) {
        s.artists.forEach(a => a && artistSet.add(a.trim()));
      } else if (s.artist && s.artist.trim()) {
        artistSet.add(s.artist.trim());
      }
    });
    return Array.from(artistSet).sort((a, b) => a.localeCompare(b));
  }, [songs]);

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return songs.filter(s => {
      // Search text
      const titleMatch = s.title.toLowerCase().includes(q);
      const artistMatch = (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.artists && s.artists.some(a => a.toLowerCase().includes(q)));
      const keyMatch = s.key && s.key.toLowerCase().includes(q);
      const matchSearch = !q || titleMatch || artistMatch || keyMatch;

      // Artist filter
      const matchArtist =
        selectedArtist === 'all' ||
        (s.artist && s.artist.trim() === selectedArtist) ||
        (s.artists && s.artists.includes(selectedArtist));

      // Category filter
      const matchCategory =
        selectedCategory === 'Todas' || (s.category || 'General') === selectedCategory;

      // Speed / BPM Group filter
      let matchSpeed = true;
      const bpm = s.bpm || 0;
      if (selectedSpeed === 'slow') {
        matchSpeed = bpm > 0 && bpm < 80;
      } else if (selectedSpeed === 'medium') {
        matchSpeed = bpm >= 80 && bpm <= 115;
      } else if (selectedSpeed === 'fast') {
        matchSpeed = bpm > 115;
      }

      return matchSearch && matchArtist && matchCategory && matchSpeed;
    }).sort((a, b) => a.title.localeCompare(b.title, 'es', { numeric: true, sensitivity: 'base' }));
  }, [songs, searchQuery, selectedArtist, selectedCategory, selectedSpeed]);

  const handleCreateSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const finalArtist = artistInput.trim() || 'Desconocido';

    if (onAddSong) {
      onAddSong({
        title: newTitle.trim(),
        artist: finalArtist,
        artists: [finalArtist],
        category: newCategory,
        key: newKey.trim() || 'G',
        bpm: newBpm ? Number(newBpm) : undefined,
        lyrics: newLyrics.trim() || '',
        youtubeUrl: newYoutubeUrl.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Reset form
    setNewTitle('');
    setArtistInput('');
    setNewCategory('Adoración');
    setNewKey('G');
    setNewBpm(80);
    setNewLyrics('');
    setNewYoutubeUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6" id="song-catalog-view">
      {/* Header Banner */}
      <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#c5a059] uppercase tracking-widest mb-1 font-bold">
              <BookOpen size={14} />
              <span>Repertorio Oficial de Alabanzas</span>
            </div>
            <h2 className="font-serif text-3xl font-light text-white">
              Cancionero de <span className="italic text-[#c5a059]">Alabanza & Adoración</span>
            </h2>
            <p className="text-xs text-[#888894] mt-1 max-w-xl">
              Cifrado americano directo sin corchetes, filtros por BPM y categorías para programar cultos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0a0a0b] px-4 py-2 rounded-xl border border-[#1f1f23] text-center">
              <span className="text-xl font-serif font-medium text-[#c5a059]">{songs.length}</span>
              <span className="block text-[10px] font-mono uppercase text-[#6b6b75] tracking-wider">Canciones</span>
            </div>

            {isAdmin && onAddSong && (
              <button
                onClick={() => {
                  setArtistInput('');
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#c5a059]/20"
              >
                <Plus size={15} />
                <span>Nueva Canción</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Main Filter Controls */}
        <div className="mt-6 pt-6 border-t border-[#1f1f23] space-y-4">
          {/* Row 1: Search, Artist Dropdown, Speed/BPM, View Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6b75]" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, artista o tono..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl text-xs text-white placeholder-[#6b6b75] focus:outline-none transition-all"
              />
            </div>

            {/* Artist Dropdown */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b75]" size={14} />
              <select
                value={selectedArtist}
                onChange={e => setSelectedArtist(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl text-xs text-white focus:outline-none transition-all cursor-pointer appearance-none font-mono"
              >
                <option value="all">Todos los artistas ({uniqueArtists.length})</option>
                {uniqueArtists.map(artist => (
                  <option key={artist} value={artist}>
                    {artist}
                  </option>
                ))}
              </select>
            </div>

            {/* Speed / BPM Groups Filter */}
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b75]" size={14} />
              <select
                value={selectedSpeed}
                onChange={e => setSelectedSpeed(e.target.value as SpeedFilter)}
                className="w-full pl-9 pr-8 py-2 bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl text-xs text-white focus:outline-none transition-all cursor-pointer appearance-none font-mono"
              >
                <option value="all">Todas las velocidades (BPM)</option>
                <option value="slow">🐢 Lenta / Solemne (&lt; 80 BPM)</option>
                <option value="medium">🚶 Media / Moderada (80 - 115 BPM)</option>
                <option value="fast">⚡ Rápida / Júbilo (&gt; 115 BPM)</option>
              </select>
            </div>

            {/* View Mode Toggle: Table, Compact */}
            <div className="flex items-center justify-end gap-1 bg-[#0a0a0b] p-1 rounded-xl border border-[#232328] w-fit sm:w-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-[#1f1f23] text-[#c5a059]' : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Vista Tabla Detallada"
              >
                <TableIcon size={15} />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'compact' ? 'bg-[#1f1f23] text-[#c5a059]' : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Vista Lista Compacta"
              >
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Row 2: Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-mono uppercase text-[#888894] mr-1 flex items-center gap-1 flex-shrink-0">
              <Tag size={11} />
              <span>Categoría:</span>
            </span>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#c5a059] text-black font-bold shadow-md shadow-[#c5a059]/10'
                    : 'bg-[#0a0a0b] text-[#888894] hover:text-white border border-[#232328]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RENDER VIEW ACCORDING TO VIEW MODE (TABLE, COMPACT) */}
      {/* ======================================================== */}

      {/* 1. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0e0e12] border-b border-[#232328] text-[#888894] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Título</th>
                  <th className="py-3 px-4">Artista / Autor</th>
                  <th className="py-3 px-4">Tono</th>
                  <th className="py-3 px-4">BPM</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {filteredSongs.map((song, idx) => (
                  <tr
                    key={song.id || idx}
                    onClick={() => onSelectSong && onSelectSong(song, filteredSongs)}
                    className="hover:bg-[#1a1a1f] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-[#6b6b75]">{idx + 1}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white hover:text-[#c5a059]">
                      {song.title}
                    </td>
                    <td className="py-3 px-4 text-[#a0a0ab]">{song.artist || 'Desconocido'}</td>
                    <td className="py-3 px-4">
                      {song.key ? (
                        <span className="font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded border border-[#c5a059]/30">
                          {song.key}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#888894]">{song.bpm ? `${song.bpm}` : '-'}</td>
                    <td className="py-3 px-4 text-slate-300">{song.category || 'General'}</td>
                    <td className="py-3 px-4">
                      {(() => {
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
                          <div className="flex items-center gap-2">
                            {song.lyrics ? (
                              <span className="text-emerald-400 font-bold">✓ Acordes</span>
                            ) : (
                              <span className="text-[#6b6b75]">En blanco</span>
                            )}
                            {hasPdf && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSong && onSelectSong(song, filteredSongs, 'pdf');
                                }}
                                className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title="Ver partitura PDF directamente"
                              >
                                <FileText size={10} />
                                <span>PDF</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. COMPACT VIEW */}
      {viewMode === 'compact' && (
        <div className="bg-[#141418] border border-[#1f1f23] rounded-2xl divide-y divide-[#1f1f23] overflow-hidden shadow-xl">
          {filteredSongs.map((song, idx) => {
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
                key={song.id || idx}
                onClick={() => onSelectSong && onSelectSong(song, filteredSongs)}
                className="p-3 sm:px-5 flex items-center justify-between hover:bg-[#1a1a1f] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-[#6b6b75] w-6">{idx + 1}.</span>
                  <span className="font-medium text-sm text-white truncate hover:text-[#c5a059]">
                    {song.title}
                  </span>
                  <span className="text-xs text-[#888894] hidden sm:inline">· {song.artist}</span>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  {hasPdf && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSong && onSelectSong(song, filteredSongs, 'pdf');
                      }}
                      className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Ver partitura PDF directamente"
                    >
                      <FileText size={10} />
                      <span>PDF</span>
                    </button>
                  )}
                  {song.key && (
                    <span className="font-mono text-xs font-bold text-[#c5a059] px-2 py-0.5 bg-[#0a0a0b] rounded border border-[#232328]">
                      {song.key}
                    </span>
                  )}
                  <ChevronRight size={15} className="text-[#6b6b75]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredSongs.length === 0 && (
        <div className="text-center py-16 bg-[#141418] border border-dashed border-[#2a2a2e] rounded-2xl">
          <Music className="w-10 h-10 text-[#6b6b75]/40 mx-auto mb-3" />
          <h3 className="font-serif text-xl text-white font-light">No se encontraron alabanzas</h3>
          <p className="text-xs text-[#888894] mt-1">Intenta con otro término de búsqueda o filtro.</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AGREGAR ALABANZA AL REPERTORIO */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-[#2a2a2e] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#232328]">
              <h3 className="font-serif text-xl text-white font-medium">Agregar Alabanza al Repertorio</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#888894] hover:text-white p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSong} className="space-y-3.5">
              {/* Título */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej: 10.000 Razones"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              {/* Artista con autocompletado y selección rápida */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">
                  Artista / Autor / Intérprete
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="artists-catalog-list"
                    value={artistInput}
                    onChange={e => setArtistInput(e.target.value)}
                    placeholder="Escribe o selecciona un artista (Ej: Miel San Marcos, Marcos Witt, Hillsong...)"
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                  <datalist id="artists-catalog-list">
                    {uniqueArtists.map(artist => (
                      <option key={artist} value={artist} />
                    ))}
                  </datalist>
                </div>
                {uniqueArtists.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 max-h-16 overflow-y-auto pr-1">
                    <span className="text-[10px] text-[#888894] self-center mr-1">Sugeridos:</span>
                    {uniqueArtists.slice(0, 8).map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setArtistInput(a)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          artistInput === a
                            ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                            : 'bg-[#0a0a0b] text-[#888894] hover:text-white border-[#242429]'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tono, BPM & Categoría */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-mono uppercase text-[#888894] mb-1">Tono</label>
                  <select
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-2 py-2 text-xs text-[#c5a059] font-mono font-bold focus:outline-none cursor-pointer"
                  >
                    {ALL_STANDARD_KEYS.map(k => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#888894] mb-1">BPM</label>
                  <input
                    type="number"
                    value={newBpm}
                    onChange={e => setNewBpm(e.target.value ? parseInt(e.target.value, 10) : '')}
                    placeholder="80"
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-2 py-2 text-xs text-white font-mono focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#888894] mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-2 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c !== 'Todas').map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video YouTube URL */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">Enlace de YouTube (Opcional)</label>
                <input
                  type="text"
                  value={newYoutubeUrl}
                  onChange={e => setNewYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Letra y acordes iniciales */}
              <div>
                <label className="block text-xs font-mono uppercase text-[#888894] mb-1">Letra y Acordes (Opcional)</label>
                <textarea
                  rows={6}
                  value={newLyrics}
                  onChange={e => setNewLyrics(e.target.value)}
                  placeholder={`[Estrofa 1]\nG               Em7\nCantaré a Ti Señor\n      C          D    G\nCon todo mi corazón...`}
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl p-3 font-mono text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#232328]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#888894] hover:text-white rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#c5a059]/20"
                >
                  Guardar Canción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
