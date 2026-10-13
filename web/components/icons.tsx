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
  route: (
    <>
      <circle cx="6" cy="18.5" r="2" />
      <circle cx="18" cy="5.5" r="2" />
      <path d="M8 18.5h6.5a3 3 0 0 0 0-6h-5a3 3 0 0 1 0-6H16" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3.5v4M15 3.5v4" />
      <path d="M6.5 7.5h11V11a5.5 5.5 0 0 1-11 0z" />
      <path d="M12 16.5v4" />
    </>
  ),
  scope: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M6 12h2.5l1.5-4 3 8 1.5-4H18" />
    </>
  ),
  toolbox: (
    <>
      <path d="M3.5 9.5h17V19a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
      <path d="M8.5 9.5v-3a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v3" />
      <path d="M3.5 14h17M10.5 14v1.5h3V14" />
    </>
  ),
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
  play: <path d="M8 5.5v13l11-6.5z" />,
  reset: <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4M4.5 5v4h4" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.3-4.3" />
    </>
  ),
  'chevron-left': <path d="m14.5 6-6 6 6 6" />,
  trash: (
    <>
      <path d="M5 7h14M10 7V4.5h4V7" />
      <path d="m7 7 .8 12a1 1 0 0 0 1 1h6.4a1 1 0 0 0 1-1L17 7M10.5 11v5M13.5 11v5" />
    </>
  ),
  wifi: <path d="M4 9.5a12 12 0 0 1 16 0M7 13a7.5 7.5 0 0 1 10 0M10 16.3a3 3 0 0 1 4 0M12 19.3v.1" />,
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2L9 5h6l1.3 2h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  list: <path d="M8.5 7H19M8.5 12H19M8.5 17H19M4.8 7v.1M4.8 12v.1M4.8 17v.1" />,
  sliders: (
    <>
      <path d="M5 7h8M19 7h-2M5 12h2M11 12h8M5 17h10M19 17h0" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),

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
