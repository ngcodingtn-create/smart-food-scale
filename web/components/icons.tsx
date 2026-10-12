import type { SVGProps } from 'react';

/**
 * The site's whole icon set, drawn on a 24 × 24 grid with a shared stroke.
 *
 * Inline SVG rather than an icon package: the set is small, it inherits
 * `currentColor` so it follows the theme, and it adds no dependency.
 */
const PATHS = {
  // --- navigation -----------------------------------------------------------
  home: (
    <>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  clipboard: (
    <>
      <path d="M8.5 4.5H6.5a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V5.5a1 1 0 0 0-1-1h-2" />
      <rect x="8.5" y="3" width="7" height="3.5" rx="1" />
      <path d="M9 11.5h6M9 15.5h6" />
    </>
  ),
  nodes: (
    <>
      <rect x="3" y="3.5" width="7" height="6" rx="1.2" />
      <rect x="14" y="3.5" width="7" height="6" rx="1.2" />
      <rect x="8.5" y="14.5" width="7" height="6" rx="1.2" />
      <path d="M10 6.5h4M17.5 9.5V11a1 1 0 0 1-1 1H12v2.5" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2.8 20 7.2v9.6l-8 4.4-8-4.4V7.2z" />
      <path d="m4 7.2 8 4.4 8-4.4M12 11.6v9.6" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.6" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.8 19.5h18.4z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </>
  ),
  server: (
    <>
      <rect x="4" y="4" width="16" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="16" height="6.5" rx="1.5" />
      <path d="M7.5 7.2v.1M7.5 16.7v.1" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
    </>
  ),
  // The brand mark: a weighing dial — arc, needle, base.
  scale: (
    <>
      <path d="M5 15a7 7 0 0 1 14 0" />
      <path d="m12 15 3.2-4.4" />
      <path d="M4 19h16" />
    </>
  ),

  // --- interface ------------------------------------------------------------
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.8" />
      <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8.5 20h7M12 16v4" />
    </>
  ),
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  external: (
    <>
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,

  // --- callouts -------------------------------------------------------------
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.4 2.8 2.8L16 9.6" />
    </>
  ),
  stop: (
    <>
      <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z" />
      <path d="M12 7.5v5.5M12 16.2v.1" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  ...props
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
