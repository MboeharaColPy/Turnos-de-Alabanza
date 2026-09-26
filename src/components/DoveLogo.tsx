import React from 'react';

interface MusicLogoProps {
  className?: string;
  size?: number;
}

export const DoveLogo: React.FC<MusicLogoProps> = ({ className = 'w-9 h-9', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative flex-shrink-0 flex items-center justify-center ${className}`} style={style}>
      <svg
        viewBox="0 0 400 320"
        className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(197,160,89,0.4)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="musicLogoGoldComp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff5cc" />
            <stop offset="30%" stopColor="#eec76b" />
            <stop offset="70%" stopColor="#c5a059" />
            <stop offset="100%" stopColor="#805d15" />
          </linearGradient>
          <linearGradient id="musicLogoGoldComp2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffae0" />
            <stop offset="50%" stopColor="#dfb758" />
            <stop offset="100%" stopColor="#9a7122" />
          </linearGradient>
          <filter id="musicLogoGlowComp" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g filter="url(#musicLogoGlowComp)">
          {/* Staff lines background arc */}
          <path d="M 75 160 C 130 110, 270 110, 325 160" stroke="url(#musicLogoGoldComp)" strokeWidth="2" strokeOpacity="0.35" strokeDasharray="4 6" />
          <path d="M 85 180 C 140 130, 260 130, 315 180" stroke="url(#musicLogoGoldComp)" strokeWidth="2" strokeOpacity="0.25" strokeDasharray="4 6" />

          {/* Beamed Eighth Notes (Corcheas de Alabanza) */}
          {/* Main Beam */}
          <path d="M 220 95 L 295 68 L 295 87 L 220 114 Z" fill="url(#musicLogoGoldComp)" />
          {/* Secondary Beam */}
          <path d="M 220 120 L 295 93 L 295 104 L 220 131 Z" fill="url(#musicLogoGoldComp2)" opacity="0.9" />

          {/* Note Stem 1 */}
          <rect x="220" y="105" width="9.5" height="110" rx="4.7" fill="url(#musicLogoGoldComp)" />
          {/* Note Head 1 */}
          <ellipse cx="206" cy="215" rx="23" ry="16" transform="rotate(-25 206 215)" fill="url(#musicLogoGoldComp)" />

          {/* Note Stem 2 */}
          <rect x="285" y="80" width="9.5" height="110" rx="4.7" fill="url(#musicLogoGoldComp)" />
          {/* Note Head 2 */}
          <ellipse cx="271" cy="190" rx="21" ry="15" transform="rotate(-25 271 190)" fill="url(#musicLogoGoldComp)" />

          {/* Left Harmonic Treble Clef (Clave de Sol) */}
          <path
            d="M 158 270
               C 143 270 130 258 130 240
               C 130 222 145 212 160 218
               C 168 221 173 229 173 238
               C 173 253 162 260 150 260
               M 158 270
               L 158 85
               C 158 48 176 32 186 32
               C 195 32 199 44 194 64
               C 188 88 165 132 150 170
               C 128 224 98 244 98 198
               C 98 148 146 125 178 148
               C 203 167 207 202 188 228
               C 173 248 143 248 130 235"
            fill="none"
            stroke="url(#musicLogoGoldComp)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="158" cy="270" r="10" fill="url(#musicLogoGoldComp)" />

          {/* Top Sparkle */}
          <path d="M 186 16 Q 186 28 194 28 Q 186 28 186 40 Q 186 28 178 28 Q 186 28 186 16 Z" fill="#ffffff" />
          <circle cx="186" cy="28" r="3.2" fill="url(#musicLogoGoldComp)" />
        </g>
      </svg>
    </div>
  );
};
