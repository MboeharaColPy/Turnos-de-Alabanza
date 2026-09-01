// Multi-Instrument Chord Library: Guitar, Piano, Ukulele, Bass
import { CHORD_ROOTS_ANGLO, CHORD_ROOTS_LATIN } from './chordUtils';

export type InstrumentType = 'guitar' | 'piano' | 'ukulele' | 'bass';

export interface ChordDiagramData {
  name: string;
  instrument: InstrumentType;
  guitar?: {
    frets: (number | 'x')[]; // 6 strings: [E, A, D, G, B, e]
    fingers?: number[];
    baseFret?: number;
  };
  piano?: {
    notes: string[]; // e.g. ['C', 'E', 'G']
    root: string;
    keys: number[]; // semitone offsets from C (0 to 11, and +12 for octave if needed)
  };
  ukulele?: {
    frets: (number | 'x')[]; // 4 strings: [G, C, E, A]
    baseFret?: number;
  };
  bass?: {
    frets: (number | 'x')[]; // 4 strings: [E, A, D, G]
    baseFret?: number;
    notes?: string[];
  };
}

// Convert Latin to Anglo
export function convertLatinToAngloChord(chord: string): string {
  let c = (chord || '').trim();
  c = c.replace(/^\[|\]$/g, '').replace(/^\*/, '').replace(/^\(|\)$/g, '');

  const slashIdx = c.indexOf('/');
  if (slashIdx !== -1) {
    const main = convertLatinToAngloChord(c.slice(0, slashIdx));
    const bass = convertLatinToAngloChord(c.slice(slashIdx + 1));
    return `${main}/${bass}`;
  }

  for (let i = 0; i < CHORD_ROOTS_LATIN.length; i++) {
    const latin = CHORD_ROOTS_LATIN[i];
    if (c.toLowerCase().startsWith(latin.toLowerCase())) {
      const rest = c.slice(latin.length);
      return CHORD_ROOTS_ANGLO[i] + rest;
    }
  }
  return c;
}

// Guitar chord DB
const GUITAR_CHORD_DB: Record<string, { frets: (number | 'x')[]; fingers?: number[]; baseFret?: number }> = {
  'C': { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'Cm': { frets: ['x', 3, 5, 5, 4, 3], baseFret: 3 },
  'C7': { frets: ['x', 3, 2, 3, 1, 0] },
  'Cmaj7': { frets: ['x', 3, 2, 0, 0, 0] },
  'Cm7': { frets: ['x', 3, 5, 3, 4, 3], baseFret: 3 },
  'Csus4': { frets: ['x', 3, 3, 0, 1, 1] },
  'Cadd9': { frets: ['x', 3, 2, 0, 3, 3] },
  'C2': { frets: ['x', 3, 0, 0, 1, 0] },

  'C#': { frets: ['x', 4, 6, 6, 6, 4], baseFret: 4 },
  'C#m': { frets: ['x', 4, 6, 6, 5, 4], baseFret: 4 },
  'Db': { frets: ['x', 4, 6, 6, 6, 4], baseFret: 4 },
  'Dbm': { frets: ['x', 4, 6, 6, 5, 4], baseFret: 4 },

  'D': { frets: ['x', 'x', 0, 2, 3, 2] },
  'Dm': { frets: ['x', 'x', 0, 2, 3, 1] },
  'D7': { frets: ['x', 'x', 0, 2, 1, 2] },
  'Dmaj7': { frets: ['x', 'x', 0, 2, 2, 2] },
  'Dm7': { frets: ['x', 'x', 0, 2, 1, 1] },
  'Dsus4': { frets: ['x', 'x', 0, 2, 3, 3] },
  'D2': { frets: ['x', 'x', 0, 2, 3, 0] },

  'D#': { frets: ['x', 6, 8, 8, 8, 6], baseFret: 6 },
  'D#m': { frets: ['x', 6, 8, 8, 7, 6], baseFret: 6 },
  'Eb': { frets: ['x', 6, 8, 8, 8, 6], baseFret: 6 },
  'Ebm': { frets: ['x', 6, 8, 8, 7, 6], baseFret: 6 },

  'E': { frets: [0, 2, 2, 1, 0, 0] },
  'Em': { frets: [0, 2, 2, 0, 0, 0] },
  'E7': { frets: [0, 2, 0, 1, 0, 0] },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0] },
  'Em7': { frets: [0, 2, 2, 0, 3, 0] },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0] },

  'F': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], baseFret: 1 },
  'F7': { frets: [1, 3, 1, 2, 1, 1], baseFret: 1 },
  'Fmaj7': { frets: ['x', 'x', 3, 2, 1, 0] },
  'Fm7': { frets: [1, 3, 1, 1, 1, 1], baseFret: 1 },

  'F#': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },

  'G': { frets: [3, 2, 0, 0, 0, 3] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], baseFret: 3 },
  'G7': { frets: [3, 2, 0, 0, 0, 1] },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2] },
  'Gm7': { frets: [3, 5, 3, 3, 3, 3], baseFret: 3 },
  'Gsus4': { frets: [3, 3, 0, 0, 1, 3] },
  'G2': { frets: [3, 0, 0, 0, 3, 3] },

  'G#': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  'Ab': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },

  'A': { frets: ['x', 0, 2, 2, 2, 0] },
  'Am': { frets: ['x', 0, 2, 2, 1, 0] },
  'A7': { frets: ['x', 0, 2, 0, 2, 0] },
  'Amaj7': { frets: ['x', 0, 2, 1, 2, 0] },
  'Am7': { frets: ['x', 0, 2, 0, 1, 0] },
  'Asus4': { frets: ['x', 0, 2, 2, 3, 0] },
  'A2': { frets: ['x', 0, 2, 2, 0, 0] },

  'A#': { frets: ['x', 1, 3, 3, 3, 1], baseFret: 1 },
  'A#m': { frets: ['x', 1, 3, 3, 2, 1], baseFret: 1 },
  'Bb': { frets: ['x', 1, 3, 3, 3, 1], baseFret: 1 },
  'Bbm': { frets: ['x', 1, 3, 3, 2, 1], baseFret: 1 },

  'B': { frets: ['x', 2, 4, 4, 4, 2], baseFret: 2 },
  'Bm': { frets: ['x', 2, 4, 4, 3, 2], baseFret: 2 },
  'B7': { frets: ['x', 2, 1, 2, 0, 2] },
  'Bmaj7': { frets: ['x', 2, 4, 3, 4, 2], baseFret: 2 },
  'Bm7': { frets: ['x', 2, 4, 2, 3, 2], baseFret: 2 },
};

