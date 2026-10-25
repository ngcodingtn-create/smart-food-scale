'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** ← and → move between steps, unless the cursor is in a field. */
export function StepKeys({ previous, next }: { previous: string; next: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.closest('input, textarea, select, [contenteditable="true"]') || target.isContentEditable)) return;
      if (event.key === 'ArrowLeft') router.push(previous);
      if (event.key === 'ArrowRight') router.push(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router, previous, next]);
  return null;
}
