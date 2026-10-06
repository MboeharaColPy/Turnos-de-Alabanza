import { doc, getDoc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_FULL_SONG_CATALOG } from '../data/songCatalogData';
import {
  AppState,
  DEFAULT_SONG_CATEGORIES,
  Gender,
  INITIAL_PRELOADED_MUSICIANS_DATA,
  INITIAL_PRELOADED_ROLES,
  Musician,
  Role,
  Slot,
  SongItem,
  Notice,
} from '../types';

export const STORAGE_KEY = 'turnos_musicos_data_v4';
const CLOUD_DOC_PATH = { collection: 'shared_data', id: 'main' };


export interface DetectedBackup {
  key: string;
  source: 'localStorage' | 'cloudBackup';
  dateStr: string;
  timestamp: number;
  assignmentsCount: number;
  musiciansCount: number;
  slotsCount: number;
  songsCount: number;
  state: AppState;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export function getInitialDefaultState(): AppState {
  // Pre-cargar roles solicitados con primera letra mayúscula y siguientes en minúscula
  const roles: Role[] = INITIAL_PRELOADED_ROLES.map((name, index) => ({
    id: `role_${index + 1}`,
    name,
    priority: index + 1,
  }));

  const roleNameMap = new Map<string, string>(roles.map(r => [r.name.toLowerCase().trim(), r.id]));
  const vozHRoleIds = roles.filter(r => r.name.toLowerCase().startsWith('voz h')).map(r => r.id);
  const vozMRoleIds = roles.filter(r => r.name.toLowerCase().startsWith('voz m')).map(r => r.id);

  // Distribuir roles a cada músico según su perfil real y rol primordial
  const musicians: Musician[] = INITIAL_PRELOADED_MUSICIANS_DATA.map((item, index) => {
    const id = `mus_${index + 1}`;
    const assignedRoles: string[] = [];
    const pRoleName = (item.primaryRoleName || '').toLowerCase().trim();
    const primaryId = roleNameMap.get(pRoleName) || '';

    if (primaryId) {
      assignedRoles.push(primaryId);
    }

    // Directores y Cantantes
    if (pRoleName.includes('director')) {
      if (item.gender === 'H') {
        vozHRoleIds.forEach(vid => { if (!assignedRoles.includes(vid)) assignedRoles.push(vid); });
        const gAcustica = roleNameMap.get('guitarra acustica');
        if (gAcustica && !assignedRoles.includes(gAcustica)) assignedRoles.push(gAcustica);
      } else {
        vozMRoleIds.forEach(vid => { if (!assignedRoles.includes(vid)) assignedRoles.push(vid); });
      }
    } else if (pRoleName.startsWith('voz h')) {
      vozHRoleIds.forEach(vid => { if (!assignedRoles.includes(vid)) assignedRoles.push(vid); });
    } else if (pRoleName.startsWith('voz m')) {
      vozMRoleIds.forEach(vid => { if (!assignedRoles.includes(vid)) assignedRoles.push(vid); });
    }

    return {
      id,
      name: item.name,
      gender: item.gender,
      roleIds: assignedRoles.length > 0 ? assignedRoles : (primaryId ? [primaryId] : []),
      primaryRoleId: primaryId || assignedRoles[0] || '',
    };
  });

  // Parejas por defecto
  const couples = [
    { id: 'cpl_1', aId: 'mus_11', bId: 'mus_7' }, // Jairo & Catherin
  ];

  // Turnos recurrentes por defecto (Ensayo del Sábado y Culto Dominical como predeterminado)
  const defaultSlots: Slot[] = [
    {
      id: 'slt_sabado_ensayo',
      label: 'Ensayo del Sábado',
      day: 5, // Sábado
      time: '18:00',
      durationMinutes: 90,
      roleIds: roles.map(r => r.id),
    },
    {
      id: 'slt_domingo_culto',
      label: 'Culto Dominical',
      day: 6, // Domingo
      time: '10:00',
      durationMinutes: 90,
      rehearsal: {
        enabled: true,
        day: 5, // Sábado
        time: '18:00',
        durationMinutes: 90,
        label: 'Ensayo previo del Sábado',
      },
      roleIds: roles.map(r => r.id),
    },
  ];

  const defaultNotices: Notice[] = [];

  const defaultChatMessages = [
    {
      id: 'msg_1',
      senderName: 'Jairo (Director)',
      text: '¡Dios les bendiga equipo! Bienvenidos a la plataforma de gestión y cancionero en vivo.',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      isAnnouncement: true,
      isPinned: true,
    },
    {
      id: 'msg_2',
      senderName: 'Carolina (Piano)',
      text: 'Hola a todos, ya revisé las notas de las canciones en el repertorio. ¡Todo listo para el ensayo!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isAnnouncement: false,
    },
  ];

  return {
    roles,
    musicians,
    slots: defaultSlots,
    assignments: {},
    shiftSongs: {},
    songCatalog: INITIAL_FULL_SONG_CATALOG,
    songCategories: DEFAULT_SONG_CATEGORIES,
    couples,
    notices: defaultNotices,
    chatMessages: defaultChatMessages,
    seeded: true,
    worshipPlaylistUrl: '',
    lastUpdated: new Date().toISOString(),
  };
}

export function isRehearsalSlot(slot: Slot, allSlots: Slot[]): boolean {
  if (!slot) return false;
  // If slot is explicitly the default legacy rehearsal slot
  if (slot.id === 'slt_sabado_ensayo') return true;
  // If another slot has rehearsal enabled on this slot's day
  const isCoveredByOther = allSlots.some(
    other => other.id !== slot.id && other.rehearsal?.enabled && other.rehearsal.day === slot.day
  );
  if (isCoveredByOther && (slot.label || '').toLowerCase().includes('ensayo')) {
    return true;
  }
  return false;
}

export function sanitizeLoadedState(rawState: unknown): AppState {
  const fallbackDefault = getInitialDefaultState();
  if (!rawState || typeof rawState !== 'object') {
    return fallbackDefault;
  }

  const parsed = rawState as Partial<AppState>;

  // Determinar género por defecto si no existía en versiones anteriores
  const inferGender = (name: string): Gender => {
    const found = INITIAL_PRELOADED_MUSICIANS_DATA.find(
      p => p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (found) return found.gender;
    const lower = name.toLowerCase().trim();
    if (lower.endsWith('a') || lower.endsWith('ith') || lower.endsWith('in') || lower === 'majo' || lower === 'sandra') {
      return 'M';
    }
    return 'H';
  };

  // Respetar exactamente los roles que vienen de la base de datos sin sobreescribir
  let roles: Role[] = Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : fallbackDefault.roles;

  // Respetar los músicos de la base de datos exactamente como fueron guardados
  const rawMusicians = Array.isArray(parsed.musicians) && parsed.musicians.length > 0
    ? parsed.musicians
    : fallbackDefault.musicians;

  const musicians: Musician[] = rawMusicians.map((m, idx) => {
    const gender = (m.gender === 'H' || m.gender === 'M') ? m.gender : inferGender(m.name || '');
    const roleIds = Array.isArray(m.roleIds) ? [...m.roleIds] : [];
    return {
      id: m.id || `mus_${idx + 1}`,
      name: m.name || `Integrante ${idx + 1}`,
      gender,
      roleIds,
      primaryRoleId: m.primaryRoleId || (roleIds.length > 0 ? roleIds[0] : ''),
      phone: m.phone || '',
      notes: m.notes || '',
    };
  });

  // Respetar los slots de la base de datos exactamente
  const rawSlots = Array.isArray(parsed.slots) && parsed.slots.length > 0 ? parsed.slots : fallbackDefault.slots;
  const slots: Slot[] = rawSlots.map(s => {
    const slotRoles = Array.isArray(s.roleIds) ? s.roleIds : [];
    return {
      ...s,
      day: typeof s.day === 'number' ? s.day : 6,
      time: s.time ? String(s.time).slice(0, 5) : '10:00',
      durationMinutes: s.durationMinutes ? Number(s.durationMinutes) : 90,
      rehearsal: s.rehearsal && typeof s.rehearsal === 'object' && s.rehearsal.enabled
        ? {
            enabled: true,
            day: typeof s.rehearsal.day === 'number' ? s.rehearsal.day : 5,
            time: s.rehearsal.time ? String(s.rehearsal.time).slice(0, 5) : '18:00',
            durationMinutes: s.rehearsal.durationMinutes ? Number(s.rehearsal.durationMinutes) : 90,
            label: s.rehearsal.label || 'Ensayo previo',
          }
        : (s.rehearsal ? { ...s.rehearsal, enabled: false } : undefined),
      roleIds: slotRoles,
    };
  });

  // Respetar todas las asignaciones tal cual están en la base de datos
  const sanitizedAssignments: Record<string, Record<string, string>> = {};
  if (parsed.assignments && typeof parsed.assignments === 'object') {
    Object.entries(parsed.assignments).forEach(([shiftKey, roleMap]) => {
      if (roleMap && typeof roleMap === 'object') {
        sanitizedAssignments[shiftKey] = { ...roleMap };
      }
    });
  }

  // Asegurar que si el songCatalog tiene menos de 20 canciones se fusione con las 220 oficiales
  let songCatalog = Array.isArray(parsed.songCatalog) && parsed.songCatalog.length > 20
    ? parsed.songCatalog
    : INITIAL_FULL_SONG_CATALOG;

  // Fusionar cualquier canción faltante del catálogo oficial
  if (Array.isArray(parsed.songCatalog) && parsed.songCatalog.length > 0) {
    const existingTitles = new Set(parsed.songCatalog.map(s => s.title.toLowerCase().trim()));
    const missing = INITIAL_FULL_SONG_CATALOG.filter(
      s => !existingTitles.has(s.title.toLowerCase().trim())
    );
    if (missing.length > 0) {
      songCatalog = [...parsed.songCatalog, ...missing];
    }
  }

  // Normalizar soporte de categorías múltiples en cada canción del catálogo
  songCatalog = songCatalog.map((s: SongItem) => {
    const cats = Array.isArray(s.categories) && s.categories.length > 0
      ? s.categories
      : (s.category ? [s.category] : ['Adoración']);
    return {
      ...s,
      categories: cats,
      category: s.category || cats[0] || 'Adoración',
    };
  });

  // Ordenar catálogo alfabéticamente por título de la A a la Z
  songCatalog = [...songCatalog].sort((a, b) =>
    a.title.localeCompare(b.title, 'es', { numeric: true, sensitivity: 'base' })
  );

  const state: AppState = {
    roles,
    musicians: musicians.length > 0 ? musicians : fallbackDefault.musicians,
    slots,
    assignments: sanitizedAssignments,
    shiftSongs: parsed.shiftSongs && typeof parsed.shiftSongs === 'object' ? parsed.shiftSongs : {},
    songCatalog,
    songCategories: Array.isArray(parsed.songCategories) && parsed.songCategories.length > 0
      ? parsed.songCategories
      : DEFAULT_SONG_CATEGORIES,
    couples: Array.isArray(parsed.couples) ? parsed.couples : fallbackDefault.couples,
    notices: Array.isArray(parsed.notices) ? parsed.notices : [],
    chatMessages: Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : fallbackDefault.chatMessages,
    seeded: !!parsed.seeded,
    worshipPlaylistUrl:
      typeof parsed.worshipPlaylistUrl === 'string'
        ? (parsed.worshipPlaylistUrl.includes('PL4fGSI1pDJn6O1E9vB1O4l2oGf5h8v8vX') ? '' : parsed.worshipPlaylistUrl)
        : '',
    lastUpdated: parsed.lastUpdated || new Date().toISOString(),
  };

  return state;
}

/**
 * Escanea todas las llaves en localStorage del navegador buscando cualquier respaldo
 * o versión previa de datos (v4, v3, v2, v1, sin versión, backups automáticos, etc.)
 */
export function scanAvailableLocalBackups(): DetectedBackup[] {
  const backups: DetectedBackup[] = [];
  try {
    const knownKeys = [
      'turnos_musicos_data_v4',
      'turnos_musicos_data_v3',
      'turnos_musicos_data_v2',
      'turnos_musicos_data_v1',
      'turnos_musicos_data',
      'turnos_state',
      'alabanza_state',
    ];

    const allKeys = new Set<string>([...knownKeys]);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('turnos_') || k.startsWith('alabanza_') || k.includes('backup') || k.includes('musico'))) {
        allKeys.add(k);
      }
    }

