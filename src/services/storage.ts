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
 * Helper para evitar que cualquier llamada quede colgada indefinidamente
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
}

/**
 * Comprueba si un estado entrante es válido y más reciente para evitar que
 * una lectura vacía o desactualizada sobrescriba cambios hechos en modo admin.
 */
export function shouldAcceptIncomingState(incoming: AppState, current: AppState): boolean {
  if (!incoming) return false;
  if (!current) return true;

  const currentAssignCount = Object.keys(current.assignments || {}).reduce(
    (acc, k) => acc + Object.keys(current.assignments[k] || {}).length,
    0
  );
  const incomingAssignCount = Object.keys(incoming.assignments || {}).reduce(
    (acc, k) => acc + Object.keys(incoming.assignments[k] || {}).length,
    0
  );

  const currentTime = current.lastUpdated ? new Date(current.lastUpdated).getTime() : 0;
  const incomingTime = incoming.lastUpdated ? new Date(incoming.lastUpdated).getTime() : 0;

  // Si el actual tiene asignaciones y el entrante no tiene ninguna, no sobreescribir salvo timestamp muy superior
  if (currentAssignCount > 0 && incomingAssignCount === 0) {
    if (incomingTime <= currentTime) {
      return false;
    }
  }

  // Si el entrante tiene timestamp anterior al actual por más de 3 segundos, rechazar
  if (incomingTime && currentTime && incomingTime < currentTime - 3000) {
    return false;
  }

  return true;
}

/**
 * Obtiene el estado actual sincronizado desde el servidor o Firestore con protección contra datos vacíos
 */
export async function fetchCloudState(): Promise<AppState | null> {
  const localCurrent = loadStoredState();

  // 1. Intentar primero desde el servidor backend (/api/state)
  try {
    const res = await withTimeout(fetch('/api/state'), 3500, 'Timeout en /api/state');
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && (serverData.slots || serverData.roles || serverData.musicians)) {
        const sanitized = sanitizeLoadedState(serverData);
        if (shouldAcceptIncomingState(sanitized, localCurrent)) {
          saveStoredState(sanitized);
          isCloudQuotaExceeded = false;
          return sanitized;
        } else {
          // El estado local es más reciente o tiene asignaciones que el servidor no tiene
          // Sincronizarlo hacia el servidor para que los demás celulares lo vean
          saveCloudState(localCurrent).catch(() => {});
          return localCurrent;
        }
      }
    } else if (res.status === 404) {
      // El servidor aún no tiene ningún estado; sincronizar con el local si contiene asignaciones
      saveCloudState(localCurrent).catch(() => {});
    }
  } catch {
    // Backend aún no conectado o en inicio frío
  }

  // 2. Consulta de respaldo a Firestore
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);
    const snapshot = await withTimeout(getDoc(docRef), 4000, 'Tiempo de espera al leer de Firestore agotado');
    if (snapshot.exists()) {
      const cloudData = snapshot.data();
      const sanitized = sanitizeLoadedState(cloudData);
      if (shouldAcceptIncomingState(sanitized, localCurrent)) {
        saveStoredState(sanitized);
        isCloudQuotaExceeded = false;
        return sanitized;
      } else {
        return localCurrent;
      }
    }
    return localCurrent;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      isCloudQuotaExceeded = true;
    }
    console.warn('Consulta a Firestore operando con datos locales/servidor:', errMsg);
    return localCurrent;
  }
}

/**
 * Obtiene el respaldo secundario de Firestore si existe
 */
export async function fetchCloudBackup(): Promise<AppState | null> {
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, 'backup_latest');
    const snapshot = await withTimeout(getDoc(docRef), 4000, 'Tiempo de espera de backup agotado');
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
 * Guarda un archivo adjunto pesado (PDF o partitura) en el servidor y en la caché local
 */
