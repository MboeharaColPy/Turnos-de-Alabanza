import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SongItem, SongAttachment } from '../types';
import {
  parseLyricsLineTokens,
  transposeSongText,
  transposeSingleChord,
  isSectionHeader,
  isChordLine,
  ALL_STANDARD_KEYS,
} from '../utils/chordUtils';
import {
  InstrumentType,
  extractUniqueChords,
  convertLatinToAngloChord,
} from '../utils/chordDiagrams';
import { GuitarChordDiagram } from './GuitarChordDiagram';
import {
  X,
  Music,
  Edit3,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
  Copy,
  Check,
  Plus,
  Minus,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Printer,
  Columns,
  Square,
  Volume2,
  VolumeX,
  Layers,
  ArrowUp,
  Activity,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  EyeOff,
  Video,
  FileText,
  ExternalLink,
  Paperclip,
  Clock,
  Pin,
  HelpCircle,
} from 'lucide-react';

interface SongLyricsModalProps {
  song: SongItem | null;
  isAdmin: boolean;
  onClose: () => void;
  onSaveSongLyrics?: (
    songId: string,
    updatedLyrics: string,
    updatedKey?: string,
    updatedBpm?: number,
    updatedYoutubeUrl?: string,
    updatedAttachments?: SongAttachment[]
  ) => void;
  onRequestAdmin?: () => void;
  showToast: (msg: string) => void;
  allSongs?: SongItem[];
  onNavigateToSong?: (song: SongItem) => void;
}

type TextSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface StructureSection {
  id: string;
  code: string;
  label: string;
  lineIndex: number;
}

