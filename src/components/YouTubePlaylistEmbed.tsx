import React, { useState, useEffect, useMemo } from 'react';
import {
  Youtube,
  Music,
  ExternalLink,
  Edit3,
  Check,
  X,
  Lock,
  Copy,
  Trash2,
  Headphones,
  Link2,
} from 'lucide-react';

interface YouTubePlaylistEmbedProps {
  initialUrl?: string;
  isAdmin: boolean;
  onUpdateUrl?: (url: string) => void;
  onRequestAdmin?: () => void;
}

export interface ParsedMedia {
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
 * Parsea y normaliza cualquier URL o código de YouTube / YouTube Music
 */
export function parseYouTubeMediaUrl(rawInput?: string | null): ParsedMedia | null {
  if (!rawInput || typeof rawInput !== 'string') return null;

  let input = rawInput.trim();
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

  // A) Formato YouTube Music browse o channel (/browse/VLPL... o /channel/VLPL...)
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

  // C) Si es un ID de lista directamente escrito (PL..., OLAK..., RD..., etc.)
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
    const youtubeMusicUrl = videoId
      ? `https://music.youtube.com/watch?v=${videoId}&list=${listId}`
      : `https://music.youtube.com/playlist?list=${listId}`;

    const youtubeUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}&list=${listId}`
      : `https://www.youtube.com/playlist?list=${listId}`;

    return {
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
    const youtubeMusicUrl = `https://music.youtube.com/watch?v=${videoId}`;
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    return {
      externalUrl: isMusic ? youtubeMusicUrl : youtubeUrl,
      youtubeMusicUrl,
      youtubeUrl,
      isPlaylist: false,
      platform: isMusic ? 'youtube-music' : 'youtube',
      id: videoId,
      videoId,
    };
  }

  // Fallback para URLs generales válidas de YouTube
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return {
      externalUrl: input,
      youtubeMusicUrl: input,
      youtubeUrl: input,
      isPlaylist: input.includes('list='),
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
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingEditAfterAdmin, setPendingEditAfterAdmin] = useState(false);

  // Sincronizar reactivamente con el estado global
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

  // Si el usuario solicitó ser admin desde el botón de la playlist, abrir el editor automáticamente tras el login
  useEffect(() => {
    if (isAdmin && pendingEditAfterAdmin) {
      setIsEditing(true);
      setPendingEditAfterAdmin(false);
    }
  }, [isAdmin, pendingEditAfterAdmin]);

  const handleAdminClick = () => {
    setPendingEditAfterAdmin(true);
    if (onRequestAdmin) {
      onRequestAdmin();
    }
  };

  const parsed = useMemo(() => parseYouTubeMediaUrl(currentUrl), [currentUrl]);
  const previewParsed = useMemo(() => parseYouTubeMediaUrl(inputVal), [inputVal]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!isAdmin) {
      handleAdminClick();
      return;
    }

