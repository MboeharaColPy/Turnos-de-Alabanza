// Guitar and Piano Chord Library & Notation Converter
import { CHORD_ROOTS_ANGLO, CHORD_ROOTS_LATIN, transposeSingleChord } from './chordUtils';

export interface ChordDiagramData {
  name: string;
  guitar: {
    frets: (number | 'x')[]; // 6 strings: [E, A, D, G, B, e] from low E to high e
    fingers?: (number | 0)[]; // 1: Index, 2: Middle, 3: Ring, 4: Pinky
    barre?: { fret: number; fromString: number; toString: number };
    baseFret?: number;
  };
  piano?: {
    notes: string[]; // e.g. ['C', 'E', 'G']
  };
}

// Base chord diagrams in Anglo notation (standard guitar tuning E A D G B e)
// frets: [string 6 (low E), string 5 (A), string 4 (D), string 3 (G), string 2 (B), string 1 (high e)]
const GUITAR_CHORD_DB: Record<string, { frets: (number | 'x')[]; fingers?: number[]; baseFret?: number }> = {
  // C family
  'C': { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  'Cm': { frets: ['x', 3, 5, 5, 4, 3], baseFret: 3 },
  'C7': { frets: ['x', 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  'Cmaj7': { frets: ['x', 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  'Cm7': { frets: ['x', 3, 5, 3, 4, 3], baseFret: 3 },
  'Csus4': { frets: ['x', 3, 3, 0, 1, 1] },
  'Cadd9': { frets: ['x', 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },

  // C# / Db
  'C#': { frets: ['x', 4, 6, 6, 6, 4], baseFret: 4 },
  'C#m': { frets: ['x', 4, 6, 6, 5, 4], baseFret: 4 },
  'C#7': { frets: ['x', 4, 6, 4, 6, 4], baseFret: 4 },
  'Db': { frets: ['x', 4, 6, 6, 6, 4], baseFret: 4 },
  'Dbm': { frets: ['x', 4, 6, 6, 5, 4], baseFret: 4 },

  // D family
  'D': { frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  'Dm': { frets: ['x', 'x', 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  'D7': { frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  'Dmaj7': { frets: ['x', 'x', 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  'Dm7': { frets: ['x', 'x', 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  'Dsus4': { frets: ['x', 'x', 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  'Dsus2': { frets: ['x', 'x', 0, 2, 3, 0] },

  // D# / Eb
  'D#': { frets: ['x', 6, 8, 8, 8, 6], baseFret: 6 },
  'D#m': { frets: ['x', 6, 8, 8, 7, 6], baseFret: 6 },
  'Eb': { frets: ['x', 6, 8, 8, 8, 6], baseFret: 6 },
  'Ebm': { frets: ['x', 6, 8, 8, 7, 6], baseFret: 6 },

  // E family
  'E': { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  'E7': { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  'Emaj7': { frets: [0, 2, 1, 1, 0, 0] },
  'Em7': { frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0] },
  'Esus4': { frets: [0, 2, 2, 2, 0, 0] },

  // F family
  'F': { frets: [1, 3, 3, 2, 1, 1], baseFret: 1 },
  'Fm': { frets: [1, 3, 3, 1, 1, 1], baseFret: 1 },
  'F7': { frets: [1, 3, 1, 2, 1, 1], baseFret: 1 },
  'Fmaj7': { frets: ['x', 'x', 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  'Fm7': { frets: [1, 3, 1, 1, 1, 1], baseFret: 1 },
  'Fsus4': { frets: [1, 3, 3, 3, 1, 1], baseFret: 1 },

  // F# / Gb
  'F#': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  'F#m': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },
  'F#7': { frets: [2, 4, 2, 3, 2, 2], baseFret: 2 },
  'F#m7': { frets: [2, 4, 2, 2, 2, 2], baseFret: 2 },
  'Gb': { frets: [2, 4, 4, 3, 2, 2], baseFret: 2 },
  'Gbm': { frets: [2, 4, 4, 2, 2, 2], baseFret: 2 },

  // G family
  'G': { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  'Gm': { frets: [3, 5, 5, 3, 3, 3], baseFret: 3 },
  'G7': { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  'Gmaj7': { frets: [3, 2, 0, 0, 0, 2] },
  'Gm7': { frets: [3, 5, 3, 3, 3, 3], baseFret: 3 },
  'Gsus4': { frets: [3, 3, 0, 0, 1, 3] },

  // G# / Ab
  'G#': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  'G#m': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },
  'Ab': { frets: [4, 6, 6, 5, 4, 4], baseFret: 4 },
  'Abm': { frets: [4, 6, 6, 4, 4, 4], baseFret: 4 },

  // A family
  'A': { frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Am': { frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  'A7': { frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  'Amaj7': { frets: ['x', 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  'Am7': { frets: ['x', 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  'Asus4': { frets: ['x', 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  'Asus2': { frets: ['x', 0, 2, 2, 0, 0] },

  // A# / Bb
  'A#': { frets: ['x', 1, 3, 3, 3, 1], baseFret: 1 },
  'A#m': { frets: ['x', 1, 3, 3, 2, 1], baseFret: 1 },
  'Bb': { frets: ['x', 1, 3, 3, 3, 1], baseFret: 1 },
  'Bbm': { frets: ['x', 1, 3, 3, 2, 1], baseFret: 1 },
  'Bb7': { frets: ['x', 1, 3, 1, 3, 1], baseFret: 1 },

  // B family
  'B': { frets: ['x', 2, 4, 4, 4, 2], baseFret: 2 },
  'Bm': { frets: ['x', 2, 4, 4, 3, 2], baseFret: 2 },
  'B7': { frets: ['x', 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  'Bmaj7': { frets: ['x', 2, 4, 3, 4, 2], baseFret: 2 },
  'Bm7': { frets: ['x', 2, 4, 2, 3, 2], baseFret: 2 },
  'Bsus4': { frets: ['x', 2, 4, 4, 5, 2], baseFret: 2 },
};

// Convert Latin chord names (Sol, Re, Mim, Do, etc.) to Anglo (G, D, Em, C)
export function convertLatinToAngloChord(chord: string): string {
  let c = chord.trim();
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
      // Special handle: 'm' after Latin like 'Mim' -> 'Em', 'Solm' -> 'Gm'
      return CHORD_ROOTS_ANGLO[i] + rest;
    }
  }
  return c;
}

// Convert Anglo chord names to Latin (G -> Sol, Em -> Mim, D7 -> Re7)
export function convertAngloToLatinChord(chord: string): string {
  let c = chord.trim();
  c = c.replace(/^\[|\]$/g, '').replace(/^\*/, '').replace(/^\(|\)$/g, '');

  const slashIdx = c.indexOf('/');
  if (slashIdx !== -1) {
    const main = convertAngloToLatinChord(c.slice(0, slashIdx));
    const bass = convertAngloToLatinChord(c.slice(slashIdx + 1));
    return `${main}/${bass}`;
  }

  for (let i = 0; i < CHORD_ROOTS_ANGLO.length; i++) {
    const anglo = CHORD_ROOTS_ANGLO[i];
    if (c.toUpperCase().startsWith(anglo.toUpperCase())) {
      const rest = c.slice(anglo.length);
      return CHORD_ROOTS_LATIN[i] + rest;
    }
  }
  return c;
}

// Convert whole text between Latin and Anglo notation
export function convertSongNotation(text: string, targetNotation: 'anglo' | 'latin'): string {
  if (!text) return text;
  const lines = text.split('\n');

  return lines
    .map(line => {
      // Bracketed chords [Sol] -> [G] or [G] -> [Sol]
      let res = line.replace(/\[([A-Za-z0-9#b/]+)\]/g, (_, chord) => {
        const converted =
          targetNotation === 'anglo'
            ? convertLatinToAngloChord(chord)
            : convertAngloToLatinChord(chord);
        return `[${converted}]`;
      });

      // Asterisk chords *Sol -> *G
      res = res.replace(/\*([A-Za-z0-9#b/]+)/g, (_, chord) => {
        const converted =
          targetNotation === 'anglo'
            ? convertLatinToAngloChord(chord)
            : convertAngloToLatinChord(chord);
        return `*${converted}`;
      });

      return res;
    })
    .join('\n');
}

// Extract list of unique chords present in the song text
export function extractUniqueChords(text: string): string[] {
  if (!text) return [];
  const chordsSet = new Set<string>();

  // Bracketed [G]
  const bracketMatches = text.match(/\[([A-Za-z0-9#b/]+)\]/g);
  if (bracketMatches) {
    bracketMatches.forEach(m => {
      const c = m.slice(1, -1).trim();
      if (c && !c.toLowerCase().includes('coro') && !c.toLowerCase().includes('estrofa') && !c.toLowerCase().includes('intro')) {
        chordsSet.add(c);
      }
    });
  }

  // Asterisk *G
  const starMatches = text.match(/\*([A-Za-z0-9#b/]+)/g);
  if (starMatches) {
    starMatches.forEach(m => chordsSet.add(m.slice(1).trim()));
  }

  return Array.from(chordsSet);
}

// Get guitar diagram data for any chord (Latin or Anglo)
export function getChordDiagram(chordName: string): ChordDiagramData | null {
  if (!chordName) return null;
  const clean = chordName.trim().replace(/^\[|\]$/g, '').replace(/^\*/, '');
  const angloChord = convertLatinToAngloChord(clean);

  // Exact lookup
  if (GUITAR_CHORD_DB[angloChord]) {
    const raw = GUITAR_CHORD_DB[angloChord];
    return {
      name: clean,
      guitar: {
        frets: raw.frets,
        fingers: raw.fingers,
        baseFret: raw.baseFret || 1,
      },
    };
  }

  // Fallback: match root + basic quality (e.g. F#m7 -> F#m or F#)
  const rootMatch = angloChord.match(/^([A-G][#b]?)(m|min|maj7|7|sus4)?/i);
  if (rootMatch) {
    const root = rootMatch[1];
    const qual = rootMatch[2] || '';
    const simplified = `${root}${qual.startsWith('m') && !qual.startsWith('maj') ? 'm' : ''}`;
    if (GUITAR_CHORD_DB[simplified]) {
      const raw = GUITAR_CHORD_DB[simplified];
      return {
        name: clean,
        guitar: {
          frets: raw.frets,
          fingers: raw.fingers,
          baseFret: raw.baseFret || 1,
        },
      };
    }
  }

  return null;
}
