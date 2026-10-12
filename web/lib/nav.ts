/**
 * The sidebar, and the single source of truth for site navigation.
 *
 * Adding a route is two steps: create `app/<path>/page.mdx`, then add an entry
 * here. Nothing else needs touching.
 */

import type { IconName } from '@/components/icons';

export type NavItem = {
  label: string;
  href: string;
  /** Shown beside the label in the sidebar. Optional — a link works without one. */
  icon?: IconName;
  badge?: { text: string; tone: 'done' | 'wip' | 'todo' | 'alert' };
};

export type NavGroup = {
  label: string;
  /** The group's own landing page, if it has one. */
  href?: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: 'Start here',
    items: [{ label: 'Overview', href: '/', icon: 'home' }],
  },
  {
    label: 'The project',
    items: [
      { label: 'Component request', href: '/project/component-request', icon: 'clipboard' },
      { label: 'Architecture', href: '/project/architecture', icon: 'nodes' },
      { label: 'The rig in 3D', href: '/rig', icon: 'cube' },
      { label: 'Wiring & pin map', href: '/project/wiring', icon: 'chip' },
      { label: 'Risks', href: '/project/risks', icon: 'alert' },
    ],
  },
];

/**
 * Pages that exist and are served, but are not linked from the sidebar.
 *
 * The Deliverables and Reference groups were removed from the sidebar on the
 * owner's request (2026-09-21). They are kept here — rather than deleted — so
 * each page still knows its own name and section for the breadcrumb, and so
 * restoring a group is one move: cut it from this array and paste it into NAV.
 * Body links to these pages (the Overview page's buttons, for one) work either
 * way.
 */
export const UNLISTED: NavGroup[] = [
  {
    label: 'Deliverables',
    href: '/deliverables',
    items: [
      { label: 'Status board', href: '/deliverables' },
      { label: 'Backend API', href: '/deliverables/backend', icon: 'server' },
      { label: 'Tunisian food table', href: '/deliverables/food-table', icon: 'table' },
      { label: 'Firmware', href: '/deliverables/firmware', icon: 'chip' },
      { label: 'Mobile app', href: '/deliverables/app', icon: 'phone' },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'Decision log', href: '/reference/decisions' },
      { label: 'Accuracy & calibration', href: '/reference/accuracy' },
      { label: 'Vision API options', href: '/reference/vision-apis' },
    ],
  },
];

export const REPO_URL = 'https://github.com/ngcodingtn-create/smart-food-scale';

/** Flat list, in sidebar order — used for prev/next links at the page foot. */
export const FLAT_NAV: NavItem[] = NAV.flatMap((group) => group.items);

/** Which group and entry a path belongs to, listed in the sidebar or not. */
export function findPage(pathname: string): { group: NavGroup; item: NavItem } | null {
  for (const group of [...NAV, ...UNLISTED]) {
    const item = group.items.find((entry) => entry.href === pathname);
    if (item) return { group, item };
  }
  return null;
}