    allKeys.forEach(key => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const hasRolesOrMusicians = Array.isArray(parsed.roles) || Array.isArray(parsed.musicians);
          const hasAssignments = parsed.assignments && typeof parsed.assignments === 'object';
          if (hasRolesOrMusicians || hasAssignments) {
            const sanitized = sanitizeLoadedState(parsed);
            const assignKeys = Object.keys(sanitized.assignments || {});
            let totalAssignedRoles = 0;
            assignKeys.forEach(k => {
              totalAssignedRoles += Object.keys(sanitized.assignments[k] || {}).length;
            });

            const dateStr = sanitized.lastUpdated || '';
            const timestamp = dateStr ? new Date(dateStr).getTime() : 0;

            backups.push({
              key,
              source: 'localStorage',
              dateStr: dateStr ? new Date(dateStr).toLocaleString('es-ES') : 'Fecha no registrada',
              timestamp: isNaN(timestamp) ? 0 : timestamp,
              assignmentsCount: totalAssignedRoles,
              musiciansCount: sanitized.musicians.length,
              slotsCount: sanitized.slots.length,
              songsCount: sanitized.songCatalog.length,
              state: sanitized,
            });
          }
        }
      } catch {
        // Ignorar entradas no serializadas en JSON
      }
    });
  } catch (err) {
    console.warn('Error escaneando respaldos locales:', err);
  }

  // Ordenar priorizando los que tengan asignaciones y luego los más recientes
  return backups.sort((a, b) => {
    if (b.assignmentsCount !== a.assignmentsCount) {
      return b.assignmentsCount - a.assignmentsCount;
    }
    return b.timestamp - a.timestamp;
  });
}

