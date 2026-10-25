import type { Metadata } from 'next';
import { PlanBoard } from '@/components/admin/PlanBoard';

export const metadata: Metadata = { title: 'The plan' };

export default function PlanPage() {
  return <PlanBoard />;
}
