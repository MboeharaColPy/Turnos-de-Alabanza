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

export interface Slot {
  id: string;
  label: string;
  day: number; // 0 = Lunes, ..., 6 = Domingo
  time: string; // "10:00"
  roleIds: string[];
}

export interface Couple {
  id: string;
  aId: string;
  bId: string;
}

export interface SongItem {
  id: string;
  title: string;
  artist?: string;
  key?: string; // Tono (ej: Sol, C, Em)
  tempo?: string;
  notes?: string;
  lyrics?: string; // Letra y notas / acordes formateados
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
  couples: Couple[];
  adminPassword?: string;
  seeded: boolean;
  lastUpdated?: string;
}

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
  'Audio visual',
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

