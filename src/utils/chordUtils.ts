// Chord detection, parsing, highlighting, and transposition utilities in American notation

export const CHORD_ROOTS_ANGLO = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];
export const CHORD_ROOTS_ANGLO_FLATS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

export const CHORD_ROOTS_LATIN = [
  'Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'
];
export const CHORD_ROOTS_LATIN_FLATS = [
  'Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'
];

export const ALL_STANDARD_KEYS = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B',
  'Am', 'A#m', 'Bbm', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Abm'
];

// Helper to find root index in semitones (0 to 11)
export function getRootIndex(root: string): { index: number; system: 'anglo' | 'latin'; isFlat: boolean } | null {
  const clean = (root || '').trim();
  // Check Latin first (Sol, Do, Re, Mi, Fa, La, Si)
  for (let i = 0; i < CHORD_ROOTS_LATIN.length; i++) {
    if (clean.toLowerCase() === CHORD_ROOTS_LATIN[i].toLowerCase()) {
      return { index: i, system: 'latin', isFlat: false };
    }
  }
  for (let i = 0; i < CHORD_ROOTS_LATIN_FLATS.length; i++) {
    if (clean.toLowerCase() === CHORD_ROOTS_LATIN_FLATS[i].toLowerCase()) {
      return { index: i, system: 'latin', isFlat: true };
    }
  }

  // Check Anglo (C, D, E, F, G, A, B)
  for (let i = 0; i < CHORD_ROOTS_ANGLO.length; i++) {
    if (clean.toUpperCase() === CHORD_ROOTS_ANGLO[i].toUpperCase()) {
      return { index: i, system: 'anglo', isFlat: false };
    }
  }
  for (let i = 0; i < CHORD_ROOTS_ANGLO_FLATS.length; i++) {
    if (clean.toUpperCase() === CHORD_ROOTS_ANGLO_FLATS[i].toUpperCase()) {
      return { index: i, system: 'anglo', isFlat: true };
    }
  }

  return null;
}

