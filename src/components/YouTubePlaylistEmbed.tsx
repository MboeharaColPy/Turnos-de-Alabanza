import React, { useState, useEffect, useMemo } from 'react';
import {
  Youtube,
  Music,
  ExternalLink,
  Edit3,
  Check,
  X,
  ListMusic,
  Headphones,
  AlertCircle,
  RefreshCw,
  Lock,
  Trash2,
  Share2,
} from 'lucide-react';

interface YouTubePlaylistEmbedProps {
  initialUrl?: string;
  isAdmin: boolean;
  onUpdateUrl?: (url: string) => void;
  onRequestAdmin?: () => void;
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
export function parseYouTubeMediaUrl(rawInput?: string | null): ParsedMedia | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  let input = rawInput.trim();
  // Limpiar posibles comillas o corchetes que se copien al pegar
  input = input.replace(/^[<"'\(\[]+|[>"'\)\]]+$/g, '').trim();
  if (!input) return null;

  // Si el usuario pega un iframe HTML completo, extraer el atributo src
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
      ? `https://www.youtube.com/embed/${videoId}?list=${listId}&rel=0&playsinline=1`
      : `https://www.youtube.com/embed/videoseries?list=${listId}&rel=0&playsinline=1`;

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
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1`;
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

  // Fallback si ya es una URL de embed directa
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
  initialUrl = '',
  isAdmin,
  onUpdateUrl,
  onRequestAdmin,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(initialUrl || '');
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState<string>(initialUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [playerKey, setPlayerKey] = useState(0);

  // Sincronizar de forma reactiva con la URL oficial que viene del estado global
  useEffect(() => {
    const clean = initialUrl || '';
    setCurrentUrl(clean);
    setInputVal(clean);
  }, [initialUrl]);

  // Si se cierra la sesión de admin mientras se edita, cerrar el panel de edición
  useEffect(() => {
    if (!isAdmin && isEditing) {
      setIsEditing(false);
    }
  }, [isAdmin, isEditing]);

  const parsed = useMemo(() => parseYouTubeMediaUrl(currentUrl), [currentUrl]);
  const previewParsed = useMemo(() => parseYouTubeMediaUrl(inputVal), [inputVal]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }

    const finalUrl = inputVal.trim();
    if (finalUrl && !previewParsed) {
      return;
    }

    setCurrentUrl(finalUrl);
    if (onUpdateUrl) {
      onUpdateUrl(finalUrl);
    }

    setSaveSuccess(true);
    setPlayerKey(prev => prev + 1);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 500);
  };

  const handleRemovePlaylist = () => {
    if (!isAdmin) {
      if (onRequestAdmin) onRequestAdmin();
      return;
    }

    if (window.confirm('¿Deseas quitar la playlist actual del reproductor?')) {
      setCurrentUrl('');
      setInputVal('');
      if (onUpdateUrl) {
        onUpdateUrl('');
      }
      setIsEditing(false);
      setPlayerKey(prev => prev + 1);
    }
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
                {parsed?.platform === 'youtube-music' ? 'YouTube Music' : 'YouTube'}
              </span>
              <span className="text-[10px] font-mono text-[#8e8e99] hidden sm:inline">
                {parsed?.isPlaylist ? 'Lista de Reproducción' : 'Video / Audio'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif text-white font-medium truncate mt-0.5">
              Playlist Oficial de Alabanza
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
              title="Abrir en la aplicación o web de YouTube Music"
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
          {parsed?.embedUrl && (
            <button
              onClick={handleReloadPlayer}
              className="h-9 w-9 rounded-xl bg-[#0a0a0b] hover:bg-[#1a1a1e] border border-[#232328] text-[#8e8e99] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Recargar reproductor"
              id="reload-youtube-player-btn"
            >
              <RefreshCw size={13} />
            </button>
          )}

          {/* Botón Cambiar Playlist (Solo Administrador) */}
          {isAdmin ? (
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
              title="Cambiar la playlist oficial de YouTube / YouTube Music"
              id="edit-youtube-playlist-btn"
            >
              {isEditing ? <X size={13} /> : <Edit3 size={13} />}
              <span>{isEditing ? 'Cerrar' : parsed?.embedUrl ? 'Cambiar Playlist' : 'Configurar Playlist'}</span>
            </button>
          ) : onRequestAdmin ? (
            <button
              onClick={onRequestAdmin}
              className="h-9 px-3 rounded-xl bg-[#0a0a0b] hover:bg-[#1a1a20] border border-[#232328] hover:border-[#c5a059]/40 text-[#8e8e99] hover:text-[#c5a059] text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Solo el Administrador puede modificar la playlist (Haz clic para autenticarte)"
              id="edit-youtube-playlist-btn"
            >
              <Lock size={12} className="text-[#c5a059]" />
              <span className="hidden sm:inline">Modificar (Admin)</span>
              <span className="sm:hidden">Admin</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Panel Exclusivo para Configurar / Modificar Playlist (Solo Administrador) */}
      {isAdmin && isEditing && (
        <form
          onSubmit={handleSave}
          className="p-4 bg-[#0a0a0b] border border-[#26262e] rounded-xl space-y-3.5 animate-fadeIn"
          id="admin-playlist-config-form"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label
              htmlFor="youtube-url-input"
              className="text-xs font-mono font-bold uppercase tracking-wider text-[#c5a059] flex items-center gap-1.5"
            >
              <ListMusic size={14} />
              <span>URL de la Playlist de YouTube / YouTube Music</span>
            </label>
            <span className="text-[11px] text-[#8e8e99] font-mono">
              Espacio exclusivo para la playlist elegida por el administrador
            </span>
          </div>

          <p className="text-xs text-[#9494a0] leading-relaxed">
            Pega directamente el enlace completo de la playlist creada o seleccionada en YouTube o YouTube Music
            (ejemplo: <span className="text-zinc-300 font-mono">https://music.youtube.com/playlist?list=PL...</span> o{' '}
            <span className="text-zinc-300 font-mono">https://www.youtube.com/playlist?list=PL...</span>).
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              id="youtube-url-input"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="https://music.youtube.com/playlist?list=PL..."
              className="flex-1 bg-[#141418] border border-[#2e2e36] focus:border-[#c5a059] focus:outline-none rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-[#555560]"
              autoFocus
            />
            <button
              type="submit"
              disabled={inputVal.trim().length > 0 && !previewParsed}
              className={`px-5 py-2.5 font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 ${
                inputVal.trim().length > 0 && !previewParsed
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-amber-500/10'
              }`}
              id="save-youtube-url-btn"
            >
              {saveSuccess ? <Check size={14} className="stroke-[3]" /> : <Check size={14} />}
              <span>{saveSuccess ? '¡Guardado!' : 'Guardar Playlist'}</span>
            </button>
          </div>

          {/* Detección y validación en tiempo real */}
          <div className="text-xs font-mono">
            {previewParsed ? (
              <div className="inline-flex items-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg">
                <Check size={13} />
                <span>
                  Enlace válido: {previewParsed.platform === 'youtube-music' ? 'YouTube Music' : 'YouTube'} (
                  {previewParsed.isPlaylist ? `Lista: ${previewParsed.id}` : `Video: ${previewParsed.id}`})
                </span>
              </div>
            ) : inputVal.trim() ? (
              <div className="inline-flex items-center gap-2 text-amber-400 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
                <AlertCircle size={13} />
                <span>Enlace no reconocido. Asegúrate de que contenga el identificador de la playlist o video.</span>
              </div>
            ) : null}
          </div>

          {/* Opciones adicionales: Quitar o Cancelar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1f1f23] text-xs">
            {currentUrl ? (
              <button
                type="button"
                onClick={handleRemovePlaylist}
                className="text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer font-mono text-[11px] transition-colors"
                id="remove-playlist-btn"
              >
                <Trash2 size={12} />
                <span>Quitar playlist actual</span>
              </button>
            ) : (
              <span className="text-[11px] text-[#63636e] italic">No hay playlist activa en este momento</span>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[#8e8e99] hover:text-white font-mono text-[11px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
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
          <div className="p-8 sm:p-12 text-center space-y-3.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Music size={24} />
            </div>
            <h4 className="text-base font-serif text-white font-medium">Sin Playlist Oficial Configurada</h4>
            <p className="text-xs text-[#8e8e99] max-w-md mx-auto leading-relaxed">
              Este espacio está reservado para la lista de reproducción oficial que elija el administrador. Aquí se
              mostrarán las canciones y alabanzas seleccionadas para practicar.
            </p>

            {isAdmin ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-bold border border-amber-400 rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  id="configure-playlist-admin-btn"
                >
                  <Edit3 size={13} />
                  <span>Poner Playlist del Administrador</span>
                </button>
              </div>
            ) : onRequestAdmin ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onRequestAdmin}
                  className="px-4 py-2 bg-[#141418] hover:bg-[#1a1a20] text-[#8e8e99] hover:text-[#c5a059] border border-[#26262e] rounded-xl text-xs font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  id="login-admin-for-playlist-btn"
                >
                  <Lock size={13} className="text-[#c5a059]" />
                  <span>Acceder como Administrador para Configurar</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#71717a] italic">
                El administrador aún no ha configurado una lista de reproducción.
              </p>
            )}
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