export function loadStoredState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const sanitized = sanitizeLoadedState(parsed);

      // Si la versión en v4 está vacía (0 asignaciones), verificar si alguna versión previa del navegador tenía datos reales
      const assignCountInV4 = Object.keys(sanitized.assignments || {}).reduce(
        (acc, k) => acc + Object.keys(sanitized.assignments[k] || {}).length,
        0
      );

      if (assignCountInV4 === 0) {
        const backups = scanAvailableLocalBackups();
        const candidate = backups.find(b => b.key !== STORAGE_KEY && b.assignmentsCount > 0);
        if (candidate) {
          console.log(`[Storage] Recuperando automáticamente ${candidate.assignmentsCount} asignaciones desde ${candidate.key}`);
          saveStoredState(candidate.state);
          return candidate.state;
        }
      }

      return sanitized;
    }

    // Si no existe v4 aún, buscar en respaldos anteriores del navegador
    const backups = scanAvailableLocalBackups();
    if (backups.length > 0) {
      const best = backups[0];
      saveStoredState(best.state);
      return best.state;
    }

    const fresh = getInitialDefaultState();
    saveStoredState(fresh);
    return fresh;
  } catch (error) {
    console.error('Error cargando estado de localStorage:', error);
    const fresh = getInitialDefaultState();
    saveStoredState(fresh);
    return fresh;
  }
}

