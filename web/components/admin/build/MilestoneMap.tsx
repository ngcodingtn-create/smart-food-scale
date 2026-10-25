'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { MILESTONES, milestoneProgress, milestoneState, nextUp, useTicks } from './progress';
import { ProgressBar } from './Stepper';

/**
 * Every milestone as one route, top to bottom: done, now, under way, later.
 * "Now" is the milestone holding the next step to do.
 */
export function MilestoneMap() {
  const { ticks } = useTicks();
  const now = nextUp(ticks)?.milestone.id;

  return (
    <ol className="milestone-map">
      {MILESTONES.map((milestone) => {
        const progress = milestoneProgress(ticks, milestone);
        const state = milestoneState(ticks, milestone);
        const look = state === 'done' ? 'done' : milestone.id === now ? 'now' : state === 'started' ? 'started' : 'later';
        const label = { done: 'Done', now: 'Now', started: 'Under way', later: 'Later' }[look];
        return (
          <li key={milestone.id} className="milestone-row" data-state={look}>
            <span className="milestone-dot" aria-hidden="true">
              {look === 'done' ? <Icon name="check" size={15} /> : milestone.number}
            </span>
            <Link href={`/admin/build/${milestone.id}`} className="milestone-card">
              <span className="milestone-top">
                <span className="milestone-when">
                  Milestone {milestone.number} · {milestone.when}
                </span>
                <span className="milestone-state">{label}</span>
              </span>
              <strong>{milestone.title}</strong>
              <span className="milestone-goal">{milestone.goal}</span>
              {progress.total ? (
                <ProgressBar done={progress.done} total={progress.total} label={progress.drafts ? `Steps · ${progress.drafts} more being written` : 'Steps'} size="sm" />
              ) : (
                <span className="milestone-count">{progress.drafts} steps, being written</span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