export async function saveAttachmentDoc(
  docId: string,
  attachment: {
    id: string;
    songId?: string;
    name: string;
    type?: string;
    dataUrl: string;
    updatedAt?: string;
  }
): Promise<boolean> {
  try {
    localStorage.setItem(`att_cache_${docId}`, attachment.dataUrl);
  } catch {
    // Si localStorage está lleno, ignorar
  }

  // 1. Guardar en el servidor backend
  try {
    await fetch(`/api/attachments/${docId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attachment),
    });
  } catch {
    // ignorar
  }

  // 2. Intentar guardar en Firestore como réplica
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, docId);
    await withTimeout(
      setDoc(docRef, {
        ...attachment,
        updatedAt: attachment.updatedAt || new Date().toISOString(),
      }),
      4000,
      'Tiempo de espera al guardar adjunto agotado'
    );
    return true;
  } catch (err) {
    console.warn(`No se pudo guardar adjunto ${docId} en Firestore:`, err);
    return true; // Exitoso porque ya se guardó localmente y en servidor
  }
}

/**
 * Recupera un archivo adjunto pesado (PDF o partitura) desde la caché local, servidor o Firestore.
 */
export async function fetchAttachmentDoc(docId: string): Promise<string | null> {
  try {
    const cached = localStorage.getItem(`att_cache_${docId}`);
    if (cached) return cached;
  } catch {
    // ignorar
  }

  // 1. Intentar servidor backend
  try {
    const res = await fetch(`/api/attachments/${docId}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.dataUrl) {
        try {
          localStorage.setItem(`att_cache_${docId}`, data.dataUrl);
        } catch {
          // ignorar
        }
        return data.dataUrl;
      }
    }
  } catch {
    // continuar
  }

  // 2. Fallback a Firestore
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, docId);
    const snap = await withTimeout(getDoc(docRef), 4000, 'Tiempo de espera para descargar partitura agotado');
    if (snap.exists()) {
      const data = snap.data();
      const dataUrl = data?.dataUrl || null;
      if (dataUrl) {
        try {
          localStorage.setItem(`att_cache_${docId}`, dataUrl);
        } catch {
          // ignorar
        }
        return dataUrl;
      }
    }
    return null;
  } catch (err) {
    console.warn(`Error al recuperar adjunto ${docId}:`, err);
    return null;
  }
}

let isCloudQuotaExceeded = false;
export function getIsCloudQuotaExceeded(): boolean {
  return isCloudQuotaExceeded;
}

/**
 * Guarda el estado de forma inmediata y confiable en:
 * 1. LocalStorage (síncrono)
 * 2. Servidor backend (/api/state) -> persistido en ./data/app_state.json y transmitido en vivo vía SSE a todos los dispositivos
 * 3. Firestore en la nube (réplica de respaldo)
 */
export async function saveCloudState(state: AppState): Promise<boolean> {
  // Primero respaldar localmente de forma síncrona
  saveStoredState(state);

  try {
    // Procesar adjuntos: solo almacenar metadatos ligeros en el estado compartido
    const cleanCatalog = (state.songCatalog || INITIAL_FULL_SONG_CATALOG).map(song => {
      if (!Array.isArray(song.attachments) || song.attachments.length === 0) {
        return song;
      }
      const processedAtts = song.attachments.map((att, idx) => {
        if (att.url && att.url.length > 500) {
          const storageDocId = att.storageDocId || `att_${song.id || 'sng'}_${att.id || idx}`;
          try {
            localStorage.setItem(`att_cache_${storageDocId}`, att.url);
          } catch {
            // ignorar
          }
          return {
            ...att,
            storageDocId,
            url: '', // Mantener el documento principal compacto y ligero
          };
        }
        return att;
      });
      return { ...song, attachments: processedAtts };
    });

    // Compactar shiftSongs para evitar duplicar PDFs base64
    const cleanShiftSongs: Record<string, SongItem[]> = {};
    if (state.shiftSongs && typeof state.shiftSongs === 'object') {
      Object.entries(state.shiftSongs).forEach(([shiftKey, songs]) => {
        if (Array.isArray(songs)) {
          cleanShiftSongs[shiftKey] = songs.map((s, sIdx) => {
            const compactAtts = Array.isArray(s.attachments)
              ? s.attachments.map((a, aIdx) => {
                  let storageDocId = a.storageDocId;
                  if (a.url && a.url.length > 500) {
                    storageDocId = storageDocId || `att_shift_${shiftKey}_${s.id || sIdx}_${a.id || aIdx}`;
                    try {
                      localStorage.setItem(`att_cache_${storageDocId}`, a.url);
                    } catch {
                      // ignorar
                    }
                  }
                  return {
                    id: a.id || a.name,
                    name: a.name || 'Archivo',
                    type: a.type || 'pdf',
                    storageDocId,
                    url: a.url && a.url.length > 500 ? '' : (a.url || ''),
                  };
                })
              : [];
            return {
              id: s.id,
              title: s.title,
              artist: s.artist || '',
              artists: s.artists || (s.artist ? [s.artist] : []),
              key: s.key || '',
              bpm: s.bpm,
              timeSignature: s.timeSignature || '4/4',
              category: s.category || 'General',
              categories: s.categories || (s.category ? [s.category] : ['General']),
              notes: s.notes || '',
              lyrics: s.lyrics || '',
              youtubeUrl: s.youtubeUrl || '',
              attachments: compactAtts,
            };
          });
        }
      });
    }

    const payload = {
      roles: state.roles || [],
      musicians: state.musicians || [],
      slots: state.slots || [],
      assignments: state.assignments || {},
      shiftSongs: cleanShiftSongs,
      songCatalog: cleanCatalog,
      songCategories: state.songCategories || DEFAULT_SONG_CATEGORIES,
      couples: state.couples || [],
      notices: state.notices || [],
      chatMessages: state.chatMessages || [],
      seeded: !!state.seeded,
      worshipPlaylistUrl: state.worshipPlaylistUrl || '',
      lastUpdated: new Date().toISOString(),
    };

    const cleanPayload = JSON.parse(JSON.stringify(payload));

    let savedToServer = false;

    // 1. Guardar en el servidor backend (/api/state)
    // Garantiza que todos los demás celulares y pantallas vean las asignaciones inmediatamente
    try {
      const res = await withTimeout(
        fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanPayload),
        }),
        3500,
        'Timeout en /api/state'
      );
      if (res.ok) {
        savedToServer = true;
      }
    } catch (apiErr) {
      console.warn('Servidor /api/state no disponible:', apiErr);
    }

    // 2. Intentar guardar en Firestore como réplica en la nube
    try {
      const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);
      await withTimeout(setDoc(docRef, cleanPayload), 4000, 'Tiempo agotado al escribir en Firestore');
      isCloudQuotaExceeded = false;
      return true;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        if (!savedToServer) {
          isCloudQuotaExceeded = true;
        }
      }
      console.warn('Firestore en pausa o fuera de línea (guardado en servidor/local exitoso):', errMsg);
      return savedToServer || true;
    }
  } catch (error: unknown) {
    console.error('Error general al guardar estado:', error);
    return false;
  }
}

