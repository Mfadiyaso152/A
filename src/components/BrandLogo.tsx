import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoTrackGradLight" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="70%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>

      {/* Outer frame background squircle with subtle drop shadow */}
      <rect width="100" height="100" rx="22" fill="#0F172A" />

      {/* Perspective Ground Grid lines */}
      <line x1="16" y1="80" x2="84" y2="80" stroke="#334155" strokeWidth="1.5" />
      <line x1="26" y1="68" x2="74" y2="68" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="36" y1="58" x2="64" y2="58" stroke="#334155" strokeWidth="1.5" strokeDasharray="2 2" />

      {/* Perspective Track Corridor */}
      <polygon points="36,86 64,86 55,24 45,24" fill="#0D9488" fillOpacity="0.25" />

      {/* Main Ground Line Vector */}
      <line x1="50" y1="86" x2="50" y2="20" stroke="url(#logoTrackGradLight)" strokeWidth="6" strokeLinecap="round" />
      <line x1="50" y1="86" x2="50" y2="20" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />

      {/* Target Crosshair & Camera Brackets */}
      <path
        d="M 22 36 L 22 22 L 36 22"
        stroke="#14B8A6"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 64 22 L 78 22 L 78 36"
        stroke="#14B8A6"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 22 64 L 22 78 L 36 78"
        stroke="#38BDF8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 64 78 L 78 78 L 78 64"
        stroke="#38BDF8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Target Lock Point */}
      <circle cx="50" cy="52" r="3.5" fill="#14B8A6" stroke="#FFFFFF" strokeWidth="1.5" />
    </svg>
  );
};