export function getSectionBadgeCode(headerText: string): { code: string; colorClass: string } {
  const clean = headerText.replace(/[[\]]/g, '').toLowerCase().trim();

  if (clean.includes('intro')) {
    return { code: 'IN', colorClass: 'bg-blue-500/15 text-blue-400 border-blue-500/40' };
  }
  if (clean.includes('verso 1') || clean.includes('estrofa 1') || clean === 'verso' || clean === 'estrofa') {
    return { code: 'V1', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' };
  }
  if (clean.includes('verso 2') || clean.includes('estrofa 2')) {
    return { code: 'V2', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' };
  }
  if (clean.includes('verso 3') || clean.includes('estrofa 3')) {
    return { code: 'V3', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' };
  }
  if (clean.includes('verso 4') || clean.includes('estrofa 4')) {
    return { code: 'V4', colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' };
  }
  if (clean.includes('pre') || clean.includes('pre-coro') || clean.includes('precoro')) {
    return { code: 'PC', colorClass: 'bg-purple-500/15 text-purple-400 border-purple-500/40' };
  }
  if (clean.includes('coro 2') || clean.includes('estribillo 2')) {
    return { code: 'C2', colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold' };
  }
  if (clean.includes('coro') || clean.includes('estribillo')) {
    return { code: 'C', colorClass: 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold' };
  }
  if (clean.includes('puente') || clean.includes('bridge')) {
    return { code: 'PTE', colorClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40' };
  }
  if (clean.includes('solo')) {
    return { code: 'SOLO', colorClass: 'bg-rose-500/15 text-rose-400 border-rose-500/40' };
  }
  if (clean.includes('inter') || clean.includes('instrumental')) {
    return { code: 'INST', colorClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40' };
  }
  if (clean.includes('final') || clean.includes('outro')) {
    return { code: 'OUT', colorClass: 'bg-orange-500/15 text-orange-400 border-orange-500/40' };
  }

  const short = clean.substring(0, 3).toUpperCase();
  return { code: short || 'SEC', colorClass: 'bg-[#1e1e24] text-[#c5a059] border-[#c5a059]/40' };
}

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=0&rel=0`;
    }
  } catch {
    return null;
  }
  return null;
}

export const SongLyricsModal: React.FC<SongLyricsModalProps> = ({
  song,
  isAdmin,
  onClose,
  onSaveSongLyrics,
  onRequestAdmin,
  showToast,
  allSongs = [],
  onNavigateToSong,
}) => {
  if (!song) return null;

  const defaultLyrics = song.lyrics || '';

  const [rawText, setRawText] = useState(defaultLyrics);
  const [editedText, setEditedText] = useState(defaultLyrics);
  const [currentKey, setCurrentKey] = useState<string>(() => convertLatinToAngloChord(song.key || 'G'));
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  
  // Persisted Chords vs Lyrics preference per device
  const [showChords, setShowChords] = useState<boolean>(() => {
    const saved = localStorage.getItem('alabanza_view_chords');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleShowChords = (val: boolean) => {
    setShowChords(val);
    localStorage.setItem('alabanza_view_chords', String(val));
  };

  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentType>('guitar');
  const [textSize, setTextSize] = useState<TextSize>('md');
  const [columnsCount, setColumnsCount] = useState<1 | 2>(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // YouTube separate panel & attachments
  const [showYouTubePanel, setShowYouTubePanel] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState(song.youtubeUrl || '');
  const [attachments, setAttachments] = useState<SongAttachment[]>(song.attachments || []);
  const [showAttachmentsPanel, setShowAttachmentsPanel] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');

  // Key selector popover
  const [showKeyPickerPopover, setShowKeyPickerPopover] = useState(false);
  const [showCapoPickerPopover, setShowCapoPickerPopover] = useState(false);
  const [showScrollSpeedPopover, setShowScrollSpeedPopover] = useState(false);

  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(30);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Metronome & BPM state
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState<number>(() => song.bpm || 120);
  const [metronomeSound, setMetronomeSound] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(0);
  const tapTimesRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // UI Panels
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);
  const [showChordDiagramsBar, setShowChordDiagramsBar] = useState(false);
  const [selectedChordForPopover, setSelectedChordForPopover] = useState<string | null>(null);

  // Initialize state when song changes
  useEffect(() => {
    const text = song.lyrics || '';
    setRawText(text);
    setEditedText(text);
    setCurrentKey(convertLatinToAngloChord(song.key || 'G'));
    setBpm(song.bpm || 120);
    setYoutubeUrlInput(song.youtubeUrl || '');
    setAttachments(song.attachments || []);
    setTransposeOffset(0);
    setCapoFret(0);
    setViewMode('view');
    setIsAutoScrolling(false);
    setIsMetronomeActive(false);
    setShowKeyPickerPopover(false);
    setShowCapoPickerPopover(false);
  }, [song.id, song.lyrics, song.key, song.bpm, song.youtubeUrl, song.attachments]);

  // Transposed text calculation (considering semitones and Capo)
  const displayedText = useMemo(() => {
    let result = editedText;
    const effectiveOffset = transposeOffset - capoFret;
    if (effectiveOffset !== 0) {
      result = transposeSongText(result, effectiveOffset);
    }
    return result;
  }, [editedText, transposeOffset, capoFret]);

  // Sounding Key vs Fingered Key
  const soundingKey = useMemo(() => {
    if (!currentKey) return 'G';
    return transposeOffset !== 0 ? transposeSingleChord(currentKey, transposeOffset) : currentKey;
  }, [currentKey, transposeOffset]);

  const fingeredKey = useMemo(() => {
    if (capoFret === 0) return soundingKey;
    return transposeSingleChord(soundingKey, -capoFret);
  }, [soundingKey, capoFret]);

  // Extract unique chords for chord diagrams
  const songUniqueChords = useMemo(() => {
    return extractUniqueChords(displayedText);
  }, [displayedText]);

  // Render lines
  const renderedLines = useMemo(() => {
    return displayedText.split('\n');
  }, [displayedText]);

  // Structure sections
  const structureSections = useMemo(() => {
    const sections: StructureSection[] = [];
    renderedLines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (isSectionHeader(trimmed)) {
        const { code } = getSectionBadgeCode(trimmed);
        sections.push({
          id: `sec_${idx}`,
          code,
          label: trimmed,
          lineIndex: idx,
        });
      }
    });
    return sections;
  }, [renderedLines]);

  // Navigation between songs strictly in the provided setlist context
  const currentSongIndex = useMemo(() => {
    return allSongs.findIndex(s => s.id === song.id);
  }, [allSongs, song.id]);

  const prevSong = currentSongIndex > 0 ? allSongs[currentSongIndex - 1] : null;
  const nextSong = currentSongIndex >= 0 && currentSongIndex < allSongs.length - 1 ? allSongs[currentSongIndex + 1] : null;

  const scrollToSection = (lineIndex: number) => {
    const el = document.getElementById(`section-node-${lineIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auto-scroll loop
  useEffect(() => {
    if (!isAutoScrolling || !scrollContainerRef.current) return;

    let animationId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (container.scrollTop >= maxScroll) {
          setIsAutoScrolling(false);
        } else {
          container.scrollTop += scrollSpeed * delta;
        }
      }
      animationId = requestAnimationFrame(step);
    };

    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [isAutoScrolling, scrollSpeed]);

  // Metronome audio pulse & visual tick
  useEffect(() => {
    if (!isMetronomeActive) return;

    const intervalMs = (60 / bpm) * 1000;
    const intervalId = setInterval(() => {
      setMetronomeBeat(prev => {
        const nextBeat = (prev % 4) + 1;

        if (metronomeSound) {
          try {
            if (!audioContextRef.current) {
              const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
              audioContextRef.current = new AudioCtx();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = nextBeat === 1 ? 1200 : 800;
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
          } catch {
            // Audio context blocked
          }
        }

        return nextBeat;
      });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isMetronomeActive, bpm, metronomeSound]);

  // Tap tempo handler
  const handleTapTempo = () => {
    const now = performance.now();
    const times = tapTimesRef.current;
    times.push(now);

    if (times.length > 4) times.shift();

    if (times.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 200 && avgInterval < 2000) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        setBpm(calculatedBpm);
      }
    }
  };

  const handleTranspose = (delta: number) => {
    setTransposeOffset(prev => prev + delta);
  };

  const handleResetTranspose = () => {
    setTransposeOffset(0);
    setCapoFret(0);
  };

  // Set Key directly from Key Picker
  const handleSelectNewKey = (newKeyPicked: string) => {
    setCurrentKey(newKeyPicked);
    setTransposeOffset(0);
    setShowKeyPickerPopover(false);
  };

  // Permanently Save current sounding key as official base key (Admin)
  const handleSaveCurrentKeyAsBase = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }
    const newOfficialKey = soundingKey;
    const newOfficialText = displayedText;
    setCurrentKey(newOfficialKey);
    setTransposeOffset(0);
    setCapoFret(0);
    setEditedText(newOfficialText);
    setRawText(newOfficialText);
    if (onSaveSongLyrics) {
      onSaveSongLyrics(song.id, newOfficialText, newOfficialKey, bpm, youtubeUrlInput, attachments);
      showToast(`¡Tono base fijado y guardado en "${newOfficialKey}"!`);
    }
  };

  const textSizeClass = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
  }[textSize];

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText);
    setCopied(true);
    showToast('Letra y acordes copiados al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetToSaved = () => {
    setEditedText(rawText);
    setTransposeOffset(0);
    setCapoFret(0);
    showToast('Restaurado a la versión guardada.');
  };

  // Add attachment
  const handleAddAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) {
      showToast('Por favor ingresa un nombre y un enlace válido.');
      return;
    }
    const newAtt: SongAttachment = {
      id: `att_${Date.now()}`,
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim(),
      type: newAttachmentUrl.toLowerCase().includes('.pdf') ? 'pdf' : 'link',
    };
    setAttachments(prev => [...prev, newAtt]);
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    showToast('Adjunto añadido.');
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Save changes (Admin only)
  const handleSaveOfficial = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }

    if (onSaveSongLyrics) {
      onSaveSongLyrics(song.id, editedText, currentKey, bpm, youtubeUrlInput, attachments);
      setRawText(editedText);
      showToast(`¡Cambios guardados para "${song.title}"!`);
    }
  };

  const youtubeEmbedUrl = getYouTubeEmbedUrl(youtubeUrlInput);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden ${
        isFullScreen ? 'p-0' : ''
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[#141418] border border-[#26262b] flex flex-col shadow-2xl overflow-hidden transition-all ${
          isFullScreen
            ? 'w-full h-full rounded-none border-none'
            : 'w-full max-w-6xl h-[95vh] rounded-2xl my-auto'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* 1. HEADER: Título, Tono, Setlist Nav, Video YouTube & Slider Acordes */}
        {/* ======================================================== */}
        <div className="p-3 sm:p-4 bg-[#1a1a1d] border-b border-[#232328] flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-shrink-0">
          {/* Título & Meta */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0">
              <Music size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a059] font-bold">
                  Cancionero · Cifrado Americano
                </span>

                {/* Tono Actual con indicador si está transportado */}
                <button
                  onClick={() => setShowKeyPickerPopover(!showKeyPickerPopover)}
                  className="inline-flex items-center gap-1.5 bg-[#0a0a0b] hover:bg-[#1f1f23] px-2 py-0.5 rounded-lg border border-[#c5a059]/40 cursor-pointer transition-colors"
                  title="Haz clic para cambiar el tono de la canción"
                >
                  <KeyRound size={11} className="text-[#c5a059]" />
                  <span className="text-[10px] font-mono text-[#888894]">Tono:</span>
                  <span className="font-mono text-xs font-bold text-[#c5a059]">
                    {soundingKey}
                    {transposeOffset !== 0 && (
                      <span className="text-[10px] text-amber-300 ml-1">
                        ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                      </span>
                    )}
                  </span>
                </button>

                {/* Capo Display */}
                {capoFret > 0 && (
                  <button
                    onClick={() => setShowCapoPickerPopover(!showCapoPickerPopover)}
                    className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-lg cursor-pointer hover:bg-amber-900/40"
                    title="Cejilla activa"
                  >
                    Capo {capoFret} ({fingeredKey})
                  </button>
                )}

                {/* BPM */}
                <div className="flex items-center gap-1 bg-[#0a0a0b] px-2 py-0.5 rounded-lg border border-[#1f1f23]">
                  <Clock size={11} className="text-[#888894]" />
                  <span className="text-[10px] font-mono text-[#888894]">BPM:</span>
                  {isAdmin && viewMode === 'edit' ? (
                    <input
                      type="number"
                      value={bpm}
                      onChange={e => setBpm(Math.max(40, Math.min(260, parseInt(e.target.value, 10) || 120)))}
                      className="w-12 bg-transparent font-mono text-xs font-bold text-white focus:outline-none text-center"
                    />
                  ) : (
                    <span className="text-[10px] font-mono text-white font-bold">{bpm}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium tracking-tight truncate">
                  {song.title}
                </h3>
                {song.artist && (
                  <span className="text-xs text-[#8e8e99] italic truncate">
                    — {song.artist}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones Centrales & Derechas del Header */}
          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            {/* Navegación Entre Canciones (Exclusiva de la lista contextual / semanal) */}
            {allSongs.length > 1 && onNavigateToSong && (
              <div className="flex items-center bg-[#0a0a0b] border border-[#26262b] rounded-xl p-0.5 shadow-sm">
                <button
                  onClick={() => prevSong && onNavigateToSong(prevSong)}
                  disabled={!prevSong}
                  className="p-1.5 text-[#888894] hover:text-[#c5a059] disabled:opacity-30 disabled:hover:text-[#888894] transition-colors cursor-pointer rounded-lg"
                  title={prevSong ? `Anterior en la lista: ${prevSong.title}` : 'Primera de la lista'}
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-mono text-[#888894] px-2 font-medium">
                  {currentSongIndex + 1}/{allSongs.length}
                </span>
                <button
                  onClick={() => nextSong && onNavigateToSong(nextSong)}
                  disabled={!nextSong}
                  className="p-1.5 text-[#888894] hover:text-[#c5a059] disabled:opacity-30 disabled:hover:text-[#888894] transition-colors cursor-pointer rounded-lg"
                  title={nextSong ? `Siguiente en la lista: ${nextSong.title}` : 'Última de la lista'}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* BOTÓN YOUTUBE INDEPENDIENTE (Fuera de herramientas) */}
            <button
              onClick={() => setShowYouTubePanel(!showYouTubePanel)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                showYouTubePanel
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 font-bold shadow-sm'
                  : youtubeUrlInput
                  ? 'bg-[#0a0a0b] text-red-400 border-red-500/30 hover:bg-red-950/20'
                  : 'bg-[#0a0a0b] text-[#8e8e99] border-[#232328] hover:text-white'
              }`}
              title="Reproducir o configurar video de YouTube"
            >
              <Video size={14} className={youtubeUrlInput ? 'text-red-500' : ''} />
              <span>{youtubeUrlInput ? (showYouTubePanel ? 'Ocultar Video' : 'Video YouTube') : '+ Video'}</span>
            </button>

            {/* DESLIZABLE SEGMENTADO: ACORDES vs SOLO LETRA (Guardado por dispositivo) */}
            <div className="flex items-center bg-[#0a0a0b] p-1 rounded-xl border border-[#232328]">
              <button
                onClick={() => handleToggleShowChords(true)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  showChords
                    ? 'bg-[#c5a059] text-black font-bold shadow-sm'
                    : 'text-[#888894] hover:text-white'
                }`}
                title="Mostrar acordes sobre la letra"
              >
                <Music size={12} />
                <span>Acordes</span>
              </button>
              <button
                onClick={() => handleToggleShowChords(false)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  !showChords
                    ? 'bg-[#c5a059] text-black font-bold shadow-sm'
                    : 'text-[#888894] hover:text-white'
                }`}
                title="Mostrar solo letra sin acordes"
              >
                <EyeOff size={12} />
                <span>Solo Letra</span>
              </button>
            </div>

            {/* Selector Modo Ver / Editar */}
            <div className="flex bg-[#0a0a0b] p-1 rounded-xl border border-[#232328]">
              <button
                onClick={() => setViewMode('view')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'view'
                    ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                    : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Modo Lectura e Interpretación"
              >
                <Eye size={12} />
                <span>Ver</span>
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                    : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Editar letra y notas"
              >
                <Edit3 size={12} />
                <span>{isAdmin ? 'Editar' : 'Probar'}</span>
              </button>
            </div>

            {/* Partituras / Adjuntos */}
            <button
              onClick={() => setShowAttachmentsPanel(!showAttachmentsPanel)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showAttachmentsPanel
                  ? 'bg-[#c5a059]/20 text-[#c5a059] border-[#c5a059]/40'
                  : 'bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-white border-[#232328]'
              }`}
              title={`Partituras y archivos (${attachments.length})`}
            >
              <Paperclip size={15} />
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-white border border-[#232328] transition-colors cursor-pointer"
              title="Cerrar modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. REPRODUCTOR YOUTUBE INDEPENDIENTE */}
        {/* ======================================================== */}
        {showYouTubePanel && (
          <div className="bg-[#0b0b0e] border-b border-[#232328] p-3 flex flex-col md:flex-row items-center gap-3 animate-fadeIn">
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                  <Video size={14} />
                  <span>Video de Referencia (YouTube)</span>
                </span>
                <button
                  onClick={() => setShowYouTubePanel(false)}
                  className="text-[#888894] hover:text-white p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={youtubeUrlInput}
                    onChange={e => setYoutubeUrlInput(e.target.value)}
                    placeholder="Pega el enlace de YouTube aquí (ej: https://www.youtube.com/watch?v=...)"
                    className="w-full bg-[#141418] border border-[#232328] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#6b6b75] focus:outline-none focus:border-red-500 font-mono"
                  />
                  {youtubeUrlInput !== (song.youtubeUrl || '') && (
                    <button
                      onClick={handleSaveOfficial}
                      className="px-3 py-1.5 bg-[#c5a059] text-black font-bold text-xs rounded-xl font-mono uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-[#d4b068]"
                    >
                      Guardar Link
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8e8e99] truncate">
                  {youtubeUrlInput || 'No hay video enlazado por el administrador.'}
                </p>
              )}
            </div>

            {youtubeEmbedUrl && (
              <div className="w-full md:w-72 h-40 rounded-xl overflow-hidden border border-[#232328] shadow-lg flex-shrink-0 bg-black">
                <iframe
                  src={youtubeEmbedUrl}
                  title="YouTube video reference"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. PANEL DE PARTITURAS Y ADJUNTOS */}
        {/* ======================================================== */}
        {showAttachmentsPanel && (
          <div className="bg-[#0b0b0e] border-b border-[#232328] p-3.5 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5 font-bold">
                <FileText size={14} />
                <span>Partituras y Archivos Adjuntos ({attachments.length})</span>
              </span>
              <button
                onClick={() => setShowAttachmentsPanel(false)}
                className="text-[#888894] hover:text-white p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-3">
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 bg-[#141418] border border-[#26262b] rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <FileText size={12} className="text-[#c5a059]" />
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#c5a059] underline flex items-center gap-1"
                  >
                    <span>{att.name}</span>
                    <ExternalLink size={10} />
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {attachments.length === 0 && (
                <span className="text-xs text-[#6b6b75] italic">No hay partituras adjuntas todavía.</span>
              )}
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#1f1f23]">
                <input
                  type="text"
                  placeholder="Nombre (ej: Partitura Piano)"
                  value={newAttachmentName}
                  onChange={e => setNewAttachmentName(e.target.value)}
                  className="bg-[#141418] border border-[#232328] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#6b6b75]"
                />
                <input
                  type="text"
                  placeholder="URL del archivo PDF o enlace"
                  value={newAttachmentUrl}
                  onChange={e => setNewAttachmentUrl(e.target.value)}
                  className="bg-[#141418] border border-[#232328] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#6b6b75] flex-1 min-w-[200px]"
                />
                <button
                  onClick={handleAddAttachment}
                  className="px-3 py-1 bg-[#c5a059] text-black font-semibold rounded-lg text-xs hover:bg-[#d4b068] transition-colors cursor-pointer"
                >
                  Añadir
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. MAPA DE ESTRUCTURA (PILLS INTERACTIVAS) */}
        {/* ======================================================== */}
        {structureSections.length > 0 && viewMode === 'view' && (
          <div className="bg-[#0b0b0d] border-b border-[#1c1c20] px-4 py-2 flex items-center gap-2 overflow-x-auto flex-shrink-0">
            <span className="text-[10px] font-mono uppercase text-[#c5a059] font-bold flex items-center gap-1.5 flex-shrink-0 pr-1">
              <ListOrdered size={12} />
              <span>Estructura:</span>
            </span>

            <div className="flex items-center gap-1.5 flex-nowrap">
              {structureSections.map((sec, sIdx) => {
                const { code, colorClass } = getSectionBadgeCode(sec.label);
                return (
                  <button
                    key={sec.id || sIdx}
                    onClick={() => scrollToSection(sec.lineIndex)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider border transition-all hover:scale-105 cursor-pointer shadow-sm flex items-center gap-1 flex-shrink-0 ${colorClass}`}
                    title={`Ir a ${sec.label}`}
                  >
                    <span>{code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. RIBBON DE DIAGRAMAS PARA INSTRUMENTOS */}
        {/* ======================================================== */}
        {showChordDiagramsBar && songUniqueChords.length > 0 && (
          <div className="bg-[#0e0e12] border-b border-[#232328] px-4 py-3 overflow-x-auto flex-shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] flex items-center gap-1.5 font-bold">
                <Music size={12} />
                <span>
                  Diagramas para{' '}
                  {selectedInstrument === 'piano'
                    ? 'Piano'
                    : selectedInstrument === 'ukulele'
                    ? 'Ukelele'
                    : selectedInstrument === 'bass'
                    ? 'Bajo'
                    : 'Guitarra'}{' '}
                  ({songUniqueChords.length} acordes):
                </span>
              </span>
              <div className="flex items-center gap-1 text-[10px] font-mono text-[#888894]">
                <span>Cambiar instrumento:</span>
                {(['guitar', 'piano', 'ukulele', 'bass'] as const).map(inst => (
                  <button
                    key={inst}
                    onClick={() => setSelectedInstrument(inst)}
                    className={`px-2 py-0.5 rounded uppercase font-bold cursor-pointer transition-colors ${
                      selectedInstrument === inst ? 'bg-[#c5a059] text-black' : 'hover:text-white bg-[#1a1a1d]'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {songUniqueChords.map((chord, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => setSelectedChordForPopover(chord)}
                  className="cursor-pointer flex-shrink-0 hover:scale-105 transition-transform"
                >
                  <GuitarChordDiagram
                    chordName={chord}
                    instrument={selectedInstrument}
                    size="sm"
                    showTitle={true}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. MODAL FLOTANTE DE ACORDE INDIVIDUAL */}
        {/* ======================================================== */}
        {selectedChordForPopover && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedChordForPopover(null)}
          >
            <div
              className="bg-[#141418] border border-[#c5a059]/40 rounded-2xl p-5 shadow-2xl max-w-sm w-full flex flex-col items-center animate-scaleIn"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-[#232328]">
                <div className="flex items-center gap-2">
                  <Music size={16} className="text-[#c5a059]" />
                  <h4 className="font-serif text-lg text-white font-medium">
                    Acorde {selectedChordForPopover}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedChordForPopover(null)}
                  className="w-7 h-7 rounded-lg bg-[#1a1a1d] hover:bg-[#25252b] text-[#888894] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-[#0a0a0b] p-1 rounded-xl border border-[#232328] mb-3 w-full justify-center">
                {(
                  [
                    { id: 'guitar', label: 'Guitarra' },
                    { id: 'piano', label: 'Piano' },
                    { id: 'ukulele', label: 'Ukelele' },
                    { id: 'bass', label: 'Bajo' },
                  ] as const
                ).map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInstrument(inst.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                      selectedInstrument === inst.id
                        ? 'bg-[#1f1f23] text-[#c5a059] font-bold border border-[#c5a059]/40'
                        : 'text-[#888894] hover:text-white'
                    }`}
                  >
                    {inst.label}
                  </button>
                ))}
              </div>

              <GuitarChordDiagram
                chordName={selectedChordForPopover}
                instrument={selectedInstrument}
                size="lg"
                showTitle={false}
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. CONTENEDOR PRINCIPAL (LETRA + BARRA VERTICAL DERECHA) */}
        {/* ======================================================== */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* A. ÁREA DE LETRA Y ACORDES (SCROLLABLE) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-7 bg-[#0a0a0b] relative select-text scroll-smooth"
          >
            {viewMode === 'view' ? (
              <div
                className={`bg-[#121215] border border-[#1f1f23] rounded-2xl p-5 sm:p-8 shadow-inner font-mono ${textSizeClass} leading-relaxed select-text ${
                  columnsCount === 2 ? 'md:columns-2 md:gap-8' : ''
                }`}
              >
                {renderedLines.length === 0 || (renderedLines.length === 1 && !renderedLines[0].trim()) ? (
                  <div className="text-center py-12 text-[#6b6b75]">
                    <Music size={32} className="mx-auto mb-2 text-[#34343d]" />
                    <p className="text-sm font-sans text-[#a0a0ab]">Esta canción no tiene letra cargada aún.</p>
                    {isAdmin && (
                      <button
                        onClick={() => setViewMode('edit')}
                        className="mt-3 px-4 py-2 bg-[#1a1a1d] hover:bg-[#232328] text-[#c5a059] rounded-xl text-xs font-mono uppercase tracking-wider border border-[#c5a059]/30 transition-colors cursor-pointer"
                      >
                        Escribir o pegar letra y acordes
                      </button>
                    )}
                  </div>
                ) : (
                  renderedLines.map((line, lineIdx) => {
                    const trimmed = line.trim();

                    if (!trimmed) {
                      return <div key={lineIdx} className="h-4" />;
                    }

                    // Encabezado de Sección: [Intro], [Estrofa 1], [Coro], [Puente]
                    if (isSectionHeader(trimmed)) {
                      const { code, colorClass } = getSectionBadgeCode(trimmed);
                      return (
                        <div
                          key={lineIdx}
                          id={`section-node-${lineIdx}`}
                          className="pt-5 pb-2 break-inside-avoid scroll-mt-6 flex items-center gap-2"
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 font-bold text-xs rounded-lg border tracking-wider shadow-sm ${colorClass}`}
                          >
                            <span className="font-mono">{code}</span>
                            <span className="text-[#a0a0ab] font-sans font-normal text-[11px]">
                              · {trimmed.replace(/[[\]]/g, '')}
                            </span>
                          </span>
                        </div>
                      );
                    }

                    // Ocultar si usuario eligió "Solo Letra" y toda la línea es acordes
                    const isLineAllChords = isChordLine(line);
                    if (!showChords && isLineAllChords) {
                      return null;
                    }

                    const tokens = parseLyricsLineTokens(line);

                    return (
                      <div
                        key={lineIdx}
                        className={`whitespace-pre-wrap ${
                          isLineAllChords ? 'text-[#c5a059] font-bold py-0.5' : 'text-[#f0f0f5] py-0.5'
                        }`}
                      >
                        {tokens.map((token, tIdx) => {
                          if (token.isChord) {
                            if (!showChords) return null;
                            return (
                              <span
                                key={tIdx}
                                onClick={() => setSelectedChordForPopover(token.text)}
                                className="inline-block font-bold text-[#c5a059] bg-[#c5a059]/10 hover:bg-[#c5a059]/25 px-1.5 py-0.5 rounded mx-0.5 border border-[#c5a059]/30 hover:border-[#c5a059] transition-all cursor-pointer select-text"
                                title={`Ver diagrama de acorde: ${token.text}`}
                              >
                                {token.text}
                              </span>
                            );
                          }
                          return (
                            <span key={tIdx} className="text-[#f0f0f5]">
                              {token.text}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Modo Editor */
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-[#6b6b75] block">
                    {isAdmin
                      ? 'Editor de Canción (Cifrado Americano sin necesidad de corchetes)'
                      : 'Editor Interactivo (Modo Práctica)'}
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToSaved}
                    className="text-[11px] font-mono text-[#6b6b75] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Restablecer Original</span>
                  </button>
                </div>

                <textarea
                  value={editedText}
                  onChange={e => setEditedText(e.target.value)}
                  rows={18}
                  placeholder={`Pega aquí la letra y notas. Ej:\n\n[Intro]\nG  Em7  C  D\n\n[Estrofa 1]\n      G                Em7\nTu fidelidad es grande\n       C        D        G\nTu fidelidad incomparable es`}
                  className="w-full bg-[#121215] border border-[#26262b] focus:border-[#c5a059] rounded-xl p-4 sm:p-5 font-mono text-sm leading-relaxed text-white focus:outline-none transition-colors shadow-inner resize-y"
                />

                <div className="text-[11px] font-mono text-[#888894] flex items-center justify-between flex-wrap gap-2">
                  <span>{editedText.split('\n').filter(l => l.trim()).length} líneas de letra</span>
                  <span className="text-[#c5a059]">
                    Reconocimiento automático: Escribe notas como C, G, Am, D7 directamente sobre la letra.
                  </span>
                </div>
              </div>
            )}

            {/* Botón flotante para pausar auto-scroll */}
            {isAutoScrolling && (
              <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#141418]/95 border border-[#c5a059] rounded-full px-5 py-2 shadow-2xl flex items-center gap-3 z-40 backdrop-blur-md animate-fadeIn">
                <button
                  onClick={() => setIsAutoScrolling(false)}
                  className="w-8 h-8 rounded-full bg-[#c5a059] text-black flex items-center justify-center font-bold hover:scale-105 transition-transform cursor-pointer"
                  title="Pausar desplazamiento"
                >
                  <Pause size={14} />
                </button>
                <span className="font-mono text-xs text-[#c5a059] font-bold">
                  Auto-Scroll ({scrollSpeed}px/s)
                </span>
                <button
                  onClick={() => {
                    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                  }}
                  className="p-1 hover:text-[#c5a059] text-[#888894] transition-colors cursor-pointer"
                  title="Volver al inicio"
                >
                  <ArrowUp size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* B. BARRA VERTICAL DERECHA DE HERRAMIENTAS MUSICALES (ICONOS INTUITIVOS) */}
          {/* ======================================================== */}
          <aside className="w-14 sm:w-16 bg-[#101013] border-l border-[#1f1f23] flex flex-col items-center py-3 gap-2 flex-shrink-0 select-none z-20 overflow-y-auto">
            {/* GRUPO 1: TONALIDAD & TRANSPOSICIÓN */}
            <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-2 border-b border-[#1f1f23]">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#6b6b75] font-bold">
                Tono
              </span>

              {/* Subir +1 Semitono */}
              <button
                onClick={() => handleTranspose(1)}
                className="w-10 h-8 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#c5a059] hover:text-white border border-[#2a2a30] flex items-center justify-center transition-colors cursor-pointer"
                title="Subir +1 Semitono (#)"
              >
                <Plus size={15} />
              </button>

              {/* Tono Actual (Clic para abrir selector de todas las tonalidades) */}
              <button
                onClick={() => setShowKeyPickerPopover(!showKeyPickerPopover)}
                className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  transposeOffset !== 0
                    ? 'bg-[#c5a059] text-black font-bold border-[#c5a059] shadow-md shadow-[#c5a059]/20'
                    : 'bg-[#18181c] text-[#c5a059] border-[#c5a059]/40 hover:bg-[#232328]'
                }`}
                title={`Tono actual: ${soundingKey}. Haz clic para cambiar tonalidad directa`}
              >
                <span className="text-xs font-mono font-bold leading-tight truncate px-0.5">
                  {soundingKey}
                </span>
                <span className="text-[8px] font-mono leading-none opacity-80">
                  {transposeOffset === 0 ? 'Base' : `${transposeOffset > 0 ? '+' : ''}${transposeOffset}`}
                </span>
              </button>

              {/* Bajar -1 Semitono */}
              <button
                onClick={() => handleTranspose(-1)}
                className="w-10 h-8 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#c5a059] hover:text-white border border-[#2a2a30] flex items-center justify-center transition-colors cursor-pointer"
                title="Bajar -1 Semitono (b)"
              >
                <Minus size={15} />
              </button>

              {/* Restablecer Tono Original */}
              {transposeOffset !== 0 && (
                <button
                  onClick={handleResetTranspose}
                  className="w-10 h-7 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 text-amber-400 border border-amber-800/40 flex items-center justify-center text-[10px] font-mono transition-colors cursor-pointer mt-0.5"
                  title="Restablecer al tono base original"
                >
                  <RotateCcw size={12} />
                </button>
              )}

              {/* Guardar Tono Base Oficial (Admin) */}
              {isAdmin && transposeOffset !== 0 && (
                <button
                  onClick={handleSaveCurrentKeyAsBase}
                  className="w-10 h-7 rounded-lg bg-[#c5a059]/20 hover:bg-[#c5a059] text-[#c5a059] hover:text-black border border-[#c5a059]/40 flex items-center justify-center text-[10px] font-mono transition-all cursor-pointer mt-0.5"
                  title={`Fijar y guardar "${soundingKey}" como el nuevo tono oficial de la canción`}
                >
                  <Pin size={12} />
                </button>
              )}
            </div>

            {/* GRUPO 2: CEJILLA / CAPO */}
            <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-2 border-b border-[#1f1f23]">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#6b6b75] font-bold">
                Capo
              </span>
              <button
                onClick={() => setShowCapoPickerPopover(!showCapoPickerPopover)}
                className={`w-10 h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  capoFret > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-[#18181c] text-[#8e8e99] hover:text-white border-[#2a2a30]'
                }`}
                title="Configurar Cejilla / Capodastro"
              >
                <span className="text-[10px] font-mono font-bold">CAPO</span>
                <span className="text-[9px] font-mono text-[#c5a059]">{capoFret}</span>
              </button>
            </div>

            {/* GRUPO 3: DIAGRAMAS DE INSTRUMENTOS */}
            <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-2 border-b border-[#1f1f23]">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#6b6b75] font-bold">
                Notas
              </span>
              <button
                onClick={() => setShowChordDiagramsBar(!showChordDiagramsBar)}
                className={`w-10 h-9 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  showChordDiagramsBar
                    ? 'bg-[#c5a059] text-black font-bold border-[#c5a059]'
                    : 'bg-[#18181c] text-[#8e8e99] hover:text-[#c5a059] border-[#2a2a30]'
                }`}
                title="Mostrar u ocultar cinta con diagramas visuales de acordes"
              >
                <Layers size={14} />
                <span className="text-[8px] font-mono">{songUniqueChords.length}</span>
              </button>
            </div>

            {/* GRUPO 4: AUTO-SCROLL Y METRÓNOMO */}
            <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-2 border-b border-[#1f1f23]">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#6b6b75] font-bold">
                Ensayo
              </span>

              {/* Auto-Scroll Toggle */}
              <button
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                  isAutoScrolling
                    ? 'bg-[#c5a059] text-black font-bold border-[#c5a059] animate-pulse'
                    : 'bg-[#18181c] text-[#8e8e99] hover:text-[#c5a059] border-[#2a2a30]'
                }`}
                title={isAutoScrolling ? 'Pausar Auto-Scroll' : 'Iniciar Auto-Scroll'}
              >
                {isAutoScrolling ? <Pause size={14} /> : <Play size={14} />}
              </button>

              {/* Control de Velocidad de Scroll */}
              <button
                onClick={() => setShowScrollSpeedPopover(!showScrollSpeedPopover)}
                className="w-10 h-5 text-[9px] font-mono bg-[#141418] hover:bg-[#1f1f23] text-[#8e8e99] hover:text-white rounded border border-[#232328] flex items-center justify-center cursor-pointer"
                title="Ajustar velocidad de Auto-Scroll"
              >
                {scrollSpeed}s
              </button>

              {/* Metrónomo */}
              <button
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border mt-1 ${
                  isMetronomeActive
                    ? 'bg-amber-400 text-black font-bold border-amber-400'
                    : 'bg-[#18181c] text-[#8e8e99] hover:text-white border-[#2a2a30]'
                }`}
                title={isMetronomeActive ? 'Desactivar Metrónomo' : 'Activar Metrónomo'}
              >
                <Activity size={14} className={isMetronomeActive ? 'animate-pulse' : ''} />
              </button>

              {isMetronomeActive && (
                <button
                  onClick={handleTapTempo}
                  className="w-10 h-5 text-[8px] font-mono font-bold bg-[#c5a059]/20 hover:bg-[#c5a059] text-[#c5a059] hover:text-black rounded border border-[#c5a059]/40 flex items-center justify-center cursor-pointer"
                  title="Marca el pulso (TAP)"
                >
                  TAP
                </button>
              )}
            </div>

            {/* GRUPO 5: TAMAÑO DE TEXTO Y COLUMNAS */}
            <div className="flex flex-col items-center gap-1 w-full px-1.5 pb-2 border-b border-[#1f1f23]">
              <span className="text-[8px] font-mono uppercase tracking-widest text-[#6b6b75] font-bold">
                Vista
              </span>

              {/* Aumentar letra */}
              <button
                onClick={() => {
                  const sizes: TextSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];
                  const curIdx = sizes.indexOf(textSize);
                  if (curIdx < sizes.length - 1) setTextSize(sizes[curIdx + 1]);
                }}
                className="w-10 h-7 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#8e8e99] hover:text-white border border-[#2a2a30] flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                title="Aumentar tamaño de letra"
              >
                A+
              </button>

              {/* Reducir letra */}
              <button
                onClick={() => {
                  const sizes: TextSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];
                  const curIdx = sizes.indexOf(textSize);
                  if (curIdx > 0) setTextSize(sizes[curIdx - 1]);
                }}
                className="w-10 h-7 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#8e8e99] hover:text-white border border-[#2a2a30] flex items-center justify-center text-xs font-mono font-bold cursor-pointer"
                title="Reducir tamaño de letra"
              >
                A-
              </button>

              {/* Columnas */}
              <button
                onClick={() => setColumnsCount(columnsCount === 1 ? 2 : 1)}
                className={`w-10 h-7 rounded-lg flex items-center justify-center border transition-colors cursor-pointer hidden md:flex ${
                  columnsCount === 2
                    ? 'bg-[#1f1f23] text-[#c5a059] border-[#c5a059]/40'
                    : 'bg-[#18181c] text-[#8e8e99] hover:text-white border-[#2a2a30]'
                }`}
                title={columnsCount === 1 ? 'Dividir en 2 columnas' : 'Modo 1 columna'}
              >
                {columnsCount === 1 ? <Columns size={13} /> : <Square size={13} />}
              </button>
            </div>

            {/* GRUPO 6: ACCIONES GENERALES */}
            <div className="flex flex-col items-center gap-1 w-full px-1.5 pt-1 mt-auto">
              {/* Pantalla Completa */}
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="w-10 h-8 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#8e8e99] hover:text-white border border-[#2a2a30] flex items-center justify-center transition-colors cursor-pointer"
                title={isFullScreen ? 'Salir de pantalla completa' : 'Modo Pantalla Completa'}
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>

              {/* Imprimir */}
              <button
                onClick={handlePrint}
                className="w-10 h-8 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#8e8e99] hover:text-white border border-[#2a2a30] items-center justify-center transition-colors cursor-pointer hidden sm:flex"
                title="Imprimir canción"
              >
                <Printer size={14} />
              </button>

              {/* Copiar */}
              <button
                onClick={handleCopy}
                className="w-10 h-8 rounded-lg bg-[#18181c] hover:bg-[#25252a] text-[#8e8e99] hover:text-white border border-[#2a2a30] flex items-center justify-center transition-colors cursor-pointer"
                title="Copiar letra y acordes"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </aside>
        </div>

        {/* ======================================================== */}
        {/* 8. POPOVER: SELECTOR DE TONALIDAD RÁPIDO */}
        {/* ======================================================== */}
        {showKeyPickerPopover && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowKeyPickerPopover(false)}
          >
            <div
              className="bg-[#141418] border border-[#c5a059]/40 rounded-2xl p-5 shadow-2xl max-w-md w-full space-y-4 animate-scaleIn"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#232328]">
                <div className="flex items-center gap-2 text-[#c5a059]">
                  <KeyRound size={18} />
                  <h4 className="font-serif text-lg text-white font-medium">Seleccionar Tonalidad</h4>
                </div>
                <button
                  onClick={() => setShowKeyPickerPopover(false)}
                  className="p-1 text-[#888894] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-[#8e8e99] block mb-2">
                  Tonalidades Mayores y Menores:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {ALL_STANDARD_KEYS.map(k => (
                    <button
                      key={k}
                      onClick={() => handleSelectNewKey(k)}
                      className={`p-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                        soundingKey === k
                          ? 'bg-[#c5a059] text-black border-[#c5a059] shadow-md shadow-[#c5a059]/20'
                          : 'bg-[#0a0a0b] text-white hover:bg-[#1a1a1e] border-[#26262e] hover:border-[#c5a059]/40'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-[#232328] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#8e8e99]">
                    ¿Quieres que este sea el tono permanente de la canción?
                  </span>
                  <button
                    onClick={() => {
                      handleSaveCurrentKeyAsBase();
                      setShowKeyPickerPopover(false);
                    }}
                    className="px-3 py-1.5 bg-[#c5a059] text-black font-bold text-xs rounded-xl font-mono uppercase tracking-wider hover:bg-[#d4b068] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Fijar como Base
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 9. POPOVER: SELECTOR DE CAPO */}
        {/* ======================================================== */}
        {showCapoPickerPopover && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCapoPickerPopover(false)}
          >
            <div
              className="bg-[#141418] border border-amber-500/40 rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-3 animate-scaleIn"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#232328]">
                <div className="flex items-center gap-2 text-amber-400">
                  <Music size={18} />
                  <h4 className="font-serif text-lg text-white font-medium">Cejilla / Capodastro</h4>
                </div>
                <button
                  onClick={() => setShowCapoPickerPopover(false)}
                  className="p-1 text-[#888894] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-[#8e8e99]">
                Selecciona en qué traste pondrás el capodastro. Las posiciones de los dedos se adaptarán manteniendo el tono sonoro.
              </p>

              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(fret => (
                  <button
                    key={fret}
                    onClick={() => {
                      setCapoFret(fret);
                      setShowCapoPickerPopover(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      capoFret === fret
                        ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                        : 'bg-[#0a0a0b] text-white hover:bg-[#1a1a1e] border-[#26262e]'
                    }`}
                  >
                    {fret === 0 ? 'Sin Capo' : `Traste ${fret}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 10. POPOVER: VELOCIDAD DE SCROLL */}
        {/* ======================================================== */}
        {showScrollSpeedPopover && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowScrollSpeedPopover(false)}
          >
            <div
              className="bg-[#141418] border border-[#c5a059]/40 rounded-2xl p-5 shadow-2xl max-w-xs w-full space-y-4 animate-scaleIn"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#232328]">
                <h4 className="font-serif text-lg text-white font-medium">Velocidad de Auto-Scroll</h4>
                <button
                  onClick={() => setShowScrollSpeedPopover(false)}
                  className="p-1 text-[#888894] hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#c5a059] font-bold">
                  <span>Velocidad actual:</span>
                  <span>{scrollSpeed} px/seg</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Lenta', speed: 18 },
                    { label: 'Media', speed: 30 },
                    { label: 'Rápida', speed: 50 },
                  ].map(preset => (
                    <button
                      key={preset.speed}
                      onClick={() => {
                        setScrollSpeed(preset.speed);
                        setShowScrollSpeedPopover(false);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-medium border transition-colors cursor-pointer ${
                        scrollSpeed === preset.speed
                          ? 'bg-[#c5a059] text-black font-bold border-[#c5a059]'
                          : 'bg-[#0a0a0b] text-white hover:bg-[#1a1a1d] border-[#26262e]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 11. FOOTER: Permisos & Guardado */}
        {/* ======================================================== */}
        <div className="p-3 sm:p-4 bg-[#1a1a1d] border-t border-[#232328] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-[#6b6b75]">
            {isAdmin ? (
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                <Sparkles size={13} />
                <span>Modo Administrador: Los cambios se guardan y sincronizan en la nube.</span>
              </span>
            ) : (
              <span className="font-mono text-[11px] text-[#888894] flex items-center gap-1.5">
                <Lock size={12} className="text-[#c5a059]" />
                <span>Modo Músico: Transporta acordes, usa metrónomo y auto-scroll libremente.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#121215] hover:bg-[#1f1f23] text-[#888894] hover:text-white rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {isAdmin ? (
              <button
                onClick={handleSaveOfficial}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#c5a059] hover:bg-[#d4b068] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#c5a059]/20 cursor-pointer hover:scale-102 font-mono"
              >
                <Save size={15} />
                <span>Guardar Cambios</span>
              </button>
            ) : (
              onRequestAdmin && (
                <button
                  onClick={onRequestAdmin}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1f1f23] hover:bg-[#28282e] text-[#c5a059] rounded-xl text-xs font-mono uppercase tracking-wider border border-[#c5a059]/30 cursor-pointer transition-colors"
                >
                  <Lock size={12} />
                  <span>Desbloquear Edición</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
