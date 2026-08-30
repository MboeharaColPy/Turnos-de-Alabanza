import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SongItem } from '../types';
import {
  parseLyricsLineTokens,
  transposeSongText,
  transposeSingleChord,
  isSectionHeader,
  isChordLine,
  CHORD_ROOTS_ANGLO,
  CHORD_ROOTS_LATIN,
} from '../utils/chordUtils';
import {
  convertSongNotation,
  extractUniqueChords,
  getChordDiagram,
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
  HelpCircle,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Printer,
  Sliders,
  Columns,
  Square,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Info,
  Layers,
  ArrowUp,
  Activity,
  KeyRound,
} from 'lucide-react';

interface SongLyricsModalProps {
  song: SongItem | null;
  isAdmin: boolean;
  onClose: () => void;
  onSaveSongLyrics?: (songId: string, updatedLyrics: string, updatedKey?: string) => void;
  onRequestAdmin?: () => void;
  showToast: (msg: string) => void;
}

type TextSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type NotationSystem = 'latin' | 'anglo';
type ChordDisplayMode = 'all' | 'lyrics-only' | 'chords-only';

export const SongLyricsModal: React.FC<SongLyricsModalProps> = ({
  song,
  isAdmin,
  onClose,
  onSaveSongLyrics,
  onRequestAdmin,
  showToast,
}) => {
  if (!song) return null;

  const defaultLyrics = song.lyrics || `[Intro]
[Sol]  [Re]  [Mim]  [Do]

[Estrofa 1]
[Sol]                   [Re]
Pueblos todos batid las manos
[Mim]               [Do]
Alabad al Dios de Israel
[Sol]                [Re]
Porque el Señor es Altísimo
     [Do]           [Re]        [Sol]
Y es Rey grande sobre toda la tierra

[Coro]
[Do]                   [Re]
Cantad a Dios, cantad
[Mim]                  [Sim]
Cantad a nuestro Rey, cantad
     [Do]            [Re]
Porque Dios es el Rey de toda la tierra
[Sol]  [Re]  [Mim]  [Do]`;

  const [rawText, setRawText] = useState(defaultLyrics);
  const [editedText, setEditedText] = useState(defaultLyrics);
  const [currentKey, setCurrentKey] = useState(song.key || 'Sol');
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [capoFret, setCapoFret] = useState(0);
  const [notation, setNotation] = useState<NotationSystem>('latin');
  const [chordDisplayMode, setChordDisplayMode] = useState<ChordDisplayMode>('all');
  const [textSize, setTextSize] = useState<TextSize>('md');
  const [columnsCount, setColumnsCount] = useState<1 | 2>(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(30); // px per second
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Metronome state
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [bpm, setBpm] = useState<number>(() => {
    if (song.tempo) {
      const match = song.tempo.match(/\d+/);
      if (match) return parseInt(match[0], 10);
    }
    return 120;
  });
  const [metronomeSound, setMetronomeSound] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(0);
  const tapTimesRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  // UI Panels / Modals
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [copied, setCopied] = useState(false);
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);
  const [showChordDiagramsBar, setShowChordDiagramsBar] = useState(false);
  const [selectedChordForPopover, setSelectedChordForPopover] = useState<string | null>(null);

  // Initialize state when song changes
  useEffect(() => {
    const text = song.lyrics || defaultLyrics;
    setRawText(text);
    setEditedText(text);
    setCurrentKey(song.key || 'Sol');
    setTransposeOffset(0);
    setCapoFret(0);
    setViewMode('view');
    setIsAutoScrolling(false);
    setIsMetronomeActive(false);
  }, [song.id, song.lyrics, song.key]);

  // Transposed & Notation-adjusted text calculation
  const displayedText = useMemo(() => {
    let result = editedText;
    if (transposeOffset !== 0) {
      result = transposeSongText(result, transposeOffset);
    }
    if (notation === 'anglo') {
      result = convertSongNotation(result, 'anglo');
    } else {
      result = convertSongNotation(result, 'latin');
    }
    return result;
  }, [editedText, transposeOffset, notation]);

  // Displayed Root Key
  const displayedKey = useMemo(() => {
    if (!currentKey) return currentKey;
    let key = currentKey;
    if (transposeOffset !== 0) {
      key = transposeSingleChord(key, transposeOffset);
    }
    if (notation === 'anglo') {
      key = convertSongNotation(`[${key}]`, 'anglo').replace(/^\[|\]$/g, '');
    } else {
      key = convertSongNotation(`[${key}]`, 'latin').replace(/^\[|\]$/g, '');
    }
    return key;
  }, [currentKey, transposeOffset, notation]);

  // Extract unique chords for top diagram ribbon
  const songUniqueChords = useMemo(() => {
    return extractUniqueChords(displayedText);
  }, [displayedText]);

  // Auto-scroll animation loop
  useEffect(() => {
    if (!isAutoScrolling || !scrollContainerRef.current) return;

    let animationId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const delta = (time - lastTime) / 1000; // in seconds
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
            // Audio context failed or blocked by browser
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

    // Keep only last 4 taps
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

  // Transpose controls
  const handleTranspose = (delta: number) => {
    setTransposeOffset(prev => prev + delta);
  };

  const handleResetTranspose = () => {
    setTransposeOffset(0);
    setCapoFret(0);
  };

  // Font size selector mapping
  const textSizeClass = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
  }[textSize];

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(displayedText);
    setCopied(true);
    showToast('Letra y acordes copiados al portapapeles.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Reset to original saved
  const handleResetToSaved = () => {
    setEditedText(rawText);
    setTransposeOffset(0);
    setCapoFret(0);
    showToast('Restaurado a la versión original guardada.');
  };

  // Save changes (Admin only)
  const handleSaveOfficial = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }

    if (onSaveSongLyrics) {
      onSaveSongLyrics(song.id, editedText, currentKey);
      setRawText(editedText);
      showToast(`¡Letra y acordes de "${song.title}" guardados oficialmente!`);
    }
  };

  // Render formatted lines
  const renderedLines = useMemo(() => {
    return displayedText.split('\n');
  }, [displayedText]);

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
            : 'w-full max-w-5xl h-[94vh] rounded-2xl my-auto'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* ======================================================== */}
        {/* 1. HEADER: Título, Tono, BPM, Acciones & Controles Principales */}
        {/* ======================================================== */}
        <div className="p-3.5 sm:p-5 bg-[#1a1a1d] border-b border-[#232328] flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          {/* Título & Meta */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059] flex-shrink-0">
              <Music size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#c5a059] font-bold">
                  Letra & Acordes
                </span>

                {displayedKey && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#0a0a0b] text-[#c5a059] border border-[#c5a059]/40 rounded flex items-center gap-1">
                    <KeyRound size={10} />
                    <span>Tono: {displayedKey}</span>
                    {transposeOffset !== 0 && (
                      <span className="text-[10px] text-[#888894]">
                        ({transposeOffset > 0 ? `+${transposeOffset}` : transposeOffset})
                      </span>
                    )}
                  </span>
                )}

                {capoFret > 0 && (
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                    Capo: {capoFret}º traste
                  </span>
                )}

                {song.tempo && (
                  <span className="text-[10px] font-mono text-[#888894] bg-[#0a0a0b] px-2 py-0.5 rounded border border-[#1f1f23]">
                    {song.tempo}
                  </span>
                )}
              </div>

              <h3 className="font-serif text-lg sm:text-2xl text-white font-medium tracking-tight">
                {song.title}
              </h3>
              {song.artist && <p className="text-xs text-[#888894] italic">{song.artist}</p>}
            </div>
          </div>

          {/* Botones de Control Superiores */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
            {/* View / Edit Mode toggle */}
            <div className="flex bg-[#0a0a0b] p-1 rounded-xl border border-[#232328]">
              <button
                onClick={() => setViewMode('view')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'view'
                    ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                    : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Vista de acordes interactiva"
              >
                <Eye size={13} />
                <span>Acordes</span>
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-[#1a1a1d] text-[#c5a059] border border-[#c5a059]/30 font-medium'
                    : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Editar letra y notas"
              >
                <Edit3 size={13} />
                <span>{isAdmin ? 'Editar' : 'Probar'}</span>
              </button>
            </div>

            {/* Pantalla Completa / Modo Atril */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 rounded-xl bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-white border border-[#232328] transition-colors cursor-pointer"
              title={isFullScreen ? 'Salir de pantalla completa' : 'Modo Atril / Pantalla Completa'}
            >
              {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Imprimir */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-white border border-[#232328] transition-colors cursor-pointer hidden sm:flex"
              title="Imprimir canción"
            >
              <Printer size={15} />
            </button>

            {/* Copiar */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-white border border-[#232328] transition-colors cursor-pointer"
              title="Copiar letra y acordes"
            >
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-white border border-[#232328] transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. TOOLBAR PRINCIPAL: Transportador, Notación, Zoom, Auto-Scroll, Metrónomo */}
        {/* ======================================================== */}
        <div className="px-3 sm:px-5 py-2.5 bg-[#101013] border-b border-[#1f1f23] flex flex-wrap items-center justify-between gap-2.5 text-xs flex-shrink-0">
          {/* GRUPO 1: Transposición & Tono */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#6b6b75]">
              Tono:
            </span>
            <div className="flex items-center bg-[#0a0a0b] border border-[#232328] rounded-lg p-0.5">
              <button
                onClick={() => handleTranspose(-1)}
                className="px-2 py-1 hover:bg-[#1f1f23] text-[#a0a0ab] hover:text-white rounded transition-colors cursor-pointer flex items-center gap-0.5"
                title="Bajar medio tono (-1 semitono)"
              >
                <Minus size={11} />
                <span className="font-mono text-[10px]">-1</span>
              </button>

              <span className="px-2 py-0.5 font-mono text-[11px] font-bold text-[#c5a059] border-x border-[#232328] min-w-[55px] text-center">
                {transposeOffset === 0
                  ? 'Original'
                  : `${transposeOffset > 0 ? '+' : ''}${transposeOffset}`}
              </span>

              <button
                onClick={() => handleTranspose(1)}
                className="px-2 py-1 hover:bg-[#1f1f23] text-[#a0a0ab] hover:text-white rounded transition-colors cursor-pointer flex items-center gap-0.5"
                title="Subir medio tono (+1 semitono)"
              >
                <Plus size={11} />
                <span className="font-mono text-[10px]">+1</span>
              </button>
            </div>

            {transposeOffset !== 0 && (
              <button
                onClick={handleResetTranspose}
                className="text-[10px] font-mono uppercase text-[#c5a059] hover:underline cursor-pointer px-1"
              >
                Reset
              </button>
            )}

            {/* Capo selector */}
            <div className="flex items-center gap-1 ml-1">
              <span className="font-mono text-[10px] uppercase text-[#6b6b75] hidden sm:inline">
                Capo:
              </span>
              <select
                value={capoFret}
                onChange={e => setCapoFret(parseInt(e.target.value, 10))}
                className="bg-[#0a0a0b] text-[#a0a0ab] hover:text-white border border-[#232328] rounded-lg px-1.5 py-1 text-[10px] font-mono focus:outline-none cursor-pointer"
                title="Posición de cejilla / Capodastro"
              >
                <option value={0}>Sin Capo</option>
                <option value={1}>Capo 1</option>
                <option value={2}>Capo 2</option>
                <option value={3}>Capo 3</option>
                <option value={4}>Capo 4</option>
                <option value={5}>Capo 5</option>
                <option value={6}>Capo 6</option>
              </select>
            </div>

            {/* Notación Cifrado: Latino (Do, Re) ⇄ Americano (C, D) */}
            <div className="flex bg-[#0a0a0b] p-0.5 rounded-lg border border-[#232328] ml-1">
              <button
                onClick={() => setNotation('latin')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  notation === 'latin'
                    ? 'bg-[#1a1a1d] text-[#c5a059] font-bold'
                    : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Cifrado Latino (Do, Re, Mi, Fa, Sol, La, Si)"
              >
                Latino
              </button>
              <button
                onClick={() => setNotation('anglo')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                  notation === 'anglo'
                    ? 'bg-[#1a1a1d] text-[#c5a059] font-bold'
                    : 'text-[#6b6b75] hover:text-white'
                }`}
                title="Cifrado Americano (C, D, E, F, G, A, B)"
              >
                Americano
              </button>
            </div>
          </div>

          {/* GRUPO 2: Auto-Scroll & Metrónomo */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-Scroll Controller */}
            <div className="flex items-center bg-[#0a0a0b] border border-[#232328] rounded-lg p-0.5">
              <button
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isAutoScrolling
                    ? 'bg-[#c5a059] text-black font-bold'
                    : 'hover:bg-[#1a1a1d] text-[#c5a059]'
                }`}
                title="Iniciar o pausar desplazamiento automático"
              >
                {isAutoScrolling ? <Pause size={12} /> : <Play size={12} />}
                <span>Auto-Scroll</span>
              </button>

              <div className="flex items-center px-1.5 border-l border-[#232328] text-[10px] font-mono text-[#888894] gap-1">
                <button
                  onClick={() => setScrollSpeed(prev => Math.max(10, prev - 10))}
                  className="hover:text-white px-1 cursor-pointer"
                  title="Menos velocidad"
                >
                  -
                </button>
                <span>{scrollSpeed}px/s</span>
                <button
                  onClick={() => setScrollSpeed(prev => Math.min(120, prev + 10))}
                  className="hover:text-white px-1 cursor-pointer"
                  title="Más velocidad"
                >
                  +
                </button>
              </div>
            </div>

            {/* Metrónomo / BPM */}
            <div className="flex items-center bg-[#0a0a0b] border border-[#232328] rounded-lg p-0.5">
              <button
                onClick={() => setIsMetronomeActive(!isMetronomeActive)}
                className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
                  isMetronomeActive
                    ? 'bg-amber-400 text-black font-bold'
                    : 'hover:bg-[#1a1a1d] text-[#888894] hover:text-white'
                }`}
                title="Activar metrónomo para ensayo"
              >
                <Activity
                  size={12}
                  className={isMetronomeActive ? 'animate-pulse text-black' : 'text-[#c5a059]'}
                />
                <span>{bpm} BPM</span>
              </button>

              {isMetronomeActive && (
                <>
                  <button
                    onClick={handleTapTempo}
                    className="px-2 py-1 hover:bg-[#1f1f23] text-[#c5a059] text-[10px] font-mono font-bold border-l border-[#232328] cursor-pointer"
                    title="Marca el pulso haciendo clics seguidos"
                  >
                    TAP
                  </button>
                  <button
                    onClick={() => setMetronomeSound(!metronomeSound)}
                    className="p-1 hover:bg-[#1f1f23] text-[#888894] hover:text-white border-l border-[#232328] cursor-pointer"
                    title={metronomeSound ? 'Silenciar sonido' : 'Activar sonido de clic'}
                  >
                    {metronomeSound ? (
                      <Volume2 size={12} className="text-emerald-400" />
                    ) : (
                      <VolumeX size={12} />
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Tamaño de Letra (A- / A+) */}
            <div className="flex items-center bg-[#0a0a0b] border border-[#232328] rounded-lg p-0.5">
              <button
                onClick={() => {
                  const sizes: TextSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];
                  const curIdx = sizes.indexOf(textSize);
                  if (curIdx > 0) setTextSize(sizes[curIdx - 1]);
                }}
                className="px-2 py-1 hover:bg-[#1f1f23] text-[#888894] hover:text-white rounded text-[11px] font-mono cursor-pointer"
                title="Reducir tamaño de letra"
              >
                A-
              </button>
              <span className="px-1.5 text-[10px] font-mono text-[#c5a059] uppercase">
                {textSize}
              </span>
              <button
                onClick={() => {
                  const sizes: TextSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];
                  const curIdx = sizes.indexOf(textSize);
                  if (curIdx < sizes.length - 1) setTextSize(sizes[curIdx + 1]);
                }}
                className="px-2 py-1 hover:bg-[#1f1f23] text-[#888894] hover:text-white rounded text-[11px] font-mono cursor-pointer"
                title="Aumentar tamaño de letra"
              >
                A+
              </button>
            </div>

            {/* Columnas (1 Col / 2 Col) */}
            <button
              onClick={() => setColumnsCount(columnsCount === 1 ? 2 : 1)}
              className="p-1.5 rounded-lg bg-[#0a0a0b] hover:bg-[#1f1f23] text-[#888894] hover:text-[#c5a059] border border-[#232328] transition-colors cursor-pointer hidden md:flex"
              title={columnsCount === 1 ? 'Dividir en 2 columnas' : 'Modo 1 columna'}
            >
              {columnsCount === 1 ? <Columns size={13} /> : <Square size={13} />}
            </button>

            {/* Botón Ver Acordes / Diagramas */}
            <button
              onClick={() => setShowChordDiagramsBar(!showChordDiagramsBar)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 border transition-colors cursor-pointer ${
                showChordDiagramsBar
                  ? 'bg-[#1a1a1d] text-[#c5a059] border-[#c5a059]/40 font-bold'
                  : 'bg-[#0a0a0b] text-[#888894] hover:text-white border-[#232328]'
              }`}
              title="Mostrar u ocultar diagramas de guitarra de los acordes"
            >
              <Layers size={12} />
              <span>Diagramas ({songUniqueChords.length})</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. RIBBON DESPLEGABLE DE DIAGRAMAS DE ACORDES DE GUITARRA */}
        {/* ======================================================== */}
        {showChordDiagramsBar && songUniqueChords.length > 0 && (
          <div className="bg-[#0e0e12] border-b border-[#232328] px-4 py-3 overflow-x-auto flex-shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a059] flex items-center gap-1.5">
                <Music size={12} />
                <span>Acordes utilizados en esta canción ({songUniqueChords.length}):</span>
              </span>
              <span className="text-[10px] text-[#6b6b75] font-mono">
                Pasa el mouse o haz clic sobre un acorde para ampliar
              </span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {songUniqueChords.map((chord, cIdx) => (
                <div
                  key={cIdx}
                  onClick={() => setSelectedChordForPopover(chord)}
                  className="cursor-pointer flex-shrink-0"
                >
                  <GuitarChordDiagram chordName={chord} size="sm" showTitle={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. POPOVER FLOTANTE DE ACORDE SELECCIONADO */}
        {/* ======================================================== */}
        {selectedChordForPopover && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedChordForPopover(null)}
          >
            <div
              className="bg-[#141418] border border-[#c5a059]/40 rounded-2xl p-5 shadow-2xl max-w-xs w-full flex flex-col items-center animate-scaleIn"
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

              <GuitarChordDiagram chordName={selectedChordForPopover} size="lg" showTitle={false} />

              <p className="text-[11px] text-[#888894] font-mono mt-3 text-center">
                Posición en diapasón de guitarra estándar (E A D G B e).
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. CUERPO PRINCIPAL (VISOR CON ESTILO CIFRADO WEB O EDITOR) */}
        {/* ======================================================== */}
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
              {renderedLines.map((line, lineIdx) => {
                const trimmed = line.trim();

                // Empty line separator
                if (!trimmed) {
                  return <div key={lineIdx} className="h-4" />;
                }

                // Section headers: [Intro], [Estrofa 1], [Coro], [Puente]
                if (isSectionHeader(trimmed)) {
                  return (
                    <div key={lineIdx} className="pt-4 pb-1.5 break-inside-avoid">
                      <span className="inline-block px-3 py-1 bg-[#1a1a1d] text-[#c5a059] font-bold text-xs rounded-lg border border-[#c5a059]/40 tracking-wider shadow-sm">
                        {trimmed}
                      </span>
                    </div>
                  );
                }

                // Parse tokens for lyrics and chords
                const tokens = parseLyricsLineTokens(line);
                const isLineAllChords = isChordLine(line);

                return (
                  <div
                    key={lineIdx}
                    className={`whitespace-pre-wrap ${
                      isLineAllChords ? 'text-[#c5a059] font-bold py-0.5' : 'text-[#f0f0f5] py-0.5'
                    }`}
                  >
                    {tokens.map((token, tIdx) => {
                      if (token.isChord) {
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
              })}
            </div>
          ) : (
            /* Modo Editor / Modificación */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-[#6b6b75] block">
                  {isAdmin
                    ? 'Editor Oficial de Letra y Notas (Sincroniza en la nube)'
                    : 'Editor Interactivo de Ensayo (Prueba notas y estructura)'}
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
                placeholder="Escribe o pega aquí la letra y los acordes de la alabanza..."
                className="w-full bg-[#121215] border border-[#26262b] focus:border-[#c5a059] rounded-xl p-4 sm:p-5 font-mono text-sm leading-relaxed text-white focus:outline-none transition-colors shadow-inner resize-y"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
              />

              <div className="text-[11px] font-mono text-[#6b6b75] flex items-center justify-between flex-wrap gap-2">
                <span>{editedText.split('\n').length} líneas · Formato cifrado enriquecido</span>
                <span>Los acordes como [Sol], [Re] o *Sol se resaltan y transportan automáticamente.</span>
              </div>
            </div>
          )}

          {/* Floating Auto-Scroll Controls Bar when scrolling */}
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

              <div className="flex items-center gap-1 border-l border-[#232328] pl-2">
                <button
                  onClick={() => setScrollSpeed(prev => Math.max(10, prev - 10))}
                  className="px-2 py-0.5 bg-[#0a0a0b] hover:bg-[#1f1f23] rounded text-white text-xs font-mono cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => setScrollSpeed(prev => Math.min(120, prev + 10))}
                  className="px-2 py-0.5 bg-[#0a0a0b] hover:bg-[#1f1f23] rounded text-white text-xs font-mono cursor-pointer"
                >
                  +
                </button>
              </div>

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
        {/* 6. FOOTER: Indicador de Permisos & Botones de Guardar */}
        {/* ======================================================== */}
        <div className="p-3.5 sm:p-5 bg-[#1a1a1d] border-t border-[#232328] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-[#6b6b75]">
            {isAdmin ? (
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                <Sparkles size={13} />
                <span>Modo Administrador: Los cambios se guardan en tiempo real en la nube.</span>
              </span>
            ) : (
              <span className="font-mono text-[11px] text-[#888894] flex items-center gap-1.5">
                <Lock size={12} className="text-[#c5a059]" />
                <span>Modo Músico / Visualizador: Transporta acordes, usa metrónomo y auto-scroll libremente.</span>
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
                className="flex items-center gap-2 px-5 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#c5a059]/10 cursor-pointer"
              >
                <Save size={14} />
                <span>Guardar Oficialmente</span>
              </button>
            ) : (
              onRequestAdmin && (
                <button
                  onClick={onRequestAdmin}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1f1f23] hover:bg-[#28282e] text-[#c5a059] rounded-xl text-xs font-mono uppercase tracking-wider border border-[#c5a059]/30 cursor-pointer transition-colors"
                >
                  <Lock size={12} />
                  <span>Desbloquear Edición Admin</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