export function saveStoredState(state: AppState): boolean {
  try {
    const updated = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Guardar copia histórica de seguridad en localStorage si contiene asignaciones
    const assignCount = Object.keys(updated.assignments || {}).reduce(
      (acc, k) => acc + Object.keys(updated.assignments[k] || {}).length,
      0
    );
    if (assignCount > 0) {
      try {
        const todayTag = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`turnos_backup_auto_${todayTag}`, JSON.stringify(updated));
      } catch {
        // Ignorar si el storage está lleno
      }
    }

    return true;
  } catch (error) {
    console.error('Error guardando estado en localStorage:', error);
    return false;
  }
}

/**
 * Obtiene el estado actual directamente de Firestore
 */
export async function fetchCloudState(): Promise<AppState | null> {
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const cloudData = snapshot.data();
      const sanitized = sanitizeLoadedState(cloudData);
      saveStoredState(sanitized);
      return sanitized;
    }
    return null;
  } catch (error) {
    console.warn('Error al obtener estado desde la nube:', error);
    return null;
  }
}

/**
 * Obtiene el respaldo secundario de Firestore si existe
 */
export async function fetchCloudBackup(): Promise<AppState | null> {
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, 'backup_latest');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const cloudData = snapshot.data();
      return sanitizeLoadedState(cloudData);
    }
    return null;
  } catch (error) {
    console.warn('Error al consultar backup en Firestore:', error);
    return null;
  }
}

/**
 * Guarda el estado en Firestore en la nube para sincronizar con todos los usuarios
 */
