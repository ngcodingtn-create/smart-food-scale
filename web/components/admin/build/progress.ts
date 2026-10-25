'use client';

import { useEffect, useState } from 'react';
import { MILESTONES, type Milestone, type Step } from '../roadmap';

/**
 * The owner's ticks on the build pages, in this browser only, like Wire it's.
 * One entry per step: the indexes of its checks ticked. Storage can be missing
 * (private windows): the ticks then last until the page closes.
 */

const KEY = 'sfs-build-checks-v1';
type Ticks = Record<string, number[]>;
const EVENT = 'sfs-build-checks';

function read(): Ticks {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return value && typeof value === 'object' ? (value as Ticks) : {};
  } catch {
    return {};
  }
}

export const stepKey = (milestone: Milestone, step: Step) => `${milestone.id}/${step.id}`;

/** All ticks, kept in step with other components on the page. */
export function useTicks() {
  const [ticks, setTicks] = useState<Ticks>({});
  useEffect(() => {
    const load = () => setTicks(read());
    load();
    window.addEventListener(EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, []);

  function toggle(key: string, index: number, on: boolean) {
    const next = { ...read() };
    const set = new Set(next[key] ?? []);
    if (on) set.add(index);
    else set.delete(index);
    next[key] = [...set].sort((a, b) => a - b);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Not saved; the page still shows it.
    }
    setTicks(next);
    window.dispatchEvent(new Event(EVENT));
  }

  return { ticks, toggle };
}

/** A step is done when all its checks are ticked. Draft steps never count. */
export function stepDone(ticks: Ticks, milestone: Milestone, step: Step) {
  const checks = step.checks ?? [];
  if (step.draft || checks.length === 0) return false;
  return (ticks[stepKey(milestone, step)] ?? []).length >= checks.length;
}

export function milestoneProgress(ticks: Ticks, milestone: Milestone) {
  const ready = milestone.steps.filter((step) => !step.draft && (step.checks ?? []).length > 0);
  const done = ready.filter((step) => stepDone(ticks, milestone, step)).length;
  return { done, total: ready.length, drafts: milestone.steps.filter((step) => step.draft).length };
}

/** Every written step across the whole build. */
export function overallProgress(ticks: Ticks) {
  return MILESTONES.reduce(
    (sum, milestone) => {
      const progress = milestoneProgress(ticks, milestone);
      return { done: sum.done + progress.done, total: sum.total + progress.total };
    },
    { done: 0, total: 0 },
  );
}

/** Where to carry on: the first written step not yet done, in build order. */
export function nextUp(ticks: Ticks): { milestone: Milestone; step: Step; index: number } | null {
  for (const milestone of MILESTONES) {
    const index = milestone.steps.findIndex((step) => !step.draft && (step.checks ?? []).length > 0 && !stepDone(ticks, milestone, step));
    if (index >= 0) return { milestone, step: milestone.steps[index], index };
  }
  return null;
}

/** done: every step written and ticked; started: some ticked; todo: none yet. */
export function milestoneState(ticks: Ticks, milestone: Milestone): 'done' | 'started' | 'todo' {
  const progress = milestoneProgress(ticks, milestone);
  if (progress.total > 0 && progress.drafts === 0 && progress.done === progress.total) return 'done';
  return progress.done > 0 ? 'started' : 'todo';
}

export { MILESTONES };
