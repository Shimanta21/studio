import React from 'react';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 150 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="StockPilot logo"
    >
      <g className="group" fill="currentColor">
        <path d="M10 10 L10 30 L20 30 L20 20 L30 20 L30 10 Z" fillOpacity="0.8" />
        <rect x="0" y="0" width="15" height="15" rx="2" className="transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1" />
        <rect x="18" y="18" width="15" height="15" rx="2" className="transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
      </g>
      <text x="40" y="28" fontFamily="'Inter', sans-serif" fontSize="24" fontWeight="bold" fill="currentColor">
        StockPilot
      </text>
    </svg>
  );
}
