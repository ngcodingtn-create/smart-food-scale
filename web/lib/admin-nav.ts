/**
 * The sidebar of /admin, the builder's area. Every link stays inside /admin.
 * The milestones are read from the roadmap, so a new one appears here by itself.
 */

import { MILESTONES } from '@/components/admin/roadmap';
import type { NavGroup } from '@/lib/nav';

export const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Build',
    items: [
      { label: 'The plan', href: '/admin/plan', icon: 'list' },
      { label: 'Build map', href: '/admin/build', icon: 'route' },
      { label: 'Our parts', href: '/admin/parts', icon: 'clipboard' },
    ],
  },
  {
    label: 'Milestones',
    items: MILESTONES.map((milestone) => ({
      label: `${milestone.number}. ${milestone.title}`,
      href: `/admin/build/${milestone.id}`,
      prefix: true,
    })),
  },
];