// Regex to capture a single chord (e.g. C#m7, Gmaj7, D/F#, Em, A2, etc.)
export const CHORD_REGEX = /^(?:[*([]\s*)?([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?([mM]|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?)?(?:\s*[*)\]])?$/i;

export function isSingleChord(token: string): boolean {
  if (!token || token.trim().length === 0) return false;
  const t = token.trim();
  if (t === '|' || t === '/' || t === '//' || t === '%' || t === ':') return false;
  if (t.startsWith('*') && t.length > 1) return true;
  if (t.startsWith('[') && t.endsWith(']') && !isSectionHeader(t)) return true;
  if (t.startsWith('(') && t.endsWith(')')) {
    const inside = t.slice(1, -1).trim();
    if (inside.split(/\s+/).every(isSingleChord)) return true;
  }
  return CHORD_REGEX.test(t);
}

export function isSectionHeader(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (t.startsWith('[') && t.endsWith(']')) {
    return true;
  }
  return (
    t.startsWith('intro') ||
    t.startsWith('verso') ||
    t.startsWith('estrofa') ||
    t.startsWith('coro') ||
    t.startsWith('puente') ||
    t.startsWith('outro') ||
    t.startsWith('final') ||
    t.startsWith('solo') ||
    t.startsWith('interludio') ||
    t.startsWith('pre-coro') ||
    t.startsWith('precoro') ||
    t.startsWith('parte')
  );
}

export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSectionHeader(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    if (isSingleChord(token) || token === '|' || token === '/' || token === '-' || token === '//' || token === ':') {
      chordCount++;
    }
  }

  return chordCount >= Math.ceil(tokens.length * 0.6);
}

// Convert chord to American notation and transpose
export function transposeSingleChord(chord: string, semitones: number): string {
  if (!chord) return chord;

  let prefix = '';
  let suffix = '';
  let core = chord.trim();

  if (core.startsWith('*')) {
    prefix = '';
    core = core.slice(1);
  } else if (core.startsWith('[') && core.endsWith(']')) {
    prefix = '';
    suffix = '';
    core = core.slice(1, -1);
  } else if (core.startsWith('(') && core.endsWith(')')) {
    prefix = '';
    suffix = '';
    core = core.slice(1, -1);
  }

  // Check for bass note (e.g. G/B)
  const slashParts = core.split('/');
  const mainPart = slashParts[0];
  const bassPart = slashParts[1] || null;

  const match = mainPart.match(/^([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?(.*)$/i);
  if (!match) return chord;

  const rootText = (match[1] + (match[2] || '')).trim();
  const quality = match[3] || '';

  const rootInfo = getRootIndex(rootText);
  if (!rootInfo) return chord;

  let newIndex = (rootInfo.index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Always use Anglo/American notation
  const newRoot = rootInfo.isFlat ? CHORD_ROOTS_ANGLO_FLATS[newIndex] : CHORD_ROOTS_ANGLO[newIndex];

  let transposedBass = '';
  if (bassPart) {
    const bassMatch = bassPart.match(/^([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?(.*)$/i);
    if (bassMatch) {
      const bassRootText = (bassMatch[1] + (bassMatch[2] || '')).trim();
      const bassQuality = bassMatch[3] || '';
      const bassInfo = getRootIndex(bassRootText);
      if (bassInfo) {
        let newBassIndex = (bassInfo.index + semitones) % 12;
        if (newBassIndex < 0) newBassIndex += 12;
        const newBassRoot = bassInfo.isFlat ? CHORD_ROOTS_ANGLO_FLATS[newBassIndex] : CHORD_ROOTS_ANGLO[newBassIndex];
        transposedBass = '/' + newBassRoot + bassQuality;
      } else {
        transposedBass = '/' + bassPart;
      }
    } else {
      transposedBass = '/' + bassPart;
    }
  }

  return `${prefix}${newRoot}${quality}${transposedBass}${suffix}`;
}

export function transposeSongText(fullText: string, semitones: number): string {
  if (!fullText) return '';

  const lines = fullText.split('\n');
  const transposedLines = lines.map(line => {
    if (!line.trim() || isSectionHeader(line)) return line;

    // Handle bracketed chords [G] -> A
    let result = line.replace(/\[([A-Za-z0-9#b/]+)\]/g, (match, chord) => {
      return transposeSingleChord(chord, semitones);
    });

    // Handle asterisk chords *G -> A
    result = result.replace(/\*([A-Za-z0-9#b/]+)/g, (match, chord) => {
      return transposeSingleChord(chord, semitones);
    });

    // If whole line is chords, transpose word by word
    if (isChordLine(result)) {
      result = result.replace(/([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?([mM]|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?)?/gi, (match) => {
        return transposeSingleChord(match, semitones);
      });
    }

    return result;
  });

  return transposedLines.join('\n');
}

/**
 * Calculate capo transpose information:
 * If baseKey is 'G' and capo is 2, the shape played is 'F' (2 semitones down)
 * sounding pitch remains 'G'.
 */
export function getCapoTransposedKey(baseKey: string, capoFret: number): { fingeredKey: string; soundingKey: string } {
  if (!baseKey) return { fingeredKey: '', soundingKey: '' };
  if (capoFret <= 0) return { fingeredKey: baseKey, soundingKey: baseKey };

  const fingeredKey = transposeSingleChord(baseKey, -capoFret);
  return {
    fingeredKey,
    soundingKey: baseKey,
  };
}

export interface LyricToken {
  text: string;
  isChord: boolean;
  isSectionHeader?: boolean;
}

export function parseLyricsLineTokens(line: string): LyricToken[] {
  if (!line) return [{ text: '', isChord: false }];

  if (isSectionHeader(line)) {
    return [{ text: line, isChord: false, isSectionHeader: true }];
  }

  if (isChordLine(line)) {
    const tokens: LyricToken[] = [];
    const regex = /(\s+)|([^\s]+)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1]) {
        tokens.push({ text: match[1], isChord: false });
      } else if (match[2]) {
        tokens.push({ text: match[2], isChord: isSingleChord(match[2]) });
      }
    }
    return tokens;
  }

  // Mixed inline chords
  const tokens: LyricToken[] = [];
  const regex = /(\[[^\]]+\])|(\*[A-Za-z0-9#b/]+)|(\([A-Za-z0-9#b/\s]+\))|([^[*(]+)/g;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match[1]) {
      const inside = match[1].slice(1, -1);
      tokens.push({ text: inside, isChord: true });
    } else if (match[2]) {
      tokens.push({ text: match[2].slice(1), isChord: true });
    } else if (match[3]) {
      const inside = match[3].slice(1, -1).trim();
      if (inside.split(/\s+/).every(isSingleChord)) {
        tokens.push({ text: inside, isChord: true });
      } else {
        tokens.push({ text: match[3], isChord: false });
      }
    } else if (match[4]) {
      tokens.push({ text: match[4], isChord: false });
    }
  }

  return tokens.length > 0 ? tokens : [{ text: line, isChord: false }];
}
