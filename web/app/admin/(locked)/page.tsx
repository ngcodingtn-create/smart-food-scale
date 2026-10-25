import { redirect } from 'next/navigation';

/** /admin opens on the plan. */
export default function AdminHome() {
  redirect('/admin/plan');
}
