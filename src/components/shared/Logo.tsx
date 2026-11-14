import { useId } from 'react';

/** App logo: same artwork as public/favicon.svg. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}bg`} x1="8" y1="0" x2="56" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#60A5FA" />
          <stop offset="0.45" stopColor="#2563EB" />
          <stop offset="1" stopColor="#1E40AF" />
        </linearGradient>
        <linearGradient id={`${id}gl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}tile`}>
          <rect width="64" height="64" rx="16" />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}bg)`} />
      <g clipPath={`url(#${id}tile)`}>
        <ellipse cx="32" cy="-6" rx="46" ry="30" fill={`url(#${id}gl)`} />
      </g>
      <circle cx="32" cy="32" r="19" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="5" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="86 120" transform="rotate(-90 32 32)" />
      <path d="M32 21.5V32l6.5 4" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="2.4" fill="#fff" />
    </svg>
  );
}
