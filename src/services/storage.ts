import { doc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_FULL_SONG_CATALOG } from '../data/songCatalogData';
import {
  AppState,
  Gender,
  INITIAL_PRELOADED_MUSICIANS_DATA,
  INITIAL_PRELOADED_ROLES,
  Musician,
  Role,
  Slot,
  SongItem,
} from '../types';

export const STORAGE_KEY = 'turnos_musicos_data_v4';
const CLOUD_DOC_PATH = { collection: 'shared_data', id: 'main' };

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
  const defaultSlots = [
    {
      id: 'slt_sabado_ensayo',
      label: 'Ensayo del Sábado',
      day: 5, // Sábado
      time: '18:00',
      roleIds: roles.map(r => r.id),
    },
    {
      id: 'slt_domingo_culto',
      label: 'Culto Dominical',
      day: 6, // Domingo
      time: '10:00',
      roleIds: roles.map(r => r.id),
    },
  ];

  const defaultNotices = [
    {
      id: 'not_1',
      title: 'Puntualidad en el Ensayo General',
      content: 'Recordamos a todo el ministerio estar 15 minutos antes de la hora acordada para afinar instrumentos y tener un tiempo de oración juntos antes de comenzar.',
      author: 'Dirección de Alabanza',
      date: new Date().toISOString().split('T')[0],
      isImportant: true,
    },
    {
      id: 'not_2',
      title: 'Repertorio y Cifrados Actualizados',
      content: 'Ya se encuentran disponibles en la sección Canciones todas las letras con acordes, tempos en BPM y mapa de estructura para el servicio de este fin de semana.',
      author: 'Ministerio de Alabanza',
      date: new Date().toISOString().split('T')[0],
      isImportant: false,
    },
  ];

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
    couples,
    notices: defaultNotices,
    chatMessages: defaultChatMessages,
    adminPassword: 'alabanza2026',
    seeded: true,
    lastUpdated: new Date().toISOString(),
  };
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

  // Limpiar roles heredados obsoletos (como "Voces h", "Voces m") y garantizar los 6 roles vocales exactos
  let roles: Role[] = Array.isArray(parsed.roles) && parsed.roles.length > 0 ? parsed.roles : fallbackDefault.roles;
  
  // Filtrar roles no deseados o duplicados obsoletos
  const legacyRoleNamesToPurge = ['voces h', 'voces m', 'voz h', 'voz m', 'voz masculina', 'voz femenina', 'voces'];
  roles = roles.filter(
    r => !legacyRoleNamesToPurge.includes(r.name.toLowerCase().trim())
  );

  const requiredRoleNames = [
    'Director',
    'Voz h 1',
    'Voz h 2',
    'Voz h 3',
    'Voz m 1',
    'Voz m 2',
    'Voz m 3',
    'Piano',
    'Guitarra acustica',
    'Bateria',
    'Bajo',
    'Guitarra electrica',
    'Sonido',
    'Audio visual',
  ];

  requiredRoleNames.forEach((reqName, idx) => {
    const exists = roles.some(
      r => r.name.toLowerCase().trim() === reqName.toLowerCase().trim()
    );
    if (!exists) {
      roles.push({
        id: `role_${idx + 1}_${reqName.toLowerCase().replace(/\s+/g, '_')}`,
        name: reqName,
        priority: idx + 1,
      });
    }
  });

  // Mapear los IDs de los 3 roles vocales masculinos y 3 femeninos exactos
  const vozHRoleIds = roles
    .filter(r => {
      const n = r.name.toLowerCase().trim();
      return n === 'voz h 1' || n === 'voz h 2' || n === 'voz h 3';
    })
    .map(r => r.id);

  const vozMRoleIds = roles
    .filter(r => {
      const n = r.name.toLowerCase().trim();
      return n === 'voz m 1' || n === 'voz m 2' || n === 'voz m 3';
    })
    .map(r => r.id);

  const rawMusicians = Array.isArray(parsed.musicians) && parsed.musicians.length > 0
    ? parsed.musicians
    : fallbackDefault.musicians;

  // Asegurar que los músicos tengan asignados sus roles vocales según perfil real
  const musicians: Musician[] = rawMusicians.map((m, idx) => {
    const gender = (m.gender === 'H' || m.gender === 'M') ? m.gender : inferGender(m.name || '');
    let roleIds = Array.isArray(m.roleIds) ? [...m.roleIds] : [];
    
    // Identificar si este integrante canta (tiene algún rol de voz o director asignado)
    const hasVozH = roleIds.some(id => vozHRoleIds.includes(id));
    const hasVozM = roleIds.some(id => vozMRoleIds.includes(id));
    const primaryRole = roles.find(r => r.id === m.primaryRoleId);
    const primaryIsVozH = primaryRole && (primaryRole.name.toLowerCase().includes('voz h') || (primaryRole.name.toLowerCase().includes('director') && gender === 'H'));
    const primaryIsVozM = primaryRole && (primaryRole.name.toLowerCase().includes('voz m') || (primaryRole.name.toLowerCase().includes('director') && gender === 'M'));

    // Si es cantante masculino (o director), asegurar que pueda participar en los 3 puestos de voz h
    if (gender === 'H' && (hasVozH || primaryIsVozH)) {
      vozHRoleIds.forEach(id => {
        if (!roleIds.includes(id)) roleIds.push(id);
      });
      // Remover accidentalmente asignados roles de voz m si existieran
      roleIds = roleIds.filter(id => !vozMRoleIds.includes(id));
    } else if (gender === 'M' && (hasVozM || primaryIsVozM)) {
      // Si es cantante femenina (o directora), asegurar que pueda participar en los 3 puestos de voz m
      vozMRoleIds.forEach(id => {
        if (!roleIds.includes(id)) roleIds.push(id);
      });
      // Remover accidentalmente asignados roles de voz h si existieran
      roleIds = roleIds.filter(id => !vozHRoleIds.includes(id));
    } else {
      // Para músicos que NO son cantantes (ej: Batería, Bajo, Sonido, AV, etc.):
      // Limpiar cualquier rol de voz inyectado automáticamente
      roleIds = roleIds.filter(id => !vozHRoleIds.includes(id) && !vozMRoleIds.includes(id));
      
      // Si quedó sin roles, recuperar su rol original según INITIAL_PRELOADED_MUSICIANS_DATA
      if (roleIds.length === 0) {
        const initMatch = INITIAL_PRELOADED_MUSICIANS_DATA.find(
          x => x.name.toLowerCase() === (m.name || '').toLowerCase()
        );
        if (initMatch?.primaryRoleName) {
          const matchRole = roles.find(r => r.name.toLowerCase() === initMatch.primaryRoleName?.toLowerCase());
          if (matchRole) {
            roleIds.push(matchRole.id);
            if (initMatch.primaryRoleName.toLowerCase().startsWith('voz h')) {
              vozHRoleIds.forEach(id => { if (!roleIds.includes(id)) roleIds.push(id); });
            } else if (initMatch.primaryRoleName.toLowerCase().startsWith('voz m')) {
              vozMRoleIds.forEach(id => { if (!roleIds.includes(id)) roleIds.push(id); });
            }
          }
        }
      }
    }

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

  // Asegurar que los slots contengan exclusivamente roles válidos y no IDs ficticios u obsoletos
  const validRoleIdsSet = new Set(roles.map(r => r.id));
  const allRoleIds = roles.map(r => r.id);
  const rawSlots = Array.isArray(parsed.slots) && parsed.slots.length > 0 ? parsed.slots : fallbackDefault.slots;
  const slots: Slot[] = rawSlots.map(s => {
    const rawIds = s.roleIds && s.roleIds.length > 0
      ? Array.from(new Set([...s.roleIds, ...vozHRoleIds, ...vozMRoleIds]))
      : allRoleIds;
    const sanitizedRoleIds = rawIds.filter(rid => validRoleIdsSet.has(rid));
    return {
      ...s,
      roleIds: sanitizedRoleIds.length > 0 ? sanitizedRoleIds : allRoleIds,
    };
  });

  // Limpiar assignments: eliminar cualquier rol obsoleto o inexistente
  const sanitizedAssignments: Record<string, Record<string, string>> = {};
  if (parsed.assignments && typeof parsed.assignments === 'object') {
    Object.entries(parsed.assignments).forEach(([shiftKey, roleMap]) => {
      if (roleMap && typeof roleMap === 'object') {
        const cleanMap: Record<string, string> = {};
        Object.entries(roleMap).forEach(([rId, mId]) => {
          if (validRoleIdsSet.has(rId) && typeof mId === 'string' && mId) {
            cleanMap[rId] = mId;
          }
        });
        sanitizedAssignments[shiftKey] = cleanMap;
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
    couples: Array.isArray(parsed.couples) ? parsed.couples : fallbackDefault.couples,
    notices: Array.isArray(parsed.notices) && parsed.notices.length > 0 ? parsed.notices : fallbackDefault.notices,
    chatMessages: Array.isArray(parsed.chatMessages) && parsed.chatMessages.length > 0 ? parsed.chatMessages : fallbackDefault.chatMessages,
    adminPassword: parsed.adminPassword || 'alabanza2026',
    seeded: !!parsed.seeded,
    lastUpdated: parsed.lastUpdated || new Date().toISOString(),
  };

  return state;
}

export function loadStoredState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Intentar migrar de v2 si existe
      const rawV2 = localStorage.getItem('turnos_musicos_data_v2');
      if (rawV2) {
        const parsed = JSON.parse(rawV2);
        const sanitized = sanitizeLoadedState(parsed);
        saveStoredState(sanitized);
        return sanitized;
      }
      const fresh = getInitialDefaultState();
      saveStoredState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeLoadedState(parsed);
    return sanitized;
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
    return true;
  } catch (error) {
    console.error('Error guardando estado en localStorage:', error);
    return false;
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
      couples: state.couples || [],
      notices: state.notices || [],
      chatMessages: state.chatMessages || [],
      adminPassword: state.adminPassword || 'alabanza2026',
      seeded: !!state.seeded,
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.warn('Almacenamiento en la nube en modo diferido/offline:', error);
    return false;
  }
}

let hasAttemptedInitialCloudSeed = false;

/**
 * Escucha cambios en tiempo real desde Firestore.
 * Si el documento en la nube aún no existe, lo inicializa con los datos locales/por defecto.
 */
export function subscribeToCloudState(
  onUpdate: (state: AppState) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, CLOUD_DOC_PATH.collection, CLOUD_DOC_PATH.id);

  const unsubscribe = onSnapshot(
    docRef,
    async snapshot => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        const sanitized = sanitizeLoadedState(cloudData);
        // Actualizar cache local
        saveStoredState(sanitized);
        onUpdate(sanitized);
      } else if (!hasAttemptedInitialCloudSeed && navigator.onLine) {
        hasAttemptedInitialCloudSeed = true;
        // Inicializar documento en Firestore con el estado actual o default
        const local = loadStoredState();
        try {
          await setDoc(docRef, local, { merge: true });
          onUpdate(local);
        } catch (err) {
          console.warn('Modo sin conexión detectado, usando datos locales:', err);
        }
      }
    },
    error => {
      // Registrar advertencia amigable sin romper la aplicación
      console.warn('Conexión con Firestore operando en modo local/offline:', error.message);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

