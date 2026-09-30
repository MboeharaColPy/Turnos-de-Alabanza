export interface Role {
  id: string;
  name: string;
  priority?: number;
}

export type Gender = 'H' | 'M';

export interface Musician {
  id: string;
  name: string;
  gender: Gender;
  roleIds: string[];
  primaryRoleId?: string; // Rol primordial/preferente
  phone?: string;
  notes?: string;
}

export interface SlotRehearsal {
  enabled: boolean;
  day: number; // 0 = Lunes, ..., 6 = Domingo
  time: string; // ej: "18:00"
  durationMinutes: number; // ej: 90
  label?: string; // ej: "Ensayo previo"
}

export interface Slot {
  id: string;
  label: string;
  day: number; // 0 = Lunes, ..., 6 = Domingo
  time: string; // "10:00"
  durationMinutes?: number; // Duración en minutos del evento (ej: 90 min)
  rehearsal?: SlotRehearsal; // Ensayo asociado programado con día, hora y duración
  roleIds: string[];
}

export interface Couple {
  id: string;
  aId: string;
  bId: string;
}

export interface SongAttachment {
  id: string;
  name: string;
  url: string;
  type?: 'pdf' | 'image' | 'link';
}

export interface SongItem {
  id: string;
  title: string;
  artist?: string; // Legacy singular string
  artists?: string[]; // Multiple artists support
  key?: string; // Tono (ej: C, G, Em, Am)
  tempo?: string;
  bpm?: number;
  timeSignature?: string; // ej: "4/4", "6/8", "3/4"
  category?: string; // Legacy singular string
  categories?: string[]; // Multiple categories support (ej: ["Adoración", "Comunión"])
  sequence?: string[]; // ej: ["IN", "V1", "C", "V2", "C", "PTE", "C", "OUT"]
  notes?: string;
  lyrics?: string; // Letra y acordes (en cifrado americano, sin necesidad de corchetes)
  youtubeUrl?: string;
  attachments?: SongAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAnnouncement?: boolean;
  isPinned?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  isImportant?: boolean;
}

// Key format: `${isoDate}__${slotId}`
export type AssignmentsMap = Record<string, Record<string, string>>;

export interface AppState {
  roles: Role[];
  musicians: Musician[];
  slots: Slot[];
  assignments: AssignmentsMap;
  shiftSongs: Record<string, SongItem[]>;
  songCatalog: SongItem[];
  songCategories?: string[]; // Categorías editables por el administrador
  couples: Couple[];
  chatMessages?: ChatMessage[];
  notices?: Notice[];
  seeded: boolean;
  worshipPlaylistUrl?: string;
  lastUpdated?: string;
}

export const DEFAULT_SONG_CATEGORIES: string[] = [
  'Adoración',
  'Alabanza',
  'Júbilo',
  'Comunión',
  'Especial',
  'Apertura',
  'Ofrenda',
  'Reflexión',
  'Congregacional',
];

export const DAYS_OF_WEEK = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export const INITIAL_PRELOADED_ROLES: string[] = [
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
  'Sonido 2',
  'Audio visual',
  'Audio visual 2',
];

export interface PreloadedMusicianData {
  name: string;
  gender: Gender;
  primaryRoleName?: string;
}

export const INITIAL_PRELOADED_MUSICIANS_DATA: PreloadedMusicianData[] = [
  { name: 'Amparito', gender: 'M', primaryRoleName: 'Voz m 1' },
  { name: 'Angelica', gender: 'M', primaryRoleName: 'Voz m 1' },
  { name: 'Arturo', gender: 'H', primaryRoleName: 'Guitarra acustica' },
  { name: 'Benjamin', gender: 'H', primaryRoleName: 'Bajo' },
  { name: 'Camila', gender: 'M', primaryRoleName: 'Voz m 2' },
  { name: 'Carolina', gender: 'M', primaryRoleName: 'Piano' },
  { name: 'Catherin', gender: 'M', primaryRoleName: 'Voz m 1' },
  { name: 'Daniel', gender: 'H', primaryRoleName: 'Bateria' },
  { name: 'Diego', gender: 'H', primaryRoleName: 'Guitarra electrica' },
  { name: 'Iván', gender: 'H', primaryRoleName: 'Sonido' },
  { name: 'Jairo', gender: 'H', primaryRoleName: 'Director' },
  { name: 'Josué', gender: 'H', primaryRoleName: 'Voz h 1' },
  { name: 'Lucho', gender: 'H', primaryRoleName: 'Audio visual' },
  { name: 'Majo', gender: 'M', primaryRoleName: 'Director' },
  { name: 'Nelson', gender: 'H', primaryRoleName: 'Voz h 2' },
  { name: 'Nikolai', gender: 'H', primaryRoleName: 'Piano' },
  { name: 'Sandra', gender: 'M', primaryRoleName: 'Voz m 3' },
  { name: 'Santiago Sánchez', gender: 'H', primaryRoleName: 'Guitarra acustica' },
  { name: 'Sebastian', gender: 'H', primaryRoleName: 'Bajo' },
];

export const INITIAL_PRELOADED_MUSICIANS: string[] = INITIAL_PRELOADED_MUSICIANS_DATA.map(m => m.name);

