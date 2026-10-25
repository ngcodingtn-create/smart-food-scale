/**
 * The sidebar of /admin, the builder's area. Every link stays inside /admin.
 */

import type { NavGroup } from '@/lib/nav';

export const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Build',
    items: [
      { label: 'The plan', href: '/admin/plan', icon: 'list' },
      { label: 'Our parts', href: '/admin/parts', icon: 'clipboard' },
    ],
  },
];
