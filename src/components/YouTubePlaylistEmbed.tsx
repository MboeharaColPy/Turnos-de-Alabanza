import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface YouTubePlaylistEmbedProps {
  initialUrl?: string;
  isAdmin: boolean;
  onUpdateUrl?: (url: string) => void;
}

export interface ParsedMedia {
  embedUrl: string;
  externalUrl: string;
  isPlaylist: boolean;
  platform: 'youtube' | 'youtube-music';
  id: string;
}

export function parseYouTubeMediaUrl(rawInput: string): ParsedMedia | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  let input = rawInput.trim();

  // Si el usuario pega un código iframe entero, extraer el src
  const iframeMatch = input.match(/src=["']([^"']+)["']/i);
  if (iframeMatch && iframeMatch[1]) {
    input = iframeMatch[1].trim();
  }

  const isMusic = input.includes('music.youtube.com');

  // 1. Extraer ID de playlist si contiene 'list='
  const listParamMatch = input.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listParamMatch && listParamMatch[1]) {
    const listId = listParamMatch[1];
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${listId}&rel=0`,
      externalUrl: isMusic
        ? `https://music.youtube.com/playlist?list=${listId}`
        : `https://www.youtube.com/playlist?list=${listId}`,
      isPlaylist: true,
      platform: isMusic ? 'youtube-music' : 'youtube',
      id: listId,
    };
  }

  // 2. Si es solo un ID de playlist (inicia con PL, OLAK, RD, etc.)
  if (/^(PL|OLAK|RD|FL)[a-zA-Z0-9_-]{8,}$/i.test(input)) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/videoseries?list=${input}&rel=0`,
      externalUrl: `https://www.youtube.com/playlist?list=${input}`,
      isPlaylist: true,
      platform: 'youtube',
      id: input,
    };
  }

  // 3. Extraer video individual (watch?v= o youtu.be/)
  let videoId = '';
  const watchMatch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    videoId = watchMatch[1];
  } else {
    const shortMatch = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    } else {
      const embedMatch = input.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch && embedMatch[1]) {
        videoId = embedMatch[1];
      }
    }
  }

  if (videoId) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
      externalUrl: isMusic
        ? `https://music.youtube.com/watch?v=${videoId}`
        : `https://www.youtube.com/watch?v=${videoId}`,
      isPlaylist: false,
      platform: isMusic ? 'youtube-music' : 'youtube',
      id: videoId,
    };
  }

  // 4. Fallback si ya es una URL de embed directa
  if (input.includes('/embed/')) {
    return {
      embedUrl: input,
      externalUrl: input,
      isPlaylist: input.includes('videoseries'),
      platform: 'youtube',
      id: 'custom',
    };
  }

  return null;
}

const LOCAL_STORAGE_PLAYLIST_KEY = 'adoracion_worship_playlist_url';
const DEFAULT_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn6O1E9vB1O4l2oGf5h8v8vX';

const PRESET_PLAYLISTS = [
  {
    title: 'Alabanza & Adoración General',
    desc: 'Selección contemporánea de adoración para ensayos',
    url: 'https://www.youtube.com/playlist?list=PL4fGSI1pDJn6O1E9vB1O4l2oGf5h8v8vX',
  },
  {
    title: 'Adoración Íntima & Reflexión',
    desc: 'Música congregacional suave y de oración',
    url: 'https://www.youtube.com/playlist?list=PLD3FFBA0DC5FBDCC0',
  },
  {
    title: 'Himnos & Coros Clásicos',
    desc: 'Arreglos orquestales e himnología congregacional',
    url: 'https://www.youtube.com/playlist?list=PL9F7F55C92E8FB95C',
  },
];

export const YouTubePlaylistEmbed: React.FC<YouTubePlaylistEmbedProps> = ({
  initialUrl,
  isAdmin,
  onUpdateUrl,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    return (
      initialUrl ||
      localStorage.getItem(LOCAL_STORAGE_PLAYLIST_KEY) ||
      DEFAULT_PLAYLIST_URL
    );
  });

  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(currentUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sincronizar si cambia initialUrl desde el padre
  useEffect(() => {
    if (initialUrl && initialUrl !== currentUrl) {
      setCurrentUrl(initialUrl);
      setInputVal(initialUrl);
    }
  }, [initialUrl]);

  const parsed = parseYouTubeMediaUrl(currentUrl);

  const handleSave = (urlToSave?: string) => {
    const finalUrl = (urlToSave !== undefined ? urlToSave : inputVal).trim();
    if (!finalUrl) return;

    setCurrentUrl(finalUrl);
    setInputVal(finalUrl);
    localStorage.setItem(LOCAL_STORAGE_PLAYLIST_KEY, finalUrl);

    if (onUpdateUrl) {
      onUpdateUrl(finalUrl);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 600);
  };

  const handleResetDefault = () => {
    setInputVal(DEFAULT_PLAYLIST_URL);
    handleSave(DEFAULT_PLAYLIST_URL);
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
            <Youtube size={20} />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
                {parsed?.platform === 'youtube-music' ? 'YouTube Music' : 'YouTube'} Playlist
              </span>
              <span className="text-[10px] font-mono text-[#6b6b75] hidden sm:inline">•</span>
              <span className="text-[10px] font-mono text-[#8e8e99] hidden sm:inline">
                {parsed?.isPlaylist ? 'Lista de Reproducción' : 'Video / Canción'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif text-white font-medium truncate">
              Playlist Oficial para Ensayos y Cultos
            </h3>
          </div>
        </div>

        {/* Acciones de la Cabecera */}
        <div className="flex items-center gap-2 flex-wrap">
          {parsed?.externalUrl && (
            <a
              href={parsed.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-3 rounded-xl bg-[#0a0a0b] hover:bg-[#1a1a1e] border border-[#232328] hover:border-[#c5a059]/40 text-[#a0a0ab] hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Abrir en pestaña nueva de YouTube / YouTube Music"
              id="open-youtube-external-btn"
            >
              <ExternalLink size={13} className="text-red-400" />
              <span className="hidden sm:inline">Abrir en YouTube</span>
              <span className="sm:hidden">Abrir</span>
            </a>
          )}

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
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5">
                <ListMusic size={14} />
                <span>Enlace de YouTube o YouTube Music</span>
              </label>
              <span className="text-[11px] text-[#8e8e99]">
                Soporta listas (`list=...`), videos individuales o embeds
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="https://www.youtube.com/playlist?list=PL... o https://music.youtube.com/playlist?list=PL..."
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
          </div>

          {/* Sugerencias Rápidas / Presets */}
          <div className="space-y-2 pt-2 border-t border-[#1f1f23]">
            <span className="text-[11px] font-mono text-[#8e8e99] uppercase tracking-wider block">
              Sugerencias de Listas Congregacionales:
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

          <div className="flex items-center justify-between text-[11px] text-[#71717a] pt-1">
            <span className="flex items-center gap-1">
              <Info size={12} className="text-[#c5a059]" />
              Tip: Puedes crear una lista en YouTube Music con los tonos exactos del grupo y pegarla acá.
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
          <div className="w-full aspect-video min-h-[300px] max-h-[500px]">
            <iframe
              src={parsed.embedUrl}
              title="Playlist Oficial de Alabanza"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
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
    </div>
  );
};
