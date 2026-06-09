import React from 'react';

export const Logo = ({ size = 48, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Soft Glow */}
      <rect width="100" height="100" rx="35" fill="url(#aestheticGradient)" />
      <circle cx="50" cy="50" r="40" fill="url(#glowGradient)" opacity="0.6" filter="url(#blur)" />

      {/* Aesthetic Abstract Heart / Spark */}
      <path 
        d="M50 75C50 75 22 55 22 38C22 28.5 29 23 37 23C42 23 47 26 50 31C53 26 58 23 63 23C71 23 78 28.5 78 38C78 55 50 75 50 75Z" 
        fill="#FFFFFF" 
        style={{ dropShadow: '0px 10px 20px rgba(0,0,0,0.1)' }}
      />
      <circle cx="65" cy="30" r="4" fill="#FFEAA7" opacity="0.8" />
      <circle cx="28" cy="45" r="2" fill="#FFEAA7" opacity="0.6" />

      {/* Defs for gradients & filters */}
      <defs>
        <linearGradient id="aestheticGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC3A0" /> {/* Soft Peach */}
          <stop offset="1" stopColor="#FFAFBD" /> {/* Soft Pink */}
        </linearGradient>
        <radialGradient id="glowGradient" cx="50" cy="50" r="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E0BBE4" /> {/* Soft Lavender */}
          <stop offset="1" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
    </svg>
  );
};
