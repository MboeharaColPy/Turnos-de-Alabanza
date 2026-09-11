import React, { useState, useEffect, useMemo } from 'react';
import {
  Youtube,
  Music,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  X,
  ListMusic,
  Play,
  Headphones,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface YouTubePlaylistEmbedProps {
  initialUrl?: string;
  isAdmin: boolean;
  onUpdateUrl?: (url: string) => void;
}

export interface ParsedMedia {
  embedUrl: string;
  externalUrl: string;
  youtubeUrl: string;
  youtubeMusicUrl: string;
  isPlaylist: boolean;
  platform: 'youtube' | 'youtube-music';
  id: string;
  videoId?: string;
  listId?: string;
}

const OLD_BROKEN_PLAYLIST_ID = 'PL4fGSI1pDJn6O1E9vB1O4l2oGf5h8v8vX';
export const LOCAL_STORAGE_PLAYLIST_KEY = 'adoracion_worship_playlist_url';
export const DEFAULT_PLAYLIST_URL = 'https://music.youtube.com/playlist?list=PLw-VjHDlEOgvQg_N9WXLPRBpFG2gj1xmy';

export const PRESET_PLAYLISTS = [
  {
    title: 'Alabanza & Adoración Cristiana',
    desc: 'Selección de música cristiana de adoración para ensayos',
    url: 'https://music.youtube.com/playlist?list=PLw-VjHDlEOgvQg_N9WXLPRBpFG2gj1xmy',
  },
  {
    title: 'Música Cristiana de Adoración',
    desc: 'Grandes canciones congregacionales para culto y ministración',
    url: 'https://music.youtube.com/playlist?list=PLbsXiQOTnFUmPJf_CNV3vtELkeIiF58e4',
  },
  {
    title: 'Adoración Congregacional',
    desc: 'Alabanzas íntimas y de reflexión para el grupo',
    url: 'https://music.youtube.com/playlist?list=PLiMbwlK6tmAPdaksYbeLA1Ri11doloNiX',
  },
];

/**
 * Parsea y normaliza cualquier URL o código de YouTube / YouTube Music:
 * - https://music.youtube.com/playlist?list=PL...
 * - https://music.youtube.com/watch?v=...&list=PL...
 * - https://music.youtube.com/browse/VLPL...
 * - https://music.youtube.com/watch?v=...
 * - https://www.youtube.com/playlist?list=PL...
 * - https://www.youtube.com/watch?v=...&list=PL...
 * - https://youtu.be/...
 * - Código iframe embebido
 * - ID de lista directo (PL..., OLAK..., RD...)
 */
export function parseYouTubeMediaUrl(rawInput: string): ParsedMedia | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  let input = rawInput.trim();

  // 0. Si el usuario pega un iframe HTML completo, extraer el atributo src
  const iframeMatch = input.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    input = iframeMatch[1].trim();
  }

  const isMusic = input.includes('music.youtube.com') || rawInput.includes('music.youtube.com');

  // 1. Extraer ID de playlist
  let listId: string | undefined;

  // A) Formato YouTube Music browse o channel (ej: /browse/VLPL... o /channel/VLPL...)
  const browseMatch = input.match(/\/(?:browse|channel)\/VL([a-zA-Z0-9_-]+)/i);
  if (browseMatch && browseMatch[1]) {
    listId = browseMatch[1];
  }

  // B) Parámetro estándar ?list= o &list=
  if (!listId) {
    const listParamMatch = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listParamMatch && listParamMatch[1]) {
      listId = listParamMatch[1];
    }
  }

  // C) Si es un ID de lista directamente escrito (inicia con PL, OLAK, RD, etc.)
  if (!listId && /^(PL|OLAK|RD|FL)[a-zA-Z0-9_-]{8,}$/i.test(input)) {
    listId = input;
  }

  // 2. Extraer Video ID si existe
  let videoId: string | undefined;
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    videoId = watchMatch[1];
  } else {
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    } else {
      const embedMatch = input.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch && embedMatch[1] && embedMatch[1] !== 'videoseries') {
        videoId = embedMatch[1];
      }
    }
  }

  if (videoId === 'videoseries') {
    videoId = undefined;
  }

  // Construir URLs de destino
  if (listId) {
    // Si tiene video y playlist
    const embedUrl = videoId
      ? `https://www.youtube.com/embed/${videoId}?list=${listId}&rel=0&playsinline=1&enablejsapi=1`
      : `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0&playsinline=1&enablejsapi=1`;

    const youtubeMusicUrl = videoId
      ? `https://music.youtube.com/watch?v=${videoId}&list=${listId}`
      : `https://music.youtube.com/playlist?list=${listId}`;

    const youtubeUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}&list=${listId}`
      : `https://www.youtube.com/playlist?list=${listId}`;

    return {
      embedUrl,
      externalUrl: isMusic ? youtubeMusicUrl : youtubeUrl,
      youtubeMusicUrl,
      youtubeUrl,
      isPlaylist: true,
      platform: isMusic ? 'youtube-music' : 'youtube',
      id: listId,
      videoId,
      listId,
    };
  }

  // Si solo tiene video individual
  if (videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&enablejsapi=1`;
    const youtubeMusicUrl = `https://music.youtube.com/watch?v=${videoId}`;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return {
      embedUrl,
      externalUrl: isMusic ? youtubeMusicUrl : youtubeUrl,
      youtubeMusicUrl,
      youtubeUrl,
      isPlaylist: false,
      platform: isMusic ? 'youtube-music' : 'youtube',
      id: videoId,
      videoId,
    };
  }

  // 4. Fallback si ya es una URL de embed directa
  if (input.includes('/embed/')) {
    const cleanEmbed = input.replace('youtube-nocookie.com', 'youtube.com');
    return {
      embedUrl: cleanEmbed,
      externalUrl: cleanEmbed,
      youtubeMusicUrl: cleanEmbed,
      youtubeUrl: cleanEmbed,
      isPlaylist: input.includes('videoseries') || input.includes('list='),
      platform: isMusic ? 'youtube-music' : 'youtube',
      id: 'custom',
    };
  }

  return null;
}

