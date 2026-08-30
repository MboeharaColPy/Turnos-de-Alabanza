import React from 'react';
import { ChordDiagramData, getChordDiagram } from '../utils/chordDiagrams';

interface GuitarChordDiagramProps {
  chordName: string;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
}

export const GuitarChordDiagram: React.FC<GuitarChordDiagramProps> = ({
  chordName,
  size = 'md',
  showTitle = true,
}) => {
  const diagram = getChordDiagram(chordName);

  const dimensions = {
    sm: { width: 90, height: 110, stringSpacing: 12, fretSpacing: 16, dotRadius: 4 },
    md: { width: 120, height: 145, stringSpacing: 16, fretSpacing: 22, dotRadius: 5.5 },
    lg: { width: 160, height: 190, stringSpacing: 22, fretSpacing: 30, dotRadius: 7 },
  }[size];

  if (!diagram) {
    return (
      <div className="flex flex-col items-center justify-center p-3 bg-[#0a0a0b] border border-[#1f1f23] rounded-xl text-center">
        {showTitle && <span className="font-bold text-[#c5a059] text-xs font-mono mb-1">{chordName}</span>}
        <span className="text-[10px] text-[#6b6b75] italic">Diagrama estándar</span>
      </div>
    );
  }

  const { frets, baseFret = 1 } = diagram.guitar;
  const numFrets = 4;
  const startX = 20;
  const startY = 32;
  const stringSpacing = dimensions.stringSpacing;
  const fretSpacing = dimensions.fretSpacing;
  const totalWidth = startX * 2 + stringSpacing * 5;
  const totalHeight = startY + fretSpacing * numFrets + 15;

  return (
    <div className="flex flex-col items-center bg-[#0d0d10] border border-[#232328] hover:border-[#c5a059]/40 rounded-xl p-2.5 shadow-md transition-all">
      {showTitle && (
        <span className="font-bold text-white text-xs font-mono tracking-wider mb-1 flex items-center gap-1">
          <span className="text-[#c5a059]">{chordName}</span>
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
            x2={startX + stringSpacing * 5 + 1}
            y2={startY}
            stroke="#c5a059"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        ) : (
          <>
            <line
              x1={startX}
              y1={startY}
              x2={startX + stringSpacing * 5}
              y2={startY}
              stroke="#44444e"
              strokeWidth={1.5}
            />
            {/* Base fret number text */}
            <text
              x={startX - 10}
              y={startY + fretSpacing * 0.7}
              fill="#c5a059"
              fontSize="10"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {baseFret}fr
            </text>
          </>
        )}

        {/* Fret Lines (horizontal) */}
        {Array.from({ length: numFrets + 1 }).map((_, fIdx) => {
          if (fIdx === 0 && baseFret === 1) return null;
          const y = startY + fIdx * fretSpacing;
          return (
            <line
              key={`fret-${fIdx}`}
              x1={startX}
              y1={y}
              x2={startX + stringSpacing * 5}
              y2={y}
              stroke="#2e2e36"
              strokeWidth={1}
            />
          );
        })}

        {/* Strings (vertical) */}
        {Array.from({ length: 6 }).map((_, sIdx) => {
          const x = startX + sIdx * stringSpacing;
          const isOuter = sIdx === 0 || sIdx === 5;
          return (
            <line
              key={`string-${sIdx}`}
              x1={x}
              y1={startY}
              x2={x}
              y2={startY + fretSpacing * numFrets}
              stroke="#4a4a55"
              strokeWidth={isOuter ? 1.2 : 0.8}
            />
          );
        })}

        {/* Markers: Open ('o'), Muted ('x'), or Fretted dots */}
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
                fontFamily="sans-serif"
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
                cy={startY - 8}
                r={3}
                fill="none"
                stroke="#c5a059"
                strokeWidth={1.5}
              />
            );
          }

          // Fretted note
          const fretNum = Number(fretVal);
          const relativeFret = baseFret > 1 ? fretNum - baseFret + 1 : fretNum;

          if (relativeFret >= 1 && relativeFret <= numFrets) {
            const dotY = startY + (relativeFret - 0.5) * fretSpacing;
            return (
              <g key={`dot-${sIdx}`}>
                <circle
                  cx={x}
                  cy={dotY}
                  r={dimensions.dotRadius}
                  fill="#c5a059"
                  stroke="#0a0a0b"
                  strokeWidth={1.5}
                />
              </g>
            );
          }

          return null;
        })}
      </svg>
    </div>
  );
};
