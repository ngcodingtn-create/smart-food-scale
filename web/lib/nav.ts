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
  // The Deliverables and Reference groups were removed from the sidebar on
  // the owner's request (2026-09-21). The PAGES still exist and are still
  // served — they are simply not linked from the nav:
  //
  //   /deliverables            /reference/decisions
  //   /deliverables/backend    /reference/accuracy
  //   /deliverables/food-table /reference/vision-apis
  //   /deliverables/firmware
  //   /deliverables/app
  //
  // Restore them by putting their entries back here; nothing else needs to
  // change. Body links to them (the Overview page's buttons, for one) still
  // work either way.
];

export const REPO_URL = 'https://github.com/ngcodingtn-create/smart-food-scale';

/** Flat list, in sidebar order — used for prev/next links at the page foot. */
export const FLAT_NAV: NavItem[] = NAV.flatMap((group) => group.items);