    const finalUrl = inputVal.trim();
    setCurrentUrl(finalUrl);
    if (onUpdateUrl) {
      onUpdateUrl(finalUrl);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 400);
  };

  const handleRemove = () => {
    if (!isAdmin) {
      handleAdminClick();
      return;
    }

    if (window.confirm('¿Deseas quitar el enlace de la playlist oficial?')) {
      setCurrentUrl('');
      setInputVal('');
      if (onUpdateUrl) {
        onUpdateUrl('');
      }
      setIsEditing(false);
    }
  };

  const handleCopyLink = () => {
    const urlToCopy = parsed?.externalUrl || currentUrl;
    if (!urlToCopy) return;

    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const targetUrl = parsed?.externalUrl || currentUrl;

  return (
    <div
      className="bg-[#141418] border border-[#232328] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 relative overflow-hidden"
      id="youtube-playlist-section"
    >
      {/* Cabecera del apartado */}
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
                {parsed?.isPlaylist ? 'Lista Oficial de Alabanza' : 'Canción / Video'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-serif text-white font-medium truncate mt-0.5">
              Playlist Oficial de Alabanza
            </h3>
          </div>
        </div>

        {/* Acciones de administración */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin ? (
            <button
              onClick={() => {
                setInputVal(currentUrl);
                setIsEditing(!isEditing);
              }}
              className={`h-9 px-3 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isEditing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-[#1a1a1d] hover:bg-[#25252b] text-[#c5a059] border-[#2e2e36] hover:border-[#c5a059]/50'
              }`}
              title="Modificar enlace de la playlist oficial"
              id="btn-edit-playlist-url"
            >
              {isEditing ? <X size={13} /> : <Edit3 size={13} />}
              <span>{isEditing ? 'Cerrar' : targetUrl ? 'Editar Enlace' : 'Configurar Enlace'}</span>
            </button>
          ) : onRequestAdmin ? (
            <button
              onClick={handleAdminClick}
              className="h-9 px-3 rounded-xl bg-[#0a0a0b] hover:bg-[#1a1a20] border border-[#232328] hover:border-[#c5a059]/40 text-[#8e8e99] hover:text-[#c5a059] text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Acceder como Administrador para cambiar el enlace"
              id="btn-login-admin-playlist"
            >
              <Lock size={12} className="text-[#c5a059]" />
              <span className="hidden sm:inline">Editar (Admin)</span>
              <span className="sm:hidden">Admin</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Formulario de Edición (Solo Administrador) */}
      {isAdmin && isEditing && (
        <form
          onSubmit={handleSave}
          className="p-4 bg-[#0a0a0b] border border-[#26262e] rounded-xl space-y-3.5 animate-fadeIn"
          id="admin-playlist-form"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-xs font-mono uppercase text-[#c5a059] tracking-wider flex items-center gap-1.5">
              <Link2 size={14} />
              <span>Enlace de la Playlist de YouTube o YouTube Music</span>
            </label>
            {currentUrl && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-red-400 hover:text-red-300 font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Quitar el enlace actual"
              >
                <Trash2 size={12} />
                <span>Quitar Enlace</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Pega el enlace aquí: https://youtube.com/playlist?list=... o https://music.youtube.com/..."
              className="w-full bg-[#141418] border border-[#2e2e36] focus:border-[#c5a059] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-[#52525b] focus:outline-none font-mono transition-colors"
              autoFocus
            />
            <p className="text-[11px] text-[#8e8e99] leading-relaxed">
              Puedes pegar cualquier enlace copiado desde la app de YouTube o YouTube Music (por ejemplo:{' '}
              <span className="text-[#c5a059] font-mono">https://www.youtube.com/playlist?list=PL...</span>).
            </p>
          </div>

          {/* Previsualización del enlace */}
          {inputVal.trim() && (
            <div className="p-2.5 rounded-lg bg-[#141418] border border-[#26262e] text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-[#a0a0ab] truncate font-mono text-[11px]">
                  {previewParsed?.isPlaylist ? 'Lista de reproducción detectada' : 'Enlace válido'}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex-shrink-0">
                {previewParsed?.platform === 'youtube-music' ? 'YouTube Music' : 'YouTube'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1f1f23]">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-xl bg-[#141418] hover:bg-[#1a1a1f] text-[#8e8e99] hover:text-white font-mono text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#c5a059] to-[#d4b068] hover:from-[#d4b068] hover:to-[#e3bf77] text-black font-extrabold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-[#c5a059]/20 cursor-pointer active:scale-95"
            >
              <Check size={14} />
              <span>{saveSuccess ? 'Guardado' : 'Guardar Enlace'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Cuerpo principal: Botón directo o Estado Vacío */}
      {targetUrl ? (
        <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-[#0c0c0f] to-[#16161d] border border-[#23232a] space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase text-[#c5a059] tracking-wider font-semibold">
                Repertorio para Ensayo y Servicios
              </span>
              <p className="text-sm text-[#c0c0cb] leading-relaxed max-w-xl">
                Haz clic en el botón a continuación para abrir la lista directamente en la aplicación o web de YouTube sin cortes ni restricciones.
              </p>
            </div>

            {/* Botón Principal Destacado */}
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer flex-shrink-0"
              id="btn-open-youtube-main"
            >
              <Youtube size={18} />
              <span>Abrir Playlist en YouTube</span>
              <ExternalLink size={15} className="opacity-80" />
            </a>
          </div>

          {/* Accesos secundarios: YouTube Music y Copiar Enlace */}
          <div className="pt-3 border-t border-[#1e1e24] flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {parsed?.youtubeMusicUrl && (
                <a
                  href={parsed.youtubeMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-500/25 text-red-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
                  title="Abrir en YouTube Music"
                >
                  <Headphones size={13} className="text-red-400" />
                  <span>Abrir en YouTube Music</span>
                  <ExternalLink size={11} className="opacity-70" />
                </a>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] border border-[#26262e] text-[#a0a0ab] hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar enlace directo de la lista"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-[#71717a]">
              Se reproduce en la app oficial de YouTube
            </span>
          </div>
        </div>
      ) : (
        /* Estado sin configurar */
        <div className="p-6 sm:p-8 rounded-xl bg-[#0e0e12] border border-dashed border-[#23232a] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-400">
            <Music size={22} />
          </div>
          <h4 className="text-sm sm:text-base font-serif text-white font-medium">
            Sin Playlist Oficial Configurada
          </h4>
          <p className="text-xs text-[#8e8e99] max-w-md mx-auto leading-relaxed">
            Aquí podrás acceder directamente a las alabanzas y pistas oficiales de YouTube que el administrador configure para los servicios.
          </p>

          {isAdmin ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#c5a059] to-[#d4b068] hover:from-[#d4b068] hover:to-[#e3bf77] text-black font-extrabold rounded-xl text-xs font-mono uppercase tracking-wider transition-all shadow-md shadow-[#c5a059]/20 cursor-pointer inline-flex items-center gap-2"
                id="btn-setup-playlist-admin"
              >
                <Edit3 size={13} />
                <span>Configurar Enlace de Playlist</span>
              </button>
            </div>
          ) : onRequestAdmin ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAdminClick}
                className="px-4 py-2 bg-[#141418] hover:bg-[#1a1a20] text-[#8e8e99] hover:text-[#c5a059] border border-[#26262e] rounded-xl text-xs font-mono transition-colors cursor-pointer inline-flex items-center gap-1.5"
                id="btn-login-admin-empty"
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
  );
};
