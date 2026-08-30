// Chord detection, parsing, highlighting, and transposition utilities

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

// Helper to find root index in semitones (0 to 11)
function getRootIndex(root: string): { index: number; system: 'anglo' | 'latin'; isFlat: boolean } | null {
  const clean = root.trim();
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

// Regex to capture a single chord (e.g. C#m7, Solmaj7, D/F#, *Sol, [Em])
export const CHORD_REGEX = /^(?:[*([]\s*)?([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?([mM]|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?)?(?:\s*[*)\]])?$/i;

export function isSingleChord(token: string): boolean {
  if (!token || token.trim().length === 0) return false;
  const t = token.trim();
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
    const inner = t.slice(1, -1).trim();
    return (
      inner.startsWith('intro') ||
      inner.startsWith('verso') ||
      inner.startsWith('estrofa') ||
      inner.startsWith('coro') ||
      inner.startsWith('puente') ||
      inner.startsWith('outro') ||
      inner.startsWith('final') ||
      inner.startsWith('solo') ||
      inner.startsWith('interludio') ||
      inner.startsWith('pre-coro') ||
      inner.startsWith('precoro')
    );
  }
  return false;
}

export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (isSectionHeader(trimmed)) return false;

  // If line is enclosed in parentheses like (Sol Re Mim Do)
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return true;

  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    if (isSingleChord(token) || token === '|' || token === '/' || token === '-' || token === '//' || token === ':') {
      chordCount++;
    }
  }

  return chordCount >= Math.ceil(tokens.length * 0.7);
}

export function transposeSingleChord(chord: string, semitones: number): string {
  if (semitones === 0 || !chord) return chord;

  // Extract prefixes / suffixes like [ ], *, ( )
  let prefix = '';
  let suffix = '';
  let core = chord.trim();

  if (core.startsWith('*')) {
    prefix = '*';
    core = core.slice(1);
  } else if (core.startsWith('[') && core.endsWith(']')) {
    prefix = '[';
    suffix = ']';
    core = core.slice(1, -1);
  } else if (core.startsWith('(') && core.endsWith(')')) {
    prefix = '(';
    suffix = ')';
    core = core.slice(1, -1);
  }

  // Check for bass note (e.g. G/B or Sol/Si)
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

  let newRoot = '';
  if (rootInfo.system === 'latin') {
    newRoot = rootInfo.isFlat ? CHORD_ROOTS_LATIN_FLATS[newIndex] : CHORD_ROOTS_LATIN[newIndex];
  } else {
    newRoot = rootInfo.isFlat ? CHORD_ROOTS_ANGLO_FLATS[newIndex] : CHORD_ROOTS_ANGLO[newIndex];
  }

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
        const newBassRoot = bassInfo.system === 'latin'
          ? (bassInfo.isFlat ? CHORD_ROOTS_LATIN_FLATS[newBassIndex] : CHORD_ROOTS_LATIN[newBassIndex])
          : (bassInfo.isFlat ? CHORD_ROOTS_ANGLO_FLATS[newBassIndex] : CHORD_ROOTS_ANGLO[newBassIndex]);
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
  if (semitones === 0 || !fullText) return fullText;

  const lines = fullText.split('\n');
  const transposedLines = lines.map(line => {
    if (!line.trim() || isSectionHeader(line)) return line;

    // Replace bracketed chords [G] -> [A]
    let result = line.replace(/\[([A-Za-z0-9#b/]+)\]/g, (match, chord) => {
      return `[${transposeSingleChord(chord, semitones)}]`;
    });

    // Replace asterisk chords *G -> *A
    result = result.replace(/\*([A-Za-z0-9#b/]+)/g, (match, chord) => {
      return `*${transposeSingleChord(chord, semitones)}`;
    });

    // Replace parenthesized chords (G) -> (A) or line chords if the entire line is a chord line
    if (isChordLine(result)) {
      result = result.replace(/([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?([mM]|maj|min|dim|aug|sus[24]?|add\d+|\d+)*(?:\/([A-Ga-g]|Do|Re|Mi|Fa|Sol|La|Si)(#|b|♯|♭)?)?/gi, (match) => {
        return transposeSingleChord(match, semitones);
      });
    }

    return result;
  });

  return transposedLines.join('\n');
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
    // Entire line is treated with chords highlighted
    const tokens: LyricToken[] = [];
    const regex = /(\s+)|([^\s]+)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match[1]) {
        // whitespace
        tokens.push({ text: match[1], isChord: false });
      } else if (match[2]) {
        tokens.push({ text: match[2], isChord: isSingleChord(match[2]) });
      }
    }
    return tokens;
  }

  // Mixed inline chord line like: "Cuan grande es [Sol] Dios, cantale [Re] cuan grande..." or "*Sol Dios"
  const tokens: LyricToken[] = [];
  // Match [chord] or *chord or (chord)
  const regex = /(\[[^\]]+\])|(\*[A-Za-z0-9#b/]+)|(\([A-Za-z0-9#b/\s]+\))|([^[*(]+)/g;
  let match;

  while ((match = regex.exec(line)) !== null) {
    if (match[1]) {
      // [chord]
      const inside = match[1].slice(1, -1);
      tokens.push({ text: inside, isChord: true });
    } else if (match[2]) {
      // *chord
      tokens.push({ text: match[2].slice(1), isChord: true });
    } else if (match[3]) {
      // (chord)
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