// Ukulele chord DB [G, C, E, A]
const UKULELE_CHORD_DB: Record<string, { frets: (number | 'x')[]; baseFret?: number }> = {
  'C': { frets: [0, 0, 0, 3] },
  'Cm': { frets: [0, 3, 3, 3] },
  'C7': { frets: [0, 0, 0, 1] },
  'Cmaj7': { frets: [0, 0, 0, 2] },
  'D': { frets: [2, 2, 2, 0] },
  'Dm': { frets: [2, 2, 1, 0] },
  'D7': { frets: [2, 0, 2, 0] },
  'E': { frets: [4, 4, 4, 2], baseFret: 1 },
  'Em': { frets: [0, 4, 3, 2] },
  'Em7': { frets: [0, 2, 0, 2] },
  'E7': { frets: [1, 2, 0, 2] },
  'F': { frets: [2, 0, 1, 0] },
  'Fm': { frets: [1, 0, 1, 3] },
  'F#m': { frets: [2, 1, 2, 0] },
  'G': { frets: [0, 2, 3, 2] },
  'Gm': { frets: [0, 2, 3, 1] },
  'G7': { frets: [0, 2, 1, 2] },
  'A': { frets: [2, 1, 0, 0] },
  'Am': { frets: [2, 0, 0, 0] },
  'A7': { frets: [0, 1, 0, 0] },
  'Am7': { frets: [0, 0, 0, 0] },
  'B': { frets: [4, 3, 2, 2], baseFret: 2 },
  'Bm': { frets: [4, 2, 2, 2], baseFret: 2 },
  'B7': { frets: [2, 3, 2, 2], baseFret: 2 },
  'Bb': { frets: [3, 2, 1, 1], baseFret: 1 },
};

// Bass chord root notes [E, A, D, G]
const BASS_CHORD_DB: Record<string, { frets: (number | 'x')[]; baseFret?: number }> = {
  'C': { frets: ['x', 3, 2, 0] },
  'Cm': { frets: ['x', 3, 1, 0] },
  'C#': { frets: ['x', 4, 3, 1] },
  'C#m': { frets: ['x', 4, 2, 1] },
  'D': { frets: ['x', 5, 4, 2], baseFret: 2 },
  'Dm': { frets: ['x', 5, 3, 2], baseFret: 2 },
  'Eb': { frets: ['x', 6, 5, 3], baseFret: 3 },
  'E': { frets: [0, 2, 2, 'x'] },
  'Em': { frets: [0, 2, 2, 'x'] },
  'F': { frets: [1, 3, 3, 'x'] },
  'Fm': { frets: [1, 3, 3, 'x'] },
  'F#': { frets: [2, 4, 4, 'x'] },
  'F#m': { frets: [2, 4, 4, 'x'] },
  'G': { frets: [3, 2, 0, 0] },
  'Gm': { frets: [3, 1, 0, 0] },
  'Ab': { frets: [4, 3, 1, 1] },
  'A': { frets: [5, 4, 2, 2], baseFret: 2 },
  'Am': { frets: [5, 3, 2, 2], baseFret: 2 },
  'Bb': { frets: ['x', 1, 3, 3] },
  'B': { frets: ['x', 2, 4, 4] },
  'Bm': { frets: ['x', 2, 4, 4] },
};

