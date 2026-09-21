/**
 * The sidebar, and the single source of truth for site navigation.
 *
 * Adding a route is two steps: create `app/<path>/page.mdx`, then add an entry
 * here. Nothing else needs touching.
 */

export type NavItem = {
  label: string;
  href: string;
  badge?: { text: string; tone: 'done' | 'wip' | 'todo' | 'alert' };
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: 'Start here',
    items: [{ label: 'Overview', href: '/' }],
  },
  {
    label: 'The project',
    items: [
      { label: 'Component request', href: '/project/component-request' },
      { label: 'Architecture', href: '/project/architecture' },
      { label: 'Wiring & pin map', href: '/project/wiring' },
      { label: 'Risks', href: '/project/risks' },
    ],
  },
  {
    label: 'Deliverables',
    items: [
      { label: 'Status board', href: '/deliverables' },
      { label: 'Backend API', href: '/deliverables/backend', badge: { text: 'Done', tone: 'done' } },
      {
        label: 'Tunisian food table',
        href: '/deliverables/food-table',
        badge: { text: 'Done', tone: 'done' },
      },
      {
        label: 'Firmware',
        href: '/deliverables/firmware',
        badge: { text: 'WIP', tone: 'wip' },
      },
      {
        label: 'Mobile app',
        href: '/deliverables/app',
        badge: { text: 'Planned', tone: 'todo' },
      },
    ],
  },
  {
    label: 'Reference',
    items: [
      { label: 'Decision log', href: '/reference/decisions' },
      { label: 'Accuracy & calibration', href: '/reference/accuracy' },
      {
        label: 'Vision API options',
        href: '/reference/vision-apis',
        badge: { text: 'Decide', tone: 'alert' },
      },
    ],
  },
];

export const REPO_URL = 'https://github.com/ngcodingtn-create/smart-food-scale';

/** Flat list, in sidebar order — used for prev/next links at the page foot. */
export const FLAT_NAV: NavItem[] = NAV.flatMap((group) => group.items);
