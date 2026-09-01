import React from 'react';
import {
  InstrumentType,
  getChordDiagramForInstrument,
} from '../utils/chordDiagrams';

interface ChordDiagramProps {
  chordName: string;
  instrument?: InstrumentType;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export const GuitarChordDiagram: React.FC<ChordDiagramProps> = ({
  chordName,
  instrument = 'guitar',
  size = 'md',
  showTitle = true,
}) => {
  const safeInstrument: InstrumentType = (instrument as InstrumentType) || 'guitar';
  const diagram = getChordDiagramForInstrument(chordName, safeInstrument);

  if (!diagram) {
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-[#0a0a0b] dark:bg-[#0a0a0b] bg-slate-900 border border-[#232328] rounded-xl text-center">
        {showTitle && <span className="font-bold text-[#c5a059] text-xs font-mono mb-1">{chordName}</span>}
        <span className="text-[10px] text-[#6b6b75] italic">Diagrama</span>
      </div>
    );
  }

  // Render Piano
  if (instrument === 'piano' && diagram.piano) {
    const { root, notes, keys } = diagram.piano;
    // Octave piano keys: 7 white keys (0, 2, 4, 5, 7, 9, 11)
    const whiteKeys = [
      { note: 'C', semitone: 0 },
      { note: 'D', semitone: 2 },
      { note: 'E', semitone: 4 },
      { note: 'F', semitone: 5 },
      { note: 'G', semitone: 7 },
      { note: 'A', semitone: 9 },
      { note: 'B', semitone: 11 },
    ];
    // 5 black keys
    const blackKeys = [
      { note: 'C#', semitone: 1, leftOffset: 16 },
      { note: 'D#', semitone: 3, leftOffset: 38 },
      { note: 'F#', semitone: 6, leftOffset: 82 },
      { note: 'G#', semitone: 8, leftOffset: 104 },
      { note: 'A#', semitone: 10, leftOffset: 126 },
    ];

    return (
      <div className="flex flex-col items-center bg-[#0d0d10] dark:bg-[#0d0d10] border border-[#232328] rounded-xl p-3 shadow-md">
        {showTitle && (
          <div className="flex items-center justify-between w-full mb-2 px-1">
            <span className="font-bold text-[#c5a059] text-xs font-mono tracking-wider">{chordName}</span>
            <span className="text-[10px] font-mono text-[#a0a0ab]">{notes.join(' - ')}</span>
          </div>
        )}
        <div className="relative w-[154px] h-[75px] bg-[#141418] rounded-md p-1 border border-[#2a2a32] select-none flex">
          {/* White keys */}
          {whiteKeys.map((k) => {
            const isPressed = keys.includes(k.semitone);
            return (
              <div
                key={k.note}
                className={`relative flex-1 h-full rounded-b-sm border-r border-[#222228] last:border-r-0 flex flex-col justify-end items-center pb-1 text-[9px] font-bold ${
                  isPressed
                    ? 'bg-[#c5a059] text-black shadow-inner'
                    : 'bg-white text-slate-700'
                }`}
              >
                {isPressed && <span className="w-1.5 h-1.5 rounded-full bg-black mb-0.5" />}
                <span className="leading-none">{k.note}</span>
              </div>
            );
          })}

          {/* Black keys */}
          {blackKeys.map((k) => {
            const isPressed = keys.includes(k.semitone);
            return (
              <div
                key={k.note}
                style={{ left: `${k.leftOffset}px` }}
                className={`absolute top-1 w-[15px] h-[45px] rounded-b-sm z-10 flex flex-col justify-end items-center pb-0.5 text-[8px] font-bold ${
                  isPressed
                    ? 'bg-[#f59e0b] text-black ring-1 ring-white'
                    : 'bg-[#18181b] text-slate-300 border-x border-b border-[#0a0a0b]'
                }`}
              >
                {isPressed && <span className="w-1 h-1 rounded-full bg-black mb-0.5" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Render Ukulele or Bass or Guitar (fretboard SVG)
  const isUke = instrument === 'ukulele';
  const isBass = instrument === 'bass';
  const numStrings = isUke || isBass ? 4 : 6;
  const frets = isUke
    ? diagram.ukulele?.frets || [0, 0, 0, 0]
    : isBass
    ? diagram.bass?.frets || [0, 'x', 'x', 'x']
    : diagram.guitar?.frets || ['x', 'x', 0, 0, 0, 0];
  const baseFret = isUke
    ? diagram.ukulele?.baseFret || 1
    : isBass
    ? diagram.bass?.baseFret || 1
    : diagram.guitar?.baseFret || 1;

  const numFrets = 4;
  const startX = 18;
  const startY = 28;
  const stringSpacing = 16;
  const fretSpacing = 20;
  const totalWidth = startX * 2 + stringSpacing * (numStrings - 1);
  const totalHeight = startY + fretSpacing * numFrets + 12;

  const stringLabels = isUke
    ? ['G', 'C', 'E', 'A']
    : isBass
    ? ['E', 'A', 'D', 'G']
    : ['E', 'A', 'D', 'G', 'B', 'e'];

  return (
    <div className="flex flex-col items-center bg-[#0d0d10] dark:bg-[#0d0d10] border border-[#232328] hover:border-[#c5a059]/40 rounded-xl p-2.5 shadow-md transition-all">
      {showTitle && (
        <span className="font-bold text-[#c5a059] text-xs font-mono tracking-wider mb-1">
          {chordName}
        </span>
      )}

      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="select-none"
      >
        {/* Nut (thick top bar if fret 1) */}
        {baseFret === 1 ? (
          <line
            x1={startX - 1}
            y1={startY}
            x2={startX + stringSpacing * (numStrings - 1) + 1}
            y2={startY}
            stroke="#c5a059"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ) : (
          <>
            <line
              x1={startX}
              y1={startY}
              x2={startX + stringSpacing * (numStrings - 1)}
              y2={startY}
              stroke="#44444e"
              strokeWidth={1.5}
            />
            <text
              x={startX - 9}
              y={startY + fretSpacing * 0.7}
              fill="#c5a059"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {baseFret}fr
            </text>
          </>
        )}

        {/* Fret Lines */}
        {Array.from({ length: numFrets + 1 }).map((_, fIdx) => {
          if (fIdx === 0 && baseFret === 1) return null;
          const y = startY + fIdx * fretSpacing;
          return (
            <line
              key={`fret-${fIdx}`}
              x1={startX}
              y1={y}
              x2={startX + stringSpacing * (numStrings - 1)}
              y2={y}
              stroke="#2e2e36"
              strokeWidth={1}
            />
          );
        })}

        {/* Strings */}
        {Array.from({ length: numStrings }).map((_, sIdx) => {
          const x = startX + sIdx * stringSpacing;
          return (
            <line
              key={`string-${sIdx}`}
              x1={x}
              y1={startY}
              x2={x}
              y2={startY + fretSpacing * numFrets}
              stroke="#4a4a55"
              strokeWidth={1}
            />
          );
        })}

        {/* Frets markers */}
        {frets.map((fretVal, sIdx) => {
          const x = startX + sIdx * stringSpacing;

          if (fretVal === 'x') {
            return (
              <text
                key={`mute-${sIdx}`}
                x={x}
                y={startY - 6}
                fill="#ef4444"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
              >
                ×
              </text>
            );
          }

          if (fretVal === 0) {
            return (
              <circle
                key={`open-${sIdx}`}
                cx={x}
                cy={startY - 7}
                r={3}
                fill="none"
                stroke="#c5a059"
                strokeWidth={1.5}
              />
            );
          }

          const fretNum = Number(fretVal);
          const relativeFret = baseFret > 1 ? fretNum - baseFret + 1 : fretNum;

          if (relativeFret >= 1 && relativeFret <= numFrets) {
            const dotY = startY + (relativeFret - 0.5) * fretSpacing;
            return (
              <circle
                key={`dot-${sIdx}`}
                cx={x}
                cy={dotY}
                r={5}
                fill="#c5a059"
                stroke="#0a0a0b"
                strokeWidth={1.5}
              />
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};