// Piano chord key notes generator (semitone relative to C = 0)
const NOTE_SEMITONES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

export function getPianoChordNotes(chordName: string): { root: string; notes: string[]; keys: number[] } {
  const clean = convertLatinToAngloChord(chordName);
  const match = clean.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return { root: 'C', notes: ['C', 'E', 'G'], keys: [0, 4, 7] };

  const root = match[1];
  const qual = (match[2] || '').toLowerCase();
  const rootIndex = NOTE_SEMITONES[root] ?? 0;

  // Intervals from root
  let intervals = [0, 4, 7]; // Major triad

  if (qual.startsWith('m') && !qual.startsWith('maj')) {
    if (qual.includes('7')) intervals = [0, 3, 7, 10]; // minor 7
    else intervals = [0, 3, 7]; // minor
  } else if (qual.includes('maj7')) {
    intervals = [0, 4, 7, 11];
  } else if (qual.includes('7')) {
    intervals = [0, 4, 7, 10]; // Dominant 7
  } else if (qual.includes('sus4')) {
    intervals = [0, 5, 7];
  } else if (qual.includes('sus2') || qual.includes('2') || qual.includes('add9')) {
    intervals = [0, 2, 4, 7];
  } else if (qual.includes('dim')) {
    intervals = [0, 3, 6];
  } else if (qual.includes('aug')) {
    intervals = [0, 4, 8];
  }

  const keys = intervals.map(iv => (rootIndex + iv) % 12);
  const noteNames = intervals.map(iv => CHORD_ROOTS_ANGLO[(rootIndex + iv) % 12]);

  return { root, notes: noteNames, keys };
}

// Universal Chord Diagram Getter
export function getChordDiagramForInstrument(
  chordName: string,
  instrument: InstrumentType = 'guitar'
): ChordDiagramData | null {
  if (!chordName) return null;
  const clean = convertLatinToAngloChord(chordName);

  if (instrument === 'piano') {
    const pianoData = getPianoChordNotes(clean);
    return {
      name: clean,
      instrument: 'piano',
      piano: pianoData,
    };
  }

  if (instrument === 'ukulele') {
    const raw = UKULELE_CHORD_DB[clean] || UKULELE_CHORD_DB[clean.replace(/7|maj7|sus4|2/g, '')] || { frets: [0, 0, 0, 0] };
    return {
      name: clean,
      instrument: 'ukulele',
      ukulele: {
        frets: raw.frets,
        baseFret: raw.baseFret || 1,
      },
    };
  }

  if (instrument === 'bass') {
    const raw = BASS_CHORD_DB[clean] || BASS_CHORD_DB[clean.replace(/7|maj7|sus4|2/g, '')] || { frets: [0, 'x', 'x', 'x'] };
    return {
      name: clean,
      instrument: 'bass',
      bass: {
        frets: raw.frets,
        baseFret: raw.baseFret || 1,
      },
    };
  }

  // Default: Guitar
  let raw = GUITAR_CHORD_DB[clean];
  if (!raw) {
    // Simplify (e.g. Dm7 -> Dm)
    const baseMatch = clean.match(/^([A-G][#b]?m?)/);
    if (baseMatch && GUITAR_CHORD_DB[baseMatch[1]]) {
      raw = GUITAR_CHORD_DB[baseMatch[1]];
    }
  }

  return {
    name: clean,
    instrument: 'guitar',
    guitar: {
      frets: raw ? raw.frets : ['x', 'x', 0, 0, 0, 0],
      fingers: raw?.fingers,
      baseFret: raw?.baseFret || 1,
    },
  };
}

export function extractUniqueChords(text: string): string[] {
  if (!text) return [];
  const chordsSet = new Set<string>();

  const lines = text.split('\n');
  lines.forEach(line => {
    // Look for bracketed or space-separated chords
    const tokens = line.split(/[\s,]+/);
    tokens.forEach(tok => {
      const clean = tok.replace(/[[\]*()]/g, '').trim();
      if (clean && /^[A-Ga-g]([#b]|♯|♭)?(m|maj|min|dim|aug|sus\d?|add\d+|\d)*(\/[A-Ga-g][#b]?)?$/.test(clean)) {
        chordsSet.add(clean.toUpperCase());
      }
    });
  });

  return Array.from(chordsSet);
}