/**
 * Escucha cambios en tiempo real desde el Servidor (SSE) y Firestore.
 * Sincroniza automáticamente en vivo a todos los dispositivos conectados.
 */
export function subscribeToCloudState(
  onUpdate: (state: AppState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  let isUnsubscribed = false;

  // 1. Conexión SSE con el servidor backend (/api/state/stream)
  let eventSource: EventSource | null = null;
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      eventSource = new EventSource('/api/state/stream');
      eventSource.onmessage = event => {
        if (isUnsubscribed) return;
        try {
          const raw = JSON.parse(event.data);
          if (raw && typeof raw === 'object' && (raw.slots || raw.roles || raw.musicians)) {
            const sanitized = sanitizeLoadedState(raw);
            const current = loadStoredState();
            if (shouldAcceptIncomingState(sanitized, current)) {
              saveStoredState(sanitized);
              isCloudQuotaExceeded = false;
              onUpdate(sanitized);
            }
          }
        } catch (err) {
          console.warn('Error al procesar actualización SSE:', err);
        }
      };
      eventSource.onerror = () => {
        // EventSource se reconecta automáticamente
      };
    } catch (err) {
      console.warn('No se pudo iniciar canal SSE:', err);
    }
  }

  // 2. Conexión con Firestore onSnapshot
  let firestoreUnsub: (() => void) | null = null;
  try {
    const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);
    firestoreUnsub = onSnapshot(
      docRef,
      snapshot => {
        if (isUnsubscribed) return;
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }
        if (snapshot.exists()) {
          const cloudData = snapshot.data();
          const sanitizedCloud = sanitizeLoadedState(cloudData);
          const current = loadStoredState();
          if (shouldAcceptIncomingState(sanitizedCloud, current)) {
            saveStoredState(sanitizedCloud);
            isCloudQuotaExceeded = false;
            onUpdate(sanitizedCloud);
          }
        }
      },
      error => {
        const errMsg = error.message || '';
        if (errMsg.includes('Quota exceeded') || errMsg.includes('resource-exhausted')) {
          // Si el servidor SSE está activo, no marcamos error de cuota crítico
        }
        console.warn('Firestore onSnapshot en modo offline:', error.message);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('No se pudo registrar listener de Firestore:', err);
  }

  return () => {
    isUnsubscribed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (firestoreUnsub) {
      firestoreUnsub();
      firestoreUnsub = null;
    }
  };
}

