import React from 'react';

interface DoveLogoProps {
  className?: string;
  size?: number;
}

export const DoveLogo: React.FC<DoveLogoProps> = ({ className = 'w-9 h-9', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative flex-shrink-0 flex items-center justify-center ${className}`} style={style}>
      <svg
        viewBox="0 0 400 320"
        className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(197,160,89,0.35)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="doveGoldGradMain" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stop-color="#f5e2a2" />
            <stop offset="30%" stop-color="#d4af37" />
            <stop offset="70%" stop-color="#b8860b" />
            <stop offset="100%" stop-color="#7a5516" />
          </linearGradient>
          <linearGradient id="doveWingGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fdf4be" />
            <stop offset="45%" stop-color="#d8b248" />
            <stop offset="100%" stop-color="#93681a" />
          </linearGradient>
          <linearGradient id="doveWingGrad2" x1="10%" y1="90%" x2="90%" y2="10%">
            <stop offset="0%" stop-color="#8c6114" />
            <stop offset="50%" stop-color="#c99e38" />
            <stop offset="100%" stop-color="#f3dba0" />
          </linearGradient>
          <linearGradient id="doveTailGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#dfb651" />
            <stop offset="60%" stop-color="#b48220" />
            <stop offset="100%" stop-color="#754b0c" />
          </linearGradient>
        </defs>

        {/* Outer Left Wing Feather */}
        <path
          d="M 152 94
             C 142 125 152 175 190 220
             C 165 175 158 130 156 108
             C 155 101 153 96 152 94 Z"
          fill="url(#doveWingGrad1)"
        />

        {/* Inner Wing Body */}
        <path
          d="M 152 94
             C 172 135 210 182 245 220
             C 220 168 184 122 152 94 Z"
          fill="url(#doveGoldGradMain)"
        />

        {/* Head, Beak & Upper Torso */}
        <path
          d="M 232 98
             C 252 98 268 106 272 118
             C 273 124 268 132 260 142
             C 248 156 242 172 244 190
             C 246 208 238 226 220 242
             C 202 215 194 175 208 142
             C 216 122 224 104 232 98 Z"
          fill="url(#doveWingGrad2)"
        />

        {/* Swooping Tail / Lower Body */}
        <path
          d="M 128 214
             C 162 222 196 210 220 242
             C 192 258 156 250 128 214 Z"
          fill="url(#doveTailGrad)"
        />

        {/* Eye - Distinctive white dot */}
        <circle cx="255" cy="116" r="3.2" fill="#ffffff" />

        {/* Floating Golden Dot */}
        <circle cx="247" cy="242" r="6.5" fill="url(#doveGoldGradMain)" />
      </svg>
    </div>
  );
};