export async function saveCloudState(state: AppState): Promise<boolean> {
  // Primero respaldar localmente de forma síncrona
  saveStoredState(state);

  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);
    const payload = {
      roles: state.roles || [],
      musicians: state.musicians || [],
      slots: state.slots || [],
      assignments: state.assignments || {},
      shiftSongs: state.shiftSongs || {},
      songCatalog: state.songCatalog || INITIAL_FULL_SONG_CATALOG,
      songCategories: state.songCategories || DEFAULT_SONG_CATEGORIES,
      couples: state.couples || [],
      notices: state.notices || [],
      chatMessages: state.chatMessages || [],
      seeded: !!state.seeded,
      worshipPlaylistUrl: state.worshipPlaylistUrl || '',
      lastUpdated: new Date().toISOString(),
    };
    // Sanitizar profundamente para evitar cualquier valor undefined que rechace Firestore
    const cleanPayload = JSON.parse(JSON.stringify(payload));
    // Guardar en documento principal
    await setDoc(docRef, cleanPayload);

    // Guardar respaldo adicional en 'backup_latest' si contiene datos significativos
    const assignCount = Object.keys(cleanPayload.assignments || {}).reduce(
      (acc: number, k: string) => acc + Object.keys(cleanPayload.assignments[k] || {}).length,
      0
    );
    const shiftSongsValues = Object.values(cleanPayload.shiftSongs || {}) as unknown[];
    const songsInShifts: number = shiftSongsValues.reduce<number>(
      (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
      0
    );
    if (assignCount > 0 || songsInShifts > 0 || (cleanPayload.notices && cleanPayload.notices.length > 0)) {
      try {
        const backupDocRef = doc(db, CLOUD_DOC_PATH.collection, 'backup_latest');
        await setDoc(backupDocRef, cleanPayload);
      } catch (errBackup) {
        console.warn('No se pudo guardar backup secundario en la nube:', errBackup);
      }
    }

    return true;
  } catch (error) {
    console.error('Error al guardar estado en Firestore:', error);
    return false;
  }
}

let hasAttemptedInitialCloudSeed = false;

/**
 * Escucha cambios en tiempo real desde Firestore.
 * Incluye protección contra sobreescritura de datos locales nuevos con versiones antiguas.
 */
export function subscribeToCloudState(
  onUpdate: (state: AppState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);

  const unsubscribe = onSnapshot(
    docRef,
    async snapshot => {
      // Ignorar escrituras locales optimistas pendientes en este cliente
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        let sanitizedCloud = sanitizeLoadedState(cloudData);

        // Validar si los datos locales en este navegador son más recientes
        const currentLocal = loadStoredState();
        const localTime = currentLocal.lastUpdated ? new Date(currentLocal.lastUpdated).getTime() : 0;
        const cloudTime = sanitizedCloud.lastUpdated ? new Date(sanitizedCloud.lastUpdated).getTime() : 0;

        // Si lo local es más nuevo (por ejemplo edición reciente), preservarlo e intentar sincronizarlo
        if (localTime > cloudTime + 2000) {
          console.log('[Storage] Preservando cambios locales más recientes que la nube');
          saveCloudState(currentLocal);
          return;
        }

        // Fusión segura: preservar cualquier canción agregada localmente que aún no esté en la nube
        if (currentLocal.songCatalog && currentLocal.songCatalog.length > 0) {
          const cloudSongIds = new Set((sanitizedCloud.songCatalog || []).map(s => s.id));
          const extraLocalSongs = currentLocal.songCatalog.filter(s => !cloudSongIds.has(s.id));
          if (extraLocalSongs.length > 0) {
            sanitizedCloud = {
              ...sanitizedCloud,
              songCatalog: [...sanitizedCloud.songCatalog, ...extraLocalSongs],
            };
          }
        }

        // Fusión segura: preservar shiftSongs locales si la nube viene vacía para un turno
        if (currentLocal.shiftSongs && Object.keys(currentLocal.shiftSongs).length > 0) {
          const mergedShiftSongs = { ...sanitizedCloud.shiftSongs };
          let changed = false;
          Object.entries(currentLocal.shiftSongs).forEach(([k, list]) => {
            if ((!mergedShiftSongs[k] || mergedShiftSongs[k].length === 0) && Array.isArray(list) && list.length > 0) {
              mergedShiftSongs[k] = list;
              changed = true;
            }
          });
          if (changed) {
            sanitizedCloud = {
              ...sanitizedCloud,
              shiftSongs: mergedShiftSongs,
            };
          }
        }

        // Guardar en cache local y notificar al estado de React
        saveStoredState(sanitizedCloud);
        onUpdate(sanitizedCloud);
      } else {
        const local = loadStoredState();
        onUpdate(local);
      }
    },
    error => {
      console.warn('Conexión con Firestore operando en modo local/offline:', error.message);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