export const YouTubePlaylistEmbed: React.FC<YouTubePlaylistEmbedProps> = ({
  initialUrl,
  isAdmin,
  onUpdateUrl,
}) => {
  // Migrar en localStorage si contiene la URL rota vieja
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PLAYLIST_KEY);
      if (stored && stored.includes(OLD_BROKEN_PLAYLIST_ID)) {
        localStorage.setItem(LOCAL_STORAGE_PLAYLIST_KEY, DEFAULT_PLAYLIST_URL);
      }
    } catch {
      // Ignorar errores de storage
    }
  }, []);

  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    let candidate = initialUrl;
    if (!candidate) {
      try {
        candidate = localStorage.getItem(LOCAL_STORAGE_PLAYLIST_KEY) || undefined;
      } catch {
        // ignore
      }
    }
    if (!candidate || candidate.includes(OLD_BROKEN_PLAYLIST_ID)) {
      candidate = DEFAULT_PLAYLIST_URL;
    }
    return candidate;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(currentUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  // Sincronizar si cambia initialUrl desde el padre
  useEffect(() => {
    if (initialUrl && initialUrl !== currentUrl) {
      const sanitized = initialUrl.includes(OLD_BROKEN_PLAYLIST_ID) ? DEFAULT_PLAYLIST_URL : initialUrl;
      setCurrentUrl(sanitized);
      setInputVal(sanitized);
    }
  }, [initialUrl]);

  const parsed = useMemo(() => parseYouTubeMediaUrl(currentUrl), [currentUrl]);
  const previewParsed = useMemo(() => parseYouTubeMediaUrl(inputVal), [inputVal]);

  const handleSave = (urlToSave?: string) => {
    const finalUrl = (urlToSave !== undefined ? urlToSave : inputVal).trim();
    if (!finalUrl) return;

    setCurrentUrl(finalUrl);
    setInputVal(finalUrl);
    try {
      localStorage.setItem(LOCAL_STORAGE_PLAYLIST_KEY, finalUrl);
    } catch {
      // ignore
    }

    if (onUpdateUrl) {
      onUpdateUrl(finalUrl);
    }

    setSaveSuccess(true);
    setPlayerKey(prev => prev + 1);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 600);
  };

  const handleResetDefault = () => {
    setInputVal(DEFAULT_PLAYLIST_URL);
    handleSave(DEFAULT_PLAYLIST_URL);
  };

  const handleReloadPlayer = () => {
    setPlayerKey(prev => prev + 1);
  };

  return (
    <div
      className="bg-[#141418] border border-[#232328] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 relative overflow-hidden"
      id="youtube-playlist-embed-container"
    >
      {/* Barra Superior del Reproductor */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
            {parsed?.platform === 'youtube-music' ? <Music size={20} /> : <Youtube size={20} />}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                {parsed?.platform === 'youtube-music' ? 'YouTube Music' : 'YouTube'} Playlist
              </span>
              <span className="text-[10px] font-mono text-[#8e8e99] hidden sm:inline">
                {parsed?.isPlaylist ? 'Lista de Reproducción' : 'Canción Individual'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif text-white font-medium truncate mt-0.5">
              Playlist Oficial para Ensayos y Cultos
            </h3>
          </div>
        </div>

        {/* Acciones de la Cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Abrir en YouTube Music */}
          {parsed?.youtubeMusicUrl && (
            <a
              href={parsed.youtubeMusicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/35 text-red-300 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir en YouTube Music (app o navegador)"
              id="open-youtube-music-btn"
            >
              <Headphones size={13} className="text-red-400" />
              <span className="hidden sm:inline">YouTube Music</span>
              <span className="sm:hidden">Music</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          )}

          {/* Botón Abrir en YouTube estándar */}
          {parsed?.youtubeUrl && (
            <a
              href={parsed.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-[#0a0a0b] hover:bg-[#1a1a1e] border border-[#232328] hover:border-[#c5a059]/40 text-[#a0a0ab] hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir en YouTube clásico"
              id="open-youtube-external-btn"
            >
              <Youtube size={13} className="text-red-400" />
              <span className="hidden sm:inline">YouTube</span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          )}

          {/* Botón Recargar */}
          <button
            onClick={handleReloadPlayer}
            className="h-9 w-9 rounded-xl bg-[#0a0a0b] hover:bg-[#1a1a1e] border border-[#232328] text-[#8e8e99] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Recargar reproductor"
            id="reload-youtube-player-btn"
          >
            <RefreshCw size={13} />
          </button>

          {/* Botón Cambiar Playlist */}
          <button
            onClick={() => {
              setInputVal(currentUrl);
              setIsEditing(!isEditing);
            }}
            className={`h-9 px-3.5 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'bg-[#1a1a1d] hover:bg-[#25252b] text-[#c5a059] border-[#2e2e36] hover:border-[#c5a059]/50'
            }`}
            title="Cambiar el enlace de la playlist o video de YouTube"
            id="edit-youtube-playlist-btn"
          >
            {isEditing ? <X size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? 'Cerrar' : 'Cambiar Playlist'}</span>
          </button>
        </div>
      </div>

      {/* Panel Desplegable para Configurar / Cambiar Playlist */}
      {isEditing && (
        <div className="p-4 bg-[#0a0a0b] border border-[#26262e] rounded-xl space-y-4 animate-fadeIn">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                <ListMusic size={14} />
                <span>Enlace de YouTube o YouTube Music</span>
              </label>
              <span className="text-[11px] text-[#8e8e99]">
                Soporta listas (`list=...`), enlaces de YouTube Music o videos
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="https://music.youtube.com/playlist?list=PL... o https://www.youtube.com/playlist?list=PL..."
                className="flex-1 bg-[#141418] border border-[#2e2e36] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-[#555560]"
                id="youtube-url-input"
              />
              <button
                onClick={() => handleSave()}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                id="save-youtube-url-btn"
              >
                {saveSuccess ? <Check size={14} className="stroke-[3]" /> : <Check size={14} />}
                <span>{saveSuccess ? '¡Guardado!' : 'Guardar'}</span>
              </button>
            </div>

            {/* Detección en tiempo real */}
            <div className="mt-2 text-xs font-mono">
              {previewParsed ? (
                <div className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                  <Check size={12} />
                  <span>
                    Válido: {previewParsed.platform === 'youtube-music' ? 'YouTube Music' : 'YouTube'} (
                    {previewParsed.isPlaylist ? `Lista: ${previewParsed.id}` : `Video: ${previewParsed.id}`})
                  </span>
                </div>
              ) : inputVal.trim() ? (
                <div className="inline-flex items-center gap-2 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-lg">
                  <AlertCircle size={12} />
                  <span>Enlace no reconocido. Copia la URL de la lista o video de YouTube / YouTube Music.</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Sugerencias Rápidas / Presets Verificados */}
          <div className="space-y-2 pt-2 border-t border-[#1f1f23]">
            <span className="text-[11px] font-mono text-[#8e8e99] uppercase tracking-wider block">
              Sugerencias de Listas Congregacionales Activas:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_PLAYLISTS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputVal(preset.url);
                    handleSave(preset.url);
                  }}
                  className="text-left p-2.5 bg-[#141418] hover:bg-[#1a1a20] border border-[#232328] hover:border-[#c5a059]/40 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="text-xs font-medium text-white group-hover:text-[#c5a059] transition-colors flex items-center gap-1.5">
                    <Play size={11} className="text-red-400 fill-current" />
                    <span className="truncate">{preset.title}</span>
                  </div>
                  <p className="text-[10px] text-[#71717a] mt-0.5 line-clamp-1">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-1 flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <Info size={12} className="text-[#c5a059]" />
              Tip: Puedes crear una playlist en YouTube Music con los temas del ministerio y pegar aquí su enlace.
            </span>
            <button
              onClick={handleResetDefault}
              className="text-[#8e8e99] hover:text-white underline cursor-pointer text-[10px] font-mono"
            >
              Restablecer por Defecto
            </button>
          </div>
        </div>
      )}

      {/* Espacio Embebido de YouTube / YouTube Music */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black border border-[#232328] shadow-inner">
        {parsed?.embedUrl ? (
          <div className="w-full relative aspect-video sm:h-[400px] lg:h-[460px] bg-black">
            <iframe
              key={playerKey}
              src={parsed.embedUrl}
              title="Playlist Oficial de Alabanza"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Music size={24} />
            </div>
            <h4 className="text-sm font-serif text-white">No hay playlist válida configurada</h4>
            <p className="text-xs text-[#8e8e99] max-w-md mx-auto">
              Ingresa el enlace de una lista de reproducción de YouTube o YouTube Music para
              que todos los integrantes puedan escuchar y practicar las canciones aquí.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 px-4 py-2 bg-[#1a1a1d] hover:bg-[#25252b] text-[#c5a059] border border-[#2e2e36] hover:border-[#c5a059]/50 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Edit3 size={13} />
              <span>Configurar Playlist Ahora</span>
            </button>
          </div>
        )}
      </div>

      {/* Barra Informativa y Accesos Directos a YouTube Music */}
      {parsed?.embedUrl && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#0e0e12] border border-[#202026] text-xs">
          <div className="flex items-center gap-2 text-[#9494a0]">
            <Headphones size={15} className="text-red-400 flex-shrink-0" />
            <span>
              Para escuchar con pantalla bloqueada o ver letras oficiales, abre la lista en{' '}
              <strong className="text-white font-medium">YouTube Music</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {parsed.youtubeMusicUrl && (
              <a
                href={parsed.youtubeMusicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 hover:text-white font-mono text-[11px] flex items-center gap-1 transition-colors"
              >
                <span>Abrir en YouTube Music</span>
                <ExternalLink size={11} />
              </a>
            )}
            {parsed.youtubeUrl && (
              <a
                href={parsed.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#18181d] hover:bg-[#222228] border border-[#2a2a32] text-[#8e8e99] hover:text-white font-mono text-[11px] flex items-center gap-1 transition-colors"
              >
                <span>YouTube</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
