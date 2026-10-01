/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Musician, Role, Slot, SongItem, Couple, SongAttachment, DEFAULT_SONG_CATEGORIES } from './types';
import {
  loadStoredState,
  saveCloudState,
  saveStoredState,
  subscribeToCloudState,
  fetchCloudState,
  scanAvailableLocalBackups,
  DetectedBackup,
} from './services/storage';
import { subscribeAdminStatus, loginAdmin, logoutAdmin, changeAdminPassword, authErrorMessage } from './auth';
import { Header, ActiveTab } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardHomeView } from './components/DashboardHomeView';
import { EventsAgendaView } from './components/EventsAgendaView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { WeekView } from './components/WeekView';
import { SongCatalogView } from './components/SongCatalogView';
import { StatsView } from './components/StatsView';
import { MusiciansView } from './components/MusiciansView';
import { ConfigView } from './components/ConfigView';
import { SongLyricsModal } from './components/SongLyricsModal';
import { ConflictExplainerModal } from './components/ConflictExplainerModal';
import { PWAUpdateNotification } from './components/PWAUpdateNotification';
import { usePWA } from './hooks/usePWA';
import { getMonday } from './utils/dateUtils';
import { safeGetStorage, safeSetStorage } from './utils/safeStorage';
import { KeyRound, ShieldAlert, X, Eye, EyeOff, Check, ShieldCheck, RotateCcw } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadStoredState());
  // Copia siempre actualizada del estado, para calcular el siguiente estado de forma síncrona
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [showGlobalExplainerModal, setShowGlobalExplainerModal] = useState(false);

  // PWA Updates and Installation Hooks
  const {
    needRefresh,
    isCheckingUpdate,
    updateApp,
    dismissUpdate,
    checkForUpdates,
    isInstallable,
    isInstalled,
    isIOS,
    installApp,
  } = usePWA();

  // Theme State: Dark or Light mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (safeGetStorage('alabanza_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme', 'light');
      document.documentElement.classList.remove('dark-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.add('light-theme', 'light');
      document.body.classList.remove('dark-theme', 'dark');
    } else {
      document.documentElement.classList.add('dark-theme', 'dark');
      document.documentElement.classList.remove('light-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark-theme', 'dark');
      document.body.classList.remove('light-theme', 'light');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#f8fafc' : '#0a0a0b');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      safeSetStorage('alabanza_theme', next);
      return next;
    });
  };

  // Admin Auth State
  // isAdmin ya no vive en sessionStorage (cualquiera podía activarlo desde la consola del navegador):
  // depende de la sesión de Firebase Auth y de que la cuenta exista en admins/{uid}.
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [adminEmailInput, setAdminEmailInput] = useState(() => safeGetStorage('alabanza_admin_email') || '');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);

  // Detección y recuperación proactiva de respaldos previos en este navegador
  const [detectedBackups, setDetectedBackups] = useState<DetectedBackup[]>([]);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  useEffect(() => {
    const currentAssignmentsCount = Object.keys(state.assignments || {}).reduce(
      (acc, key) => acc + Object.keys(state.assignments[key] || {}).length,
      0
    );
    const found = scanAvailableLocalBackups();
    const candidate = found.find(b => b.assignmentsCount > currentAssignmentsCount);
    if (candidate && currentAssignmentsCount === 0) {
      setDetectedBackups(found);
      setShowRestorePrompt(true);
    }
  }, [state.assignments]);

  // Selected Song for Lyrics & Chords Modal with Contextual Navigation (Setlist)
  const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<SongItem | null>(null);
  const [lyricsContextSongs, setLyricsContextSongs] = useState<SongItem[] | null>(null);
  const [initialLyricsViewMode, setInitialLyricsViewMode] = useState<'view' | 'pdf'>('view');

  const handleOpenSongLyrics = (song: SongItem, contextSongs?: SongItem[], initialView?: 'view' | 'pdf') => {
    setSelectedSongForLyrics(song);
    setLyricsContextSongs(contextSongs && contextSongs.length > 0 ? contextSongs : null);
    setInitialLyricsViewMode(initialView || 'view');
  };

  // Escuchar cambios en tiempo real desde Firestore en la nube
  useEffect(() => {
    const unsubscribe = subscribeToCloudState(
      cloudState => {
        setState(cloudState);
        setIsCloudConnected(true);
      },
      error => {
        console.warn('Conexión con Firestore no disponible, usando almacenamiento local:', error);
        setIsCloudConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Sesión de administrador (Firebase Auth)
  useEffect(() => subscribeAdminStatus(setIsAdmin), []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(current => (current === msg ? null : current));
    }, 3000);
  }, []);

  // Guardar y sincronizar con Firestore en tiempo real
  const updateStateAndSave = useCallback(async (updater: (prev: AppState) => AppState) => {
    setIsSaving(true);
    // Antes el "siguiente estado" se calculaba dentro del updater de setState, que React ejecuta
    // de forma diferida: nextState podía seguir en null y el guardado en la nube se omitía
    // (además el updater se ejecutaba dos veces bajo StrictMode).
    const nextState = updater(stateRef.current);
    stateRef.current = nextState;
    setState(nextState);
    saveStoredState(nextState);
    try {
      await saveCloudState(nextState);
    } finally {
      setTimeout(() => setIsSaving(false), 200);
    }
  }, []);

  // Recargar manual / forzar sincronización desde la nube (sin sobreescribir)
  const handleRefresh = async () => {
    setIsSaving(true);
    try {
      const cloud = await fetchCloudState();
      if (cloud) {
        setState(cloud);
        setIsCloudConnected(true);
        showToast('Datos actualizados desde la nube en tiempo real.');
      } else {
        const local = loadStoredState();
        setState(local);
        showToast('Modo sin conexión: cargados datos locales.');
      }
    } catch (err) {
      console.warn('Error al sincronizar con la nube:', err);
      showToast('No se pudo conectar con Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  // Guardado manual explícito del Administrador a Firestore
  const handleAdminManualSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveCloudState(state);
      if (success) {
        showToast('¡Todos los cambios guardados exitosamente en la nube de Firebase!');
      } else {
        showToast('Guardado localmente (sin conexión a Firebase).');
      }
    } catch (err) {
      console.error('Error guardando en la nube:', err);
      showToast('Error al conectar con la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Admin Authentication Handlers ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLoggingIn) return;
    setAdminLoggingIn(true);
    setAdminPasswordError('');
    try {
      await loginAdmin(adminEmailInput, adminPasswordInput);
      safeSetStorage('alabanza_admin_email', adminEmailInput.trim());
      setIsAdmin(true);
      setShowAdminModal(false);
      setAdminPasswordInput('');
      showToast('¡Acceso de Administrador concedido!');
      if (pendingTab) {
        setActiveTab(pendingTab);
      }
      setPendingTab(null);
    } catch (err) {
      setAdminPasswordError(authErrorMessage(err));
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleLogoutAdmin = async () => {
    await logoutAdmin();
    setIsAdmin(false);
    showToast('Sesión de administrador cerrada.');
    if (activeTab === 'estadisticas' || activeTab === 'config') {
      setActiveTab('inicio');
    }
  };

  const handleRequestAdminModal = (targetTab?: unknown) => {
    const validTabs: ActiveTab[] = [
      'inicio',
      'canciones',
      'calendario',
      'eventos',
      'musicos',
      'estadisticas',
      'config',
      'mes',
      'semana',
      'cancionero',
    ];
    if (typeof targetTab === 'string' && (validTabs as string[]).includes(targetTab)) {
      setPendingTab(targetTab as ActiveTab);
    } else {
      setPendingTab(null);
    }
    setShowAdminModal(true);
    setAdminPasswordError('');
    setAdminPasswordInput('');
  };

  const handleUpdateAdminPassword = async (currentPassword: string, newPassword: string): Promise<string | null> => {
    const error = await changeAdminPassword(currentPassword, newPassword);
    if (!error) showToast('¡Contraseña de administrador actualizada con éxito!');
    return error;
  };

  // --- Handlers de Asignaciones ---
  const handleUpdateAssignment = (slotInstanceKey: string, roleId: string, musicianId: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const nextAssignments = { ...prev.assignments };
      if (!nextAssignments[slotInstanceKey]) {
        nextAssignments[slotInstanceKey] = {};
      } else {
        nextAssignments[slotInstanceKey] = { ...nextAssignments[slotInstanceKey] };
      }

      if (musicianId) {
        nextAssignments[slotInstanceKey][roleId] = musicianId;
      } else {
        delete nextAssignments[slotInstanceKey][roleId];
      }

      return {
        ...prev,
        assignments: nextAssignments,
      };
    });
  };

  const handleApplySchedule = (newAssignments: Record<string, Record<string, string>>) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const merged = { ...prev.assignments, ...newAssignments };
      return {
        ...prev,
        assignments: merged,
      };
    });
  };

  const handleClearWeek = (keysToClear: string[]) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const nextAssignments = { ...prev.assignments };
      keysToClear.forEach(k => {
        delete nextAssignments[k];
      });
      return {
        ...prev,
        assignments: nextAssignments,
      };
    });
  };

  const handleRestoreWeek = (previousAssignments: Record<string, Record<string, string>>) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => ({
      ...prev,
      assignments: {
        ...prev.assignments,
        ...previousAssignments,
      },
    }));
  };

  // --- Handlers de Canciones y Setlist ---
  const handleUpdateSongs = (shiftKey: string, songs: SongItem[]) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const nextShiftSongs = { ...(prev.shiftSongs || {}) };
      if (songs.length === 0) {
        delete nextShiftSongs[shiftKey];
      } else {
        nextShiftSongs[shiftKey] = songs;
      }
      return {
        ...prev,
        shiftSongs: nextShiftSongs,
      };
    });
  };

  const handleAddToCatalog = (song: SongItem) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const catalog = prev.songCatalog || [];
      const alreadyInCatalog = catalog.some(
        c => c.title.toLowerCase().trim() === song.title.toLowerCase().trim()
      );
      if (alreadyInCatalog) return prev;
      return {
        ...prev,
        songCatalog: [...catalog, song],
      };
    });
  };

  const handleAddSongDirectToCatalog = (songData: Omit<SongItem, 'id'>) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    const newSong: SongItem = {
      ...songData,
      id: `sng_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: songData.title.trim(),
      artist: songData.artist || 'Desconocido',
      artists: songData.artists || [songData.artist || 'Desconocido'],
      category: songData.category || 'Adoración',
      key: songData.key || 'G',
      bpm: songData.bpm || 0,
      lyrics: songData.lyrics || '',
      youtubeUrl: songData.youtubeUrl || '',
      attachments: songData.attachments || [],
      createdAt: songData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateStateAndSave(prev => {
      const existing = (prev.songCatalog || []).filter(s => s.id !== newSong.id);
      return {
        ...prev,
        songCatalog: [...existing, newSong],
      };
    });
    showToast(`Canción "${newSong.title}" agregada al catálogo.`);
  };

  // Guardar letra y notas de una canción
  const handleSaveSongLyrics = (
    songId: string,
    updatedLyrics: string,
    updatedKey?: string,
    updatedBpm?: number,
    updatedYoutubeUrl?: string,
    updatedAttachments?: SongAttachment[],
    updatedCategories?: string[]
  ) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      // 1. Update in songCatalog
      const updatedCatalog = (prev.songCatalog || []).map(s => {
        if (s.id === songId) {
          return {
            ...s,
            lyrics: updatedLyrics,
            ...(updatedKey ? { key: updatedKey } : {}),
            ...(updatedBpm !== undefined ? { bpm: updatedBpm } : {}),
            ...(updatedYoutubeUrl !== undefined ? { youtubeUrl: updatedYoutubeUrl } : {}),
            ...(updatedAttachments !== undefined ? { attachments: updatedAttachments } : {}),
            ...(updatedCategories !== undefined
              ? {
                  categories: updatedCategories,
                  category: updatedCategories[0] || s.category,
                }
              : {}),
          };
        }
        return s;
      });

      // 2. Update in all shiftSongs if present
      const updatedShiftSongs: Record<string, SongItem[]> = {};
      Object.entries(prev.shiftSongs || {}).forEach(([k, songsList]) => {
        const list = Array.isArray(songsList) ? songsList : [];
        updatedShiftSongs[k] = list.map((s: SongItem) => {
          if (s.id === songId) {
            return {
              ...s,
              lyrics: updatedLyrics,
              ...(updatedKey ? { key: updatedKey } : {}),
              ...(updatedBpm !== undefined ? { bpm: updatedBpm } : {}),
              ...(updatedYoutubeUrl !== undefined ? { youtubeUrl: updatedYoutubeUrl } : {}),
              ...(updatedAttachments !== undefined ? { attachments: updatedAttachments } : {}),
              ...(updatedCategories !== undefined
                ? {
                    categories: updatedCategories,
                    category: updatedCategories[0] || s.category,
                  }
                : {}),
            };
          }
          return s;
        });
      });

      return {
        ...prev,
        songCatalog: updatedCatalog,
        shiftSongs: updatedShiftSongs,
      };
    });

    // Update currently opened modal item in local state
    setSelectedSongForLyrics(curr =>
      curr && curr.id === songId
        ? {
            ...curr,
            lyrics: updatedLyrics,
            ...(updatedKey ? { key: updatedKey } : {}),
            ...(updatedBpm !== undefined ? { bpm: updatedBpm } : {}),
            ...(updatedYoutubeUrl !== undefined ? { youtubeUrl: updatedYoutubeUrl } : {}),
            ...(updatedAttachments !== undefined ? { attachments: updatedAttachments } : {}),
            ...(updatedCategories !== undefined
              ? {
                  categories: updatedCategories,
                  category: updatedCategories[0] || curr.category,
                }
              : {}),
          }
        : curr
    );

    // Sync contextual songs list with the updated song data
    setLyricsContextSongs(prevContext =>
      prevContext
        ? prevContext.map(s =>
            s.id === songId
              ? {
                  ...s,
                  lyrics: updatedLyrics,
                  ...(updatedKey ? { key: updatedKey } : {}),
                  ...(updatedBpm !== undefined ? { bpm: updatedBpm } : {}),
                  ...(updatedYoutubeUrl !== undefined ? { youtubeUrl: updatedYoutubeUrl } : {}),
                  ...(updatedAttachments !== undefined ? { attachments: updatedAttachments } : {}),
                  ...(updatedCategories !== undefined
                    ? {
                        categories: updatedCategories,
                        category: updatedCategories[0] || s.category,
                      }
                    : {}),
                }
              : s
          )
        : null
    );

    showToast('¡Letra, tono y ajustes de la canción guardados!');
  };

  // Actualizar una canción completa del catálogo (metadata, categorías, etc.)
  const handleUpdateSongInCatalog = (updatedSong: SongItem) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const updatedCatalog = (prev.songCatalog || []).map(s => (s.id === updatedSong.id ? updatedSong : s));
      const updatedShiftSongs: Record<string, SongItem[]> = {};
      Object.entries(prev.shiftSongs || {}).forEach(([k, songsList]) => {
        const list = Array.isArray(songsList) ? songsList : [];
        updatedShiftSongs[k] = list.map(s => (s.id === updatedSong.id ? { ...s, ...updatedSong } : s));
      });
      return {
        ...prev,
        songCatalog: updatedCatalog,
        shiftSongs: updatedShiftSongs,
      };
    });
    showToast(`Canción "${updatedSong.title}" actualizada.`);
  };

  // Eliminar canción del catálogo
  const handleDeleteSongFromCatalog = (songId: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const updatedCatalog = (prev.songCatalog || []).filter(s => s.id !== songId);
      const updatedShiftSongs: Record<string, SongItem[]> = {};
      Object.entries(prev.shiftSongs || {}).forEach(([k, songsList]) => {
        const list = Array.isArray(songsList) ? songsList : [];
        updatedShiftSongs[k] = list.filter(s => s.id !== songId);
      });
      return {
        ...prev,
        songCatalog: updatedCatalog,
        shiftSongs: updatedShiftSongs,
      };
    });
    showToast('Canción eliminada del catálogo.');
  };

  // Guardar lista completa de categorías de canciones desde Configuración
  const handleSaveSongCategories = (newCategories: string[]) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => ({
      ...prev,
      songCategories: newCategories,
    }));
  };

  // Renombrar una categoría existente propagando el cambio a todas las canciones
  const handleRenameSongCategory = (oldName: string, newName: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const currentCats = prev.songCategories || DEFAULT_SONG_CATEGORIES;
      const nextCats = currentCats.map(c => (c === oldName ? newName : c));

      // Actualizar en songCatalog
      const updatedCatalog = (prev.songCatalog || []).map(song => {
        const hasOldInList = (song.categories || []).includes(oldName);
        const isOldPrimary = song.category === oldName;
        if (!hasOldInList && !isOldPrimary) return song;

        const rawList = song.categories && song.categories.length > 0
          ? song.categories
          : (song.category ? [song.category] : ['Adoración']);
        const updatedCats = rawList.map(c => (c === oldName ? newName : c));

        return {
          ...song,
          categories: updatedCats,
          category: isOldPrimary ? newName : (song.category || updatedCats[0]),
        };
      });

      // Actualizar en shiftSongs
      const updatedShiftSongs: Record<string, SongItem[]> = {};
      Object.entries(prev.shiftSongs || {}).forEach(([k, songsList]) => {
        const list = Array.isArray(songsList) ? songsList : [];
        updatedShiftSongs[k] = list.map(song => {
          const hasOldInList = (song.categories || []).includes(oldName);
          const isOldPrimary = song.category === oldName;
          if (!hasOldInList && !isOldPrimary) return song;

          const rawList = song.categories && song.categories.length > 0
            ? song.categories
            : (song.category ? [song.category] : ['Adoración']);
          const updatedCats = rawList.map(c => (c === oldName ? newName : c));

          return {
            ...song,
            categories: updatedCats,
            category: isOldPrimary ? newName : (song.category || updatedCats[0]),
          };
        });
      });

      return {
        ...prev,
        songCategories: nextCats,
        songCatalog: updatedCatalog,
        shiftSongs: updatedShiftSongs,
      };
    });
    showToast(`Categoría "${oldName}" renombrada a "${newName}".`);
  };

  // Navegar de mes a semana
  const handleSelectWeekFromMonth = (weekStart: Date) => {
    setCurrentWeekStart(weekStart);
    setActiveTab('semana');
  };

  // --- Handlers de Músicos ---
  const handleSaveMusician = (musician: Musician) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      let roleIds = [...(musician.roleIds || [])];
      const s1 = prev.roles.find(r => r.name.toLowerCase().trim() === 'sonido');
      const s2 = prev.roles.find(r => r.name.toLowerCase().trim() === 'sonido 2');
      const av1 = prev.roles.find(r => r.name.toLowerCase().trim() === 'audio visual' || r.name.toLowerCase().trim() === 'audiovisual');
      const av2 = prev.roles.find(r => r.name.toLowerCase().trim() === 'audio visual 2' || r.name.toLowerCase().trim() === 'audiovisual 2');

      if (s1 && s2 && roleIds.includes(s1.id) && !roleIds.includes(s2.id)) roleIds.push(s2.id);
      if (av1 && av2 && roleIds.includes(av1.id) && !roleIds.includes(av2.id)) roleIds.push(av2.id);

      const normalizedMusician = { ...musician, roleIds };
      const existsIndex = prev.musicians.findIndex(m => m.id === musician.id);
      let updatedMusicians: Musician[];
      if (existsIndex >= 0) {
        updatedMusicians = [...prev.musicians];
        updatedMusicians[existsIndex] = normalizedMusician;
      } else {
        updatedMusicians = [...prev.musicians, normalizedMusician];
      }
      return {
        ...prev,
        musicians: updatedMusicians,
      };
    });
  };

  const handleDeleteMusician = (musicianId: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const nextMusicians = prev.musicians.filter(m => m.id !== musicianId);
      const nextAssignments: Record<string, Record<string, string>> = {};
      Object.entries(prev.assignments).forEach(([key, rolesMap]) => {
        const cleanedRolesMap: Record<string, string> = {};
        Object.entries(rolesMap).forEach(([rId, mId]) => {
          if (mId !== musicianId) {
            cleanedRolesMap[rId] = mId;
          }
        });
        if (Object.keys(cleanedRolesMap).length > 0) {
          nextAssignments[key] = cleanedRolesMap;
        }
      });
      const nextCouples = prev.couples.filter(
        c => c.aId !== musicianId && c.bId !== musicianId
      );

      return {
        ...prev,
        musicians: nextMusicians,
        assignments: nextAssignments,
        couples: nextCouples,
      };
    });
  };

  // --- Handlers de Roles ---
  const handleSaveRole = (role: Role) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const existsIndex = prev.roles.findIndex(r => r.id === role.id);
      let updatedRoles: Role[];
      if (existsIndex >= 0) {
        updatedRoles = [...prev.roles];
        updatedRoles[existsIndex] = role;
      } else {
        updatedRoles = [...prev.roles, role];
      }
      return {
        ...prev,
        roles: updatedRoles,
      };
    });
  };

  const handleDeleteRole = (roleId: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const nextRoles = prev.roles.filter(r => r.id !== roleId);
      const nextMusicians = prev.musicians.map(m => ({
        ...m,
        roleIds: (m.roleIds || []).filter(id => id !== roleId),
      }));
      const nextSlots = prev.slots.map(s => ({
        ...s,
        roleIds: (s.roleIds || []).filter(id => id !== roleId),
      }));
      const nextAssignments: Record<string, Record<string, string>> = {};
      Object.entries(prev.assignments).forEach(([key, rolesMap]) => {
        const cleaned: Record<string, string> = {};
        Object.entries(rolesMap).forEach(([rId, mId]) => {
          if (rId !== roleId) {
            cleaned[rId] = mId;
          }
        });
        if (Object.keys(cleaned).length > 0) {
          nextAssignments[key] = cleaned;
        }
      });

      return {
        ...prev,
        roles: nextRoles,
        musicians: nextMusicians,
        slots: nextSlots,
        assignments: nextAssignments,
      };
    });
  };

  // --- Handlers de Slots ---
  const handleSaveSlot = (slot: Slot) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const existsIndex = prev.slots.findIndex(s => s.id === slot.id);
      let updatedSlots: Slot[];
      if (existsIndex >= 0) {
        updatedSlots = [...prev.slots];
        updatedSlots[existsIndex] = slot;
      } else {
        updatedSlots = [...prev.slots, slot];
      }
      return {
        ...prev,
        slots: updatedSlots,
      };
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const nextSlots = prev.slots.filter(s => s.id !== slotId);
      const nextAssignments: Record<string, Record<string, string>> = {};
      Object.entries(prev.assignments).forEach(([key, val]) => {
        if (!key.endsWith(`__${slotId}`)) {
          nextAssignments[key] = val as Record<string, string>;
        }
      });
      return {
        ...prev,
        slots: nextSlots,
        assignments: nextAssignments,
      };
    });
  };

  // --- Handlers de Parejas ---
  const handleSaveCouple = (couple: Couple) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => {
      const existsIndex = prev.couples.findIndex(c => c.id === couple.id);
      let updated: Couple[];
      if (existsIndex >= 0) {
        updated = [...prev.couples];
        updated[existsIndex] = couple;
      } else {
        updated = [...prev.couples, couple];
      }
      return {
        ...prev,
        couples: updated,
      };
    });
  };

  const handleDeleteCouple = (coupleId: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    updateStateAndSave(prev => ({
      ...prev,
      couples: prev.couples.filter(c => c.id !== coupleId),
    }));
  };

  // --- Handlers de Datos Generales ---
  const handleResetAllData = async (fresh: AppState) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    setState(fresh);
    saveStoredState(fresh);
    await saveCloudState(fresh);
    showToast('Base de datos restablecida.');
  };

  const handleImportState = async (imported: AppState) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      return;
    }
    setState(imported);
    saveStoredState(imported);
    await saveCloudState(imported);
    showToast('Copia importada y sincronizada en la nube.');
  };

  const handleUpdatePlaylist = async (url: string) => {
    if (!isAdmin) {
      handleRequestAdminModal();
      showToast('Solo el administrador puede modificar la playlist.');
      return;
    }
    await updateStateAndSave(prev => ({
      ...prev,
      worshipPlaylistUrl: url,
      lastUpdated: new Date().toISOString(),
    }));
    showToast(url ? 'Playlist de alabanza guardada con éxito.' : 'Playlist eliminada.');
  };

  return (
    <div
      className={`min-h-screen font-sans selection:bg-[#c5a059] selection:text-black pb-24 transition-colors duration-200 ${
        theme === 'light'
          ? 'light-theme bg-[#f4f5f8] text-[#0f172a]'
          : 'dark-theme bg-[#0a0a0b] text-[#e0e0e0]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Notificación de Actualización PWA en Vivo (GitHub -> Service Worker) */}
        <PWAUpdateNotification
          needRefresh={needRefresh}
          onUpdate={updateApp}
          onDismiss={dismissUpdate}
        />

        {/* Banner Proactivo de Recuperación de Respaldos de Navegador */}
        {showRestorePrompt && detectedBackups.length > 0 && (
          <div
            className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
            id="banner-browser-recovery"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                <RotateCcw size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Se detectaron datos previos guardados en este dispositivo ({detectedBackups[0].assignmentsCount} asignaciones, {detectedBackups[0].dateStr})
                </p>
                <p className="text-xs text-[#a0a0ab] mt-0.5">
                  ¿Deseas restaurar esta versión y sincronizarla de inmediato con la nube de Firebase?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
              <button
                onClick={() => {
                  const target = detectedBackups[0];
                  updateStateAndSave(() => target.state);
                  setShowRestorePrompt(false);
                  showToast(`¡Datos restaurados con éxito (${target.assignmentsCount} asignaciones)!`);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
                id="btn-confirm-restore-backup"
              >
                Restaurar ahora
              </button>
              <button
                onClick={() => setShowRestorePrompt(false)}
                className="px-3 py-2 rounded-xl bg-[#141418] hover:bg-[#1a1a1d] text-[#888894] hover:text-white border border-[#222226] text-xs font-mono transition-all cursor-pointer"
                id="btn-dismiss-restore-backup"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Header Principal */}
        <Header
          activeTab={activeTab}
          onTabChange={tab => {
            if ((tab === 'estadisticas' || tab === 'config') && !isAdmin) {
              handleRequestAdminModal(tab);
            } else {
              setActiveTab(tab);
            }
          }}
          isAdmin={isAdmin}
          onToggleAdminModal={() => handleRequestAdminModal()}
          onLogoutAdmin={handleLogoutAdmin}
          isSaving={isSaving}
          isCloudConnected={isCloudConnected}
          onSync={handleRefresh}
          onAdminSave={handleAdminManualSave}
          onOpenExplainer={isAdmin ? () => setShowGlobalExplainerModal(true) : undefined}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onChangeAdminPassword={handleUpdateAdminPassword}
        />

        {/* Contenido según pestaña activa */}
        <main>
          {/* 1. INICIO */}
          {activeTab === 'inicio' && (
            <DashboardHomeView
              state={state}
              isAdmin={isAdmin}
              onNavigateTab={tab => {
                if ((tab === 'estadisticas' || tab === 'config') && !isAdmin) {
                  handleRequestAdminModal(tab);
                } else {
                  setActiveTab(tab);
                }
              }}
              onSelectSong={(song, contextSongs, initialView) => handleOpenSongLyrics(song, contextSongs, initialView)}
              onUpdatePlaylist={handleUpdatePlaylist}
              onRequestAdmin={() => handleRequestAdminModal()}
            />
          )}

          {/* 2. CANCIONES (REPERTORIO Y CATÁLOGO) */}
          {(activeTab === 'canciones' || activeTab === 'cancionero') && (
            <SongCatalogView
              songs={state.songCatalog || []}
              isAdmin={isAdmin}
              categories={state.songCategories}
              state={state}
              onAddSong={handleAddSongDirectToCatalog}
              onUpdateSong={handleUpdateSongInCatalog}
              onDeleteSong={handleDeleteSongFromCatalog}
              onSelectSong={(song, contextSongs, initialView) => handleOpenSongLyrics(song, contextSongs, initialView)}
              onUpdateSongs={handleUpdateSongs}
              showToast={showToast}
            />
          )}

          {/* 3. CALENDARIO (AGENDA GENERAL DE CULTOS) */}
          {(activeTab === 'calendario' || activeTab === 'eventos') && (
            <EventsAgendaView
              state={state}
              isAdmin={isAdmin}
              currentWeekStart={currentWeekStart}
              onWeekChange={setCurrentWeekStart}
              onApplySchedule={handleApplySchedule}
              onSelectWeek={handleSelectWeekFromMonth}
              onSelectSong={(song, contextSongs) => handleOpenSongLyrics(song, contextSongs)}
              onOpenCatalog={() => setActiveTab('canciones')}
              onUpdateAssignment={handleUpdateAssignment}
              onUpdateSongs={handleUpdateSongs}
              onAddToCatalog={handleAddToCatalog}
              onClearWeek={handleClearWeek}
              onRestoreWeek={handleRestoreWeek}
              showToast={showToast}
              onRequestAdmin={() => handleRequestAdminModal()}
              onSaveSlot={handleSaveSlot}
            />
          )}

          {/* Vistas directas mes / semana si se invocan */}
          {activeTab === 'mes' && (
            <MonthCalendarView
              state={state}
              isAdmin={isAdmin}
              onApplySchedule={handleApplySchedule}
              onSelectWeek={handleSelectWeekFromMonth}
              onSelectSong={(song, contextSongs) => handleOpenSongLyrics(song, contextSongs)}
              showToast={showToast}
              onRequestAdmin={() => handleRequestAdminModal()}
              onSaveSlot={handleSaveSlot}
            />
          )}

          {activeTab === 'semana' && (
            <WeekView
              state={state}
              isAdmin={isAdmin}
              currentWeekStart={currentWeekStart}
              onWeekChange={setCurrentWeekStart}
              onUpdateAssignment={handleUpdateAssignment}
              onUpdateSongs={handleUpdateSongs}
              onAddToCatalog={handleAddToCatalog}
              onSelectSong={(song, contextSongs) => handleOpenSongLyrics(song, contextSongs)}
              onOpenCatalog={() => setActiveTab('canciones')}
              onClearWeek={handleClearWeek}
              onRestoreWeek={handleRestoreWeek}
              onApplySchedule={handleApplySchedule}
              showToast={showToast}
              onRequestAdmin={() => handleRequestAdminModal()}
              onSaveSlot={handleSaveSlot}
            />
          )}

          {/* 4. MÚSICOS & PAREJAS (Visible para todos, editable por admin) */}
          {activeTab === 'musicos' && (
            <MusiciansView
              state={state}
              isAdmin={isAdmin}
              onRequestAdmin={() => handleRequestAdminModal('musicos')}
              onSaveMusician={handleSaveMusician}
              onDeleteMusician={handleDeleteMusician}
              onSaveCouple={handleSaveCouple}
              onDeleteCouple={handleDeleteCouple}
              showToast={showToast}
            />
          )}

          {/* 5. REPORTES / ESTADÍSTICAS (Solo Admin) */}
          {activeTab === 'estadisticas' && (
            <StatsView state={state} />
          )}

          {/* 6. CONFIGURACIÓN / AJUSTES (Solo Admin) */}
          {activeTab === 'config' && (
            <ConfigView
              state={state}
              onSaveRole={handleSaveRole}
              onDeleteRole={handleDeleteRole}
              onSaveSlot={handleSaveSlot}
              onDeleteSlot={handleDeleteSlot}
              onSaveSongCategories={handleSaveSongCategories}
              onRenameSongCategory={handleRenameSongCategory}
              onUpdateAdminPassword={handleUpdateAdminPassword}
              onResetAllData={handleResetAllData}
              onImportState={handleImportState}
              showToast={showToast}
              onCheckForUpdates={checkForUpdates}
              isCheckingUpdate={isCheckingUpdate}
              isInstallable={isInstallable}
              isInstalled={isInstalled}
              isIOS={isIOS}
              onInstallApp={installApp}
            />
          )}
        </main>
      </div>

      {/* Navegación Fija Inferior en Móvil */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={tab => {
          if ((tab === 'estadisticas' || tab === 'config') && !isAdmin) {
            handleRequestAdminModal(tab);
          } else {
            setActiveTab(tab);
          }
        }}
        isAdmin={isAdmin}
        onToggleAdminModal={() => handleRequestAdminModal()}
      />

      {/* Modal Guía Visual de Reglas y Conflictos (Solo Admin) */}
      {isAdmin && (
        <ConflictExplainerModal
          isOpen={showGlobalExplainerModal}
          onClose={() => setShowGlobalExplainerModal(false)}
        />
      )}

      {/* Modal de Letra, Notas y Acordes de Alabanzas */}
      {selectedSongForLyrics && (
        <SongLyricsModal
          song={selectedSongForLyrics}
          initialViewMode={initialLyricsViewMode}
          isAdmin={isAdmin}
          state={state}
          categories={state.songCategories}
          onUpdateSongs={handleUpdateSongs}
          onUpdateSong={handleUpdateSongInCatalog}
          onClose={() => {
            setSelectedSongForLyrics(null);
            setLyricsContextSongs(null);
            setInitialLyricsViewMode('view');
          }}
          onSaveSongLyrics={handleSaveSongLyrics}
          onRequestAdmin={() => handleRequestAdminModal()}
          showToast={showToast}
          allSongs={lyricsContextSongs && lyricsContextSongs.length > 0 ? lyricsContextSongs : (state.songCatalog || [])}
          onNavigateToSong={song => setSelectedSongForLyrics(song)}
        />
      )}

      {/* Modal de Acceso de Administrador */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-[#2a2a2e] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#232328]">
              <div className="flex items-center gap-2 text-[#c5a059]">
                <KeyRound size={20} />
                <h3 className="font-serif text-lg text-white font-medium">Acceso Administrador</h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-[#6b6b75] hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#a0a0ab]">
              Inicia sesión con tu cuenta de administrador para editar músicos, parejas, roles, turnos y ver reportes.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#6b6b75] mb-1">
                  Correo de Administrador
                </label>
                <input
                  type="email"
                  autoFocus
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={adminEmailInput}
                  onChange={e => {
                    setAdminEmailInput(e.target.value);
                    setAdminPasswordError('');
                  }}
                  placeholder="correo@ejemplo.com"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none font-mono"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono uppercase text-[#6b6b75]">
                    Contraseña de Administrador
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={adminPasswordInput}
                    onChange={e => {
                      setAdminPasswordInput(e.target.value);
                      setAdminPasswordError('');
                    }}
                    placeholder="Contraseña..."
                    className="w-full bg-[#0a0a0b] border border-[#2a2a2e] focus:border-[#c5a059] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b75] hover:text-white"
                  >
                    {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {adminPasswordError && (
                  <div className="mt-2 space-y-1 bg-red-950/20 border border-red-900/40 p-2.5 rounded-xl">
                    <p className="text-xs text-red-400 flex items-center gap-1.5 font-mono">
                      <ShieldAlert size={13} className="flex-shrink-0" />
                      <span>{adminPasswordError}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232328]">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 bg-[#1a1a1d] hover:bg-[#252529] text-[#6b6b75] hover:text-white rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adminLoggingIn}
                  className="px-4 py-2 bg-[#c5a059] hover:bg-[#d4b068] text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer font-mono shadow-md shadow-[#c5a059]/20"
                >
                  {adminLoggingIn ? 'Entrando...' : 'Iniciar sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notificación Toast flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#141418] border border-[#c5a059]/40 text-white px-5 py-2.5 rounded-full text-xs font-mono tracking-wider shadow-2xl z-50 flex items-center gap-2.5 animate-fade-in pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
