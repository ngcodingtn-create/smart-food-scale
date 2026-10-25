'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { milestoneById } from '../roadmap';
import { milestoneProgress, stepDone, useTicks } from './progress';
import { ProgressBar } from './Stepper';

/**
 * A milestone's steps as a vertical stepper: a line down the left, each step a
 * dot (done, next, being written), the next one to do singled out with its own
 * button.
 */
export function MilestoneSteps({ milestoneId }: { milestoneId: string }) {
  const milestone = milestoneById(milestoneId);
  const { ticks } = useTicks();
  if (!milestone) return null;
  const progress = milestoneProgress(ticks, milestone);
  const nextIndex = milestone.steps.findIndex((step) => !step.draft && !stepDone(ticks, milestone, step));

  return (
    <div className="milestone-steps">
      {progress.total ? (
        <ProgressBar done={progress.done} total={progress.total} label={progress.drafts ? `Steps · ${progress.drafts} more being written` : 'Steps'} />
      ) : (
        <p className="milestone-count">{progress.drafts} steps, being written</p>
      )}
      <ol className="vstepper">
        {milestone.steps.map((step, index) => {
          const done = stepDone(ticks, milestone, step);
          const look = done ? 'done' : step.draft ? 'draft' : index === nextIndex ? 'next' : 'todo';
          return (
            <li key={step.id} data-state={look}>
              <span className="vstepper-dot" aria-hidden="true">
                {done ? <Icon name="check" size={13} /> : index + 1}
              </span>
              <Link href={`/admin/build/${milestone.id}/${step.id}`} className="vstepper-card">
                <span className="vstepper-text">
                  <strong>{step.title}</strong>
                  <span>{step.goal}</span>
                </span>
                {look === 'next' ? (
                  <span className="vstepper-go">
                    {progress.done ? 'Continue' : 'Start'}
                    <Icon name="arrow-right" size={15} />
                  </span>
                ) : look === 'draft' ? (
                  <span className="step-draft">Being written</span>
                ) : look === 'done' ? (
                  <span className="vstepper-done">Done</span>
                ) : (
                  <Icon name="arrow-right" size={15} />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
